'use client';

import { useState, useEffect } from 'react';
import { useAuthModal, SignupStep } from '@/context/AuthModalContext';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/lib/supabase';
import { useUserProfileQuery } from '@/hooks/useUserProfileQuery';
import { useSnapTrade } from '@/hooks/useSnapTrade';

interface MultiStepSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MultiStepSignupModal({ isOpen, onClose }: MultiStepSignupModalProps) {
  console.log('🔄 MultiStepSignupModal: Component rendered, isOpen:', isOpen);
  
  const { 
    signupStep, 
    signupEmail, 
    setSignupStep, 
    setSignupEmail,
    resetSignupFlow 
  } = useAuthModal();
  
  const { 
    loading: snapTradeLoading, 
    error: snapTradeError, 
    snapTradeUser,
    initializeSnapTradeFlow,  // ✅ Add this back
    clearError 
  } = useSnapTrade();

  const handleBrokerageConnection = async () => {
    clearError();
    
    console.log('🎯 handleBrokerageConnection: Starting...');
    
    const connectionUrl = await initializeSnapTradeFlow('/dashboard');
    console.log('🎯 Generated URL:', connectionUrl);
    
    if (connectionUrl) {
      // Open the connection portal in a new tab
      const popup = window.open(connectionUrl, '_blank', 'width=800,height=600');
      
      // Move to a "connecting" state to show loading
      setSignupStep('connecting');
      
      // Set up listener for when user completes connection
      const checkConnection = setInterval(async () => {
        try {
          // Check if popup is closed (user finished or cancelled)
          if (popup?.closed) {
            clearInterval(checkConnection);
            
            // Check if user actually connected an account
            const response = await fetch('/api/snaptrade/accounts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: snapTradeUser?.userId,
                userSecret: snapTradeUser?.userSecret
              })
            });
            
            const accounts = await response.json();
            
            if (response.ok && accounts.length > 0) {
              // Success! User connected an account
              setSignupStep('complete');
            } else {
              // User closed popup without connecting
              setSignupStep('brokerage'); // Go back to brokerage step
            }
          }
        } catch (error) {
          console.error('Error checking connection:', error);
          clearInterval(checkConnection);
          setSignupStep('brokerage'); // Go back on error
        }
      }, 1000); // Check every second
      
      // Cleanup after 5 minutes
      setTimeout(() => {
        clearInterval(checkConnection);
        if (!popup?.closed) {
          setSignupStep('brokerage');
        }
      }, 300000);
    }
  };


  const { user } = useSupabaseAuth();

  const { updateProfileCache, refreshProfile } = useUserProfileQuery();

  console.log('🔄 MultiStepSignupModal: Current state:', {
    signupStep,
    signupEmail,
    user: user ? { id: user.id, email: user.email } : null
  });

  // Step 1: Email input
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 3: Password input
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Step 4: Profile setup
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Add this helper function at the top of your component
  const getSiteUrl = () => {
    console.log('🌐 getSiteUrl: Detecting site URL...');
    
    // First try environment variable
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      console.log('🌐 getSiteUrl: Using env variable:', process.env.NEXT_PUBLIC_SITE_URL);
      return process.env.NEXT_PUBLIC_SITE_URL;
    }
    
    // Then try to detect from window (client-side)
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      console.log('🌐 getSiteUrl: Using window.location.origin:', origin);
      return origin;
    }
    
    // Fallback for server-side rendering
    console.log('🌐 getSiteUrl: Using fallback localhost');
    return 'http://localhost:3000';
  };

  // Check if we're coming back from email verification
  useEffect(() => {
    
    console.log('🔄 useEffect: Email verification check', { user, signupStep });
    if (user && signupStep === 'verify') {
      console.log('✅ Email verified! Moving to password step');
      setSignupStep('password');
    }
  }, [user, signupStep, setSignupStep]);

  

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📧 handleEmailSubmit: Starting email submission for:', email);
    
    if (!email) {
      console.log('❌ handleEmailSubmit: No email provided');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const siteUrl = getSiteUrl();
      const redirectUrl = `${siteUrl}/?signup=verify`;
      
      console.log('📧 handleEmailSubmit: Calling supabase.auth.signUp with:', {
        email,
        redirectUrl,
        siteUrl
      });

      // Send magic link for email verification
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password: 'temp-password', // We'll let them set real password after verification
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      console.log('📧 handleEmailSubmit: Supabase response:', {
        data,
        error: signupError
      });

      if (signupError) {
        console.log('❌ handleEmailSubmit: Signup error:', signupError);
        setError(signupError.message);
      } else {
        console.log('✅ handleEmailSubmit: Success! Moving to verify step');
        console.log('📧 handleEmailSubmit: User should check email at:', email);
        setSignupEmail(email);
        setSignupStep('verify');
      }
    } catch (err) {
      console.log('❌ handleEmailSubmit: Unexpected error:', err);
      setError('An unexpected error occurred');
    }

    setLoading(false);
  };

  const validatePassword = (pass: string) => {
    const errors = [];
    if (pass.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(pass)) errors.push('One uppercase letter');
    if (!/[0-9!@#$%^&*]/.test(pass)) errors.push('One number or symbol');
    console.log('🔐 validatePassword: Password validation result:', { pass: '***', errors });
    return errors;
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setPasswordError(`Password must include: ${passwordErrors.join(', ')}`);
      return;
    }
  
    setLoading(true);
    setPasswordError('');
  
    try {
      console.log('🔐 handlePasswordSubmit: Updating user password...');
      
      // Update the user's password
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: password
      });
  
      console.log('🔐 handlePasswordSubmit: Password update response:', {
        data,
        error: updateError
      });
  
      if (updateError) {
        console.log('❌ handlePasswordSubmit: Password update error:', updateError);
        setPasswordError(updateError.message);
      } else {
        console.log('✅ handlePasswordSubmit: Success! Moving to profile step');
        
        // Clear the URL parameters to prevent conflicts
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.delete('signup');
          window.history.replaceState({}, '', url.toString());
          console.log('🔐 handlePasswordSubmit: Cleared URL parameters');
        }
        
        // Stay in the modal and move to profile step
        setSignupStep('profile');
      }
    } catch (err) {
      console.log('❌ handlePasswordSubmit: Unexpected error:', err);
      setPasswordError('An unexpected error occurred');
    }
  
    setLoading(false);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
  
    setProfileLoading(true);
    setError('');
  
    try {
      console.log('👤 handleProfileSubmit: Creating user profile in database...');
      
      // Create or update user profile
      const { data, error: profileError } = await supabase
        .from('users')
        .upsert({
          id: user?.id,
          username: username.toLowerCase().trim(),
          display_name: displayName.trim() || username.trim(),
          updated_at: new Date().toISOString()
        });
  
      console.log('👤 handleProfileSubmit: Profile creation response:', { data, error: profileError });
  


      if (profileError) {
        console.log('❌ handleProfileSubmit: Profile creation error:', profileError);
        setError(profileError.message);
      } else {
        console.log('✅ handleProfileSubmit: Success! Moving to brokerage step');
        
  
        updateProfileCache({
            username: username.toLowerCase().trim(),
            display_name: displayName.trim() || username.trim(),
          });
          refreshProfile();
          
        // Clear the URL parameters to prevent conflicts
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.delete('signup');
          window.history.replaceState({}, '', url.toString());
          console.log('👤 handleProfileSubmit: Cleared URL parameters');
        }
        
        setSignupStep('brokerage');
      }
    } catch (err) {
      console.log('❌ handleProfileSubmit: Unexpected error:', err);
      setError('An unexpected error occurred');
    }
  
    setProfileLoading(false);
  };

  const handleSkipBrokerage = () => {
    console.log('🏦 handleSkipBrokerage: User skipped brokerage connection');
    onClose();
    resetSignupFlow();
  };

  const resendEmail = async () => {
    console.log('📧 resendEmail: Attempting to resend email to:', signupEmail);
    
    if (!signupEmail) {
      console.log('❌ resendEmail: No email address stored');
      return;
    }

    setLoading(true);
    try {
      console.log('📧 resendEmail: Calling supabase.auth.resend...');
      
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: signupEmail,
      });

      console.log('📧 resendEmail: Resend response:', { data, error });

      if (error) {
        console.log('❌ resendEmail: Resend failed:', error);
        alert('Failed to resend email: ' + error.message);
      } else {
        console.log('✅ resendEmail: Email resent successfully');
        alert('Verification email resent!');
      }
    } catch (err) {
      console.log('❌ resendEmail: Unexpected error:', err);
      alert('Failed to resend email');
    }
    setLoading(false);
  };

  //put the google auth handler stuff here
  const handleGoogleSignup = async () => {
    console.log('🔵 handleGoogleSignup: Starting Google OAuth flow');
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${getSiteUrl()}/?signup=profile`
        }
      });
      
      console.log('🔵 handleGoogleSignup: OAuth response:', { data, error });
      
      if (error) {
        console.log('❌ handleGoogleSignup: OAuth error:', error);
        setError(error.message);
      }
    } catch (err) {
      console.log('❌ handleGoogleSignup: Unexpected error:', err);
      setError('An unexpected error occurred with Google sign-up');
    }
  };


  if (!isOpen) {
    console.log('🚫 Modal not open, returning null');
    return null;
  }

  const getStepNumber = () => {
    switch (signupStep) {
      case 'email': return 1;
      case 'verify': return 1;
      case 'password': return 2;
      case 'profile': return 3;
      case 'brokerage': return 4;
      case 'connecting': return 4; // Same as brokerage
      case 'complete': return 4;   // Show complete
      default: return 1;
    }
  };


  console.log('🎨 Rendering modal for step:', signupStep, 'Step number:', getStepNumber());

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
        {signupStep === 'email' && 'Join the community'}
        {signupStep === 'verify' && 'Check your inbox! 📧'}
        {signupStep === 'password' && 'Secure your account'}
        {signupStep === 'profile' && 'Set up your profile'}
        {signupStep === 'brokerage' && 'Connect your brokerage'}
        {signupStep === 'connecting' && 'Connect your brokerage'}
        {signupStep === 'complete' && 'Welcome to TopTrader!'}
        </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        {/* Progress indicator for steps 2-5 */}
        {signupStep !== 'email' && (
          <div className="mb-6">
            <div className="flex items-center justify-center mb-2">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-600">🐂 Top Trader</span>
              </div>
            </div>
            <div className="flex items-center justify-center mb-4">
              <span className="text-sm text-gray-500">Step {getStepNumber()} of 4</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(getStepNumber() / 4) * 100}%` }}
              ></div>
            </div>
          </div>
        )}


        {/* Step-specific content */}
        {signupStep === 'email' && (
          <div>
            <p className="text-gray-600 mb-6 text-center">Share trades, climb leaderboards, learn from the best</p>
            
            {/* Google Auth Button*/}
            <button 
              onClick={handleGoogleSignup}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 mb-4 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="font-medium">Continue with Google</span>
            </button>

            <div className="text-center text-gray-500 mb-4">or</div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleEmailSubmit}>
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    console.log('📧 Email input changed to:', e.target.value);
                    setEmail(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Sending...' : 'Continue with email'}
              </button>
            </form>

            <p className="mt-4 text-xs text-gray-500 text-center">
              By continuing you agree to our{' '}
              <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
            </p>
          </div>
        )}

        {signupStep === 'verify' && (
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              We sent a magic link to<br />
              <strong>{signupEmail}</strong>
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                Click the link in your email, then come back here.<br />
                This page will magically update when you do!
              </p>
            </div>

            <button
              onClick={resendEmail}
              disabled={loading}
              className="w-full mb-4 px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 disabled:opacity-50 transition-colors"
            >
              Didn't get it? Resend email
            </button>

            <div className="flex items-center justify-center space-x-1 text-gray-400">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">Waiting for confirmation...</p>
          </div>
        )}

        {signupStep === 'password' && (
          <div>
            <p className="text-gray-600 mb-6 text-center">Choose a strong password to protect your trades</p>
            
            {passwordError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{passwordError}</p>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit}>
              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    console.log('🔐 Password input changed');
                    setPassword(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Create a strong password"
                  required
                />
              </div>

              <div className="mb-6 p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium text-gray-700 mb-2">Password must include:</p>
                <ul className="text-sm space-y-1">
                  <li className={`flex items-center ${password.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="mr-2">{password.length >= 8 ? '✓' : '•'}</span>
                    At least 8 characters
                  </li>
                  <li className={`flex items-center ${/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="mr-2">{/[A-Z]/.test(password) ? '✓' : '•'}</span>
                    One uppercase letter
                  </li>
                  <li className={`flex items-center ${/[0-9!@#$%^&*]/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="mr-2">{/[0-9!@#$%^&*]/.test(password) ? '✓' : '•'}</span>
                    One number or symbol
                  </li>
                </ul>
              </div>

              <button 
                type="submit"
                disabled={loading || validatePassword(password).length > 0}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating account...' : 'Continue'}
              </button>
            </form>
          </div>
        )}

        {signupStep === 'profile' && (
          <div>
            <p className="text-gray-600 mb-6 text-center">You can change this later in Settings</p>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleProfileSubmit}>
              <div className="mb-4">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    const newUsername = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
                    console.log('👤 Username input changed to:', newUsername);
                    setUsername(newUsername);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Choose your unique username"
                  required
                  maxLength={50}
                />
              </div>

              <div className="mb-6">
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => {
                    console.log('👤 Display name input changed to:', e.target.value);
                    setDisplayName(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your full name or nickname"
                  maxLength={100}
                />
              </div>

              <button 
                type="submit"
                disabled={profileLoading || !username.trim()}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {profileLoading ? 'Saving...' : 'Continue'}
              </button>
            </form>
          </div>
        )}

        {/* Brokerage Connection Step */}
        {signupStep === 'brokerage' && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">Connect Your Brokerage</h3>
              <p className="text-sm text-gray-600 mt-2">
                Connect your trading account to start sharing your trades and competing with friends.
              </p>
            </div>

            {snapTradeError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{snapTradeError}</p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleBrokerageConnection}
                disabled={snapTradeLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
        {snapTradeLoading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Setting up connection...
          </div>
        ) : (
          'Connect Brokerage Account'
        )}
              </button>

              <button
                onClick={() => {
                  // Skip brokerage connection for now
                  setSignupStep('complete');
        }}
                className="w-full py-2 px-4 text-sm text-gray-600 hover:text-gray-800"
              >
                Skip for now (you can connect later)
              </button>
            </div>
          </div>
        )}

        {/* Connecting Step */}
{signupStep === 'connecting' && (
  <div className="text-center space-y-6">
    <div className="text-center">
      <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Connecting Your Account</h3>
      <p className="text-sm text-gray-600">
        Complete the setup in the other tab, then come back here.
      </p>
    </div>

    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Instructions:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Select your brokerage (Robinhood, etc.)</li>
            <li>Log in with your brokerage credentials</li>
            <li>Grant permission to connect</li>
            <li>Return to this tab when done</li>
          </ol>
        </div>
      </div>
    </div>

    <button
      onClick={() => setSignupStep('brokerage')}
      className="text-sm text-gray-600 hover:text-gray-800"
    >
      Cancel and go back
    </button>

    <div className="flex items-center justify-center space-x-1 text-gray-400">
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
    </div>
    <p className="text-sm text-gray-500">Waiting for connection...</p>
  </div>
)}

{/* Complete Step */}
{signupStep === 'complete' && (
  <div className="text-center space-y-6">
    <div className="text-center">
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">All Set! 🎉</h3>
      <p className="text-sm text-gray-600">
        Your brokerage account is connected and you're ready to start trading socially.
      </p>
    </div>

    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="text-sm text-green-800">
        <p className="font-medium mb-2">What's next:</p>
        <ul className="space-y-1">
          <li>• Share your trades with the community</li>
          <li>• Climb the leaderboards</li>
          <li>• Learn from top traders</li>
          <li>• Compete with friends</li>
        </ul>
      </div>
    </div>

    <button
      onClick={() => {
        onClose();
        resetSignupFlow();
        // Optionally redirect to dashboard
        window.location.href = '/dashboard';
      }}
      className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors font-medium"
    >
      Get Started Trading!
    </button>
  </div>
)}
      </div>
    </div>
  );
}