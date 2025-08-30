// Update your useSupabaseAuth.ts with better error handling:

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export const useSupabaseAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  console.log('🔐 useSupabaseAuth: Hook called, current state:', { 
    user: user ? { id: user.id, email: user.email } : null, 
    loading 
  });

  useEffect(() => {
    console.log('🔐 useSupabaseAuth: useEffect running - getting initial session');
    
    // Get initial session with proper error handling
    const getInitialSession = async () => {
      try {
        console.log('🔐 useSupabaseAuth: Calling supabase.auth.getSession()');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('🔐 useSupabaseAuth: Session error:', error);
          
          // Handle specific auth errors
          if (error.message.includes('Invalid Refresh Token') || 
              error.message.includes('Refresh Token Not Found')) {
            console.log('🔐 useSupabaseAuth: Invalid/missing refresh token, clearing session');
            
            // Clear the invalid session
            await supabase.auth.signOut();
            setUser(null);
            setLoading(false);
            return;
          }
        }
        
        console.log('🔐 useSupabaseAuth: Initial session response:', { 
          session: session ? { user: { id: session.user.id, email: session.user.email } } : null, 
          error 
        });
        
        setUser(session?.user ?? null);
        setLoading(false);
      } catch (err) {
        console.error('🔐 useSupabaseAuth: Unexpected error getting session:', err);
        
        // Clear everything on unexpected errors
        try {
          await supabase.auth.signOut();
        } catch (signOutErr) {
          console.error('🔐 Error during cleanup signOut:', signOutErr);
        }
        
        setUser(null);
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes with error handling
    console.log('🔐 useSupabaseAuth: Setting up auth state change listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 useSupabaseAuth: Auth state changed!', { 
          event, 
          session: session ? { user: { id: session.user.id, email: session.user.email } } : null 
        });
        
        setUser(session?.user ?? null);
        setLoading(false);

        // Award daily login bonus on sign in
        if (event === 'SIGNED_IN' && session?.user) {
          awardDailyLoginBonus(session.user.id)
        }
        
        // Handle token refresh errors
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.log('🔐 useSupabaseAuth: Token refresh failed, user signed out');
          setUser(null);
        }
        
        if (event === 'SIGNED_IN') {
          console.log('🔐 useSupabaseAuth: User signed in');
          router.refresh();
        }
      }
    );

    return () => {
      console.log('🔐 useSupabaseAuth: Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, [router]);

  const login = async (email: string, password: string) => {
    console.log('🔐 useSupabaseAuth: Login attempt for:', email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      console.log('🔐 useSupabaseAuth: Login response:', { data, error });
      return { data, error };
    } catch (err) {
      console.error('🔐 useSupabaseAuth: Login error:', err);
      return { data: null, error: err };
    }
  };

  const signup = async (email: string, password: string, username: string, displayName?: string) => {
    console.log('🔐 useSupabaseAuth: Signup attempt for:', email, 'username:', username);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      console.log('🔐 useSupabaseAuth: Signup response:', { data, error });

      if (data.user && !error) {
        console.log('🔐 useSupabaseAuth: Creating user profile in database');
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            username,
            display_name: displayName || username,
          });
        
        if (profileError) {
          console.error('🔐 useSupabaseAuth: Error creating user profile:', profileError);
        } else {
          console.log('🔐 useSupabaseAuth: User profile created successfully');
        }
      }

      return { data, error };
    } catch (err) {
      console.error('🔐 useSupabaseAuth: Signup error:', err);
      return { data: null, error: err };
    }
  };

  const logout = async () => {
    console.log('🔐 useSupabaseAuth: Logout attempt');
    try {
      const { error } = await supabase.auth.signOut();
      if (!error) {
        setUser(null);
        
        // Clear any localStorage fallbacks
        localStorage.removeItem('isAuthenticated');
        
        router.push('/');
        console.log('🔐 useSupabaseAuth: Logout successful');
      } else {
        console.log('🔐 useSupabaseAuth: Logout error:', error);
      }
      return { error };
    } catch (err) {
      console.error('🔐 useSupabaseAuth: Logout error:', err);
      return { error: err };
    }
  };

  const awardDailyLoginBonus = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('award_daily_login_bonus', {
        p_user_id: userId
      })
      
      if (error) {
        console.error('Error awarding daily bonus:', error)
        return
      }
      
      if (data === true) {
        console.log('🎉 Daily login bonus awarded! (+5 XP)')
      }
    } catch (error) {
      console.error('Error in awardDailyLoginBonus:', error)
    }
  }

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    signup,
    logout
  };
};