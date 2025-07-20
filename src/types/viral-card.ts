// src/types/viral-card.ts
// For individual trades
export interface TradeData {
    id: string
    user: {
      username: string
      displayName?: string
    }
    symbol: string // e.g., "AAPL"
    companyName?: string // e.g., "Apple Inc."
    tradeType: "BUY" | "SELL"
    percentage?: number // e.g., +15.5 or -3.2
    timeAgo: string // e.g., "2h ago"
  }
  
  // For profile stats
  export interface ProfileStatsData {
    username: string
    displayName: string
    stats: {
      win_rate: number // e.g., 85
      total_trades: number // e.g., 47
      best_trade_percentage: number // e.g., +23.4
      average_gain_percentage: number // e.g., +7.5
    }
    period: "day" | "week" | "month" | "year"
  }
  
  // Main component props
  export interface ViralTradeCardProps {
    data: TradeData | ProfileStatsData
    type: "trade" | "profile"
    isOpen: boolean
    onClose: () => void
  }