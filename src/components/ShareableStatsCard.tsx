// components/ShareableStatsCard.tsx
import React, { useRef } from 'react';
import { Trophy, TrendingUp, Target, Zap } from 'lucide-react';

interface ShareableStatsCardProps {
  username: string;
  displayName: string;
  stats: {
    win_rate: number;
    total_trades: number;
    best_trade_percentage: number;
    average_gain_percentage: number;
  };
  period: string;
  onClose: () => void;
}

export default function ShareableStatsCard({ 
  username, 
  displayName, 
  stats, 
  period,
  onClose 
}: ShareableStatsCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    // In production, you'd use html2canvas or similar library
    // For now, we'll just copy to clipboard
    alert('Download feature coming soon! This will save your stats as an image.');
  };

  const handleShare = () => {
    const text = `My ${period} trading stats on @TopTrader:\n\n🏆 Win Rate: ${stats.win_rate}%\n📈 Avg Return: ${stats.average_gain_percentage >= 0 ? '+' : ''}${stats.average_gain_percentage}%\n🎯 Total Trades: ${stats.total_trades}\n⚡ Best Trade: ${stats.best_trade_percentage >= 0 ? '+' : ''}${stats.best_trade_percentage}%\n\nTrack your trades at toptrader.com`;
    
    if (navigator.share) {
      navigator.share({
        title: 'My Trading Stats',
        text: text,
      });
    } else {
      navigator.clipboard.writeText(text);
      alert('Stats copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Share Your Stats</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Stats Card Preview */}
        <div className="p-4">
          <div 
            ref={cardRef}
            className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white relative overflow-hidden"
            style={{ aspectRatio: '9/16' }}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-x-32 -translate-y-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-x-24 translate-y-24"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col">
              {/* Logo */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold tracking-tight">TopTrader</h1>
                <p className="text-sm opacity-80 mt-1">Trading Performance</p>
              </div>

              {/* User Info */}
              <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold">
                  {displayName.charAt(0)}
                </div>
                <h2 className="text-xl font-semibold">{displayName}</h2>
                <p className="text-sm opacity-80">@{username}</p>
              </div>

              {/* Stats */}
              <div className="flex-1 space-y-6">
                {/* Win Rate - Featured */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur mb-2">
                    <Trophy className="w-8 h-8" />
                  </div>
                  <p className="text-5xl font-bold">{stats.win_rate}%</p>
                  <p className="text-sm opacity-80">Win Rate</p>
                </div>

                {/* Other Stats Grid */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <TrendingUp className="w-6 h-6 mx-auto mb-1 opacity-80" />
                    <p className="text-2xl font-bold">
                      {stats.average_gain_percentage >= 0 ? '+' : ''}{stats.average_gain_percentage}%
                    </p>
                    <p className="text-xs opacity-80">Avg Return</p>
                  </div>
                  <div>
                    <Target className="w-6 h-6 mx-auto mb-1 opacity-80" />
                    <p className="text-2xl font-bold">{stats.total_trades}</p>
                    <p className="text-xs opacity-80">Trades</p>
                  </div>
                  <div>
                    <Zap className="w-6 h-6 mx-auto mb-1 opacity-80" />
                    <p className="text-2xl font-bold">
                      {stats.best_trade_percentage >= 0 ? '+' : ''}{stats.best_trade_percentage}%
                    </p>
                    <p className="text-xs opacity-80">Best Trade</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center mt-8">
                <p className="text-sm opacity-80">{period.toUpperCase()} PERFORMANCE</p>
                <p className="text-xs opacity-60 mt-1">toptrader.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t flex gap-3">
          <button
            onClick={handleDownload}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Download Image
          </button>
          <button
            onClick={handleShare}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );
}