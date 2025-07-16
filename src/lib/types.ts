// src/lib/types.ts
export interface User {
    id: string;
    username: string; 
    displayName?: string; 
    avatar: string; // This will be derived from username first letter or avatar_url
    bio?: string;
    tradingStyle?: string;
    isPublic: boolean;
    isDemo: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Trade {
    id: string;
    user: User;
    symbol: string;
    companyName?: string;
    tradeType: 'BUY' | 'SELL';
    percentage?: number; // profit_loss_percentage
    timeAgo: string; // derived from executed_at or created_at
    description?: string; 
    likes: number;
    comments: number;
    userHasLiked: boolean;
    executedAt: string;
    createdAt: string;
    // Privacy settings
    showAmounts: boolean;
    showQuantity: boolean;
    visibility: 'public' | 'friends' | 'private';
}

export interface TradeComment {
    id: string;
    tradeId: string;
    userId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    user?: {
        username: string;
        displayName?: string;
        avatar?: string;
    };
}

export interface TradeLike {
    id: string;
    tradeId: string;
    userId: string;
    createdAt: string;
}

// Enhanced trade with social data from database
export interface TradeWithSocialStats {
    id: string;
    user_id: string;
    username: string;
    display_name?: string;
    symbol: string;
    company_name?: string;
    trade_type: 'BUY' | 'SELL';
    profit_loss_percentage?: number;
    description?: string;
    executed_at: string;
    created_at: string;
    like_count: number;
    comment_count: number;
    is_liked_by_user: boolean;
}

// For API responses
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

// Social interaction states
export interface SocialInteractionState {
    isLiking: boolean;
    isCommenting: boolean;
    showComments: boolean;
    commentInput: string;
}

// Helper function to convert database trade to UI trade
export const convertDbTradeToUITrade = (dbTrade: TradeWithSocialStats): Trade => {
    return {
        id: dbTrade.id,
        user: {
            id: dbTrade.user_id,
            username: dbTrade.username,
            displayName: dbTrade.display_name,
            avatar: dbTrade.display_name?.charAt(0) || dbTrade.username.charAt(0) || 'U',
            isPublic: true,
            isDemo: false,
            createdAt: '',
            updatedAt: ''
        },
        symbol: dbTrade.symbol,
        companyName: dbTrade.company_name,
        tradeType: dbTrade.trade_type,
        percentage: dbTrade.profit_loss_percentage,
        timeAgo: formatTimeAgo(dbTrade.created_at),
        description: dbTrade.description || '',
        likes: dbTrade.like_count,
        comments: dbTrade.comment_count,
        userHasLiked: dbTrade.is_liked_by_user,
        executedAt: dbTrade.executed_at,
        createdAt: dbTrade.created_at,
        showAmounts: false,
        showQuantity: false,
        visibility: 'public'
    };
};

// Helper function to format time ago
export const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
};