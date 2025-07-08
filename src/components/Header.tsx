'use client';

import Link from 'next/link';
import { useAuthModal } from '@/context/AuthModalContext';
import { useAuth } from '@/hooks/useAuth';

export default function Header() {
  const { openLoginModal, openSignupModal } = useAuthModal();
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side: Logo and Nav */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-gray-900">TopTrader</h1>
            </Link>
            <nav className="hidden md:flex space-x-6">
              <Link href="#" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                Gains Wall
              </Link>
              <Link href="#" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                Leaderboard
              </Link>
            </nav>
          </div>

          {/* Right side: Auth buttons */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <button
                  onClick={openLoginModal}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-transparent rounded-md hover:bg-gray-100 transition-colors"
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
            {/* Mobile menu button can be added here */}
          </div>
        </div>
      </div>
    </header>
  );
}