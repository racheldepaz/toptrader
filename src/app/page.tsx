'use client';

import { useState, useEffect } from 'react';
import LandingPage from '@/components/landing/LandingPage';
import EnhancedDashboard from '@/components/dashboard/EnhancedDashboard';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

export default function HomePage() {
  const { isAuthenticated, loading } = useSupabaseAuth();
  const [showFallback, setShowFallback] = useState(false);

  // Fallback to localStorage auth if Supabase auth fails
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      const localAuth = localStorage.getItem('isAuthenticated') === 'true';
      setShowFallback(localAuth);
    }
  }, [loading, isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show dashboard if authenticated via Supabase OR localStorage fallback
  if (isAuthenticated || showFallback) {
    return <EnhancedDashboard />;
  }

  return <LandingPage />;
}