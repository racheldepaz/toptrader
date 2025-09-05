// src/app/trade/[id]/page.tsx - Fixed version
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { useSupabaseAuth } from '@/context/AuthContext';
import EnhancedTradeCard from '@/components/EnhancedTradeCard';
import CommentItem from '@/components/CommentItem';
import ViralShareButton from '@/components/ViralShareButton';
import { Trade, TradeComment } from '@/lib/types';
import { getTradeComments, addTradeComment } from '@/lib/api/social';

export default function TradePage() {
  const params = useParams();
  const router = useRouter();
  const tradeId = params.id as string;
  const { user: currentUser } = useSupabaseAuth();

  const [trade, setTrade] = useState<Trade | null>(null);
  const [comments, setComments] = useState<TradeComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Comment form state
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    if (tradeId) {
      fetchTradeDetails();
      fetchComments();
    }
  }, [tradeId, currentUser]);

  const fetchTradeDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('trades')
        .select(`
          *,
          users:user_id (
            username,
            display_name,
            avatar_url
          ),
          trade_likes (
            user_id
          )
        `)
        .eq('id', tradeId)
        .single();

      if (error) {
        console.error('Error fetching trade:', error);
        setError('Trade not found');
        return;
      }

      if (!data) {
        setError('Trade not found');
        return;
      }

      // Get like count
      const { count: likeCount } = await supabase
        .from('trade_likes')
        .select('*', { count: 'exact', head: true })
        .eq('trade_id', tradeId);

      // Get comment count
      const { count: commentCount } = await supabase
        .from('trade_comments')
        .select('*', { count: 'exact', head: true })
        .eq('trade_id', tradeId);

      // Check if current user has liked this trade
      const userHasLiked = currentUser ? 
        data.trade_likes.some((like: any) => like.user_id === currentUser.id) : 
        false;

      // Transform to UI Trade format
      const userData = Array.isArray(data.users) ? data.users[0] : data.users;
      
      const uiTrade: Trade = {
        id: data.id,
        user: {
          id: data.user_id,
          username: userData?.username || '',
          displayName: userData?.display_name,
          avatar: userData?.display_name?.charAt(0) || userData?.username?.charAt(0) || 'U',
          isPublic: true,
          isDemo: false,
          createdAt: '',
          updatedAt: ''
        },
        symbol: data.symbol,
        companyName: data.company_name,
        tradeType: data.trade_type,
        percentage: data.profit_loss_percentage,
        timeAgo: formatTimeAgo(data.created_at),
        description: data.description || '',
        likes: likeCount || 0,
        comments: commentCount || 0,
        userHasLiked,
        executedAt: data.executed_at,
        createdAt: data.created_at,
        showAmounts: data.show_amounts,
        showQuantity: data.show_quantity,
        visibility: data.visibility,
        // Add the additional fields for the enhanced display
        quantity: data.quantity,
        price: data.price,
        totalValue: data.total_value,
        profitLoss: data.profit_loss,
        assetType: data.asset_type
      };

      setTrade(uiTrade);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Failed to load trade');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const result = await getTradeComments(tradeId);
      if (result.success) {
        setComments(result.comments);
      } else {
        console.error('Failed to load comments:', result.error);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const handleTradeUpdate = (updatedTrade: Trade) => {
    setTrade(updatedTrade);
  };

  const handleCommentDelete = (commentId: string) => {
    setComments(prev => prev.filter(c => c.id !== commentId));
    if (trade) {
      setTrade({
        ...trade,
        comments: Math.max(0, trade.comments - 1)
      });
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      alert('Please log in to comment');
      return;
    }

    if (!newComment.trim()) return;

    setIsSubmittingComment(true);

    try {
      const result = await addTradeComment(tradeId, newComment.trim());
      
      if (result.success && result.comment) {
        setComments(prev => [...prev, result.comment!]);
        setNewComment('');
        
        // Update trade comment count
        if (trade) {
          setTrade({
            ...trade,
            comments: trade.comments + 1
          });
        }
      } else {
        alert(`Failed to add comment: ${result.error}`);
      }
    } catch (err) {
      console.error('Error submitting comment:', err);
      alert('Failed to submit comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !trade) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Trade Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'This trade does not exist or is not available.'}</p>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            
            <h1 className="text-lg font-semibold text-gray-900">Trade Details</h1>
            
            <div className="flex items-center space-x-2">
            <ViralShareButton 
            type="trade"
            data={{
              id: trade.id,
              user: {
                username: trade.user.username,
                displayName: trade.user.displayName
              },
              symbol: trade.symbol,
              companyName: trade.companyName,
              tradeType: trade.tradeType,
              percentage: trade.percentage,
              timeAgo: trade.timeAgo
            }}
            variant="default"
            />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Trade Card */}
        <div className="mb-8">
          <EnhancedTradeCard 
            trade={trade} 
            onTradeUpdate={handleTradeUpdate}
            isDetailed={true} // Hide the "View Details" button since we're already on the detailed page
            clickable={false} // Disable card click on detail page
          />
        </div>

        {/* Enhanced Trade Details Card (additional info) */}
        {(trade.showAmounts || trade.showQuantity) && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Trade Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {trade.showQuantity && trade.quantity && (
                <div>
                  <span className="font-medium text-gray-600">Quantity:</span>
                  <p className="text-gray-900">{trade.quantity.toLocaleString()}</p>
                </div>
              )}
              {trade.showAmounts && trade.price && (
                <div>
                  <span className="font-medium text-gray-600">Price:</span>
                  <p className="text-gray-900">${trade.price.toFixed(2)}</p>
                </div>
              )}
              {trade.showAmounts && trade.totalValue && (
                <div>
                  <span className="font-medium text-gray-600">Total Value:</span>
                  <p className="text-gray-900">${trade.totalValue.toLocaleString()}</p>
                </div>
              )}
              <div>
                <span className="font-medium text-gray-600">Executed:</span>
                <p className="text-gray-900">{new Date(trade.executedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Comments Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              Discussion ({comments.length})
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Share your thoughts and analysis about this trade
            </p>
          </div>

          {/* Add Comment Form */}
          {currentUser ? (
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <form onSubmit={handleSubmitComment}>
                <div className="space-y-3">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="What do you think about this trade? Share your analysis..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500">
                      Be respectful and constructive in your feedback
                    </p>
                    <button
                      type="submit"
                      disabled={!newComment.trim() || isSubmittingComment}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            <div className="p-6 border-b border-gray-200 bg-gray-50 text-center">
              <p className="text-gray-600">
                Please log in to join the discussion about this trade.
              </p>
            </div>
          )}

          {/* Comments List */}
          <div className="divide-y divide-gray-200">
            {comments.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <MessageCircle className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No comments yet</h3>
                <p className="text-gray-600">
                  Be the first to share your thoughts on this trade!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {comments.map((comment) => (
                  <div key={comment.id} className="p-6">
                    <CommentItem
                      comment={comment}
                      onDelete={handleCommentDelete}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}