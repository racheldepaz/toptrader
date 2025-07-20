// src/components/ViralShareButton.tsx
'use client';

import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import ViralTradeCard from './ViralTradeCard';
import type { TradeData, ProfileStatsData } from '../types/viral-card';

// Props for trade sharing
interface TradeShareProps {
  type: 'trade';
  data: TradeData;
  className?: string;
  variant?: 'default' | 'minimal';
}

// Props for profile stats sharing
interface ProfileShareProps {
  type: 'profile';
  data: ProfileStatsData;
  className?: string;
  variant?: 'default' | 'minimal';
}

type ViralShareButtonProps = TradeShareProps | ProfileShareProps;

const ViralShareButton: React.FC<ViralShareButtonProps> = ({ 
  type,
  data,
  className = '',
  variant = 'default'
}) => {
  const [showCard, setShowCard] = useState(false);

  // Minimal variant for trade cards and profile buttons
  if (variant === 'minimal') {
    return (
      <>
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click when clicking share
            setShowCard(true);
          }}
          className={`flex items-center space-x-1 text-gray-500 hover:text-purple-600 transition-colors ${className}`}
          title={`Share ${type}`}
        >
          <Share2 className="w-4 h-4" />
          <span className="text-sm">Share</span>
        </button>

        <ViralTradeCard
          data={data}
          type={type}
          isOpen={showCard}
          onClose={() => setShowCard(false)}
        />
      </>
    );
  }

  // Default variant for detail pages
  return (
    <>
      <button
        onClick={() => setShowCard(true)}
        className={`flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium ${className}`}
      >
        <Share2 className="w-4 h-4" />
        <span>Share {type === 'trade' ? 'Trade' : 'Stats'}</span>
      </button>

      <ViralTradeCard
        data={data}
        type={type}
        isOpen={showCard}
        onClose={() => setShowCard(false)}
      />
    </>
  );
};

export default ViralShareButton;