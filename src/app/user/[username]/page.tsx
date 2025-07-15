// app/user/[username]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Calendar, UserPlus, UserCheck, Users } from 'lucide-react';
import Link from 'next/link';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  trading_style: string | null;
  created_at: string;
}

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

      {/* Content Section - We'll add more here later */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-gray-600">Trading history and stats coming soon...</p>
      </div>
    </div>
  );
}