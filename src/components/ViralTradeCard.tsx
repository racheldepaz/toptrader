import React, { useState, useRef } from 'react';
import { Share2, Copy, Check, X, Download } from 'lucide-react';

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
  const [isFlipping, setIsFlipping] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const tradeUrl = `https://toptrader.gg/trade/${trade.id}`;

  // Mock chart data for demonstration
  const generateMockChart = () => {
    const points = [];
    let value = 100;
    for (let i = 0; i < 20; i++) {
      value += Math.random() * 10 - 3; // Random walk
      points.push(value);
    }
    return points;
  };

  const chartPoints = generateMockChart();
  const maxValue = Math.max(...chartPoints);
  const minValue = Math.min(...chartPoints);

  const createSVGPath = (points: number[]) => {
    const width = 280;
    const height = 80;
    
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

  const handleDownloadCard = async () => {
    if (!cardRef.current) return;

    try {
      // Create a canvas to render the card
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 400;
      canvas.height = 600;

      // Fill background with gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, 600);
      gradient.addColorStop(0, '#f8fafc');
      gradient.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 400, 600);

      // Add border
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, 380, 580);

      // Add text content
      ctx.fillStyle = '#1a202c';
      ctx.font = 'bold 24px Arial';
      ctx.fillText('TOPTRADER', 40, 80);

      ctx.font = '18px Arial';
      ctx.fillStyle = '#4a5568';
      ctx.fillText(`@${trade.user.username}`, 40, 140);

      ctx.font = 'bold 32px Arial';
      ctx.fillStyle = '#1a202c';
      ctx.fillText(`${trade.tradeType} ${trade.symbol}`, 40, 190);

      ctx.font = '16px Arial';
      ctx.fillStyle = '#718096';
      ctx.fillText(trade.companyName || '', 40, 220);

      // Add percentage
      if (trade.percentage) {
        ctx.font = 'bold 28px Arial';
        ctx.fillStyle = trade.percentage > 0 ? '#48bb78' : '#f56565';
        ctx.fillText(
          `${trade.percentage > 0 ? '+' : ''}${trade.percentage.toFixed(2)}% Today 🚀`,
          40,
          280
        );
      }

      // Add bottom link
      ctx.font = '14px Arial';
      ctx.fillStyle = '#4299e1';
      ctx.fillText('toptrader.gg', 40, 550);

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trade-${trade.symbol}-${trade.user.username}.png`;
        a.click();
        URL.revokeObjectURL(url);
      });
    } catch (err) {
      console.error('Failed to generate image:', err);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      setIsFlipping(true);
      setTimeout(() => setIsFlipping(false), 600);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal Container */}
        <div className="inline-block align-bottom text-left overflow-hidden transform transition-all sm:my-8 sm:align-middle">
          {/* 3D Flip Animation Container */}
          <div className="perspective-1000">
            <div
              ref={cardRef}
              className={`relative w-96 h-[600px] transform-style-preserve-3d transition-transform duration-600 ${
                isFlipping ? 'rotate-y-180' : ''
              }`}
            >
              {/* Back of card (initial state) */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl shadow-2xl flex items-center justify-center">
                <div className="text-center text-white">
                  <Share2 className="w-16 h-16 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold">Creating Share Card...</h3>
                </div>
              </div>

              {/* Front of card (final state) */}
              <div className="absolute inset-0 backface-hidden bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 z-10 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>

                <div className="p-8 h-full flex flex-col">
                  {/* Header with Logo */}
                  <div className="flex items-center space-x-3 mb-8">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">TT</span>
                    </div>
                    <span className="text-xl font-bold text-gray-900">TOPTRADER</span>
                  </div>

                  {/* User */}
                  <div className="mb-6">
                    <p className="text-lg text-gray-600 mb-2">@{trade.user.username}</p>
                    <div className="flex items-center space-x-3">
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                        🔹 {trade.tradeType}
                      </span>
                      <span className="text-2xl font-bold text-gray-900">{trade.symbol}</span>
                    </div>
                    <p className="text-gray-600 mt-1">{trade.companyName}</p>
                  </div>

                  {/* Performance */}
                  {trade.percentage && (
                    <div className="mb-8">
                      <div className={`text-3xl font-bold ${
                        trade.percentage > 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        📈 {trade.percentage > 0 ? '+' : ''}{trade.percentage.toFixed(2)}% Today 🚀
                      </div>
                    </div>
                  )}

                  {/* Mock Chart */}
                  <div className="mb-8 flex-1 flex items-center justify-center">
                    <div className="w-full h-24 bg-gray-50 rounded-lg p-4">
                      <svg width="100%" height="100%" viewBox="0 0 280 80" className="overflow-visible">
                        <defs>
                          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#48bb78" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#48bb78" stopOpacity="0.05" />
                          </linearGradient>
                        </defs>
                        
                        {/* Chart area */}
                        <path
                          d={`${createSVGPath(chartPoints)} L 280 80 L 0 80 Z`}
                          fill="url(#chartGradient)"
                        />
                        
                        {/* Chart line */}
                        <path
                          d={createSVGPath(chartPoints)}
                          stroke="#48bb78"
                          strokeWidth="2"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        
                        {/* Data points */}
                        {chartPoints.map((point, index) => {
                          const x = (index / (chartPoints.length - 1)) * 280;
                          const y = 80 - ((point - minValue) / (maxValue - minValue)) * 80;
                          return (
                            <circle
                              key={index}
                              cx={x}
                              cy={y}
                              r="2"
                              fill="#48bb78"
                              className={index === chartPoints.length - 1 ? 'animate-pulse' : ''}
                            />
                          );
                        })}
                      </svg>
                    </div>
                  </div>

                  {/* Share Links */}
                  <div className="space-y-3">
                    <button
                      onClick={handleCopyLink}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                      {copySuccess ? (
                        <>
                          <Check className="w-5 h-5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-5 h-5" />
                          <span>toptrader.gg</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleDownloadCard}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                      <Download className="w-5 h-5" />
                      <span>Download Card</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        .transition-transform {
          transition: transform 0.6s;
        }
        .duration-600 {
          transition-duration: 0.6s;
        }
      `}</style>
    </div>
  );
};

// Main component that integrates with your trade page
const ViralShareButton: React.FC<{
  trade: any;
  className?: string;
}> = ({ trade, className = '' }) => {
  const [showCard, setShowCard] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowCard(true)}
        className={`flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ${className}`}
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