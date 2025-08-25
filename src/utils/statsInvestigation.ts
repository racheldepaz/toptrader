// utils/statsInvestigation.ts
import { supabase } from '@/lib/supabase';

/**
 * Investigation tool to compare different stats sources and identify discrepancies
 */
export async function investigateStatsDiscrepancy(userId: string) {
  const results = {
    userId,
    timestamp: new Date().toISOString(),
    sources: {} as any,
    discrepancies: [] as string[],
    recommendations: [] as string[]
  };

  try {
    console.log('🔍 Starting stats investigation for user:', userId);

    // 1. Get stats from user_stats table (cached)
    const { data: cachedStats, error: cachedError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    results.sources.cached = {
      source: 'user_stats table',
      data: cachedStats,
      error: cachedError?.message
    };

    // 2. Get stats from get_user_performance RPC (live calculation)
    const { data: liveStats, error: liveError } = await supabase
      .rpc('get_user_performance', { target_user_id: userId });

    results.sources.live = {
      source: 'get_user_performance RPC',
      data: Array.isArray(liveStats) ? liveStats[0] : liveStats,
      error: liveError?.message
    };

    // 3. Get raw trade count directly from trades table
    const { count: rawTradeCount, error: tradeCountError } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    results.sources.rawTrades = {
      source: 'trades table direct count',
      data: { total_trades: rawTradeCount },
      error: tradeCountError?.message
    };

    // 4. Calculate win rate directly from trades
    const { data: tradesForWinRate, error: winRateError } = await supabase
      .from('trades')
      .select('profit_loss_percentage')
      .eq('user_id', userId)
      .not('profit_loss_percentage', 'is', null);

    if (!winRateError && tradesForWinRate) {
      const totalTrades = tradesForWinRate.length;
      const winningTrades = tradesForWinRate.filter(t => t.profit_loss_percentage > 0).length;
      const calculatedWinRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

      results.sources.calculatedWinRate = {
        source: 'direct trades calculation',
        data: {
          total_trades: totalTrades,
          winning_trades: winningTrades,
          win_rate: calculatedWinRate
        }
      };
    }

    // 5. Compare results and identify discrepancies
    const cached = results.sources.cached?.data;
    const live = results.sources.live?.data;
    const calculated = results.sources.calculatedWinRate?.data;

    if (cached && live) {
      // Compare key metrics
      const tolerance = 0.1; // Allow small differences due to rounding

      if (Math.abs((cached.all_time_trades || 0) - (live.total_trades || 0)) > tolerance) {
        results.discrepancies.push(
          `Trade count mismatch: Cached=${cached.all_time_trades}, Live=${live.total_trades}`
        );
      }

      if (Math.abs((cached.all_time_win_rate || 0) - (live.win_rate || 0)) > tolerance) {
        results.discrepancies.push(
          `Win rate mismatch: Cached=${cached.all_time_win_rate}%, Live=${live.win_rate}%`
        );
      }

      if (Math.abs((cached.all_time_average_gain || 0) - (live.avg_return || 0)) > tolerance) {
        results.discrepancies.push(
          `Average return mismatch: Cached=${cached.all_time_average_gain}%, Live=${live.avg_return}%`
        );
      }
    }

    // 6. Generate recommendations
    if (results.discrepancies.length > 0) {
      results.recommendations.push('Run refresh_all_user_stats to sync cached data');
      results.recommendations.push('Check if stats triggers are working properly');
      results.recommendations.push('Consider using live calculations instead of cached stats');
    }

    if (!cached && live) {
      results.recommendations.push('User has no cached stats - run stats initialization');
    }

    if (!live && !cached) {
      results.recommendations.push('User has no trading data - encourage first trade');
    }

    console.log('📊 Stats Investigation Results:', results);
    return results;

  } catch (error) {
    console.error('❌ Error during stats investigation:', error);
    results.sources.error = error;
    return results;
  }
}

/**
 * Fix stats discrepancies by refreshing all user stats
 */
export async function fixStatsDiscrepancy(userId: string) {
  try {
    console.log('🔧 Fixing stats discrepancy for user:', userId);

    // 1. Refresh all user stats using the PostgreSQL function
    const { error: refreshError } = await supabase
      .rpc('refresh_all_user_stats', { p_user_id: userId });

    if (refreshError) {
      console.error('❌ Error refreshing stats:', refreshError);
      return { success: false, error: refreshError.message };
    }

    // 2. Wait a moment for the refresh to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 3. Verify the fix by re-investigating
    const verificationResults = await investigateStatsDiscrepancy(userId);

    return {
      success: true,
      verification: verificationResults,
      discrepanciesFixed: verificationResults.discrepancies.length === 0
    };

  } catch (error) {
    console.error('❌ Error fixing stats:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Component to help debug stats issues in development
 */
export function StatsDebugger({ userId }: { userId: string }) {
  const [investigation, setInvestigation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runInvestigation = async () => {
    setLoading(true);
    const results = await investigateStatsDiscrepancy(userId);
    setInvestigation(results);
    setLoading(false);
  };

  const fixStats = async () => {
    setLoading(true);
    const fixResults = await fixStatsDiscrepancy(userId);
    console.log('Fix results:', fixResults);
    
    if (fixResults.success) {
      alert('Stats refreshed! Check the investigation results again.');
      await runInvestigation();
    } else {
      alert('Error fixing stats: ' + fixResults.error);
    }
    setLoading(false);
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <h3 className="font-semibold text-yellow-800 mb-3">🐛 Stats Debug Tool</h3>
      
      <div className="flex gap-2 mb-4">
        <button
          onClick={runInvestigation}
          disabled={loading}
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Investigating...' : 'Investigate Stats'}
        </button>
        
        <button
          onClick={fixStats}
          disabled={loading}
          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Fixing...' : 'Fix Stats'}
        </button>
      </div>

      {investigation && (
        <div className="text-xs space-y-2">
          <div><strong>Sources Found:</strong> {Object.keys(investigation.sources).length}</div>
          <div><strong>Discrepancies:</strong> {investigation.discrepancies.length}</div>
          
          {investigation.discrepancies.length > 0 && (
            <div className="bg-red-50 p-2 rounded">
              <strong>Issues:</strong>
              <ul className="list-disc list-inside">
                {investigation.discrepancies.map((issue: string, idx: number) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
          
          {investigation.recommendations.length > 0 && (
            <div className="bg-green-50 p-2 rounded">
              <strong>Recommendations:</strong>
              <ul className="list-disc list-inside">
                {investigation.recommendations.map((rec: string, idx: number) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}