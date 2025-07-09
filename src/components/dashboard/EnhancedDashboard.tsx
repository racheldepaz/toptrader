import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import EnhancedTradeCard from '@/components/EnhancedTradeCard';
import { Trade, convertDbTradeToUITrade } from '@/lib/types';
import { getTradesWithSocialStats } from '@/lib/api/social';
import { mockTrades } from '@/lib/mockData';

export default function EnhancedDashboard() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useRealData, setUseRealData] = useState(true);

  useEffect(() => {
    loadTrades();
  }, [useRealData]);

  const loadTrades = async () => {
    setLoading(true);
    setError(null);

    if (!useRealData) {
      // Use mock data for demo purposes
      setTrades(mockTrades);
      setLoading(false);
      return;
    }

    try {
      const result = await getTradesWithSocialStats();
      
      if (result.success) {
        const convertedTrades = result.trades.map(convertDbTradeToUITrade);
        setTrades(convertedTrades);
      } else {
        console.error('Failed to load trades:', result.error);
        setError(result.error || 'Failed to load trades');
        // Fallback to mock data
        setTrades(mockTrades);
      }
    } catch (err) {
      console.error('Unexpected error loading trades:', err);
      setError('Unexpected error occurred');
      // Fallback to mock data
      setTrades(mockTrades);
    }

    setLoading(false);
  };

  const handleTradeUpdate = (updatedTrade: Trade) => {
    setTrades(prevTrades => 
      prevTrades.map(trade => 
        trade.id === updatedTrade.id ? updatedTrade : trade
      )
    );
  };

  const handleRefresh = () => {
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
                  trades.map(trade => (
                    <EnhancedTradeCard 
                      key={trade.id} 
                      trade={trade} 
                      onTradeUpdate={handleTradeUpdate}
                      useMockData={!useRealData}
                    />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-500 mb-4">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-6m-4 0h-6m-4 0H4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No trades yet</h3>
                    <p className="text-gray-500">
                      {useRealData 
                        ? 'No trades found in the database. Add some trades to see them here!' 
                        : 'Switch to mock data to see sample trades.'
                      }
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}