import React, { useState, useEffect } from 'react';
import { Trade, TradeComment } from '@/lib/types';
import { toggleTradeLike, getTradeComments, addTradeComment } from '@/lib/api/social';
import { 
    mockToggleTradeLike, 
    mockGetTradeComments, 
    mockAddTradeComment 
} from '@/lib/api/mockSocial';
import { supabase } from '@/lib/supabase';

interface EnhancedTradeCardProps {
    trade: Trade;
    onTradeUpdate?: (updatedTrade: Trade) => void;
    useMockData?: boolean; // Add this prop to control data source
}

export default function EnhancedTradeCard({ trade, onTradeUpdate, useMockData = false }: EnhancedTradeCardProps) {
    const [localTrade, setLocalTrade] = useState(trade);
    const [isLiking, setIsLiking] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<TradeComment[]>([]);
    const [commentInput, setCommentInput] = useState('');
    const [isAddingComment, setIsAddingComment] = useState(false);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Check authentication status
    useEffect(() => {
        const checkAuth = async () => {
            if (useMockData) {
                setIsAuthenticated(true); // Always authenticated in mock mode
                return;
            }
            
            const { data: { user } } = await supabase.auth.getUser();
            setIsAuthenticated(!!user);
        };
        checkAuth();
    }, [useMockData]);

    // Sync local trade with prop changes
    useEffect(() => {
        setLocalTrade(trade);
    }, [trade]);

    const handleLike = async () => {
        if (isLiking) return;
        
        if (!isAuthenticated && !useMockData) {
            alert('Please log in to like trades');
            return;
        }
        
        setIsLiking(true);
        
        try {
            const result = useMockData 
                ? await mockToggleTradeLike(localTrade.id)
                : await toggleTradeLike(localTrade.id);
            
            if (result.success) {
                const updatedTrade = {
                    ...localTrade,
                    likes: result.liked ? localTrade.likes + 1 : localTrade.likes - 1,
                    userHasLiked: result.liked
                };
                setLocalTrade(updatedTrade);
                onTradeUpdate?.(updatedTrade);
            } else {
                console.error('Failed to toggle like:', result.error);
                if (!useMockData) {
                    alert(`Failed to ${result.liked ? 'unlike' : 'like'} trade: ${result.error}`);
                }
            }
        } catch (error) {
            console.error('Unexpected error during like:', error);
            alert('Unexpected error occurred while liking trade');
        }
        
        // Add a small delay before allowing another like action
        setTimeout(() => setIsLiking(false), 300);
    };

    const handleShowComments = async () => {
        if (!showComments) {
            setIsLoadingComments(true);
            
            try {
                const result = useMockData 
                    ? await mockGetTradeComments(localTrade.id)
                    : await getTradeComments(localTrade.id);
                    
                if (result.success) {
                    setComments(result.comments);
                } else {
                    console.error('Failed to load comments:', result.error);
                    if (!useMockData) {
                        alert(`Failed to load comments: ${result.error}`);
                    }
                }
            } catch (error) {
                console.error('Unexpected error loading comments:', error);
                alert('Unexpected error occurred while loading comments');
            }
            
            setIsLoadingComments(false);
        }
        setShowComments(!showComments);
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentInput.trim() || isAddingComment) return;

        if (!isAuthenticated && !useMockData) {
            alert('Please log in to comment on trades');
            return;
        }

        // Prevent double submissions
        const commentToAdd = commentInput.trim();
        setCommentInput(''); // Clear input immediately
        setIsAddingComment(true);
        
        try {
            const result = useMockData 
                ? await mockAddTradeComment(localTrade.id, commentToAdd)
                : await addTradeComment(localTrade.id, commentToAdd);
            
            if (result.success && result.comment) {
                // Check if comment already exists (prevent duplicates)
                const commentExists = comments.some(c => 
                    c.content === result.comment!.content && 
                    c.userId === result.comment!.userId &&
                    Math.abs(new Date(c.createdAt).getTime() - new Date(result.comment!.createdAt).getTime()) < 1000
                );

                if (!commentExists) {
                    setComments(prev => [...prev, result.comment!]);
                    
                    // Update trade comment count
                    const updatedTrade = {
                        ...localTrade,
                        comments: localTrade.comments + 1
                    };
                    setLocalTrade(updatedTrade);
                    onTradeUpdate?.(updatedTrade);
                }
            } else {
                console.error('Failed to add comment:', result.error);
                // Restore the comment input if it failed
                setCommentInput(commentToAdd);
                if (!useMockData) {
                    alert(`Failed to add comment: ${result.error}`);
                }
            }
        } catch (error) {
            console.error('Unexpected error adding comment:', error);
            // Restore the comment input if it failed
            setCommentInput(commentToAdd);
            alert('Unexpected error occurred while adding comment');
        }
        
        setIsAddingComment(false);
    };

    return (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-start space-x-4">
                {/* User Avatar */}
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                    {localTrade.user.avatar}
                </div>
                
                <div className="flex-1">
                    {/* User info and timestamp */}
                    <div className="flex items-center space-x-2 mb-2">
                        <span className="font-bold text-gray-900">@{localTrade.user.username}</span>
                        <span className="text-gray-500 text-sm">{localTrade.timeAgo}</span>
                    </div>
                    
                    {/* Trade details card */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-3">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                                <span className="text-2xl font-bold">{localTrade.symbol}</span>
                                <span className={`px-2 py-1 rounded text-xs font-medium text-white ${
                                    localTrade.tradeType === 'SELL' ? 'bg-red-500' : 'bg-green-500'
                                }`}>
                                    {localTrade.tradeType}
                                </span>
                            </div>
                            
                            {/* Show percentage if it exists (for sells) */}
                            {localTrade.percentage && (
                                <div className="text-right">
                                    <div className={`text-2xl font-bold ${
                                        localTrade.percentage > 0 ? 'text-green-500' : 'text-red-500'
                                    }`}>
                                        {localTrade.percentage > 0 ? '+' : ''}{localTrade.percentage}%
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="text-gray-600 text-sm">
                            {localTrade.companyName} • {localTrade.description}
                        </div>
                    </div>
                    
                    {/* Interaction buttons */}
                    <div className="flex items-center space-x-6 text-gray-500">
                        <button 
                            onClick={handleLike}
                            disabled={isLiking}
                            className={`flex items-center space-x-2 transition-colors ${
                                localTrade.userHasLiked ? 'text-red-500' : 'hover:text-red-500'
                            } ${isLiking ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <span>{localTrade.userHasLiked ? '❤️' : '🤍'}</span>
                            <span className="text-sm">{localTrade.likes}</span>
                        </button>
                        
                        <button 
                            onClick={handleShowComments}
                            className="flex items-center space-x-2 hover:text-blue-500 transition-colors"
                        >
                            <span>💬</span>
                            <span className="text-sm">{localTrade.comments}</span>
                        </button>
                    </div>
                    
                    {/* Comments Section */}
                    {showComments && (
                        <div className="mt-4 border-t pt-4">
                            {isLoadingComments ? (
                                <div className="text-center py-4">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                                </div>
                            ) : (
                                <>
                                    {/* Comments List */}
                                    <div className="space-y-3 mb-4">
                                        {comments.map((comment) => (
                                            <div key={comment.id} className="flex space-x-3">
                                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                                    {comment.user?.avatar || 'U'}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="font-medium text-sm">@{comment.user?.username}</span>
                                                        <span className="text-xs text-gray-500">
                                                            {new Date(comment.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                        
                                        {comments.length === 0 && (
                                            <p className="text-gray-500 text-sm text-center py-4">
                                                No comments yet. Be the first to comment!
                                            </p>
                                        )}
                                    </div>
                                    
                                    {/* Add Comment Form */}
                                    <form onSubmit={handleAddComment} className="flex space-x-3">
                                        <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                            U
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                value={commentInput}
                                                onChange={(e) => setCommentInput(e.target.value)}
                                                placeholder="Add a comment..."
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                disabled={isAddingComment}
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={!commentInput.trim() || isAddingComment}
                                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {isAddingComment ? 'Posting...' : 'Post'}
                                        </button>
                                    </form>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}