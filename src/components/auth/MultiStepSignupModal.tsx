'use client';

import { useState, useEffect } from 'react';
import { useAuthModal, SignupStep } from '@/context/AuthModalContext';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/lib/supabase';

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
  
  const { user } = useSupabaseAuth();

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
    case 'email': return 1; // Not shown (no progress bar on email step)
    case 'verify': return 1; // "Step 1 of 4"
    case 'password': return 2; // "Step 2 of 4" 
    case 'profile': return 3; // "Step 3 of 4"
    case 'brokerage': return 4; // "Step 4 of 4"
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
            
            {/* Google Auth Button (disabled for now) */}
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

        {signupStep === 'brokerage' && (
          <div>
            <p className="text-gray-600 mb-6 text-center">Link your trading account to start sharing your moves</p>
            
            <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-green-700">Read-only access • Your credentials stay safe</span>
            </div>

            <div className="space-y-3 mb-6">
              <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between bg-gray-50">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-xs">TD</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">TD Ameritrade</div>
                    <div className="text-sm text-gray-500">Connect your TD account securely with SnapTrade</div>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between bg-gray-50">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-xs">HOOD</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Robinhood</div>
                    <div className="text-sm text-gray-500">Connect your Robinhood account securely</div>
                  </div>
                </div>
              </div>

              <div className="text-center text-sm text-blue-600 py-2">
                + 12 more brokerages supported
              </div>
            </div>

            <div className="space-y-3">
              <button 
                disabled
                className="w-full bg-gray-300 text-gray-500 py-3 px-4 rounded-md cursor-not-allowed"
              >
                Connect Brokerage
              </button>
              
              <button 
                onClick={handleSkipBrokerage}
                className="w-full bg-white text-gray-600 py-3 px-4 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Skip for now
              </button>
            </div>

            <p className="mt-3 text-xs text-gray-500 text-center">
              You can always connect your brokerage later
            </p>
          </div>
        )}
      </div>
    </div>
  );
}