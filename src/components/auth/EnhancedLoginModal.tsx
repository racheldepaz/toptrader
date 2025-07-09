'use client';

import { useState } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

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
  
  const { login } = useSupabaseAuth();

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
        setError(loginError.message);
      } else {
        onClose();
        // The auth state change will trigger a re-render
      }
    } catch (err) {
      setError('An unexpected error occurred');
    }

    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Welcome Back</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

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
            <p>Don't have an account? 
              <button 
                onClick={() => {/* Switch to signup modal */}} 
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