import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSupabaseAuth } from '@/context/AuthContext'; // Updated import
import { supabase } from '@/lib/supabase';
import { useMemo } from 'react';

interface UserProfile {
  id: string;
  email?: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  trading_style?: string;
  is_public?: boolean;
}

export const useUserProfileQuery = () => {
  const { user: authUser, isAuthenticated, loading: authLoading } = useSupabaseAuth();
  const queryClient = useQueryClient();

  // Memoize the query key to prevent unnecessary re-renders
  const queryKey = useMemo(() => ['userProfile', authUser?.id], [authUser?.id]);

  const {
    data: profile,
    isLoading: profileLoading,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: async (): Promise<UserProfile | null> => {
      if (!authUser) return null;

      console.log('🔍 useUserProfileQuery: Fetching profile for user:', authUser.id);

      const { data, error } = await supabase
        .from('users')
        .select('id, username, display_name, avatar_url, bio, trading_style, is_public')
        .eq('id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('🔍 useUserProfileQuery: Error fetching profile:', error);
        throw error;
      }

      const profileData = {
        id: authUser.id,
        email: authUser.email,
        username: data?.username,
        display_name: data?.display_name,
        avatar_url: data?.avatar_url,
        bio: data?.bio,
        trading_style: data?.trading_style,
        is_public: data?.is_public
      };

      console.log('🔍 useUserProfileQuery: Profile data retrieved:', profileData);
      return profileData;
    },
    enabled: !!authUser && !authLoading, // Only run when auth is resolved and user exists
    staleTime: 5 * 60 * 1000, // Consider profile data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Helper function to invalidate and refetch
  const refreshProfile = () => {
    queryClient.invalidateQueries({ queryKey });
  };

  // Helper function to update cache optimistically
  const updateProfileCache = (updates: Partial<UserProfile>) => {
    queryClient.setQueryData(queryKey, (old: UserProfile | null) => 
      old ? { ...old, ...updates } : null
    );
  };

  // Memoize return value to prevent unnecessary re-renders
  const returnValue = useMemo(() => ({
    profile,
    loading: authLoading || profileLoading,
    error: error as Error | null,
    isAuthenticated,
    hasCompletedProfile: profile?.username ? true : false,
    refreshProfile,
    updateProfileCache,
  }), [profile, authLoading, profileLoading, error, isAuthenticated, refreshProfile, updateProfileCache]);

  return returnValue;
};

// Helper hook for global refresh (optional)
export const useGlobalProfileRefresh = () => {
  const queryClient = useQueryClient();
  const { user } = useSupabaseAuth();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] });
  };
};