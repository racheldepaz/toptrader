'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export const useSupabaseAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  console.log('🔐 useSupabaseAuth: Hook called, current state:', { user: user ? { id: user.id, email: user.email } : null, loading });

  useEffect(() => {
    console.log('🔐 useSupabaseAuth: useEffect running - getting initial session');
    
    // Get initial session
    const getInitialSession = async () => {
      console.log('🔐 useSupabaseAuth: Calling supabase.auth.getSession()');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      console.log('🔐 useSupabaseAuth: Initial session response:', { 
        session: session ? { user: { id: session.user.id, email: session.user.email } } : null, 
        error 
      });
      
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    console.log('🔐 useSupabaseAuth: Setting up auth state change listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 useSupabaseAuth: Auth state changed!', { 
          event, 
          session: session ? { user: { id: session.user.id, email: session.user.email } } : null 
        });
        
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (event === 'SIGNED_IN') {
          console.log('🔐 useSupabaseAuth: User signed in, refreshing router');
          // Optionally refresh the page or redirect
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
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    console.log('🔐 useSupabaseAuth: Login response:', { data, error });
    return { data, error };
  };

  const signup = async (email: string, password: string, username: string, displayName?: string) => {
    console.log('🔐 useSupabaseAuth: Signup attempt for:', email, 'username:', username);
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
  };

  const logout = async () => {
    console.log('🔐 useSupabaseAuth: Logout attempt');
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      router.push('/');
      console.log('🔐 useSupabaseAuth: Logout successful');
    } else {
      console.log('🔐 useSupabaseAuth: Logout error:', error);
    }
    return { error };
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    signup,
    logout
  };
};