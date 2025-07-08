'use client';

import Header from '@/components/Header';
import TradeCard from '@/components/TradeCard';
import { mockTrades } from '@/lib/mockData';


export default function Dashboard() {

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Sidebar - Takes 1 column */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Placeholder for Your Performance */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">Your Performance</h3>
                <div className="text-sm text-gray-600">Performance stats will go here</div>
              </div>
              
              {/* Placeholder for Quick Leaderboard */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">Quick Leaderboard</h3>
                <div className="text-sm text-gray-600">Leaderboard will go here</div>
              </div>
            </div>
          </div>

          {/* Main Feed - Takes 3 columns */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Gains Wall</h2>
              <div className="text-sm text-gray-600">Filter buttons will go here</div>
            </div>

            {/* Your existing TradeCards */}
            <div className="space-y-4">
              {mockTrades.map(trade => (
                <TradeCard key={trade.id} trade={trade} />
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}