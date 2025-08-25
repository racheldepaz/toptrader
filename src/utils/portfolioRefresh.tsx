// utils/portfolioRefresh.ts
import { supabase } from '@/lib/supabase';

/**
 * Fetch the current portfolio total for a user from the database
 */
export async function fetchUserPortfolioTotal(userId: string): Promise<{
  totalBalance: number;
  totalAccounts: number;
  success: boolean;
  error?: string;
}> {
  try {
    const response = await fetch(`/api/snaptrade/account-details?userId=${userId}`);
    const data = await response.json();

    if (response.ok) {
      return {
        totalBalance: data.totalBalance || 0,
        totalAccounts: data.totalAccounts || 0,
        success: true
      };
    } else {
      return {
        totalBalance: 0,
        totalAccounts: 0,
        success: false,
        error: data.error || 'Failed to load portfolio'
      };
    }
  } catch (error) {
    console.error('Error fetching portfolio data:', error);
    return {
      totalBalance: 0,
      totalAccounts: 0,
      success: false,
      error: 'Network error'
    };
  }
}

/**
 * Trigger a portfolio refresh notification via Supabase real-time
 * This will notify all components listening for portfolio updates
 */
export async function triggerPortfolioRefresh(userId: string) {
  try {
    // Send a real-time notification to trigger portfolio refresh
    // This is a simple way to notify all components that portfolio data changed
    const channel = supabase.channel(`portfolio_refresh_${userId}`);
    
    await channel.send({
      type: 'broadcast',
      event: 'portfolio_updated',
      payload: { 
        userId, 
        timestamp: new Date().toISOString() 
      }
    });
    
    console.log('📡 Portfolio refresh notification sent for user:', userId);
  } catch (error) {
    console.error('Error sending portfolio refresh notification:', error);
  }
}

/**
 * Updated handleRefreshConnection function that also updates portfolio
 */
export function createHandleRefreshConnection(
  profile: any, 
  supabase: any, 
  fetchTradingStats: (userId: string) => Promise<void>, 
  fetchBrokerageConnections: (userId: string) => Promise<void>
) {
  return async (connectionId: string) => {
    console.log('🔄 Refreshing connection (regular API):', connectionId)
    
    try {
      // Get user credentials
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('snaptrade_user_id, snaptrade_user_secret')
        .eq('id', profile?.id)
        .single()

      if (userError || !user?.snaptrade_user_id || !user?.snaptrade_user_secret) {
        console.error('❌ No SnapTrade credentials found')
        return
      }

      // Get the accounts for this connection
      const { data: connectionAccounts, error: accountsError } = await supabase
        .from('snaptrade_accounts')
        .select('snaptrade_account_id, account_name, balance_amount')
        .eq('snaptrade_connection_id', connectionId)

      if (accountsError || !connectionAccounts?.length) {
        console.error('❌ No accounts found for this connection')
        return
      }

      console.log(`📊 Refreshing ${connectionAccounts.length} accounts with regular API`)

      // Call regular account-details API ($0.03 per account)
      // This will get the latest cached data if SnapTrade has refreshed it
      for (const accountRecord of connectionAccounts) {
        const accountId = accountRecord.snaptrade_account_id
        
        try {
          console.log(`💰 Getting latest cached data for account: ${accountId}`)
          
          // Use regular account-details endpoint (NOT manual refresh)
          const response = await fetch('/api/snaptrade/account-details', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.snaptrade_user_id,
              userSecret: user.snaptrade_user_secret,
              accountId: accountId,
              topTraderUserId: profile?.id // This updates our database
            })
          })

          if (response.ok) {
            const details = await response.json()
            console.log(`✅ Latest cached balance for ${accountId}:`, details.balance?.total)
            console.log(`📅 SnapTrade last sync:`, details.sync_status?.holdings?.last_successful_sync)
          } else {
            console.error(`❌ Failed to refresh account ${accountId}`)
          }
        } catch (error) {
          console.error(`❌ Error refreshing account ${accountId}:`, error)
        }
      }

      // Update our connection's last sync time
      await supabase
        .from('snaptrade_connections')
        .update({ 
          last_sync_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('snaptrade_connection_id', connectionId)

      // Refresh UI for connections
      if (profile?.id) {
        await fetchBrokerageConnections(profile.id)
      }

      console.log('✅ Regular refresh completed! Got latest cached data from SnapTrade.')

      // 🆕 Automatically refresh performance stats after connection refresh
      console.log('🔄 Auto-refreshing performance stats after connection update...')
      try {
        // Call the PostgreSQL function to refresh stats
        const { error: statsError } = await supabase.rpc("refresh_all_user_stats", { p_user_id: profile.id })

        if (statsError) {
          console.error("Error refreshing stats:", statsError)
        } else {
          // Refetch the updated stats to update the UI
          await fetchTradingStats(profile.id)
          console.log('✅ Performance stats automatically refreshed!')
        }
      } catch (statsRefreshError) {
        console.error("Error in auto-refresh of stats:", statsRefreshError)
      }

      // 🆕 NEW: Trigger portfolio refresh notification for dropdown and other components
      console.log('💰 Triggering portfolio refresh notification...')
      await triggerPortfolioRefresh(profile.id)

    } catch (error) {
      console.error('❌ Error refreshing connection:', error)
    }
  }
}