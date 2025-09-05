// app/admin/initialize-stats/page.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useSupabaseAuth } from "@/context/AuthContext"
import { RefreshCw } from 'lucide-react';

export default function InitializeStatsPage() {
  const { user } = useSupabaseAuth();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const initializeAllStats = async () => {
    setLoading(true);
    setResults(['Starting initialization...']);

    try {
      // Get all users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, username, display_name');

      if (usersError) {
        setResults(prev => [...prev, `❌ Error fetching users: ${usersError.message}`]);
        return;
      }

      setResults(prev => [...prev, `📊 Found ${users?.length || 0} users to process`]);

      // Process each user
      for (const user of users || []) {
        try {
          // Call the refresh function for this user
          const { error } = await supabase
            .rpc('refresh_all_user_stats', { p_user_id: user.id });

          if (error) {
            setResults(prev => [...prev, `❌ Failed: ${user.username || user.display_name} - ${error.message}`]);
          } else {
            setResults(prev => [...prev, `✅ Updated: ${user.username || user.display_name}`]);
          }

          // Small delay to avoid overwhelming the database
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (err) {
          setResults(prev => [...prev, `❌ Error processing ${user.username}: ${err}`]);
        }
      }

      setResults(prev => [...prev, '🎉 Initialization complete!']);
    } catch (error) {
      setResults(prev => [...prev, `❌ Unexpected error: ${error}`]);
    } finally {
      setLoading(false);
    }
  };

  // Simple admin check - you might want to make this more secure
  const isAdmin = user?.email === 'rachel@de-paz.net' || user?.email === 'racheldepaz@gmail.com';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">Admin access required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Initialize User Stats</h1>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-gray-600 mb-6">
            This will refresh trading stats for all users. Use this to initialize stats
            or fix any issues with missing data.
          </p>

          <button
            onClick={initializeAllStats}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Processing...' : 'Initialize All User Stats'}
          </button>

          {results.length > 0 && (
            <div className="mt-6 bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <h3 className="font-medium text-gray-900 mb-2">Results:</h3>
              <div className="space-y-1 font-mono text-sm">
                {results.map((result, idx) => (
                  <div key={idx} className="text-gray-700">{result}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="font-medium text-blue-900 mb-2">How Stats Updates Work:</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Stats automatically update when new trades are added (via trigger)</li>
            <li>Social stats update when friendships change</li>
            <li>Users can manually refresh their own stats on their profile</li>
            <li>This page lets admins refresh all users at once</li>
          </ul>
        </div>
      </div>
    </div>
  );
}