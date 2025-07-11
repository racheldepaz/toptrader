'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/lib/supabase';
import { useAuthModal } from '@/context/AuthModalContext';
import MultiStepSignupModal from '@/components/auth/MultiStepSignupModal';

export default function EnhancedDashboard() {
  console.log('📊 EnhancedDashboard: Component rendered');
  
  const { user } = useSupabaseAuth();
  const searchParams = useSearchParams();
  const { 
    isSignupModalOpen, 
    openSignupModal, 
    closeSignupModal, 
    setSignupStep,
    signupStep 
  } = useAuthModal();

  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useRealData, setUseRealData] = useState(true);

  console.log('📊 EnhancedDashboard: Current state:', {
    user: user ? { id: user.id, email: user.email } : null,
    searchParams: searchParams?.toString(),
    isSignupModalOpen,
    signupStep
  });


  useEffect(() => {
    const handleSignupFlow = async () => {
      console.log('📊 EnhancedDashboard: Handling signup flow', { 
        user: user ? { id: user.id, email: user.email } : null, 
        searchParams: searchParams?.toString(),
        signupStep 
      });
  
      if (!user) {
        console.log('📊 EnhancedDashboard: No user, skipping signup flow');
        return;
      }
  
      const signupParam = searchParams?.get('signup');
      
      // Handle URL-based signup flow first (from email verification or explicit redirects)
      if (signupParam === 'verify' && signupStep === 'email') {
        console.log('📊 EnhancedDashboard: User just verified email, moving to password step');
        openSignupModal();
        setSignupStep('password');
        return;
      }
      
      if (signupParam === 'profile') {
        console.log('📊 EnhancedDashboard: User needs to complete profile setup (from URL)');
        openSignupModal();
        setSignupStep('profile');
        return;
      }
  
      // If no URL-based signup flow, check if user needs to complete profile
      // This catches new Google OAuth users and incomplete profiles
      if (!signupParam) {
        console.log('📊 EnhancedDashboard: No signup URL param, checking if user has completed profile');
        
        try {
          const { data: profile, error } = await supabase
            .from('users')
            .select('username, display_name')
            .eq('id', user.id)
            .single();
  
          console.log('📊 EnhancedDashboard: User profile check result:', { profile, error });
  
          if (error && error.code === 'PGRST116') {
            // No profile found - this is a new user (likely from Google OAuth)
            console.log('📊 EnhancedDashboard: No profile found, opening signup modal for profile step');
            openSignupModal();
            setSignupStep('profile');
            
            // Update URL to indicate profile step for consistency
            if (typeof window !== 'undefined') {
              const url = new URL(window.location.href);
              url.searchParams.set('signup', 'profile');
              window.history.replaceState({}, '', url.toString());
            }
          } else if (profile && (!profile.username || profile.username === user.email)) {
            // Profile exists but incomplete OR username is still the email (Google OAuth new user)
            console.log('📊 EnhancedDashboard: Profile incomplete or username is email address, opening signup modal for profile step');
            openSignupModal();
            setSignupStep('profile');
            
            // Update URL to indicate profile step for consistency
            if (typeof window !== 'undefined') {
              const url = new URL(window.location.href);
              url.searchParams.set('signup', 'profile');
              window.history.replaceState({}, '', url.toString());
            }
          } else {
            console.log('📊 EnhancedDashboard: User profile complete');
          }
        } catch (err) {
          console.log('📊 EnhancedDashboard: Error checking profile:', err);
        }
      } else {
        console.log('📊 EnhancedDashboard: Not interfering with signup flow.');
      }
    };

    if (user) {
      handleSignupFlow();
    }
  }, [user, searchParams, signupStep, openSignupModal, setSignupStep]);

  const loadTrades = async () => {
    console.log('📊 EnhancedDashboard: Loading trades, useRealData:', useRealData);
    setLoading(true);
    setError(null);

    try {
      if (useRealData) {
        console.log('📊 EnhancedDashboard: Attempting to load real trades from Supabase');
        const { data, error: supabaseError } = await supabase
          .from('trades')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (supabaseError) {
          console.log('📊 EnhancedDashboard: Supabase error:', supabaseError);
          throw supabaseError;
        }

        console.log('📊 EnhancedDashboard: Real trades loaded:', data?.length || 0);
        setTrades(data || []);
      } else {
        console.log('📊 EnhancedDashboard: Using mock data');
        // Mock data for testing
        const mockTrades = [
          {
            id: 1,
            user_id: 'mock-user',
            symbol: 'AAPL',
            action: 'BUY',
            quantity: 100,
            price: 150.25,
            created_at: new Date().toISOString(),
            username: 'demo_trader',
            display_name: 'Demo Trader'
          },
          {
            id: 2,
            user_id: 'mock-user-2',
            symbol: 'TSLA',
            action: 'SELL',
            quantity: 50,
            price: 205.75,
            created_at: new Date(Date.now() - 3600000).toISOString(),
            username: 'tesla_fan',
            display_name: 'Tesla Fan'
          }
        ];
        setTrades(mockTrades);
      }
    } catch (err: any) {
      console.log('📊 EnhancedDashboard: Error loading trades:', err);
      setError(err.message || 'Failed to load trades');
      
      if (useRealData) {
        console.log('📊 EnhancedDashboard: Falling back to mock data');
        // Fallback to mock data
        const mockTrades = [
          {
            id: 1,
            user_id: 'mock-user',
            symbol: 'AAPL',
            action: 'BUY',
            quantity: 100,
            price: 150.25,
            created_at: new Date().toISOString(),
            username: 'demo_trader',
            display_name: 'Demo Trader'
          }
        ];
        setTrades(mockTrades);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    console.log('📊 EnhancedDashboard: useEffect for loading trades');
    loadTrades();
  }, [useRealData]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleTradeAction = (tradeId: number, action: 'like' | 'comment') => {
    console.log(`📊 EnhancedDashboard: ${action} trade ${tradeId}`);
    // Handle like/comment functionality
    setTrades(trades.map(trade => 
      trade.id === tradeId 
        ? { ...trade, [`${action}s`]: (trade[`${action}s`] || 0) + 1 }
        : trade
    ));
  };

  const handleRefresh = () => {
    console.log('📊 EnhancedDashboard: Manual refresh triggered');
    loadTrades();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Sidebar - Takes 1 column */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Your Performance */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">Your Performance</h3>
                <div className="text-sm text-gray-600">Performance stats will go here</div>
              </div>
              
              {/* Quick Leaderboard */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">Quick Leaderboard</h3>
                <div className="text-sm text-gray-600">Leaderboard will go here</div>
              </div>

              {/* Data Source Toggle (for development) */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">Data Source</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={useRealData}
                      onChange={() => setUseRealData(true)}
                      className="mr-2"
                    />
                    <span className="text-sm">Supabase Data</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!useRealData}
                      onChange={() => setUseRealData(false)}
                      className="mr-2"
                    />
                    <span className="text-sm">Mock Data</span>
                  </label>
                </div>
                <button
                  onClick={handleRefresh}
                  className="mt-3 w-full px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Main Feed - Takes 3 columns */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Gains Wall</h2>
              <div className="flex items-center space-x-4">
                {error && (
                  <span className="text-sm text-red-600">
                    {useRealData ? 'Using mock data - ' + error : ''}
                  </span>
                )}
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600">Loading trades...</span>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Using {useRealData ? 'Mock' : 'Demo'} Data
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>{error}. {useRealData ? 'Showing mock data as fallback.' : ''}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Trades Feed */}
            {!loading && (
              <div className="space-y-4">
                {trades.length > 0 ? (
                  trades.map((trade) => (
                    <div key={trade.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {trade.display_name?.[0] || trade.username?.[0] || 'U'}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {trade.display_name || trade.username || 'Unknown User'}
                            </h4>
                            <p className="text-sm text-gray-500">@{trade.username || 'unknown'}</p>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDate(trade.created_at)}
                        </span>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            trade.action === 'BUY' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {trade.action}
                          </span>
                          <span className="font-medium">{trade.quantity} shares of {trade.symbol}</span>
                          <span className="text-gray-500">at {formatPrice(trade.price)}</span>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center space-x-4">
                        <button
                          onClick={() => handleTradeAction(trade.id, 'like')}
                          className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm">{trade.likes || 0}</span>
                        </button>
                        <button
                          onClick={() => handleTradeAction(trade.id, 'comment')}
                          className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm">{trade.comments || 0}</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v18a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1h2a1 1 0 011 1v1m0 0h10M9 7h6m-3 4h3" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No trades yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Start following traders or connect your brokerage to see trades here.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Signup Modal for continuing the flow */}
      <MultiStepSignupModal 
        isOpen={isSignupModalOpen} 
        onClose={closeSignupModal} 
      />
    </div>
  );
}