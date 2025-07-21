"use client"

import { Star, Trophy, Target, Zap } from "lucide-react"

interface LevelData {
  currentLevel: number
  levelName: string
  currentXP: number
  nextLevelXP: number
  totalXP: number
}

interface LevelBenefit {
  level: number
  benefit: string
  unlocked: boolean
}

interface LevelDisplayProps {
  levelData: LevelData
  className?: string
}

export default function LevelDisplay({ levelData, className = "" }: LevelDisplayProps) {
  const { currentLevel, levelName, currentXP, nextLevelXP, totalXP } = levelData

  const progressPercentage = (currentXP / nextLevelXP) * 100
  const xpToNext = nextLevelXP - currentXP

  const getLevelIcon = (level: number) => {
    if (level >= 20) return <Trophy className="w-6 h-6 text-yellow-500" />
    if (level >= 15) return <Star className="w-6 h-6 text-purple-500" />
    if (level >= 10) return <Target className="w-6 h-6 text-blue-500" />
    return <Zap className="w-6 h-6 text-green-500" />
  }

  const getLevelColor = (level: number) => {
    if (level >= 20) return "from-yellow-400 to-orange-500"
    if (level >= 15) return "from-purple-400 to-pink-500"
    if (level >= 10) return "from-blue-400 to-indigo-500"
    return "from-green-400 to-emerald-500"
  }

  const getNextLevelName = (level: number) => {
    const levelNames = {
      1: "Rookie Trader",
      5: "Active Trader",
      10: "Skilled Trader",
      15: "Expert Trader",
      20: "Master Trader",
      25: "Elite Trader",
      30: "Legendary Trader",
    }

    const nextMilestone = Object.keys(levelNames)
      .map(Number)
      .find((l) => l > level)

    return nextMilestone ? levelNames[nextMilestone as keyof typeof levelNames] : "Max Level"
  }

  const levelBenefits: LevelBenefit[] = [
    { level: 5, benefit: "Custom profile themes", unlocked: currentLevel >= 5 },
    { level: 10, benefit: "Advanced analytics", unlocked: currentLevel >= 10 },
    { level: 15, benefit: "Priority support", unlocked: currentLevel >= 15 },
    { level: 20, benefit: "Exclusive badges", unlocked: currentLevel >= 20 },
  ]

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {/* Main Level Display */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-3">
          <div className={`p-3 rounded-full bg-gradient-to-r ${getLevelColor(currentLevel)} shadow-lg`}>
            {getLevelIcon(currentLevel)}
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-1">Level {currentLevel}</h2>
        <p
          className={`text-lg font-medium bg-gradient-to-r ${getLevelColor(currentLevel)} bg-clip-text text-transparent`}
        >
          {levelName}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-600">
            {currentXP.toLocaleString()} / {nextLevelXP.toLocaleString()} XP
          </span>
          <span className="text-sm text-gray-500">{xpToNext.toLocaleString()} XP to next level</span>
        </div>

        {/* Custom Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 bg-gradient-to-r ${getLevelColor(currentLevel)} rounded-full transition-all duration-500 ease-out`}
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>

        <div className="mt-2 text-center">
          <p className="text-sm text-gray-600">
            Next: Level {currentLevel + 1} - {getNextLevelName(currentLevel)}
          </p>
        </div>
      </div>

      {/* Level Benefits 
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Level Benefits</h3>

        <div className="space-y-2">
          {levelBenefits.map((benefit) => (
            <div
              key={benefit.level}
              className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                benefit.unlocked ? "bg-green-50 border border-green-200" : "bg-gray-50 border border-gray-200"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  benefit.unlocked ? "bg-green-500 text-white" : "bg-gray-300 text-gray-600"
                }`}
              >
                {benefit.level}
              </div>

              <span className={`text-sm flex-1 ${benefit.unlocked ? "text-green-700" : "text-gray-600"}`}>
                {benefit.benefit}
              </span>

              {benefit.unlocked && (
                <div className="ml-auto">
                  <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div> */}

      {/* Total XP */}
      <div className="mt-6 pt-4 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-600">
          Total XP Earned: <span className="font-semibold text-gray-900">{totalXP.toLocaleString()}</span>
        </p>
      </div>
    </div>
  )
}