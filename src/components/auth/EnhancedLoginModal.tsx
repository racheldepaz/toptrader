'use client';

import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useAuthModal } from '@/context/AuthModalContext';

interface EnhancedLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EnhancedLoginModal({ isOpen, onClose }: EnhancedLoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useFallback, setUseFallback] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  
  const { login } = useSupabaseAuth();
  const { 
    loginEmail, 
    welcomeMessage, 
    clearLoginPrefills, 
    openSignupModal 
  } = useAuthModal();

  const getSiteUrl = () => {
    console.log('🌐 getSiteUrl: Detecting site URL...');
    
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      console.log('🌐 getSiteUrl: Using env variable:', process.env.NEXT_PUBLIC_SITE_URL);
      return process.env.NEXT_PUBLIC_SITE_URL;
    }
    
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      console.log('🌐 getSiteUrl: Using window.location.origin:', origin);
      return origin;
    }
    
    console.log('🌐 getSiteUrl: Using fallback localhost');
    return 'http://localhost:3000';
  };

  // Handle prefilled email and welcome message
  useEffect(() => {
    if (loginEmail) {
      setEmail(loginEmail);
      setShowWelcome(!!welcomeMessage);
      console.log('👋 EnhancedLoginModal: Pre-filling email and showing welcome:', loginEmail);
    } else {
      setShowWelcome(false);
    }
  }, [loginEmail, welcomeMessage]);

  // Clear welcome message after 5 seconds
  useEffect(() => {
    if (showWelcome && welcomeMessage) {
      const timer = setTimeout(() => {
        setShowWelcome(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showWelcome, welcomeMessage]);

  const handleGoogleLogin = async () => {
    console.log('🔵 handleGoogleLogin: Starting Google OAuth flow');
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${getSiteUrl()}/`
        }
      });
      
      console.log('🔵 handleGoogleLogin: OAuth response:', { data, error });
      
      if (error) {
        console.log('❌ handleGoogleLogin: OAuth error:', error);
        setError(error.message);
      }
    } catch (err) {
      console.log('❌ handleGoogleLogin: Unexpected error:', err);
      setError('An unexpected error occurred with Google sign-in');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError('');

    if (useFallback) {
      // Fallback to localStorage for demo
      localStorage.setItem('isAuthenticated', 'true');
      window.location.reload();
      return;
    }

    try {
      const { error: loginError } = await login(email, password);
      
      if (loginError) {
        setError((loginError as Error).message);
      } else {
        handleClose();
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred');
    }

    setLoading(false);
  };

  const handleClose = () => {
    onClose();
    clearLoginPrefills();
    setError('');
    setShowWelcome(false);
  };

  const handleSwitchToSignup = () => {
    handleClose();
    setTimeout(() => {
      openSignupModal();
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Welcome Back</h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        {/* Welcome back message */}
        {showWelcome && welcomeMessage && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700 text-center font-medium">
              {welcomeMessage}
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Google Sign-In Button */}
        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 mb-4 transition-colors shadow-sm"
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span className="font-medium">Sign in with Google</span>
        </button>

        <div className="text-center text-gray-500 mb-4">or</div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={useFallback ? "Enter any email (demo)" : "Email address"}
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={useFallback ? "Enter any password (demo)" : "Password"}
            required
          />
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="useFallback"
              checked={useFallback}
              onChange={(e) => setUseFallback(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="useFallback" className="text-sm text-gray-600">
              Use demo mode (no Supabase required)
            </label>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {!useFallback && (
          <div className="mt-4 text-sm text-gray-600 text-center">
            <p>Don&apos;t have an account? 
              <button 
                onClick={handleSwitchToSignup}
                className="text-blue-600 hover:text-blue-700 ml-1"
              >
                Sign up
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}