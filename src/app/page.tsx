'use client';

import LandingPage from '@/components/landing/LandingPage';
import Dashboard from '@/components/dashboard/Dashboard';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return user ? <Dashboard /> : <LandingPage />;
}