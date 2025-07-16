// ProfileTradeHistory.tsx
'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Filter, TrendingUp, TrendingDown, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Trade, TradeWithSocialStats, convertDbTradeToUITrade } from '@/lib/types';
import EnhancedTradeCard from '@/components/EnhancedTradeCard';

interface ProfileTradeHistoryProps {
  userId: string;
  isOwnProfile: boolean;
  username: string;
}

type FilterType = 'all' | 'buys' | 'sells' | 'winners' | 'losers';
type SortType = 'recent' | 'oldest' | 'best_performance' | 'worst_performance';

export default function ProfileTradeHistory({ 
  userId, 
  isOwnProfile, 
  username 
}: ProfileTradeHistoryProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const PAGE_SIZE = 10;

  const fetchTrades = async (pageNumber: number = 0, isLoadMore: boolean = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError(null);
    }

    try {
      // Build query based on privacy and visibility
      let query = supabase
        .from('trades')
        .select(`
          id,
          user_id,
          symbol,
          company_name,
          trade_type,
          profit_loss_percentage,
          description,
          executed_at,
          created_at,
          visibility,
          users!inner (
            username,
            display_name
          ),
          trade_likes (
            id,
            user_id
          ),
          trade_comments (
            id
          )
        `)
        .eq('user_id', userId)
        .range(pageNumber * PAGE_SIZE, (pageNumber + 1) * PAGE_SIZE - 1);

      // Apply privacy filters
      if (!isOwnProfile) {
        query = query.in('visibility', ['public', 'friends']);
      }

      // Apply trade type filter
      if (filter === 'buys') {
        query = query.eq('trade_type', 'BUY');
      } else if (filter === 'sells') {
        query = query.eq('trade_type', 'SELL');
      } else if (filter === 'winners') {
        query = query.gt('profit_loss_percentage', 0);
      } else if (filter === 'losers') {
        query = query.lt('profit_loss_percentage', 0);
      }

      // Apply sorting
      if (sort === 'recent') {
        query = query.order('executed_at', { ascending: false });
      } else if (sort === 'oldest') {
        query = query.order('executed_at', { ascending: true });
      } else if (sort === 'best_performance') {
        query = query.order('profit_loss_percentage', { ascending: false, nullsFirst: false });
      } else if (sort === 'worst_performance') {
        query = query.order('profit_loss_percentage', { ascending: true, nullsFirst: true });
      }

      const { data: tradesData, error: tradesError } = await query;

      if (tradesError) throw tradesError;

      // Get current user for like status
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      // Transform to UI format
      const transformedTrades: Trade[] = (tradesData || []).map(trade => {
        const userHasLiked = currentUser ? 
          trade.trade_likes.some((like: any) => like.user_id === currentUser.id) : 
          false;

        // Access user data correctly - users is an object, not an array
        const userData = Array.isArray(trade.users) ? trade.users[0] : trade.users;

        return {
          id: trade.id,
          user: {
            id: trade.user_id,
            username: userData?.username || '',
            displayName: userData?.display_name || undefined, // Convert null to undefined
            avatar: userData?.display_name?.charAt(0) || userData?.username?.charAt(0) || 'U',
            isPublic: true,
            isDemo: false,
            createdAt: '',
            updatedAt: ''
          },
          symbol: trade.symbol,
          companyName: trade.company_name || undefined, // Convert null to undefined
          tradeType: trade.trade_type as 'BUY' | 'SELL',
          percentage: trade.profit_loss_percentage || undefined, // Convert null to undefined
          timeAgo: formatTimeAgo(trade.created_at),
          description: trade.description || '',
          likes: trade.trade_likes.length,
          comments: trade.trade_comments.length,
          userHasLiked,
          executedAt: trade.executed_at,
          createdAt: trade.created_at,
          showAmounts: false,
          showQuantity: false,
          visibility: trade.visibility as 'public' | 'friends' | 'private'
        };
      });

      if (isLoadMore) {
        setTrades(prev => [...prev, ...transformedTrades]);
      } else {
        setTrades(transformedTrades);
      }

      // Check if there are more trades
      setHasMore(transformedTrades.length === PAGE_SIZE);
      setPage(pageNumber);

    } catch (err) {
      console.error('Error fetching trades:', err);
      setError('Failed to load trades');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Helper function to format time ago
  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 604800)}w ago`;
  };

  useEffect(() => {
    fetchTrades(0, false);
  }, [userId, filter, sort]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchTrades(page + 1, true);
    }
  };

  const handleTradeUpdate = (updatedTrade: Trade) => {
    setTrades(prev => 
      prev.map(trade => 
        trade.id === updatedTrade.id ? updatedTrade : trade
      )
    );
  };

  const getFilterStats = () => {
    const totalTrades = trades.length;
    const buys = trades.filter(t => t.tradeType === 'BUY').length;
    const sells = trades.filter(t => t.tradeType === 'SELL').length;
    const winners = trades.filter(t => t.percentage && t.percentage > 0).length;
    const losers = trades.filter(t => t.percentage && t.percentage < 0).length;

    return { totalTrades, buys, sells, winners, losers };
  };

  const stats = getFilterStats();

  if (loading && !loadingMore) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading trades...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center text-red-600">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-gray-900">
              {isOwnProfile ? 'Your Trades' : `${username}'s Trades`}
            </h2>
            <span className="text-sm text-gray-500">
              ({trades.length} {filter !== 'all' ? filter : 'total'})
            </span>
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Filter</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 space-y-4 pt-4 border-t border-gray-100">
            {/* Filter buttons */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trade Type</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'All', count: stats.totalTrades },
                  { key: 'buys', label: 'Buys', count: stats.buys },
                  { key: 'sells', label: 'Sells', count: stats.sells },
                  { key: 'winners', label: 'Winners', count: stats.winners },
                  { key: 'losers', label: 'Losers', count: stats.losers },
                ].map(({ key, label, count }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key as FilterType)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      filter === key
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {label} ({count})
                  </button>
                ))}
              </div>
            </div>

            {/* Sort options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'recent', label: 'Most Recent' },
                  { key: 'oldest', label: 'Oldest First' },
                  { key: 'best_performance', label: 'Best Performance' },
                  { key: 'worst_performance', label: 'Worst Performance' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setSort(key as SortType)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      sort === key
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Trades List */}
      <div className="divide-y divide-gray-200">
        {trades.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No trades yet</h3>
            <p className="text-gray-600">
              {isOwnProfile 
                ? 'Start trading to see your history here'
                : `${username} hasn't shared any trades yet`
              }
            </p>
          </div>
        ) : (
          <>
            {trades.map((trade) => (
              <div key={trade.id} className="p-6">
                <EnhancedTradeCard
                  trade={trade}
                  onTradeUpdate={handleTradeUpdate}
                />
              </div>
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="p-6 text-center border-t border-gray-200">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <span>Load More</span>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}