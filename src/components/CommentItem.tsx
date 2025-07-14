import React, { useState } from 'react';
import { TradeComment } from '@/lib/types';
import { deleteTradeComment } from '@/lib/api/social';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

interface CommentItemProps {
  comment: TradeComment;
  onDelete: (commentId: string) => void;
}

const CommentItem = ({ comment, onDelete }: CommentItemProps) => {
  const { user } = useSupabaseAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isSwipeRevealed, setIsSwipeRevealed] = useState(false);

  // Check if current user owns this comment
  const isOwnComment = user?.id === comment.userId;

  const handleDelete = async () => {
    if (!isOwnComment || isDeleting) return;

    const confirmDelete = window.confirm('Are you sure you want to delete this comment?');
    if (!confirmDelete) return;

    setIsDeleting(true);

    try {
      const result = await deleteTradeComment(comment.id);

      if (result.success) {
        onDelete(comment.id);
      } else {
        alert(`Failed to delete comment: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment');
    }

    setIsDeleting(false);
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setTouchEnd(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
    
    if (!touchStart || !e.targetTouches[0].clientX) return;
    
    const distance = touchStart - e.targetTouches[0].clientX;
    const isLeftSwipe = distance > 20;
    
    if (isLeftSwipe && isOwnComment) {
      setIsSwipeRevealed(true);
    } else {
      setIsSwipeRevealed(false);
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    
    if (isLeftSwipe && isOwnComment) {
      setIsSwipeRevealed(true);
    } else {
      setIsSwipeRevealed(false);
    }
  };

  return (
    <div 
      className={`relative flex space-x-3 transition-transform duration-200 ${
        isSwipeRevealed ? '-translate-x-16' : ''
      }`}
      onMouseEnter={() => isOwnComment && setShowDeleteButton(true)}
      onMouseLeave={() => setShowDeleteButton(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Comment Content */}
      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
        {comment.user?.avatar || 'U'}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-sm">@{comment.user?.username}</span>
          <span className="text-xs text-gray-500">
            {new Date(comment.createdAt).toLocaleDateString()}
          </span>
        </div>
        <p className="text-sm text-gray-700 mt-1 break-words">{comment.content}</p>
      </div>

      {/* Desktop Delete Button (appears on hover) */}
      {isOwnComment && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className={`hidden md:flex items-center justify-center w-6 h-6 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-all duration-200 ${
            showDeleteButton ? 'opacity-100' : 'opacity-0'
          } ${isDeleting ? 'cursor-not-allowed opacity-50' : ''}`}
          title="Delete comment"
        >
          {isDeleting ? (
            <div className="w-3 h-3 border border-red-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </button>
      )}

      {/* Mobile Delete Button (revealed by swipe) */}
      {isOwnComment && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className={`md:hidden absolute right-0 top-0 h-full w-12 bg-red-500 text-white flex items-center justify-center transition-all duration-200 ${
            isSwipeRevealed ? 'translate-x-0' : 'translate-x-full'
          } ${isDeleting ? 'opacity-50' : ''}`}
        >
          {isDeleting ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
};

export default CommentItem;