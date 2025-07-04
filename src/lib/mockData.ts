/* eslint-disable @typescript-eslint/no-unused-vars */
import { Trade, User } from './types';

export const mockTrades: Trade[] = [
  {
    id: '1',
    user: {
      id: 'user1',
      username: '@moonwalker',
      displayName: 'moonwalker',
      avatar: 'M'
    },
    symbol: 'TSLA',
    companyName: 'Tesla Inc.',
    tradeType: 'SELL',
    percentage: 24.5,
    timeAgo: '2 hours ago',
    description: 'Perfect timing on earnings! 🚀',
    likes: 12,
    comments: 3
  },

  {
    id: '2',
    user: {
      id: 'user2',
      username: '@danktrades',
      displayName: 'da dankest',
      avatar: 'D'
    },
    symbol: 'SNAP',
    companyName: 'Snap Inc.',
    tradeType: 'BUY',
    percentage: 24.5,
    timeAgo: '2 hours ago',
    description: 'Broooooooooo 🚀',
    likes: 0,
    comments: 0
  },

  {
    id: '3',
    user: {
      id: 'user3',
      username: '@rdpiscool',
      displayName: 'rach',
      avatar: 'R'
    },
    symbol: 'BABA',
    companyName: 'Alibaba Inc.',
    tradeType: 'SELL',
    percentage: 0.5,
    timeAgo: '2 hours ago',
    description: 'idk why i even put this trade in tbh.. oops',
    likes: 0,
    comments: 0
  },
];