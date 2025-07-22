"use client"

import { useState } from "react"
import { Trophy, Lock, Calendar, Eye, X } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface Badge {
  id: string
  name: string
  icon: string
  earned: boolean
  earnedDate?: string
  description: string
  category: "trading" | "social" | "connection" | "achievement"
  rarity: "common" | "rare" | "epic" | "legendary"
  isNew?: boolean // Add this line
}

interface BadgesGridProps {
  badges: Badge[]
  userId: string
  onBadgesUpdate: (badges: Badge[]) => void
  className?: string
}

export default function BadgesGrid({ badges, userId, onBadgesUpdate, className = "" }: BadgesGridProps) {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null)
  const [showAll, setShowAll] = useState(false)

  const earnedBadges = badges.filter((badge) => badge.earned)
  const displayBadges = showAll ? badges : badges.slice(0, 8)

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "from-yellow-400 to-orange-500"
      case "epic":
        return "from-purple-400 to-pink-500"
      case "rare":
        return "from-blue-400 to-indigo-500"
      default:
        return "from-gray-400 to-gray-500"
    }
  }

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "border-yellow-400 shadow-yellow-200"
      case "epic":
        return "border-purple-400 shadow-purple-200"
      case "rare":
        return "border-blue-400 shadow-blue-200"
      default:
        return "border-gray-300 shadow-gray-200"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "trading":
        return "📈"
      case "social":
        return "👥"
      case "connection":
        return "🔗"
      case "achievement":
        return "🏆"
      default:
        return "🎯"
    }
  }

  return (
    <>
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg font-semibold text-gray-900">Trading Badges</h3>
              <span className="text-sm font-normal text-gray-500">
                {earnedBadges.length} / {badges.length} earned
              </span>
            </div>

            {badges.length > 8 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>{showAll ? "Show Less" : "View All"}</span>
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">Collection Progress</span>
              <span className="text-sm text-gray-500">
                {Math.round((earnedBadges.length / badges.length) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(earnedBadges.length / badges.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-6">
            {displayBadges.map((badge) => (
              <button
                key={badge.id}
                onClick={ async () => {
                  // Clear red dot if badge is new
                  if (badge.isNew && badge.earned) {
                    const { error } = await supabase
                      .from('user_badges')
                      .update({ viewed_at: new Date().toISOString() })
                      .eq('user_id', userId) // Make sure you pass userId to BadgesGrid
                      .eq('badge_id', badge.id)
                      .is('viewed_at', null)

                    if (!error) {
                      // Update local state to remove red dot immediately
                      onBadgesUpdate(badges.map((b: Badge) => 
                        b.id === badge.id ? { ...b, isNew: false } : b
                      ))
                    }
                  }
                  setSelectedBadge(badge)
                }}
                className={`relative aspect-square rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                  badge.earned
                    ? `${getRarityBorder(badge.rarity)} bg-white shadow-lg`
                    : "border-gray-200 bg-gray-50 opacity-60"
                }`}
              >
                {/* Badge Icon */}
                <div className="flex items-center h-full">
                <span className="text-3xl sm:text-3xl md:text-xl lg:text-lg xl:text-base 2xl:text-sm">{badge.icon}</span>
                </div>

                {/* Rarity Glow Effect for Earned Badges */}
                {badge.earned && badge.rarity !== "common" && (
                  <div
                    className={`absolute inset-0 rounded-lg bg-gradient-to-r ${getRarityColor(badge.rarity)} opacity-20 animate-pulse`}
                  />
                )}

                {/* Lock Icon for Unearned Badges */}
                {!badge.earned && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-90 rounded-lg">
                    <Lock className="w-4 h-4 text-gray-400" />
                  </div>
                )}

                {/* New Badge Indicator */}
                {badge.isNew && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                )}
              </button>
            ))}
          </div>

          {/* Category Legend */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-4 text-xs text-gray-600">
              <div className="flex items-center space-x-1">
                <span>📈</span>
                <span>Trading</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>👥</span>
                <span>Social</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>🔗</span>
                <span>Connections</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>🏆</span>
                <span>Achievements</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setSelectedBadge(null)} 
          />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            {/* Close Button */}
            <button
              onClick={() => setSelectedBadge(null)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Badge Details */}
            <div className="flex items-center space-x-3 mb-4">
              <div
                className={`p-3 rounded-full ${
                  selectedBadge.earned ? `bg-gradient-to-r ${getRarityColor(selectedBadge.rarity)}` : "bg-gray-200"
                }`}
              >
                <span className="text-xl lg:text-lg xl:text-base 2xl:text-sm">{selectedBadge.icon}</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedBadge.name}</h3>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="capitalize text-gray-600">{selectedBadge.rarity}</span>
                  <span className="text-gray-400">•</span>
                  <span className="flex items-center space-x-1 text-gray-600">
                    <span>{getCategoryIcon(selectedBadge.category)}</span>
                    <span className="capitalize">{selectedBadge.category}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-gray-700">{selectedBadge.description}</p>

              {selectedBadge.earned ? (
                <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-lg">
                  <Trophy className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Badge Earned!</p>
                    {selectedBadge.earnedDate && (
                      <p className="text-sm flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>Earned on {selectedBadge.earnedDate}</span>
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <Lock className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Not Yet Earned</p>
                    <p className="text-sm">Complete the requirements to unlock this badge.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}