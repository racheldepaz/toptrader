export interface User {
    id: string;
    username: string; 
    displayName: string; 
    avatar: string; //this is just a letter
}

export interface Trade {
    id: string;
    user: User;
    symbol: string;
    companyName: string;
    tradeType: 'BUY' | 'SELL';
    percentage?: number;
    timeAgo: string;
    description: string; 
    likes: number;
    comments: number;
}