// components/Header.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { useAuthModal } from '@/context/AuthModalContext';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useUserProfileQuery } from '@/hooks/useUserProfileQuery';
import UserProfileDropdown from './UserProfileDropdown';

export default function Header() {
  const { openLoginModal, openSignupModal, setSignupStep } = useAuthModal();
  const { logout } = useSupabaseAuth();
  
  // Get data from React Query hook
  const { 
    profile, 
    loading, 
    isAuthenticated, 
    hasCompletedProfile,
    updateProfileCache, 
    refreshProfile 
  } = useUserProfileQuery();
  
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Handle search functionality
      console.log('Searching for:', searchQuery);
      // You can add navigation logic here
      // router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleCompleteProfile = () => {
    // Open signup modal and go to profile step
    setSignupStep('profile');
    openSignupModal();
  };

  // Show loading state while auth is resolving
  if (loading) {
    return (
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex-shrink-0">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TopTrader
              </h1>
            </Link>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side: Logo and Nav */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex-shrink-0">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TopTrader
              </h1>
            </Link>
            
            {/* Navigation - Only show when authenticated */}
            {isAuthenticated && (
              <nav className="hidden md:flex space-x-6">
                <Link 
                  href="/feed" 
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Feed
                </Link>
                <Link 
                  href="/leaderboards" 
                  className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Leaderboard
                </Link>
                <Link 
                  href="/friends" 
                  className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Friends
                </Link>
              </nav>
            )}
          </div>

          {/* Center: Search Bar (only when authenticated and profile complete) */}
          {isAuthenticated && hasCompletedProfile && (
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="w-full">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search traders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleSearch}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white/50 backdrop-blur-sm placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Right side: Auth Section */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <UserProfileDropdown 
                profile={profile || null}
                hasCompletedProfile={hasCompletedProfile}
                onLogout={handleLogout}
                onCompleteProfile={handleCompleteProfile}
              />
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <button
                  onClick={openLoginModal}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-blue-100 rounded-md hover:bg-gray-100 transition-colors"
                >
                  Log In
                </button>
                <button
                  onClick={openSignupModal}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Sign Up
                </button>
              </div>
            )}
            
            {/* Mobile menu button */}
            <button className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}