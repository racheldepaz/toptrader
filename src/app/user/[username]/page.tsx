"use client"

import { useSnapTrade } from "@/hooks/useSnapTrade"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Calendar, UserPlus, UserCheck, Users, TrendingUp, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useSupabaseAuth } from "@/context/AuthContext"
import ViralShareButton from "@/components/ViralShareButton"
import EditableBioSection from "@/components/EditableBioSection"
import ProfileTradeHistory from "@/components/ProfileTradeHistory"
import BrokerageConnectionPanel from "@/components/profile/BrokerageConnectionPanel"
import LevelDisplay from "@/components/profile/LevelDisplay"
import BadgesGrid from "@/components/profile/BadgesGrid"

interface UserProfile {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  trading_style: string | null
  created_at: string
}

interface TradingStats {
  win_rate: number
  total_trades: number
  best_trade_percentage: number
  average_gain_percentage: number
}

interface LevelData {
  currentLevel: number
  levelName: string
  currentXP: number
  nextLevelXP: number
  totalXP: number
}

interface Badge {
  id: string
  name: string
  icon: string
  earned: boolean
  earnedDate?: string
  description: string
  category: "trading" | "social" | "connection" | "achievement"
  rarity: "common" | "rare" | "epic" | "legendary"
  isNew?: boolean
}

interface BrokerageConnection {
  id: string
  name: string
  status: "connected" | "disconnected" | "syncing"
  lastSync: string
  accountValue: number
  logo: string
}

type TimePeriod = "day" | "week" | "month" | "year"

export default function UserProfilePage() {
  const params = useParams()
  const username = params.username as string
  const { user: currentUser } = useSupabaseAuth()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isFollowingBack, setIsFollowingBack] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [stats, setStats] = useState<TradingStats | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("month")
  const [allStats, setAllStats] = useState<any>(null)
  const [refreshing, setRefreshing] = useState(false)
  const { initializeSnapTradeFlow, loading: snapTradeLoading, error: snapTradeError, clearError } = useSnapTrade();
  const [connectingBrokerage, setConnectingBrokerage] = useState(false);

  
  // New state for integrated components
  const [levelData, setLevelData] = useState<LevelData | null>(null)
  const [badges, setBadges] = useState<Badge[]>([])
  const [brokerageConnections, setBrokerageConnections] = useState<BrokerageConnection[]>([])

  const isOwnProfile = currentUser?.id === profile?.id


  useEffect(() => {
    if (username) {
      fetchUserProfile()
    }
  }, [username, currentUser])

  useEffect(() => {
    console.log('🔄 useEffect[success-callback]: Checking for SnapTrade return...');
    
    // Check if user just returned from SnapTrade connection
    const urlParams = new URLSearchParams(window.location.search);
    const wasConnected = urlParams.get('connected');
    
    console.log('🔄 useEffect[success-callback]: URL params check:', {
      wasConnected,
      profileId: profile?.id,
      fullUrl: window.location.href
    });
    
    if (wasConnected === 'true' && profile?.id) {
      console.log('🔄 useEffect[success-callback]: ✅ Successful connection return detected!');
      
      // Clean up URL parameter immediately
      const url = new URL(window.location.href);
      url.searchParams.delete('connected');
      window.history.replaceState({}, '', url.toString());
      console.log('🔄 useEffect[success-callback]: URL cleaned, starting processing...');
      
      // Process the new connection (this will handle all the saving)
      processNewConnection();
    } else if (wasConnected === 'true' && !profile?.id) {
      console.log('🔄 useEffect[success-callback]: ⚠️ Success detected but no profile ID available yet');
    }
  }, [profile?.id]);

  const fetchUserProfile = async () => {
    try {
      // Fetch user profile by username
      const { data: userProfile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .single()

      if (profileError) {
        console.error("Error fetching user profile:", profileError)
        setLoading(false)
        return
      }

      setProfile(userProfile)

      // If current user exists, check follow status
      if (currentUser && currentUser.id !== userProfile.id) {
        // Check if current user follows this profile
        const { data: followData } = await supabase
          .from("friendships")
          .select("*")
          .or(
            `and(requester_id.eq.${currentUser.id},addressee_id.eq.${userProfile.id}),and(requester_id.eq.${userProfile.id},addressee_id.eq.${currentUser.id})`,
          )
          .eq("status", "accepted")

        if (followData && followData.length > 0) {
          const friendship = followData[0]
          if (friendship.requester_id === currentUser.id) {
            setIsFollowing(true)
          } else {
            setIsFollowingBack(true)
          }
        }
      }

      // Fetch follower and following counts
      const { count: followers } = await supabase
        .from("friendships")
        .select("*", { count: "exact" })
        .eq("addressee_id", userProfile.id)
        .eq("status", "accepted")

      const { count: following } = await supabase
        .from("friendships")
        .select("*", { count: "exact" })
        .eq("requester_id", userProfile.id)
        .eq("status", "accepted")

      setFollowerCount(followers || 0)
      setFollowingCount(following || 0)

      // Fetch trading stats
      await fetchTradingStats(userProfile.id)
      
      // Fetch new data for integrated components
      await fetchLevelData(userProfile.id)
      await fetchBadges(userProfile.id)
      await fetchBrokerageConnections(userProfile.id)
    } catch (error) {
      console.error("Error in fetchUserProfile:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!profile?.id) return
  
    console.log('🔄 Setting up real-time XP updates for user:', profile.id)
  
    // Subscribe to XP changes for this user
    const xpSubscription = supabase
      .channel(`xp_updates_${profile.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'user_xp_history',
        filter: `user_id=eq.${profile.id}`
      }, (payload) => {
        console.log('🆕 XP Update received:', payload.new)
        console.log('🔄 About to refresh level data...')
        
        // Refresh level data immediately
        fetchLevelData(profile.id).then(() => {
          console.log('✅ Level data refreshed!')
        })
        
        // Show notification for level ups
        if (payload.new.xp_source === 'level_up') {
          console.log('🎉 LEVEL UP!', payload.new.description)
          showLevelUpNotification(payload.new.description)
        } else {
          console.log(`💰 +${payload.new.xp_gained} XP: ${payload.new.description}`)
          showXPGainNotification(payload.new.xp_gained, payload.new.description)
        }
      })
      .subscribe((status) => {
        console.log('📡 Subscription status:', status)
      })
  
    // Subscribe to user table changes (for direct XP/level updates)
    const userSubscription = supabase
      .channel(`user_updates_${profile.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public', 
        table: 'users',
        filter: `id=eq.${profile.id}`
      }, (payload) => {
        console.log('👤 User data updated:', payload.new)
        
        // Check if XP or level changed
        const oldUser = payload.old as any
        const newUser = payload.new as any
        
        if (newUser.total_xp !== oldUser.total_xp || newUser.current_level !== oldUser.current_level) {
          console.log('📊 XP/Level changed, refreshing data...')
          fetchLevelData(profile.id).then(() => {
            console.log('✅ Level data refreshed from user update!')
          })
          
          // Also refresh badges in case any were earned
          fetchBadges(profile.id)
        }
      })
      .subscribe((status) => {
        console.log('📡 User subscription status:', status)
      })
  
    // Cleanup subscriptions
    return () => {
      console.log('🧹 Cleaning up XP subscriptions')
      xpSubscription.unsubscribe()
      userSubscription.unsubscribe()
    }
  }, [profile?.id])

  // 2. Add notification functions (optional but recommended)
const showLevelUpNotification = (description: string) => {
  // You can replace this with your preferred notification system
  // For now, we'll use a simple alert, but you could use toast notifications
  
  // Simple browser notification
  //if ('Notification' in window && Notification.permission === 'granted') {
  //  new Notification('🎉 Level Up!', {
   //   body: description,
  //    icon: '/favicon.ico' // Replace with your app icon
  //  })
 // }
  
  // Or use a toast library like react-hot-toast:
  // toast.success(`🎉 ${description}`, { duration: 5000 })
  
  // Or just console for now
  console.log('🎉 LEVEL UP NOTIFICATION:', description)
}

const showXPGainNotification = (xpGained: number, description: string) => {
  // Subtle XP gain notification
  console.log(`💰 +${xpGained} XP: ${description}`)
  
  // You could show a floating +XP animation here
  // Or use a toast: toast(`+${xpGained} XP`, { icon: '💰' })
}

  const fetchTradingStats = async (userId: string) => {
    try {
      const { data: statsData, error } = await supabase.from("user_stats").select("*").eq("user_id", userId).single()

      if (error) {
        console.error("Error fetching trading stats:", error)
        return
      }

      setAllStats(statsData)
    } catch (error) {
      console.error("Error in fetchTradingStats:", error)
    }
  }

  // New data fetching functions for integrated components: levels
  const fetchLevelData = async (userId: string) => {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('total_xp, current_level')
        .eq('id', userId)
        .single()
  
      if (error) {
        console.error("Error fetching level data:", error)
        return
      }
  
      const totalXP = user?.total_xp || 0
      const currentLevel = user?.current_level || 1
      
      // Calculate XP progress within current level
      const baseXP = 250
      const multiplier = 1.1
      
      // Calculate how much XP is needed for this level
      let xpForThisLevel = baseXP
      for (let i = 2; i <= currentLevel; i++) {
        xpForThisLevel = Math.floor(baseXP * Math.pow(multiplier, i - 2))
      }
      
      // Calculate XP for next level
      const xpForNextLevel = Math.floor(baseXP * Math.pow(multiplier, currentLevel - 1))
      
      // Calculate current XP within this level
      let totalXPForPreviousLevels = 0
      for (let i = 2; i <= currentLevel; i++) {
        totalXPForPreviousLevels += Math.floor(baseXP * Math.pow(multiplier, i - 2))
      }
      
      const currentXP = Math.max(0, totalXP - totalXPForPreviousLevels)
      
      // Get level name
      const levelNames = {
        1: "Rookie Trader", 5: "Active Trader", 10: "Skilled Trader",
        15: "Expert Trader", 20: "Master Trader", 25: "Elite Trader", 30: "Legendary Trader"
      }
      
      let levelName = "Rookie Trader"
      const levelKeys = Object.keys(levelNames).map(Number).sort((a, b) => b - a)
      for (const level of levelKeys) {
        if (currentLevel >= level) {
          levelName = levelNames[level as keyof typeof levelNames]
          break
        }
      }
  
      setLevelData({
        currentLevel,
        levelName,
        currentXP,
        nextLevelXP: xpForNextLevel,
        totalXP
      })
    } catch (error) {
      console.error("Error in fetchLevelData:", error)
    }
  }

  //New data fetching functions for integrated components: badges
  const fetchBadges = async (userId: string) => {
    try {
      await ensureBadgeDefinitions()
      
      const { data: allBadges, error: badgeError } = await supabase
        .from('badge_definitions')
        .select('*')
        .order('id')
  
      if (badgeError) {
        console.error("Error fetching badge definitions:", badgeError)
        return
      }
  
      const { data: userBadges, error: userBadgeError } = await supabase
        .from('user_badges')
        .select('badge_id, earned_at, viewed_at') // Add viewed_at here
        .eq('user_id', userId)
  
      if (userBadgeError) {
        console.error("Error fetching user badges:", userBadgeError)
      }
  
      const badges: Badge[] = (allBadges || []).map(badge => {
        const userBadge = (userBadges || []).find(ub => ub.badge_id === badge.id)
        const isEarned = !!userBadge
        const isNew = isEarned && !userBadge.viewed_at // This determines red dot
        
        return {
          id: badge.id,
          name: badge.name,
          icon: badge.icon,
          description: badge.description,
          category: badge.category,
          rarity: badge.rarity,
          earned: isEarned,
          earnedDate: userBadge?.earned_at 
            ? new Date(userBadge.earned_at).toLocaleDateString() 
            : undefined,
          isNew: isNew // This controls the red dot
        }
      })
  
      setBadges(badges)
    } catch (error) {
      console.error("Error fetching badges:", error)
      setBadges([])
    }
  }
  
  // Helper function to ensure badge definitions exist
  const ensureBadgeDefinitions = async () => {
    try {
      const { data: existingBadges, error } = await supabase
        .from('badge_definitions')
        .select('id')
        .limit(1)
  
      if (error) {
        console.log("Badge definitions table might not exist, creating badges...")
      }
  
      if (!existingBadges || existingBadges.length === 0) {
        console.log("Inserting default badge definitions...")
        
        // Insert default badge definitions
        const defaultBadges = [
          {
            id: 'first_trade',
            name: 'First Trade',
            icon: '🎯',
            description: 'Completed your first trade on the platform',
            category: 'trading',
            rarity: 'common'
          },
          {
            id: 'social_butterfly',
            name: 'Social Butterfly',
            icon: '🦋',
            description: 'Gained 10 followers',
            category: 'social',
            rarity: 'rare'
          },
          {
            id: 'winning_streak',
            name: '5 Win Streak',
            icon: '🔥',
            description: 'Achieved 5 winning trades in a row',
            category: 'trading',
            rarity: 'rare'
          },
          {
            id: 'portfolio_milestone',
            name: 'Active Trader',
            icon: '💎',
            description: 'Completed 10+ trades this month',
            category: 'achievement',
            rarity: 'epic'
          },
          {
            id: 'day_trader',
            name: 'Day Trader',
            icon: '⚡',
            description: 'Complete 10 trades in a single day',
            category: 'trading',
            rarity: 'rare'
          },
          {
            id: 'master_trader',
            name: 'Master Trader',
            icon: '👑',
            description: 'Reach Level 20',
            category: 'achievement',
            rarity: 'legendary'
          }
        ]
  
        const { error: insertError } = await supabase
          .from('badge_definitions')
          .insert(defaultBadges)
  
        if (insertError) {
          console.error("Error inserting badge definitions:", insertError)
        } else {
          console.log("✅ Badge definitions created successfully")
        }
      }
    } catch (error) {
      console.error("Error in ensureBadgeDefinitions:", error)
    }
  }

  const fetchBrokerageConnections = async (userId: string) => {
    console.log('🔗 fetchBrokerageConnections called with userId:', userId)
    console.log('🔗 isOwnProfile:', isOwnProfile)
    
    try {
      if (!isOwnProfile) {
        console.log('🔗 Not own profile, setting empty connections')
        setBrokerageConnections([])
        return
      }
  
      console.log('🔗 Using the working RPC function...')
  
      // Use the RPC function we just fixed instead of direct queries
      const { data: connections, error } = await supabase
        .rpc('get_user_brokerage_connections', { p_user_id: userId })
  
      console.log('🔗 RPC Response:', { connections, error })
  
      if (error) {
        console.error("Error fetching brokerage connections:", error)
        setBrokerageConnections([])
        return
      }
  
      // Convert database format to component format
      const formattedConnections: BrokerageConnection[] = (connections || []).map((conn: any) => ({
        id: conn.id,
        name: conn.name,
        status: conn.status as "connected" | "disconnected" | "syncing",
        lastSync: conn.last_sync ? formatLastSync(conn.last_sync) : "Never synced",
        accountValue: parseFloat(conn.account_value?.toString() || '0'),
        logo: conn.logo
      }))
  
      console.log('🔗 Formatted connections:', formattedConnections)
      setBrokerageConnections(formattedConnections)
  
    } catch (error) {
      console.error("Error fetching brokerage connections:", error)
      setBrokerageConnections([])
    }
  }

  // Helper function to format last sync time
  const formatLastSync = (timestamp: string): string => {
    try {
      const date = new Date(timestamp)
      const now = new Date()
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      
      if (diffInMinutes < 1) return "Just now"
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
      if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`
      
      // For older dates, show the actual date
      return date.toLocaleDateString()
    } catch (error) {
      console.error('Error formatting timestamp:', error)
      return "Unknown"
    }
  }
  

  // Update stats when selectedPeriod changes
  useEffect(() => {
    if (!allStats) return

    const periodMap = {
      day: {
        win_rate: allStats.daily_win_rate || 0,
        total_trades: allStats.daily_trades || 0,
        best_trade_percentage: allStats.daily_best_trade || 0,
        average_gain_percentage: allStats.daily_average_gain || 0,
      },
      week: {
        win_rate: allStats.weekly_win_rate || 0,
        total_trades: allStats.weekly_trades || 0,
        best_trade_percentage: allStats.weekly_best_trade || 0,
        average_gain_percentage: allStats.weekly_average_gain || 0,
      },
      month: {
        win_rate: allStats.monthly_win_rate || 0,
        total_trades: allStats.monthly_trades || 0,
        best_trade_percentage: allStats.monthly_best_trade || 0,
        average_gain_percentage: allStats.monthly_average_gain || 0,
      },
      year: {
        win_rate: allStats.yearly_win_rate || 0,
        total_trades: allStats.yearly_trades || 0,
        best_trade_percentage: allStats.yearly_best_trade || 0,
        average_gain_percentage: allStats.yearly_average_gain || 0,
      },
    }

    setStats(periodMap[selectedPeriod])
  }, [selectedPeriod, allStats])

  // Re-fetch level data and badges when stats change
  useEffect(() => {
    if (allStats && profile) {
      fetchLevelData(profile.id)
      fetchBadges(profile.id)
    }
  }, [allStats, followerCount])

  const handleFollowToggle = async () => {
    if (!currentUser || !profile) return

    setFollowLoading(true)
    try {
      if (isFollowing) {
        // Unfollow
        await supabase
          .from("friendships")
          .delete()
          .or(
            `and(requester_id.eq.${currentUser.id},addressee_id.eq.${profile.id}),and(requester_id.eq.${profile.id},addressee_id.eq.${currentUser.id})`,
          )
      } else {
        // Follow
        await supabase.from("friendships").insert({
          requester_id: currentUser.id,
          addressee_id: profile.id,
          status: "accepted",
        })
      }

      setIsFollowing(!isFollowing)

      // Update follower count
      if (!isFollowing) {
        setFollowerCount((prev) => prev + 1)
      } else {
        setFollowerCount((prev) => prev - 1)
      }
    } catch (error) {
      console.error("Error toggling follow:", error)
    } finally {
      setFollowLoading(false)
    }
  }

  const handleRefreshStats = async () => {
    if (!profile) return

    setRefreshing(true)
    try {
      // Call the PostgreSQL function to refresh stats
      const { error } = await supabase.rpc("refresh_all_user_stats", { p_user_id: profile.id })

      if (error) {
        console.error("Error refreshing stats:", error)
        return
      }

      // Refetch the updated stats
      await fetchTradingStats(profile.id)
    } catch (error) {
      console.error("Error in handleRefreshStats:", error)
    } finally {
      setRefreshing(false)
    }

    
  }

  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    })
  }
  // Handle new component actions
  const handleConnectBrokerage = async () => {
    console.log('🏦 handleConnectBrokerage: ============================================');
    console.log('🏦 handleConnectBrokerage: Starting brokerage connection flow for profile page');
    console.log('🏦 handleConnectBrokerage: User:', { username, profileId: profile?.id });
    
    setConnectingBrokerage(true);
    clearError();
  
    try {
      // Get the current profile page URL for redirect
      const currentUrl = `${window.location.origin}/user/${username}`;
      console.log('🏦 handleConnectBrokerage: Profile redirect URL:', currentUrl);
  
      // Initialize SnapTrade flow with profile-specific redirect
      console.log('🏦 handleConnectBrokerage: Calling initializeSnapTradeFlow...');
      const connectionUrl = await initializeSnapTradeFlow(currentUrl);
      
      if (connectionUrl) {
        console.log('🏦 handleConnectBrokerage: ✅ Connection URL generated successfully');
        console.log('🏦 handleConnectBrokerage: URL:', connectionUrl);
        
        // Open connection portal in popup window (matching signup flow)
        console.log('🏦 handleConnectBrokerage: Opening popup window...');
        const popup = window.open(
          connectionUrl, 
          'snaptrade-connect', 
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );
  
        if (!popup) {
          console.error('🏦 handleConnectBrokerage: ❌ Failed to open popup window');
          alert('Please allow popups for this site to connect your brokerage account.');
          setConnectingBrokerage(false);
          return;
        }
  
        console.log('🏦 handleConnectBrokerage: ✅ Popup opened successfully');
        console.log('🏦 handleConnectBrokerage: Starting popup monitoring...');
  
        // Monitor popup for completion
        const checkConnection = setInterval(async () => {
          try {
            // Check if popup was closed
            if (popup.closed) {
              clearInterval(checkConnection);
              console.log('🏦 handleConnectBrokerage: 🔔 Popup closed, checking for success');
              
              // Small delay to allow URL parameter processing
              setTimeout(async () => {
                // Check if we have the success parameter
                const urlParams = new URLSearchParams(window.location.search);
                const wasConnected = urlParams.get('connected');
                
                console.log('🏦 handleConnectBrokerage: URL params check:', { 
                  wasConnected, 
                  fullUrl: window.location.href 
                });
                
                if (wasConnected === 'true') {
                  console.log('🏦 handleConnectBrokerage: ✅ SUCCESS! Connection parameter detected');
                  console.log('🏦 handleConnectBrokerage: Starting post-connection processing...');
                  
                  // Clean up URL parameter first
                  const url = new URL(window.location.href);
                  url.searchParams.delete('connected');
                  window.history.replaceState({}, '', url.toString());
                  console.log('🏦 handleConnectBrokerage: URL cleaned:', url.toString());
                  
                  // Process the new connection and save to database
                  await processNewConnection();
                  
                } else {
                  console.log('🏦 handleConnectBrokerage: ⚠️ Popup closed without success parameter');
                  console.log('🏦 handleConnectBrokerage: User may have cancelled or connection failed');
                }
                
                setConnectingBrokerage(false);
                console.log('🏦 handleConnectBrokerage: Connection process completed');
              }, 500);
            }
          } catch (error) {
            console.error('🏦 handleConnectBrokerage: ❌ Error checking popup status:', error);
            clearInterval(checkConnection);
            setConnectingBrokerage(false);
          }
        }, 1000);
  
        // Safety timeout to clean up if popup doesn't close
        setTimeout(() => {
          clearInterval(checkConnection);
          if (!popup.closed) {
            console.log('🏦 handleConnectBrokerage: ⏰ Connection timeout reached (5 minutes)');
            popup.close();
          }
          setConnectingBrokerage(false);
        }, 300000); // 5 minutes timeout
  
      } else {
        console.error('🏦 handleConnectBrokerage: ❌ Failed to generate connection URL');
        console.error('🏦 handleConnectBrokerage: Check SnapTrade credentials and API status');
        alert('Failed to initialize brokerage connection. Please try again.');
        setConnectingBrokerage(false);
      }
  
    } catch (error) {
      console.error('🏦 handleConnectBrokerage: ❌ Unexpected error:', error);
      console.error('🏦 handleConnectBrokerage: Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      alert('An error occurred while connecting your brokerage account. Please try again.');
      setConnectingBrokerage(false);
    }
  
    console.log('🏦 handleConnectBrokerage: ============================================');
  };

  const processNewConnection = async () => {
    console.log('💾 processNewConnection: ==========================================');
    console.log('💾 processNewConnection: Starting connection data processing...');
    
    try {
      if (!profile?.id) {
        console.error('💾 processNewConnection: ❌ No profile ID available');
        alert('Profile information not available. Please refresh the page and try again.');
        return;
      }
  
      // Get user's SnapTrade credentials
      console.log('💾 processNewConnection: Fetching SnapTrade credentials...');
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('snaptrade_user_id, snaptrade_user_secret')
        .eq('id', profile.id)
        .single();
  
      if (userError || !userData?.snaptrade_user_id || !userData?.snaptrade_user_secret) {
        console.error('💾 processNewConnection: ❌ No SnapTrade credentials found');
        alert('Failed to retrieve SnapTrade credentials. Please try connecting again.');
        return;
      }
  
      const snapTradeUserId = userData.snaptrade_user_id;
      const snapTradeUserSecret = userData.snaptrade_user_secret;
      console.log('💾 processNewConnection: ✅ SnapTrade credentials found:', snapTradeUserId);
  
      // Step 1: Fetch all connections from SnapTrade
      console.log('💾 processNewConnection: 📋 Fetching connections from SnapTrade...');
      const connectionsResponse = await fetch('/api/snaptrade/list-connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: snapTradeUserId,
          userSecret: snapTradeUserSecret
        })
      });
  
      if (!connectionsResponse.ok) {
        throw new Error(`Failed to fetch connections: ${connectionsResponse.status}`);
      }
  
      const connections = await connectionsResponse.json();
      console.log('💾 processNewConnection: ✅ Connections fetched:', {
        count: connections.length,
        connections: connections.map((c: any) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          brokerageName: c.brokerage?.name,
          brokerageDisplayName: c.brokerage?.display_name
        }))
      });
  
      // Step 2: Store each connection using the updated API route WITH FULL DATA
      console.log('💾 processNewConnection: 💿 Storing connections with complete brokerage data...');
      let connectionsStored = 0;
      
      for (const connection of connections) {
        try {
          console.log('💾 processNewConnection: 📤 Saving connection with full brokerage data:', {
            id: connection.id,
            name: connection.name,
            brokerageName: connection.brokerage?.name,
            hasLogo: !!connection.brokerage?.aws_s3_logo_url
          });
          
          // KEY CHANGE: Pass the full connection data including brokerage information
          const requestBody = {
            userId: profile.id,  // Our database user ID
            authorizationId: connection.id,  // SnapTrade connection ID
            brokerageName: connection.name || 'Unknown Brokerage',
            connectionType: 'read',
            connectionData: connection  // 🔥 PASS FULL CONNECTION DATA HERE
          };
          
          console.log('💾 processNewConnection: Request includes full brokerage data:', {
            hasBrokerageInfo: !!requestBody.connectionData.brokerage,
            brokerageName: requestBody.connectionData.brokerage?.name,
            brokerageSlug: requestBody.connectionData.brokerage?.slug,
            hasLogos: !!(requestBody.connectionData.brokerage?.aws_s3_logo_url)
          });
          
          const saveConnectionResponse = await fetch('/api/snaptrade/save-connection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
          });
  
          console.log('💾 processNewConnection: Save connection API response:', {
            connectionId: connection.id,
            status: saveConnectionResponse.status,
            ok: saveConnectionResponse.ok
          });
  
          if (saveConnectionResponse.ok) {
            const result = await saveConnectionResponse.json();
            console.log('💾 processNewConnection: ✅ Connection stored with brokerage data:', {
              connectionId: connection.id,
              resultBrokerageName: result.data?.brokerage_name,
              resultDisplayName: result.data?.brokerage_display_name,
              hasLogo: !!result.data?.brokerage_logo_url
            });
            connectionsStored++;
          } else {
            const errorResponse = await saveConnectionResponse.text();
            console.error('💾 processNewConnection: ❌ API error for connection:', connection.id);
            console.error('💾 processNewConnection: API error response:', errorResponse);
          }
        } catch (error) {
          console.error('💾 processNewConnection: ❌ Exception saving connection:', connection.id, error);
        }
      }
  
      // Continue with accounts saving (same as before)...
      console.log('💾 processNewConnection: 📊 Fetching accounts from SnapTrade...');
      const accountsResponse = await fetch('/api/snaptrade/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: snapTradeUserId,
          userSecret: snapTradeUserSecret
        })
      });
  
      if (accountsResponse.ok) {
        const accounts = await accountsResponse.json();
        console.log('💾 processNewConnection: ✅ Accounts fetched:', accounts.length);
        
        // Get connections from database
        const connectionsInDb = await supabase
          .from('snaptrade_connections')
          .select('id, snaptrade_connection_id')
          .eq('snaptrade_user_id', snapTradeUserId);
  
        if (connectionsInDb.data && connectionsInDb.data.length > 0) {
          let totalAccountsSaved = 0;
          
          for (const dbConnection of connectionsInDb.data) {
            const connectionAccounts = accounts.filter((account: any) => 
              account.brokerage_authorization === dbConnection.snaptrade_connection_id
            );
  
            if (connectionAccounts.length > 0) {
              console.log(`💾 processNewConnection: 💰 Saving ${connectionAccounts.length} accounts...`);
              
              try {
                const transformedAccounts = connectionAccounts.map((account: any) => ({
                  id: account.id,
                  name: account.name,
                  number: account.number,
                  institution_name: account.institution_name,
                  brokerage_authorization: account.brokerage_authorization,
                  balance: account.balance,
                  meta: account.meta,
                  sync_status: account.sync_status,
                  created_date: account.created_date,
                  status: account.status,
                  type: account.meta?.type || account.raw_type,
                  raw_data: account
                }));
  
                const saveAccountsResponse = await fetch('/api/snaptrade/save-accounts', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    connectionId: dbConnection.id,
                    accounts: transformedAccounts
                  })
                });
  
                if (saveAccountsResponse.ok) {
                  const result = await saveAccountsResponse.json();
                  console.log(`💾 processNewConnection: ✅ Accounts saved for connection ${dbConnection.id}`);
                  totalAccountsSaved += connectionAccounts.length;
                } else {
                  const errorText = await saveAccountsResponse.text();
                  console.error(`💾 processNewConnection: ❌ Failed to save accounts for connection ${dbConnection.id}`);
                  console.error('💾 processNewConnection: Save accounts error:', errorText);
                }
              } catch (error) {
                console.error('💾 processNewConnection: ❌ Exception saving accounts:', error);
              }
            }
          }
  
          console.log('💾 processNewConnection: Account storage summary:', {
            totalAccounts: accounts.length,
            accountsSaved: totalAccountsSaved
          });
        }
      }
  
      // Step 4: Refresh the UI
      console.log('💾 processNewConnection: 🔄 Refreshing UI...');
      await fetchBrokerageConnections(profile.id);
      console.log('💾 processNewConnection: ✅ UI refresh completed');
      
      alert('Brokerage account connected and synced successfully!');
  
    } catch (error) {
      console.error('💾 processNewConnection: ❌ Critical error:', error);
      alert('Connection successful, but there was an issue saving the data. Please refresh the page.');
    }
  
    console.log('💾 processNewConnection: ==========================================');
  };
  

  const handleRefreshConnection = async (connectionId: string) => {
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
  
      // Refresh UI
      if (profile?.id) {
        await fetchBrokerageConnections(profile.id)
      }
  
      console.log('✅ Regular refresh completed! Got latest cached data from SnapTrade.')
  
      // 🆕 NEW: Automatically refresh performance stats after connection refresh
      console.log('🔄 Auto-refreshing performance stats after connection update...')
      try {
        if (profile?.id) {
          // Call the PostgreSQL function to refresh stats
          const { error: statsError } = await supabase.rpc("refresh_all_user_stats", { p_user_id: profile.id })

          if (statsError) {
            console.error("Error refreshing stats:", statsError)
          } else {
            // Refetch the updated stats to update the UI
            await fetchTradingStats(profile.id)
            console.log('✅ Performance stats automatically refreshed!')
          }
        }
      } catch (statsRefreshError) {
        console.error("Error in auto-refresh of stats:", statsRefreshError)
      }
    
    
  } catch (error) {
    console.error('❌ Error refreshing connection:', error)
  }
}
  
  const canRefreshConnection = (lastSyncDate: string): boolean => {
    if (!lastSyncDate) return true // Never synced, allow refresh
    
    const lastSync = new Date(lastSyncDate)
    const now = new Date()
    const hoursElapsed = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60)
    
    return hoursElapsed >= 24
  }

  const getTimeUntilNextRefresh = (lastSyncDate: string): string => {
    if (!lastSyncDate) return "Available now"
    
    const lastSync = new Date(lastSyncDate)
    const now = new Date()
    const hoursElapsed = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60)
    
    if (hoursElapsed >= 24) return "Available now"
    
    const hoursRemaining = 24 - hoursElapsed
    const hours = Math.floor(hoursRemaining)
    const minutes = Math.floor((hoursRemaining - hours) * 60)
    
    if (hours > 0) {
      return `Available in ${hours}h ${minutes}m`
    } else {
      return `Available in ${minutes}m`
    }
  }

  const getRefreshTooltipMessage = (snapTradeLastSync: string): string => {
    if (!snapTradeLastSync) return "Click to get latest data"
    
    const lastSync = new Date(snapTradeLastSync)
    const now = new Date()
    const hoursElapsed = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60)
    
    if (hoursElapsed >= 24) {
      return "Click to check for updated data"
    }
    
    const hoursUntilUseful = 24 - hoursElapsed
    const hours = Math.floor(hoursUntilUseful)
    const minutes = Math.floor((hoursUntilUseful - hours) * 60)
    
    return `Data is current. New data available in ~${hours}h ${minutes}m`
  }

  const handleDisconnectBrokerage = (id: string) => {
    // TODO: Implement brokerage disconnect
    console.log("Disconnect brokerage:", id)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">User not found</h1>
          <p className="text-gray-600">The user @{username} doesn't exist.</p>
          <Link href="/" className="mt-4 inline-block text-blue-600 hover:text-blue-700">
            Go back home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Profile Header with Level Display */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-6">
          <div className="flex items-start space-x-4">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                {profile.display_name?.charAt(0) || profile.username.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Profile Info with Level Integration */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900 truncate">
                      {profile.display_name || profile.username}
                    </h1>
                    {/* Integrated Level Badge */}
                    {levelData && (
                      <div className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold rounded-full">
                        <span>⭐</span>
                        <span>Level {levelData.currentLevel}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm">@{profile.username}</p>

                  {/* Bio Section */}
                  <div className="mt-2">
                    <EditableBioSection
                      bio={profile.bio}
                      isOwnProfile={isOwnProfile}
                      onBioUpdate={(newBio) => {
                        setProfile((prev) => (prev ? { ...prev, bio: newBio } : null))
                      }}
                    />
                  </div>

                  {/* Profile Stats */}
                  <div className="flex items-center space-x-6 mt-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{followerCount} followers</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{followingCount} following</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {formatJoinDate(profile.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-3">
                  {currentUser && currentUser.id !== profile.id && (
                    <button
                      onClick={handleFollowToggle}
                      disabled={followLoading}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        isFollowing || isFollowingBack
                          ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      } ${followLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="w-4 h-4" />
                          <span>Following</span>
                        </>
                      ) : isFollowingBack ? (
                        <>
                          <UserCheck className="w-4 h-4" />
                          <span>Follow Back</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          <span>Follow</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Level & Badges */}
          <div className="space-y-6">
            {/* Level Display Component */}
            {levelData && (
              <LevelDisplay levelData={levelData} />
            )}
            
            {/* Badges Grid Component */}
            <BadgesGrid badges={badges} userId={profile.id} onBadgesUpdate={setBadges} />
          </div>

          {/* Right Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            

            
            {/* Brokerage Connections - Only show for own profile */}
            {isOwnProfile && (
              <BrokerageConnectionPanel
                connections={brokerageConnections}
                onConnect={handleConnectBrokerage}
                onRefresh={handleRefreshConnection}
                onDisconnect={handleDisconnectBrokerage}
                loading={loading}
              />
            )}

            {/* Trading Stats Section */}
            {stats && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Trading Performance</h2>

                    <div className="flex items-center space-x-2">
                      {/* Time Period Selector */}
                      <div className="flex bg-gray-100 rounded-lg p-1">
                        {(["day", "week", "month", "year"] as TimePeriod[]).map((period) => (
                          <button
                            key={period}
                            onClick={() => setSelectedPeriod(period)}
                            className={`px-3 py-1 text-sm rounded-md transition-colors ${
                              selectedPeriod === period
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-600 hover:text-gray-900"
                            }`}
                          >
                            {period.charAt(0).toUpperCase() + period.slice(1)}
                          </button>
                        ))}
                      </div>
                        
                      {/* Share Button */}
                      {stats && profile && (
                        <ViralShareButton
                          type="profile"
                          data={{
                            username: profile.username,
                            displayName: profile.display_name || profile.username,
                            stats: stats,
                            period: selectedPeriod,
                          }}
                          variant="minimal"
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        />
                      )}

                      {/* Refresh Button - Only show for own profile 
                      {isOwnProfile && (
                        <button
                          onClick={handleRefreshStats}
                          disabled={refreshing}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                          title="Refresh stats"
                        >
                          <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
                        </button>
                      )}*/}
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Win Rate */}
                    <div className="text-center p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
                      <div className="flex justify-center mb-2">
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">🏆</span>
                        </div>
                      </div>
                      <p className="text-3xl font-bold text-green-700">{stats.win_rate}%</p>
                      <p className="text-sm text-gray-600 mt-1">Win Rate</p>
                    </div>

                    {/* Total Trades */}
                    <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
                      <div className="flex justify-center mb-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">🎯</span>
                        </div>
                      </div>
                      <p className="text-3xl font-bold text-blue-700">{stats.total_trades}</p>
                      <p className="text-sm text-gray-600 mt-1">Total Trades</p>
                    </div>

                    {/* Average Return */}
                    <div className="text-center p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
                      <div className="flex justify-center mb-2">
                        <TrendingUp className="w-8 h-8 text-purple-600" />
                      </div>
                      <p
                        className={`text-3xl font-bold ${stats.average_gain_percentage >= 0 ? "text-purple-700" : "text-red-600"}`}
                      >
                        {stats.average_gain_percentage >= 0 ? "+" : ""}
                        {stats.average_gain_percentage}%
                      </p>
                      <p className="text-sm text-gray-600 mt-1">Avg Return</p>
                    </div>

                    {/* Best Trade */}
                    <div className="text-center p-4 rounded-lg bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200">
                      <div className="flex justify-center mb-2">
                        <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">⭐</span>
                        </div>
                      </div>
                      <p
                        className={`text-3xl font-bold ${stats.best_trade_percentage >= 0 ? "text-yellow-700" : "text-red-600"}`}
                      >
                        {stats.best_trade_percentage >= 0 ? "+" : ""}
                        {stats.best_trade_percentage}%
                      </p>
                      <p className="text-sm text-gray-600 mt-1">Best Trade</p>
                    </div>
                  </div>

                  {/* Note about time period */}
                  <p className="text-xs text-gray-500 text-center mt-4">Stats for the past {selectedPeriod}</p>
                </div>
              </div>
            )}

            {/* Trade History */}
            <ProfileTradeHistory userId={profile.id} isOwnProfile={isOwnProfile} username={profile.username} />
          </div>
        </div>
      </div>
    </div>
  )
}