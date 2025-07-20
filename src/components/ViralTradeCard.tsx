// src/components/ViralTradeCard.tsx
"use client"

import { useState } from "react"
import { X, TrendingUp, Copy, Check } from "lucide-react"
import { CircularProgress } from "@/components/ui/CircularProgress"
import type { ViralTradeCardProps, TradeData, ProfileStatsData } from "../types/viral-card"

export default function ViralTradeCard({ data, type, isOpen, onClose }: ViralTradeCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = async () => {
    try {
      const shareUrl = type === 'trade' 
        ? `https://toptrader-nine.vercel.app/trade/${(data as TradeData).id}`
        : `https://toptrader-nine.vercel.app/user/${(data as ProfileStatsData).username}`;
      
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy link")
    }
  }

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? "+" : ""
    return `${sign}${value.toFixed(1)}%`
  }

  const getPercentageColor = (value: number) => {
    return value >= 0 ? "text-green-500" : "text-red-500"
  }

  const getPeriodLabel = (period: string) => {
    const labels = {
      day: "DAILY",
      week: "WEEKLY",
      month: "MONTHLY",
      year: "YEARLY",
    }
    return labels[period as keyof typeof labels] || "MONTHLY"
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Content */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full animate-in fade-in-0 zoom-in-95 duration-300">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 z-10 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white/90 p-2 transition-colors"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </button>

        {/* Card Content - 400x600px aspect ratio */}
        <div className="w-full aspect-[2/3] p-6 flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TOPTRADER
              </h1>
              <p className="text-xs text-gray-500 font-medium">Social Trading</p>
            </div>
          </div>

          {/* Content based on type */}
          {type === "profile" ? (
            <ProfileContent data={data as ProfileStatsData} />
          ) : (
            <TradeContent data={data as TradeData} />
          )}

          {/* CTA Button */}
          <div className="mt-auto">
            <button
              onClick={handleCopyLink}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  toptrader.gg
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProfileContent({ data }: { data: ProfileStatsData }) {
  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? "+" : ""
    return `${sign}${value.toFixed(1)}%`
  }

  const getPercentageColor = (value: number) => {
    return value >= 0 ? "text-green-500" : "text-red-500"
  }

  const getPeriodLabel = (period: string) => {
    const labels = {
      day: "DAILY",
      week: "WEEKLY",
      month: "MONTHLY",
      year: "YEARLY",
    }
    return labels[period as keyof typeof labels] || "MONTHLY"
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Username */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">@{data.username}</h2>
      </div>

      {/* Period Label */}
      <div className="text-center mb-8">
        <h3 className="text-sm font-bold text-gray-600 tracking-wider">MARKET MOVES ({getPeriodLabel(data.period)})</h3>
      </div>

      {/* Hero Metric - Win Rate */}
      <div className="flex justify-center mb-8">
        <CircularProgress percentage={data.stats.win_rate} />
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-gray-50 rounded-2xl p-4 text-center">
          <div className={`text-2xl font-bold ${getPercentageColor(data.stats.average_gain_percentage)}`}>
            {formatPercentage(data.stats.average_gain_percentage)}
          </div>
          <div className="text-xs text-gray-500 font-medium mt-1">AVG RETURN</div>
        </div>

        <div className="bg-gray-50 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.stats.total_trades}</div>
          <div className="text-xs text-gray-500 font-medium mt-1">TOTAL TRADES</div>
        </div>

        <div className="bg-gray-50 rounded-2xl p-4 text-center col-span-2">
          <div className={`text-2xl font-bold ${getPercentageColor(data.stats.best_trade_percentage)}`}>
            {formatPercentage(data.stats.best_trade_percentage)}
          </div>
          <div className="text-xs text-gray-500 font-medium mt-1">BEST TRADE</div>
        </div>
      </div>
    </div>
  )
}

function TradeContent({ data }: { data: TradeData }) {
  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? "+" : ""
    return `${sign}${value.toFixed(1)}%`
  }

  const getPercentageColor = (value: number) => {
    return value >= 0 ? "text-green-500" : "text-red-500"
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Username */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">@{data.user.username}</h2>
      </div>

      {/* Trade Details */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 mb-4">
          <span className={`text-sm font-bold ${data.tradeType === "BUY" ? "text-green-600" : "text-red-600"}`}>
            {data.tradeType}
          </span>
          <span className="text-sm font-bold text-gray-900">{data.symbol}</span>
        </div>

        {data.companyName && <p className="text-sm text-gray-500 mb-2">{data.companyName}</p>}

        <p className="text-xs text-gray-400">{data.timeAgo}</p>
      </div>

      {/* Hero Metric - Performance */}
      {data.percentage !== undefined && (
        <div className="text-center mb-8">
          <div className={`text-6xl font-bold ${getPercentageColor(data.percentage)} mb-2`}>
            {formatPercentage(data.percentage)}
          </div>
          <div className="text-sm text-gray-500 font-medium">PERFORMANCE</div>
        </div>
      )}

      {/* Simple Chart Visualization Placeholder */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-8">
        <div className="flex items-end justify-center gap-2 h-16">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="bg-gradient-to-t from-blue-400 to-purple-500 rounded-sm"
              style={{
                width: "8px",
                height: `${Math.random() * 60 + 20}px`,
                opacity: i === 6 ? 1 : 0.6,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}