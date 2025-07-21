"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Calendar, UserPlus, UserCheck, Users, TrendingUp, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth"
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
}

interface BrokerageConnection {
  id: number
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
  
  // New state for integrated components
  const [levelData, setLevelData] = useState<LevelData | null>(null)
  const [badges, setBadges] = useState<Badge[]>([])
  const [brokerageConnections, setBrokerageConnections] = useState<BrokerageConnection[]>([])

  useEffect(() => {
    if (username) {
      fetchUserProfile()
    }
  }, [username, currentUser])

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

  // New data fetching functions for integrated components
  const fetchLevelData = async (userId: string) => {
    try {
      // TODO: Replace with real API call to fetch user level data
      // For now, calculate based on trading stats
      const totalTrades = allStats?.monthly_trades || 0
      const winRate = allStats?.monthly_win_rate || 0
      
      // Simple XP calculation based on trading activity
      const baseXP = totalTrades * 10
      const winBonus = Math.floor(winRate * 5)
      const totalXP = baseXP + winBonus
      
      const currentLevel = Math.max(1, Math.floor(totalXP / 250) + 1)
      const currentXP = totalXP % 250
      const nextLevelXP = 250
      
      const levelNames = {
        1: "Rookie Trader",
        5: "Active Trader", 
        10: "Skilled Trader",
        15: "Expert Trader",
        20: "Master Trader",
        25: "Elite Trader",
        30: "Legendary Trader"
      }
      
      // Find appropriate level name
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
        nextLevelXP,
        totalXP
      })
    } catch (error) {
      console.error("Error fetching level data:", error)
    }
  }

  const fetchBadges = async (userId: string) => {
    try {
      // TODO: Replace with real API call to fetch user badges
      // For now, generate based on user activity and stats
      const defaultBadges: Badge[] = [
        {
          id: "first_trade",
          name: "First Trade",
          icon: "🎯",
          earned: (allStats?.total_trades || 0) > 0,
          earnedDate: allStats?.total_trades > 0 ? "2024-01-15" : undefined,
          description: "Completed your first trade on the platform",
          category: "trading",
          rarity: "common",
        },
        {
          id: "social_butterfly",
          name: "Social Butterfly",
          icon: "🦋",
          earned: followerCount >= 10,
          earnedDate: followerCount >= 10 ? "2024-02-20" : undefined,
          description: "Gained 10 followers",
          category: "social",
          rarity: "rare",
        },
        {
          id: "winning_streak",
          name: "5 Win Streak",
          icon: "🔥", 
          earned: (allStats?.monthly_win_rate || 0) >= 80,
          earnedDate: (allStats?.monthly_win_rate || 0) >= 80 ? "2024-02-15" : undefined,
          description: "Achieved 80%+ win rate this month",
          category: "trading",
          rarity: "rare",
        },
        {
          id: "portfolio_milestone",
          name: "Active Trader",
          icon: "💎",
          earned: (allStats?.monthly_trades || 0) >= 10,
          earnedDate: (allStats?.monthly_trades || 0) >= 10 ? "2024-03-01" : undefined,
          description: "Completed 10+ trades this month",
          category: "achievement",
          rarity: "epic",
        },
        {
          id: "day_trader",
          name: "Day Trader",
          icon: "⚡",
          earned: false,
          description: "Complete 10 trades in a single day",
          category: "trading",
          rarity: "rare",
        },
        {
          id: "master_trader",
          name: "Master Trader",
          icon: "👑",
          earned: levelData ? levelData.currentLevel >= 20 : false,
          description: "Reach Level 20",
          category: "achievement",
          rarity: "legendary",
        },
      ]

      setBadges(defaultBadges)
    } catch (error) {
      console.error("Error fetching badges:", error)
    }
  }

  const fetchBrokerageConnections = async (userId: string) => {
    try {
      // TODO: Replace with real API call to fetch brokerage connections
      // For now, return empty array for non-own profiles
      if (!isOwnProfile) {
        setBrokerageConnections([])
        return
      }

      // Mock data for own profile - replace with real data
      const mockConnections: BrokerageConnection[] = [
        {
          id: 1,
          name: "Robinhood",
          status: "connected",
          lastSync: "2 minutes ago",
          accountValue: 25430.5,
          logo: "🤖",
        },
        {
          id: 2,
          name: "E*TRADE",
          status: "connected", 
          lastSync: "5 minutes ago",
          accountValue: 19800.0,
          logo: "📊",
        },
      ]

      setBrokerageConnections(mockConnections)
    } catch (error) {
      console.error("Error fetching brokerage connections:", error)
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

  const isOwnProfile = currentUser?.id === profile?.id

  // Handle new component actions
  const handleConnectBrokerage = () => {
    // TODO: Implement brokerage connection flow
    console.log("Connect new brokerage account")
  }

  const handleRefreshConnection = (id: number) => {
    // TODO: Implement brokerage refresh
    console.log("Refresh connection:", id)
  }

  const handleDisconnectBrokerage = (id: number) => {
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
            <BadgesGrid badges={badges} />
          </div>

          {/* Right Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Brokerage Connections - Only show for own profile */}
            {isOwnProfile && brokerageConnections.length > 0 && (
              <BrokerageConnectionPanel
                connections={brokerageConnections}
                onConnect={handleConnectBrokerage}
                onRefresh={handleRefreshConnection}
                onDisconnect={handleDisconnectBrokerage}
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

                      {/* Refresh Button - Only show for own profile */}
                      {isOwnProfile && (
                        <button
                          onClick={handleRefreshStats}
                          disabled={refreshing}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                          title="Refresh stats"
                        >
                          <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
                        </button>
                      )}
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