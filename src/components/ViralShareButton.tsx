// src/components/ViralShareButton.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Share2, Copy, Check, X, TrendingUp } from 'lucide-react';

interface ViralTradeCardProps {
  trade: {
    id: string;
    user: {
      username: string;
      displayName?: string;
    };
    symbol: string;
    companyName?: string;
    tradeType: 'BUY' | 'SELL';
    percentage?: number;
    timeAgo: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

const ViralTradeCard: React.FC<ViralTradeCardProps> = ({ trade, isOpen, onClose }) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const tradeUrl = `https://toptrader-nine.vercel.app/trade/${trade.id}`;

  // Mock chart data generation
  const generateMockChart = () => {
    const points = [];
    let value = 100;
    const trend = trade.percentage || 0;
    
    for (let i = 0; i < 15; i++) {
      const bias = trend > 0 ? 2 : -2;
      value += Math.random() * 8 - 4 + (bias * (i / 15));
      points.push(Math.max(50, value));
    }
    return points;
  };

  const chartPoints = generateMockChart();
  const maxValue = Math.max(...chartPoints);
  const minValue = Math.min(...chartPoints);

  const createSVGPath = (points: number[]) => {
    const width = 240;
    const height = 50;
    
    return points
      .map((point, index) => {
        const x = (index / (points.length - 1)) * width;
        const y = height - ((point - minValue) / (maxValue - minValue)) * height;
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(tradeUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Handle flip animation
  useEffect(() => {
    if (isOpen) {
      // Reset state when opening
      setIsFlipped(false);
      setCopySuccess(false);
      
      // Start flip animation after brief delay
      const timer = setTimeout(() => {
        setIsFlipped(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Full screen backdrop - more padding on desktop to make card appear smaller */}
      <div className="flex items-center justify-center min-h-screen p-4 sm:p-6 md:p-12 lg:p-16 xl:p-20">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal Container - Much smaller on desktop */}
        <div className="relative z-10 w-full max-w-xs mx-auto md:max-w-xs lg:max-w-xs xl:max-w-xs">
          {/* 3D Flip Animation Container */}
          <div style={{ perspective: '1000px' }}>
            <div
              ref={cardRef}
              className="relative w-full aspect-[9/16] transition-transform duration-700 ease-out"
              style={{ 
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(0deg)' : 'rotateY(180deg)',
                maxHeight: 'calc(100vh - 4rem)',
                maxWidth: '300px' // Much smaller max width for desktop
              }}
            >
              {/* Back of card (loading state) */}
              <div 
                className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-3xl shadow-2xl flex items-center justify-center"
                style={{ 
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)'
                }}
              >
                <div className="text-center text-white px-6">
                  <div className="w-16 h-16 mx-auto mb-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <Share2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Creating Share Card...</h3>
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              </div>

              {/* Front of card (shareable card) - 9:16 optimized */}
              <div 
                className="absolute inset-0 bg-white rounded-3xl shadow-2xl overflow-hidden"
                style={{ backfaceVisibility: 'hidden' }}
              >
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 z-10 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors shadow-sm"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>

                <div className="h-full flex flex-col p-4 sm:p-5 md:p-6">
                  {/* Header with Logo - Responsive sizing */}
                  <div className="flex items-center space-x-2 mb-4 sm:mb-5">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div>
                      <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        TOPTRADER
                      </span>
                      <p className="text-xs text-gray-500 -mt-0.5">Social Trading</p>
                    </div>
                  </div>

                  {/* User Info - Responsive sizing */}
                  <div className="mb-4 sm:mb-5">
                    <p className="text-sm sm:text-base text-gray-600 mb-2">@{trade.user.username}</p>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        trade.tradeType === 'BUY' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        🔹 {trade.tradeType}
                      </span>
                      <span className="text-xl sm:text-2xl font-bold text-gray-900">{trade.symbol}</span>
                    </div>
                    <p className="text-gray-600 text-xs sm:text-sm">{trade.companyName}</p>
                  </div>

                  {/* Performance Display - Responsive sizing */}
                  {trade.percentage && (
                    <div className="mb-4 sm:mb-5 text-center bg-gray-50 rounded-xl p-3 sm:p-4 flex-shrink-0">
                      <div className={`text-3xl sm:text-4xl font-bold mb-1 ${
                        trade.percentage > 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {trade.percentage > 0 ? '+' : ''}{trade.percentage.toFixed(1)}%
                      </div>
                      <p className="text-gray-600 font-medium text-sm">Today's Performance</p>
                      <div className="text-lg sm:text-xl mt-1">
                        {trade.percentage > 0 ? '🚀' : '📉'}
                      </div>
                    </div>
                  )}

                  {/* Mock Chart - Responsive sizing */}
                  <div className="mb-4 sm:mb-5 flex-1 flex items-center justify-center min-h-0">
                    <div className="w-full h-10 sm:h-12 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-2 border border-gray-100">
                      <svg width="100%" height="100%" viewBox="0 0 240 50" className="overflow-visible">
                        <defs>
                          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={trade.percentage && trade.percentage > 0 ? "#48bb78" : "#f56565"} stopOpacity="0.3" />
                            <stop offset="100%" stopColor={trade.percentage && trade.percentage > 0 ? "#48bb78" : "#f56565"} stopOpacity="0.1" />
                          </linearGradient>
                        </defs>
                        
                        {/* Chart area fill */}
                        <path
                          d={`${createSVGPath(chartPoints)} L 240 50 L 0 50 Z`}
                          fill="url(#chartGradient)"
                        />
                        
                        {/* Chart line */}
                        <path
                          d={createSVGPath(chartPoints)}
                          stroke={trade.percentage && trade.percentage > 0 ? "#48bb78" : "#f56565"}
                          strokeWidth="2"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        
                        {/* End point highlight */}
                        {chartPoints.map((point, index) => {
                          if (index !== chartPoints.length - 1) return null;
                          const x = (index / (chartPoints.length - 1)) * 240;
                          const y = 50 - ((point - minValue) / (maxValue - minValue)) * 50;
                          return (
                            <circle
                              key={index}
                              cx={x}
                              cy={y}
                              r="2.5"
                              fill={trade.percentage && trade.percentage > 0 ? "#48bb78" : "#f56565"}
                              className="animate-pulse"
                            />
                          );
                        })}
                      </svg>
                    </div>
                  </div>

                  {/* Call to Action - Responsive sizing */}
                  <div className="space-y-2 flex-shrink-0">
                    <button
                      onClick={handleCopyLink}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 sm:py-3.5 px-4 rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2"
                    >
                      {copySuccess ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span className="text-sm sm:text-base">Link Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span className="text-sm sm:text-base">toptrader.gg</span>
                        </>
                      )}
                    </button>

                    <p className="text-center text-xs text-gray-500 px-2">
                      Share • Compete • Learn from the best traders
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main export component
interface ViralShareButtonProps {
  trade: {
    id: string;
    user: {
      username: string;
      displayName?: string;
    };
    symbol: string;
    companyName?: string;
    tradeType: 'BUY' | 'SELL';
    percentage?: number;
    timeAgo: string;
  };
  className?: string;
  variant?: 'default' | 'minimal';
}

const ViralShareButton: React.FC<ViralShareButtonProps> = ({ 
  trade, 
  className = '',
  variant = 'default'
}) => {
  const [showCard, setShowCard] = useState(false);

  // Minimal variant for trade cards
  if (variant === 'minimal') {
    return (
      <>
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click when clicking share
            setShowCard(true);
          }}
          className={`flex items-center space-x-1 text-gray-500 hover:text-purple-600 transition-colors ${className}`}
          title="Share trade"
        >
          <Share2 className="w-4 h-4" />
          <span className="text-sm">Share</span>
        </button>

        <ViralTradeCard
          trade={trade}
          isOpen={showCard}
          onClose={() => setShowCard(false)}
        />
      </>
    );
  }

  // Default variant for trade detail pages
  return (
    <>
      <button
        onClick={() => setShowCard(true)}
        className={`flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium ${className}`}
      >
        <Share2 className="w-4 h-4" />
        <span>Share Trade</span>
      </button>

      <ViralTradeCard
        trade={trade}
        isOpen={showCard}
        onClose={() => setShowCard(false)}
      />
    </>
  );
};

export default ViralShareButton;