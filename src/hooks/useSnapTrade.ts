import { useState } from 'react';
import { useSupabaseAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase'; 


interface SnapTradeUser {
  userId: string;
  userSecret: string;
}

export const useSnapTrade = () => {
  const { user } = useSupabaseAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [snapTradeUser, setSnapTradeUser] = useState<SnapTradeUser | null>(null);
  const [connectionUrl, setConnectionUrl] = useState<string>('');

  // Step 1: Test API Connection
  const testApiConnection = async (): Promise<boolean> => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/snaptrade/status');
      const data = await response.json();
      
      if (response.ok) {
        return true;
      } else {
        setError('SnapTrade API connection failed');
        return false;
      }
    } catch (err) {
      setError('Network error connecting to SnapTrade');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Create SnapTrade User
  const createSnapTradeUser = async (): Promise<SnapTradeUser | null> => {
    console.log('🔧 createSnapTradeUser: Starting...', { user });
    if (!user) {
      console.log('❌ createSnapTradeUser: No user logged in');
      setError('User must be logged in');
      return null;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔧 createSnapTradeUser: Making API call...');
      const response = await fetch('/api/snaptrade/register-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          appUserId: user.id
        })
      });

      const data = await response.json();
      console.log('🔧 createSnapTradeUser: API response:', { response: response.ok, data });


      if (response.ok && data.userId && data.userSecret) {
        const newUser = { userId: data.userId, userSecret: data.userSecret };
        console.log('✅ createSnapTradeUser: Success! Setting state:', newUser);
        setSnapTradeUser(newUser);
        return newUser;
      } else {
        console.log('❌ createSnapTradeUser: Failed:', data.error);
        setError(data.error || 'Failed to create SnapTrade user');
        return null;
      }
    } catch (err) {
      console.log('❌ createSnapTradeUser: Network error:', err);
      setError('Network error creating user');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Generate Connection Portal URL
  const generateConnectionUrl = async (redirectTo?: string): Promise<string | null> => {
    if (!snapTradeUser) {
      setError('No SnapTrade user found');
      return null;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/snaptrade/connection-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: snapTradeUser.userId,
          userSecret: snapTradeUser.userSecret,
          returnToUrl: redirectTo ? `${redirectTo}?connected=true` : `${window.location.origin}/dashboard?connected=true`
        })
      });

      const data = await response.json();

      if (response.ok && data.redirectURI) {
        setConnectionUrl(data.redirectURI);
        return data.redirectURI;
      } else {
        setError('Failed to generate connection URL');
        return null;
      }
    } catch (err) {
      setError('Network error generating connection URL');
      return null;
    } finally {
      setLoading(false);
    }
  };



  // Combined flow for signup - handle existing users
  const initializeSnapTradeFlow = async (redirectTo?: string): Promise<string | null> => {
    console.log('🚀 initializeSnapTradeFlow: Starting flow...');

    // Step 1: Test API
    const apiWorks = await testApiConnection();  
    console.log('🚀 initializeSnapTradeFlow: API test result:', apiWorks);
    if (!apiWorks) return null;

    // Step 2: Check if user already exists, create if not
    let currentUser = snapTradeUser;
    console.log('🚀 initializeSnapTradeFlow: Current user state:', currentUser);

    if (!currentUser && user) {
      // Try to get from database first
      try {
        const { data: dbUser, error } = await supabase
          .from('users')
          .select('snaptrade_user_id, snaptrade_user_secret')
          .eq('id', user.id)
          .single();
      
        if (!error && dbUser?.snaptrade_user_id && dbUser?.snaptrade_user_secret) {
          currentUser = {
            userId: dbUser.snaptrade_user_id,
            userSecret: dbUser.snaptrade_user_secret
          };
          setSnapTradeUser(currentUser);
          console.log('🚀 Found existing user in database:', currentUser);
        }
      } catch (err) {
        console.error('Error checking existing user:', err);
      }
    }
  
    // If still no user, create one
    if (!currentUser) {
      console.log('🚀 Creating new SnapTrade user...');
      currentUser = await createSnapTradeUser();
      if (!currentUser) return null;
      console.log('🚀 New user created:', currentUser);
    }

    // Step 3: Generate URL using the currentUser (not the state)
    console.log('🚀 Generating connection URL with user:', currentUser);
  
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/snaptrade/connection-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.userId,
          userSecret: currentUser.userSecret,
          returnToUrl: redirectTo ? `${redirectTo}?connected=true` : `${window.location.origin}/?connected=true`
        })
      });

    const data = await response.json();
    console.log('🚀 Connection portal response:', data);

    if (response.ok && data.redirectURI) {
      setConnectionUrl(data.redirectURI);
      return data.redirectURI;
    } else {
      setError('Failed to generate connection URL');
      return null;
    }
  } catch (err) {
    console.error('🚀 Error generating connection URL:', err);
    setError('Network error generating connection URL');
    return null;
  } finally {
    setLoading(false);
  }
};

  return {
    loading,
    error,
    snapTradeUser,
    connectionUrl,
    testApiConnection,
    createSnapTradeUser,
    generateConnectionUrl,
    initializeSnapTradeFlow,
    clearError: () => setError('')
  };

};

