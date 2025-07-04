import { Trade } from '@/lib/types';

interface TradeCardProps {
    trade: Trade;
}

export default function TradeCard({trade }: TradeCardProps) {
    return (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-start space-x-4">
        {/* User Avatar */}
        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
          {trade.user.avatar}
        </div>
        
        <div className="flex-1">
          {/* User info and timestamp */}
          <div className="flex items-center space-x-2 mb-2">
            <span className="font-bold text-gray-900">{trade.user.username}</span>
            <span className="text-gray-500 text-sm">{trade.timeAgo}</span>
          </div>
          
          {/* Trade details card */}
          <div className="bg-gray-50 rounded-lg p-4 mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <span className="text-2xl font-bold">{trade.symbol}</span>
                <span className={`px-2 py-1 rounded text-xs font-medium text-white ${
                  trade.tradeType === 'SELL' ? 'bg-red-500' : 'bg-green-500'
                }`}>
                  {trade.tradeType}
                </span>
              </div>
              
              {/* Show percentage if it exists (for sells) */}
              {trade.percentage && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-500">
                    +{trade.percentage}%
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-gray-600 text-sm">
              {trade.companyName} • {trade.description}
            </div>
          </div>
          
          {/* Interaction buttons */}
          <div className="flex items-center space-x-6 text-gray-500">
            <button className="flex items-center space-x-2 hover:text-red-500">
              <span>❤️</span>
              <span className="text-sm">{trade.likes}</span>
            </button>
            <button className="flex items-center space-x-2 hover:text-blue-500">
              <span>💬</span>
              <span className="text-sm">{trade.comments}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    );
}