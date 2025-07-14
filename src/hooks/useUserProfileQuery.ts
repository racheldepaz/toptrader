// src/hooks/useUserProfileQuery.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/lib/supabase';

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

// Renamed to avoid conflict
export const useUserProfileQuery = () => {
  const { user: authUser, isAuthenticated } = useSupabaseAuth();
  const queryClient = useQueryClient();

  const {
    data: profile,
    isLoading: loading,
    error,
    refetch
  } = useQuery({
    queryKey: ['userProfile', authUser?.id],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!authUser) return null;

      const { data, error } = await supabase
        .from('users')
        .select('id, username, display_name, avatar_url, bio, trading_style, is_public')
        .eq('id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return {
        id: authUser.id,
        email: authUser.email,
        username: data?.username,
        display_name: data?.display_name,
        avatar_url: data?.avatar_url,
        bio: data?.bio,
        trading_style: data?.trading_style,
        is_public: data?.is_public
      };
    },
    enabled: !!authUser,
  });

  // Helper function to invalidate and refetch
  const refreshProfile = () => {
    queryClient.invalidateQueries({ queryKey: ['userProfile', authUser?.id] });
  };

  // Helper function to update cache optimistically
  const updateProfileCache = (updates: Partial<UserProfile>) => {
    queryClient.setQueryData(['userProfile', authUser?.id], (old: UserProfile | null) => 
      old ? { ...old, ...updates } : null
    );
  };

  return {
    profile,
    loading,
    error: error as Error | null,
    isAuthenticated,
    hasCompletedProfile: profile?.username ? true : false,
    refreshProfile,
    updateProfileCache,
  };
};

// Helper hook for global refresh (optional)
export const useGlobalProfileRefresh = () => {
  const queryClient = useQueryClient();
  const { user } = useSupabaseAuth();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] });
  };
};