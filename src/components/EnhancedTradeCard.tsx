import React, { useState, useEffect } from 'react';
import { Trade, TradeComment } from '@/lib/types';
import { toggleTradeLike, getTradeComments, addTradeComment, deleteTradeComment } from '@/lib/api/social';
import { supabase } from '@/lib/supabase';
import CommentItem from '@/components/CommentItem'; // Adjust path as needed
import Link from 'next/link';


interface EnhancedTradeCardProps {
    trade: Trade;
    onTradeUpdate?: (updatedTrade: Trade) => void;
}

export default function EnhancedTradeCard({ trade, onTradeUpdate }: EnhancedTradeCardProps) {
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
            const { data: { user } } = await supabase.auth.getUser();
            setIsAuthenticated(!!user);
        };
        checkAuth();
    }, []);

    // Sync local trade with prop changes
    useEffect(() => {
        setLocalTrade(trade);
    }, [trade]);

    const handleLike = async () => {
        if (isLiking) return;
        
        if (!isAuthenticated) {
            alert('Please log in to like trades');
            return;
        }
        
        setIsLiking(true);
        
        try {
            const result = await toggleTradeLike(localTrade.id);
            
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
                alert(`Failed to ${result.liked ? 'unlike' : 'like'} trade: ${result.error}`);
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
                const result = await getTradeComments(localTrade.id);
                    
                if (result.success) {
                    setComments(result.comments);
                } else {
                    console.error('Failed to load comments:', result.error);
                    alert(`Failed to load comments: ${result.error}`);
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

        if (!isAuthenticated) {
            alert('Please log in to comment on trades');
            return;
        }

        // Prevent double submissions
        const commentToAdd = commentInput.trim();
        setCommentInput(''); // Clear input immediately
        setIsAddingComment(true);
        
        try {
            const result = await addTradeComment(localTrade.id, commentToAdd);
            
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
                alert(`Failed to add comment: ${result.error}`);
            }
        } catch (error) {
            console.error('Unexpected error adding comment:', error);
            // Restore the comment input if it failed
            setCommentInput(commentToAdd);
            alert('Unexpected error occurred while adding comment');
        }
        
        setIsAddingComment(false);
    };

    const handleDeleteComment = (commentId: string) => {
        // Remove the comment from local state
        setComments(prevComments => 
            prevComments.filter(comment => comment.id !== commentId)
        );
        
        // Update the comment count
        const updatedTrade = {
            ...localTrade,
            comments: Math.max(0, localTrade.comments - 1)
        };
        setLocalTrade(updatedTrade);
        onTradeUpdate?.(updatedTrade);
    };

    return (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-start space-x-4">
                {/* User Avatar */}
                <Link href={`/user/${localTrade.user.username}`} className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                    {localTrade.user.avatar}
                </div>
                </Link>
                
                <div className="flex-1">
                    {/* User info and timestamp */}
                    <div className="flex items-center space-x-2 mb-2">
                    <Link href={`/user/${localTrade.user.username}`}className="font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer"
                     >
                        @{localTrade.user.username}
                        </Link>
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
                                    <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                                        {comments.map((comment) => (
                                            <CommentItem
                                                key={comment.id}
                                                comment={comment}
                                                onDelete={handleDeleteComment}
                                            />
                                        ))}
                                        
                                        {comments.length === 0 && (
                                            <p className="text-gray-500 text-sm text-center py-4">
                                                No comments yet. Be the first to comment!
                                            </p>
                                        )}
                                    </div>

                                    {/* Add Comment Section */}
                                    <div className="flex space-x-2">
                                        <input
                                            type="text"
                                            value={commentInput}
                                            onChange={(e) => setCommentInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleAddComment(e as any);
                                                }
                                            }}
                                            placeholder={isAuthenticated ? "Add a comment..." : "Sign in to comment"}
                                            disabled={!isAuthenticated || isAddingComment}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                        />
                                        <button
                                            onClick={handleAddComment}
                                            disabled={!commentInput.trim() || isAddingComment || !isAuthenticated}
                                            className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {isAddingComment ? 'Adding...' : 'Post'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}