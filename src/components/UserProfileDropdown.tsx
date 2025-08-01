import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User, Settings, LogOut, BarChart3, Users, TrendingUp, AlertCircle } from 'lucide-react';
import {supabase} from '@/lib/supabase'

interface UserProfileDropdownProps {
  profile: {
    id: string;
    email?: string;
    username?: string;
    display_name?: string;
    avatar_url?: string;
  } | null;
  hasCompletedProfile: boolean;
  onLogout: () => void;
  onCompleteProfile?: () => void;
}

export default function UserProfileDropdown({ 
  profile, 
  hasCompletedProfile, 
  onLogout, 
  onCompleteProfile 
}: UserProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!profile) return null;

  const getLatestPortfolioValue = async () => {
    const { data: profileStats } = await supabase.from('user_stats').select('*').eq('user_id', profile.id).single()
    return profileStats?.portfolio_value
  }

  // Get user initials for avatar fallback
  const getInitials = () => {
    if (profile.display_name) {
      return profile.display_name
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (profile.username) {
      return profile.username.slice(0, 2).toUpperCase();
    }
    if (profile.email) {
      return profile.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const displayName = profile.display_name || profile.username || profile.email?.split('@')[0] || 'User';
  const username = profile.username || profile.email?.split('@')[0] || 'user';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
          hasCompletedProfile 
            ? 'hover:bg-gray-100' 
            : 'hover:bg-yellow-50 ring-2 ring-yellow-300'
        }`}
      >
        {/* Profile Picture / Avatar */}
        <div className="relative">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={displayName}
              className={`w-8 h-8 rounded-full object-cover border-2 ${
                hasCompletedProfile ? 'border-blue-500' : 'border-yellow-500'
              }`}
            />
          ) : (
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold border-2 ${
              hasCompletedProfile ? 'border-blue-500' : 'border-yellow-500'
            }`}>
              {getInitials()}
            </div>
          )}
          
          {/* Status indicator */}
          {hasCompletedProfile ? (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          ) : (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-yellow-500 border-2 border-white rounded-full flex items-center justify-center">
              <AlertCircle className="w-2 h-2 text-white" />
            </div>
          )}
        </div>

        {/* User Info - Hidden on mobile */}
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium text-gray-900">{displayName}</div>
          <div className={`text-xs ${hasCompletedProfile ? 'text-gray-500' : 'text-yellow-600'}`}>
            {hasCompletedProfile ? `@${username}` : 'Complete setup'}
          </div>
        </div>
        
        {/* Dropdown Arrow */}
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 z-50 overflow-hidden">
          {/* Header Section */}
          <div className={`px-4 py-3 border-b border-gray-100 ${
            hasCompletedProfile 
              ? 'bg-gradient-to-r from-blue-50 to-purple-50' 
              : 'bg-gradient-to-r from-yellow-50 to-orange-50'
          }`}>
            <div className="flex items-center space-x-3">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className={`w-12 h-12 rounded-full object-cover border-2 ${
                    hasCompletedProfile ? 'border-blue-500' : 'border-yellow-500'
                  }`}
                />
              ) : (
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-semibold border-2 ${
                  hasCompletedProfile ? 'border-blue-500' : 'border-yellow-500'
                }`}>
                  {getInitials()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">{displayName}</div>
                <div className={`text-xs truncate ${hasCompletedProfile ? 'text-gray-500' : 'text-yellow-600'}`}>
                  {hasCompletedProfile ? `@${username}` : 'Profile incomplete'}
                </div>
                {hasCompletedProfile && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Portfolio: $175.20
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Profile completion warning */}
            {!hasCompletedProfile && (
              <div className="mt-3 p-2 bg-yellow-100 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="text-xs text-yellow-800">Complete your profile to start trading</span>
                </div>
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {!hasCompletedProfile ? (
              // Profile completion CTA
              <button
                onClick={() => {
                  setIsOpen(false);
                  onCompleteProfile?.();
                }}
                className="w-full flex items-center px-4 py-3 text-sm text-yellow-700 hover:bg-yellow-50 transition-colors group"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-yellow-100 mr-3 group-hover:bg-yellow-200 transition-colors">
                  <User className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900">Complete Profile</div>
                  <div className="text-xs text-gray-500 mt-0.5">Set up username and display name</div>
                </div>
              </button>
            ) : (
              // Full menu for completed profiles
              <>
                {/* View Profile */}
                <Link
                  href={`/user/${username}`}
                  className="flex items-center px-4 py-3 text-sm hover:bg-gray-50 transition-colors group"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 mr-3 group-hover:bg-blue-100 transition-colors">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900">View Profile</div>
                    <div className="text-xs text-gray-500 mt-0.5">See your public profile</div>
                  </div>
                </Link>

                {/* Performance Analytics */}
                <Link
                  href="/analytics"
                  className="flex items-center px-4 py-3 text-sm hover:bg-gray-50 transition-colors group"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-50 mr-3 group-hover:bg-purple-100 transition-colors">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900">Analytics</div>
                    <div className="text-xs text-gray-500 mt-0.5">Trading performance & insights</div>
                  </div>
                </Link>

                {/* Friends */}
                <Link
                  href="/friends"
                  className="flex items-center px-4 py-3 text-sm hover:bg-gray-50 transition-colors group"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-50 mr-3 group-hover:bg-green-100 transition-colors">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900">Friends</div>
                    <div className="text-xs text-gray-500 mt-0.5">Manage your trading network</div>
                  </div>
                </Link>

                {/* Leaderboards */}
                <Link
                  href="/leaderboards"
                  className="flex items-center px-4 py-3 text-sm hover:bg-gray-50 transition-colors group"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-50 mr-3 group-hover:bg-orange-100 transition-colors">
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900">Leaderboards</div>
                    <div className="text-xs text-gray-500 mt-0.5">See where you rank</div>
                  </div>
                </Link>
              </>
            )}

            {/* Divider */}
            <div className="border-t border-gray-100 my-2 mx-4"></div>

            {/* Settings */}
            <Link
              href="/settings"
              className="flex items-center px-4 py-3 text-sm hover:bg-gray-50 transition-colors group"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-50 mr-3 group-hover:bg-gray-100 transition-colors">
                <Settings className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-gray-900">Settings</div>
                <div className="text-xs text-gray-500 mt-0.5">Account & privacy settings</div>
              </div>
            </Link>

            {/* Logout */}
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full flex items-center px-4 py-3 text-sm hover:bg-red-50 transition-colors group"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-50 mr-3 group-hover:bg-red-100 transition-colors">
                <LogOut className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-gray-900">Log Out</div>
                <div className="text-xs text-gray-500 mt-0.5">Sign out of your account</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}