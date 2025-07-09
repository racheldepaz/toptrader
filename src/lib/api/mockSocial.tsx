// src/lib/api/mockSocial.ts
// Mock implementation of social features for demo mode
import { TradeComment } from '../types';
import { mockComments } from '../mockData';

// In-memory storage for mock mode
let mockLikes: { [tradeId: string]: Set<string> } = {};
let mockCommentsStorage: { [tradeId: string]: TradeComment[] } = { ...mockComments };

// Mock user (when not authenticated with Supabase)
const MOCK_USER = {
  id: 'mock-user-123',
  username: 'demo_user',
  displayName: 'Demo User',
  avatar: 'D'
};

export const mockToggleTradeLike = async (tradeId: string): Promise<{ success: boolean; liked: boolean; error?: string }> => {
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    if (!mockLikes[tradeId]) {
      mockLikes[tradeId] = new Set();
    }

    const userLikes = mockLikes[tradeId];
    const wasLiked = userLikes.has(MOCK_USER.id);

    if (wasLiked) {
      userLikes.delete(MOCK_USER.id);
    } else {
      userLikes.add(MOCK_USER.id);
    }

    return { success: true, liked: !wasLiked };
  } catch (error) {
    return { success: false, liked: false, error: 'Mock error occurred' };
  }
};

export const mockGetTradeComments = async (tradeId: string): Promise<{ success: boolean; comments: TradeComment[]; error?: string }> => {
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));

    const comments = mockCommentsStorage[tradeId] || [];
    return { success: true, comments };
  } catch (error) {
    return { success: false, comments: [], error: 'Mock error occurred' };
  }
};

export const mockAddTradeComment = async (tradeId: string, content: string): Promise<{ success: boolean; comment?: TradeComment; error?: string }> => {
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (!content.trim()) {
      return { success: false, error: 'Comment cannot be empty' };
    }

    // Check for recent duplicate comments (within last 2 seconds)
    const existingComments = mockCommentsStorage[tradeId] || [];
    const recentDuplicate = existingComments.find(comment => 
      comment.content.trim() === content.trim() && 
      comment.userId === MOCK_USER.id &&
      (Date.now() - new Date(comment.createdAt).getTime()) < 2000
    );

    if (recentDuplicate) {
      return { success: false, error: 'Duplicate comment detected' };
    }

    const newComment: TradeComment = {
      id: `mock-comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tradeId,
      userId: MOCK_USER.id,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: {
        username: MOCK_USER.username,
        displayName: MOCK_USER.displayName,
        avatar: MOCK_USER.avatar
      }
    };

    if (!mockCommentsStorage[tradeId]) {
      mockCommentsStorage[tradeId] = [];
    }

    mockCommentsStorage[tradeId].push(newComment);

    return { success: true, comment: newComment };
  } catch (error) {
    return { success: false, error: 'Mock error occurred' };
  }
};

export const mockGetLikesCount = (tradeId: string): number => {
  return mockLikes[tradeId]?.size || 0;
};

export const mockGetCommentsCount = (tradeId: string): number => {
  return mockCommentsStorage[tradeId]?.length || 0;
};

export const mockHasUserLikedTrade = (tradeId: string): boolean => {
  return mockLikes[tradeId]?.has(MOCK_USER.id) || false;
};

// Initialize some mock likes for demo
mockLikes['c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13'] = new Set([MOCK_USER.id]); // User already liked SNAP trade