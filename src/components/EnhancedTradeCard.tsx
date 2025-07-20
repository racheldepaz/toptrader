// src/components/EnhancedTradeCard.tsx - Fixed version with no nested links
import React, { useState, useEffect } from 'react';
import { Trade, TradeComment } from '@/lib/types';
import { toggleTradeLike, getTradeComments, addTradeComment, deleteTradeComment } from '@/lib/api/social';
import { supabase } from '@/lib/supabase';
import CommentItem from '@/components/CommentItem';
import ViralShareButton from '@/components/ViralShareButton';
import { UserAvatar, ClickableUsername } from '@/components/UserAvatar';
import Link from 'next/link';

interface EnhancedTradeCardProps {
    trade: Trade;
    onTradeUpdate?: (updatedTrade: Trade) => void;
    isDetailed?: boolean;
    clickable?: boolean; // NEW: Control if card should be clickable
}

export default function EnhancedTradeCard({ 
    trade, 
    onTradeUpdate, 
    isDetailed = false,
    clickable = false // Default to false to avoid nested links
}: EnhancedTradeCardProps) {
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

        const commentToAdd = commentInput.trim();
        setCommentInput('');
        setIsAddingComment(true);
        
        try {
            const result = await addTradeComment(localTrade.id, commentToAdd);
            
            if (result.success && result.comment) {
                const commentExists = comments.some(c => 
                    c.content === result.comment!.content && 
                    c.userId === result.comment!.userId &&
                    Math.abs(new Date(c.createdAt).getTime() - new Date(result.comment!.createdAt).getTime()) < 1000
                );

                if (!commentExists) {
                    setComments(prev => [...prev, result.comment!]);
                    
                    const updatedTrade = {
                        ...localTrade,
                        comments: localTrade.comments + 1
                    };
                    setLocalTrade(updatedTrade);
                    onTradeUpdate?.(updatedTrade);
                }
            } else {
                console.error('Failed to add comment:', result.error);
                setCommentInput(commentToAdd);
                alert(`Failed to add comment: ${result.error}`);
            }
        } catch (error) {
            console.error('Unexpected error adding comment:', error);
            setCommentInput(commentToAdd);
            alert('Unexpected error occurred while adding comment');
        }
        
        setIsAddingComment(false);
    };

    const handleDeleteComment = (commentId: string) => {
        setComments(prevComments => 
            prevComments.filter(comment => comment.id !== commentId)
        );
        
        const updatedTrade = {
            ...localTrade,
            comments: Math.max(0, localTrade.comments - 1)
        };
        setLocalTrade(updatedTrade);
        onTradeUpdate?.(updatedTrade);
    };

    const handleCardClick = (e: React.MouseEvent) => {
        // Prevent card click if clicking on interactive elements
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('a') || target.closest('input')) {
            return;
        }
        
        if (clickable && !isDetailed) {
            window.location.href = `/trade/${localTrade.id}`;
        }
    };

    return (
        <div 
            className={`bg-white rounded-lg shadow-sm p-6 border border-gray-200 ${
                clickable && !isDetailed ? 'cursor-pointer hover:shadow-md transition-shadow duration-200' : ''
            }`}
            onClick={handleCardClick}
        >
            <div className="flex items-start space-x-4">
                {/* User Avatar - Using UserAvatar component, no direct Link */}
                <UserAvatar
                    username={localTrade.user.username}
                    displayName={localTrade.user.displayName}
                    avatar={localTrade.user.avatar}
                    size="md"
                />
                
                <div className="flex-1">
                    {/* User info and timestamp */}
                    <div className="flex items-center space-x-2 mb-2">
                        <ClickableUsername
                            username={localTrade.user.username}
                            displayName={localTrade.user.displayName}
                            className="font-bold text-gray-900"
                        />
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
                    <div className="flex items-center justify-between">
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

                            {/* Viral Share Button */}
                            <ViralShareButton 
                                type="trade"
                                data={{
                                    id: localTrade.id,
                                    user: {
                                        username: localTrade.user.username,
                                        displayName: localTrade.user.displayName
                                    },
                                    symbol: localTrade.symbol,
                                    companyName: localTrade.companyName,
                                    tradeType: localTrade.tradeType,
                                    percentage: localTrade.percentage,
                                    timeAgo: localTrade.timeAgo
                                }}
                                variant="minimal"
                            />
                        </div>

                        {/* Conditional View Details Button */}
                        {!isDetailed && (
                            <Link 
                                href={`/trade/${localTrade.id}`}
                                className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                                onClick={(e) => e.stopPropagation()} // Prevent card click
                            >
                                View Details
                            </Link>
                        )}
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
                                            placeholder={isAuthenticated ? 
                                                "Add a comment..." : 
                                                "Log in to comment"
                                            }
                                            disabled={!isAuthenticated || isAddingComment}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        />
                                        
                                        <button
                                            onClick={handleAddComment}
                                            disabled={!isAuthenticated || !commentInput.trim() || isAddingComment}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                                        >
                                            {isAddingComment ? 'Posting...' : 'Post'}
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