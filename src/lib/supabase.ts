import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types for type safety
export interface DatabaseUser {
  id: string
  username: string
  display_name?: string
  bio?: string
  avatar_url?: string
  trading_style?: string
  is_public: boolean
  is_demo: boolean
  created_at: string
  updated_at: string
}

export interface DatabaseTrade {
  id: string
  user_id: string
  symbol: string
  company_name?: string
  asset_type: string
  trade_type: 'BUY' | 'SELL'
  quantity?: number
  price?: number
  total_value?: number
  profit_loss?: number
  profit_loss_percentage?: number
  show_amounts: boolean
  show_quantity: boolean
  visibility: 'public' | 'friends' | 'private'
  description?: string
  executed_at: string
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface TradeLike {
  id: string
  trade_id: string
  user_id: string
  created_at: string
}

export interface TradeComment {
  id: string
  trade_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
}