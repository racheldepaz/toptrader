'use client';

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signup: (email: string, password: string, username: string, displayName?: string) => Promise<{ data: any; error: any }>;
  logout: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

let authInitialized = false; // Singleton flag to prevent multiple initializations

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  console.log('🔐 AuthProvider: Provider instantiated, authInitialized:', authInitialized);

  useEffect(() => {
    // Prevent multiple auth initializations
    if (authInitialized) {
      console.log('🔐 AuthProvider: Auth already initialized, skipping');
      return;
    }

    authInitialized = true;
    console.log('🔐 AuthProvider: Initializing auth...');
    
    // Get initial session with proper error handling
    const getInitialSession = async () => {
      try {
        console.log('🔐 AuthProvider: Calling supabase.auth.getSession()');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('🔐 AuthProvider: Session error:', error);
          
          // Handle specific auth errors
          if (error.message.includes('Invalid Refresh Token') || 
              error.message.includes('Refresh Token Not Found')) {
            console.log('🔐 AuthProvider: Invalid/missing refresh token, clearing session');
            await supabase.auth.signOut();
            setUser(null);
            setLoading(false);
            return;
          }
        }
        
        console.log('🔐 AuthProvider: Initial session response:', { 
          session: session ? { user: { id: session.user.id, email: session.user.email } } : null, 
          error 
        });
        
        setUser(session?.user ?? null);
        setLoading(false);
      } catch (err) {
        console.error('🔐 AuthProvider: Unexpected error getting session:', err);
        
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
    console.log('🔐 AuthProvider: Setting up auth state change listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 AuthProvider: Auth state changed!', { 
          event, 
          session: session ? { user: { id: session.user.id, email: session.user.email } } : null 
        });
        
        setUser(session?.user ?? null);
        setLoading(false);

        // Award daily login bonus on sign in
        if (event === 'SIGNED_IN' && session?.user) {
          awardDailyLoginBonus(session.user.id);
        }
        
        // Handle token refresh errors
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.log('🔐 AuthProvider: Token refresh failed, user signed out');
          setUser(null);
        }
        
        if (event === 'SIGNED_IN') {
          console.log('🔐 AuthProvider: User signed in');
          router.refresh();
        }
      }
    );

    return () => {
      console.log('🔐 AuthProvider: Cleaning up auth listener');
      subscription.unsubscribe();
      authInitialized = false; // Reset for potential re-initialization
    };
  }, []); // Remove router dependency to prevent unnecessary re-runs

  const awardDailyLoginBonus = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('award_daily_login_bonus', {
        p_user_id: userId
      });
      
      if (error) {
        console.error('Error awarding daily bonus:', error);
        return;
      }
      
      if (data === true) {
        console.log('🎉 Daily login bonus awarded! (+5 XP)');
      }
    } catch (error) {
      console.error('Error in awardDailyLoginBonus:', error);
    }
  };

  const login = async (email: string, password: string) => {
    console.log('🔐 AuthProvider: Login attempt for:', email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      console.log('🔐 AuthProvider: Login response:', { data, error });
      return { data, error };
    } catch (err) {
      console.error('🔐 AuthProvider: Login error:', err);
      return { data: null, error: err };
    }
  };

  const signup = async (email: string, password: string, username: string, displayName?: string) => {
    console.log('🔐 AuthProvider: Signup attempt for:', email, 'username:', username);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      console.log('🔐 AuthProvider: Signup response:', { data, error });

      if (data.user && !error) {
        console.log('🔐 AuthProvider: Creating user profile in database');
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            username,
            display_name: displayName || username,
          });
        
        if (profileError) {
          console.error('🔐 AuthProvider: Error creating user profile:', profileError);
        } else {
          console.log('🔐 AuthProvider: User profile created successfully');
        }
      }

      return { data, error };
    } catch (err) {
      console.error('🔐 AuthProvider: Signup error:', err);
      return { data: null, error: err };
    }
  };

  const logout = async () => {
    console.log('🔐 AuthProvider: Logout attempt');
    try {
      const { error } = await supabase.auth.signOut();
      if (!error) {
        setUser(null);
        
        // Clear any localStorage fallbacks
        localStorage.removeItem('isAuthenticated');
        
        router.push('/');
        console.log('🔐 AuthProvider: Logout successful');
      } else {
        console.log('🔐 AuthProvider: Logout error:', error);
      }
      return { error };
    } catch (err) {
      console.error('🔐 AuthProvider: Logout error:', err);
      return { error: err };
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Simplified hook that just consumes context
export const useSupabaseAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within an AuthProvider');
  }
  console.log('🔐 useSupabaseAuth: Hook called, returning context state:', { 
    user: context.user ? { id: context.user.id, email: context.user.email } : null, 
    loading: context.loading 
  });
  return context;
};

// Legacy export for backward compatibility
export const useAuth = useSupabaseAuth;