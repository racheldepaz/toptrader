// lib/api/stats.ts
import { supabase } from '@/lib/supabase';

/**
 * Update trading stats for a specific user
 * This calls the PostgreSQL function to recalculate all time-based stats
 */
export async function updateUserStats(userId: string) {
  try {
    const { error } = await supabase
      .rpc('update_user_time_stats', { p_user_id: userId });

    if (error) {
      console.error('Error updating user stats:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error updating stats:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Get trading stats for a specific time period
 * This can be used for real-time calculation without relying on cached stats
 */
export async function calculateTradingStats(
  userId: string, 
  startDate: Date, 
  endDate: Date = new Date()
) {
  try {
    const { data, error } = await supabase
      .rpc('calculate_trading_stats', { 
        p_user_id: userId,
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString()
      });

    if (error) {
      console.error('Error calculating stats:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      stats: data?.[0] || {
        total_trades: 0,
        winning_trades: 0,
        win_rate: 0,
        average_gain: 0,
        best_trade: 0
      }
    };
  } catch (error) {
    console.error('Unexpected error calculating stats:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Batch update stats for all users
 * This could be run as a scheduled job
 */
export async function updateAllUserStats() {
  try {
    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return { success: false, error: usersError.message };
    }

    // Update stats for each user
    const updates = users?.map(user => updateUserStats(user.id)) || [];
    await Promise.all(updates);

    return { success: true, updated: users?.length || 0 };
  } catch (error) {
    console.error('Unexpected error updating all stats:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}