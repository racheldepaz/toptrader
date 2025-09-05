'use client';

import LandingPage from '@/components/landing/LandingPage';
import EnhancedDashboard from '@/components/dashboard/EnhancedDashboard';
import { useSupabaseAuth } from "@/context/AuthContext"

export default function HomePage() {
  const { isAuthenticated, loading, user } = useSupabaseAuth();

  console.log('🏠 HomePage: Auth state:', { isAuthenticated, loading, hasUser: !!user });

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

  // ONLY show dashboard if properly authenticated via Supabase
  if (isAuthenticated && user) {
    console.log('🏠 HomePage: User authenticated, showing dashboard');
    return <EnhancedDashboard />;
  }

  // Show landing page for unauthenticated users
  console.log('🏠 HomePage: User not authenticated, showing landing page');
  return <LandingPage />;
}