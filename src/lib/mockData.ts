/* eslint-disable @typescript-eslint/no-unused-vars */
import { Trade, User } from './types';

export const mockTrades: Trade[] = [
  {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', // Proper UUID
    user: {
      id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', // Proper UUID
      username: 'moonwalker',
      displayName: 'moonwalker',
      avatar: 'M',
      isPublic: true,
      isDemo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    symbol: 'TSLA',
    companyName: 'Tesla Inc.',
    tradeType: 'SELL',
    percentage: 24.5,
    timeAgo: '2 hours ago',
    description: 'Perfect timing on earnings! 🚀',
    likes: 12,
    comments: 3,
    userHasLiked: false,
    executedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    showAmounts: false,
    showQuantity: false,
    visibility: 'public'
  },

  {
    id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', // Proper UUID
    user: {
      id: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', // Proper UUID
      username: 'danktrades',
      displayName: 'da dankest',
      avatar: 'D',
      isPublic: true,
      isDemo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    symbol: 'SNAP',
    companyName: 'Snap Inc.',
    tradeType: 'BUY',
    percentage: 15.2,
    timeAgo: '4 hours ago',
    description: 'Broooooooooo 🚀',
    likes: 5,
    comments: 1,
    userHasLiked: true, // User already liked this one
    executedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    showAmounts: false,
    showQuantity: false,
    visibility: 'public'
  },

  {
    id: 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', // Proper UUID
    user: {
      id: 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', // Proper UUID
      username: 'rdpiscool',
      displayName: 'rach',
      avatar: 'R',
      isPublic: true,
      isDemo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    symbol: 'BABA',
    companyName: 'Alibaba Inc.',
    tradeType: 'SELL',
    percentage: 0.5,
    timeAgo: '6 hours ago',
    description: 'idk why i even put this trade in tbh.. oops',
    likes: 2,
    comments: 0,
    userHasLiked: false,
    executedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    showAmounts: false,
    showQuantity: false,
    visibility: 'public'
  },
];

// Mock comments for the trades
export const mockComments = {
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11': [
    {
      id: 'comment-1',
      tradeId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      userId: 'user-comment-1',
      content: 'Nice call! I should have followed your lead.',
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      user: {
        username: 'trader123',
        displayName: 'Trader Joe',
        avatar: 'T'
      }
    },
    {
      id: 'comment-2',
      tradeId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      userId: 'user-comment-2',
      content: 'What made you sell at that timing?',
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      user: {
        username: 'curious_investor',
        displayName: 'Sarah',
        avatar: 'S'
      }
    }
  ],
  'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13': [
    {
      id: 'comment-3',
      tradeId: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
      userId: 'user-comment-3',
      content: 'SNAP is looking good! 📈',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      user: {
        username: 'bullish_betty',
        displayName: 'Betty Bull',
        avatar: 'B'
      }
    }
  ],
  'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a15': []
};