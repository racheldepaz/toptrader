// app/user/[username]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Calendar, UserPlus, UserCheck, Users, TrendingUp, Share2, Trophy, Target } from 'lucide-react';
import Link from 'next/link';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import ShareableStatsCard from '@/components/ShareableStatsCard';

interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  trading_style: string | null;
  created_at: string;
}

interface TradingStats {
  win_rate: number;
  total_trades: number;
  best_trade_percentage: number;
  average_gain_percentage: number;
}

type TimePeriod = 'day' | 'week' | 'month' | 'year';

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { user: currentUser } = useSupabaseAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowingBack, setIsFollowingBack] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [stats, setStats] = useState<TradingStats | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('day');
  const [showShareCard, setShowShareCard] = useState(false);

  useEffect(() => {
    if (username) {
      fetchUserProfile();
    }
  }, [username, currentUser]);

  const fetchUserProfile = async () => {
    try {
      // Fetch user profile by username
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(userProfile);

      // Check if current user is following this user
      if (currentUser && userProfile && currentUser.id !== userProfile.id) {
        // Check if current user follows profile user
        const { data: followingData } = await supabase
          .from('friendships')
          .select('*')
          .eq('requester_id', currentUser.id)
          .eq('addressee_id', userProfile.id)
          .eq('status', 'accepted')
          .single();

        // Check if profile user follows current user back
        const { data: followBackData } = await supabase
          .from('friendships')
          .select('*')
          .eq('requester_id', userProfile.id)
          .eq('addressee_id', currentUser.id)
          .eq('status', 'accepted')
          .single();

        setIsFollowing(!!followingData);
        setIsFollowingBack(!!followBackData);
      }

      // Get follower count (people following this user)
      const { count: followers } = await supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .eq('addressee_id', userProfile.id)
        .eq('status', 'accepted');

      // Get following count (people this user follows)
      const { count: following } = await supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .eq('requester_id', userProfile.id)
        .eq('status', 'accepted');

      setFollowerCount(followers || 0);
      setFollowingCount(following || 0);

      // Fetch trading stats - for now using user_stats table
      // In production, you might calculate these based on time period
      const { data: userStats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userProfile.id)
        .single();

      if (userStats) {
        setStats({
          win_rate: userStats.win_rate || 0,
          total_trades: userStats.total_trades || 0,
          best_trade_percentage: userStats.best_trade_percentage || 0,
          average_gain_percentage: userStats.average_gain_percentage || 0
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser || !profile) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        await supabase
          .from('friendships')
          .delete()
          .or(`and(requester_id.eq.${currentUser.id},addressee_id.eq.${profile.id}),and(requester_id.eq.${profile.id},addressee_id.eq.${currentUser.id})`);
      } else {
        // Follow
        await supabase
          .from('friendships')
          .insert({
            requester_id: currentUser.id,
            addressee_id: profile.id,
            status: 'accepted'
          });
      }

      setIsFollowing(!isFollowing);
      
      // Update follower count
      if (!isFollowing) {
        setFollowerCount(prev => prev + 1);
      } else {
        setFollowerCount(prev => prev - 1);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleShareStats = () => {
    setShowShareCard(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">User not found</h1>
          <p className="text-gray-600">The user @{username} doesn't exist.</p>
          <Link href="/" className="mt-4 inline-block text-blue-600 hover:text-blue-700">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Profile Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center space-x-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                {profile.display_name?.charAt(0) || profile.username.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {profile.display_name || profile.username}
              </h1>
              <p className="text-gray-600">@{profile.username}</p>
              
              {profile.bio && (
                <p className="mt-2 text-gray-700">{profile.bio}</p>
              )}

              <div className="mt-3 flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-1" />
                Joined {formatDate(profile.created_at)}
              </div>

              {/* Follower/Following counts */}
              <div className="mt-3 flex items-center space-x-4">
                <div className="text-sm">
                  <span className="font-semibold text-gray-900">{followerCount}</span>
                  <span className="text-gray-600 ml-1">followers</span>
                </div>
                <div className="text-sm">
                  <span className="font-semibold text-gray-900">{followingCount}</span>
                  <span className="text-gray-600 ml-1">following</span>
                </div>
              </div>
            </div>

            {/* Follow Button */}
            {currentUser && currentUser.id !== profile.id && (
              <div>
                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                    isFollowing
                      ? isFollowingBack
                        ? 'bg-purple-100 hover:bg-purple-200 text-purple-700'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isFollowing ? (
                    isFollowingBack ? (
                      <>
                        <Users className="w-4 h-4" />
                        <span>Friends</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4" />
                        <span>Following</span>
                      </>
                    )
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Follow</span>
                    </>
                  )}
                </button>
                {!isFollowing && isFollowingBack && (
                  <p className="text-xs text-gray-500 mt-1">Follows you</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trading Stats Section */}
      {stats && (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Header with Time Period Toggle */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Trading Performance</h2>
              <div className="flex items-center space-x-2">
                {/* Time Period Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  {(['day', 'week', 'month', 'year'] as TimePeriod[]).map((period) => (
                    <button
                      key={period}
                      onClick={() => setSelectedPeriod(period)}
                      className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                        selectedPeriod === period
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </button>
                  ))}
                </div>
                {/* Share Button */}
                <button
                  onClick={handleShareStats}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Share stats"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Win Rate */}
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
                <div className="flex justify-center mb-2">
                  <Trophy className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-green-700">{stats.win_rate}%</p>
                <p className="text-sm text-gray-600 mt-1">Win Rate</p>
              </div>

              {/* Total Trades */}
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
                <div className="flex justify-center mb-2">
                  <Target className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-blue-700">{stats.total_trades}</p>
                <p className="text-sm text-gray-600 mt-1">Total Trades</p>
              </div>

              {/* Average Return */}
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
                <div className="flex justify-center mb-2">
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
                <p className={`text-3xl font-bold ${stats.average_gain_percentage >= 0 ? 'text-purple-700' : 'text-red-600'}`}>
                  {stats.average_gain_percentage >= 0 ? '+' : ''}{stats.average_gain_percentage}%
                </p>
                <p className="text-sm text-gray-600 mt-1">Avg Return</p>
              </div>

              {/* Best Trade */}
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200">
                <div className="flex justify-center mb-2">
                  <Trophy className="w-8 h-8 text-yellow-600" />
                </div>
                <p className={`text-3xl font-bold ${stats.best_trade_percentage >= 0 ? 'text-yellow-700' : 'text-red-600'}`}>
                  {stats.best_trade_percentage >= 0 ? '+' : ''}{stats.best_trade_percentage}%
                </p>
                <p className="text-sm text-gray-600 mt-1">Best Trade</p>
              </div>
            </div>

            {/* Note about time period */}
            <p className="text-xs text-gray-500 text-center mt-4">
              Stats for the past {selectedPeriod}
            </p>
          </div>
        </div>
      )}

      {/* Content Section - We'll add more here later */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-gray-600">Trading history coming soon...</p>
      </div>

      {/* Shareable Stats Card Modal */}
      {showShareCard && stats && profile && (
        <ShareableStatsCard
          username={profile.username}
          displayName={profile.display_name || profile.username}
          stats={stats}
          period={selectedPeriod}
          onClose={() => setShowShareCard(false)}
        />
      )}
    </div>
  );
}