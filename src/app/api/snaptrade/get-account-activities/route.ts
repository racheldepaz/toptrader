// src/app/api/snaptrade/get-account-activities/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Snaptrade } from 'snaptrade-typescript-sdk';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize SnapTrade client
const snaptrade = new Snaptrade({
  clientId: process.env.SNAPTRADE_CLIENT_ID!,
  consumerKey: process.env.SNAPTRADE_CONSUMER_KEY!,
});

// Core trading activities for MVP
const CORE_TRADE_TYPES = ['BUY', 'SELL'];

// Helper function to safely extract symbol information
const extractSymbolInfo = (activity: any) => {
  const symbol = activity.symbol;
  if (!symbol) return { ticker: null, companyName: null };
  
  return {
    ticker: symbol.raw_symbol || symbol.symbol || null,
    companyName: symbol.description || null
  };
};

// Helper function to safely extract currency code
const extractCurrencyCode = (activity: any) => {
  return activity.currency?.code || 'USD';
};

export async function POST(request: NextRequest) {
  try {
    const { 
      userId, 
      userSecret, 
      accountId,
      appUserId,  // Our database user ID
      fullSync = false  // Whether to sync all historical data
    } = await request.json();
    
    if (!userId || !userSecret || !accountId || !appUserId) {
      return NextResponse.json(
        { error: 'userId, userSecret, accountId, and appUserId are required' },
        { status: 400 }
      );
    }

    console.log('🔄 Fetching SnapTrade account activities:', {
      snapTradeUserId: userId,
      accountId,
      appUserId,
      fullSync
    });

    // Get user's default privacy settings
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('show_amounts, show_quantity, visibility')
      .eq('id', appUserId)
      .single();

    if (userError || !user) {
      console.error('Failed to get user privacy settings:', userError);
      return NextResponse.json(
        { error: 'Failed to get user settings' },
        { status: 500 }
      );
    }

    const defaultPrivacySettings = {
      show_amounts: user.show_amounts ?? false,
      show_quantity: user.show_quantity ?? false,
      visibility: user.visibility ?? 'public'
    };

    let allActivities: any[] = [];
    const syncBatchId = uuidv4();

    // Fetch activities - single call for historical sync
    try {
      console.log(`📥 Fetching account activities (fullSync: ${fullSync})`);
      
      // CORRECTED: Use the proper SnapTrade SDK method
      const response = await snaptrade.accountInformation.getAccountActivities({
        userId: userId,
        userSecret: userSecret,
        accountId: accountId,
        // Optional: Add activity type filter if supported
        // type: CORE_TRADE_TYPES.join(',')
      });

      allActivities = response.data?.data || [];
      console.log(`📊 Received ${allActivities.length} total activities`);
      console.log(`📋 Pagination info:`, response.data?.pagination);

    } catch (snapError) {
      console.error('Error fetching activities:', snapError);
      return NextResponse.json(
        { 
          success: false,
          error: `Failed to fetch activities from SnapTrade: ${snapError}` 
        },
        { status: 500 }
      );
    }

    console.log(`📈 Total activities fetched: ${allActivities.length}`);

    // Process and store activities
    let newActivitiesCount = 0;
    let newTradesCount = 0;
    let skippedCount = 0;

    for (const activity of allActivities) {
      try {
        // Extract symbol information safely
        const { ticker, companyName } = extractSymbolInfo(activity);
        const currencyCode = extractCurrencyCode(activity);

        // Store full activity data in snaptrade_activities table
        const activityData = {
          user_id: appUserId,
          snaptrade_activity_id: activity.id,
          snaptrade_account_id: accountId,
          raw_activity_data: activity, // Store full SnapTrade response as JSONB
          activity_type: activity.type,
          symbol_ticker: ticker,
          company_name: companyName,
          price: activity.price || 0,
          units: activity.units || 0,
          amount: activity.amount || 0,
          currency_code: currencyCode,
          fee: activity.fee || 0,
          trade_date: activity.trade_date,
          settlement_date: activity.settlement_date,
          institution: activity.institution,
          external_reference_id: activity.external_reference_id,
          sync_batch_id: syncBatchId,
          created_at: new Date().toISOString(),
          last_synced_at: new Date().toISOString()
        };

        // Upsert the activity (update if exists, insert if new)
        const { data: upsertResult, error: upsertError } = await supabase
          .from('snaptrade_activities')
          .upsert(activityData, {
            onConflict: 'snaptrade_account_id,snaptrade_activity_id',
            ignoreDuplicates: false
          })
          .select('id')
          .single();

        if (upsertError) {
          console.error('Error upserting activity:', upsertError);
          skippedCount++;
          continue;
        }

        newActivitiesCount++;

        // Create simplified trade record for social features (BUY/SELL only)
        if (ticker && CORE_TRADE_TYPES.includes(activity.type)) {
          try {
            // Check if we already created a trade for this activity
            const { data: existingTrade } = await supabase
              .from('trades')
              .select('id')
              .eq('snaptrade_activity_id', upsertResult.id)
              .single();

            if (!existingTrade) {
              // Calculate profit/loss percentage (simplified for MVP)
              let profitLossPercentage = null;
              if (activity.type === 'SELL' && activity.amount && activity.amount > 0) {
                // Placeholder - would need cost basis for accurate calculation
                profitLossPercentage = 0;
              }

              const tradeData = {
                user_id: appUserId,
                symbol: ticker,
                company_name: companyName,
                asset_type: 'stock', // Simplified for MVP
                trade_type: activity.type,
                quantity: Math.abs(activity.units || 0),
                price: activity.price || 0,
                total_value: Math.abs(activity.amount || 0),
                profit_loss: activity.type === 'SELL' ? (activity.amount || 0) : null,
                profit_loss_percentage: profitLossPercentage,
                executed_at: activity.trade_date,
                description: `${activity.type} ${ticker}`,
                
                // Apply user's default privacy settings
                show_amounts: defaultPrivacySettings.show_amounts,
                show_quantity: defaultPrivacySettings.show_quantity,
                visibility: defaultPrivacySettings.visibility,
                is_public: defaultPrivacySettings.visibility === 'public',
                
                // SnapTrade specific fields
                data_source: 'snaptrade',
                snaptrade_activity_id: upsertResult.id,
                
                // Timestamps
                created_at: activity.trade_date,
                updated_at: new Date().toISOString()
              };

              const { error: tradeError } = await supabase
                .from('trades')
                .insert(tradeData);

              if (tradeError) {
                console.error('Error creating trade:', tradeError);
              } else {
                newTradesCount++;
              }
            }
          } catch (tradeCreationError) {
            console.error('Error in trade creation logic:', tradeCreationError);
          }
        } else {
          // Count non-trade activities as skipped for trade creation
          if (!CORE_TRADE_TYPES.includes(activity.type)) {
            console.log(`Skipping non-trade activity: ${activity.type}`);
          }
        }

      } catch (activityError) {
        console.error('Error processing activity:', activityError, activity);
        skippedCount++;
      }
    }

    // Update user's last sync timestamp
    await supabase
      .from('users')
      .update({ 
        last_trade_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', appUserId);

    const result = {
      success: true,
      totalActivitiesFetched: allActivities.length,
      newActivitiesStored: newActivitiesCount,
      newTradesCreated: newTradesCount,
      skippedActivities: skippedCount,
      syncBatchId,
      accountId,
      fullSync
    };

    console.log('✅ Account activities sync completed:', result);
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('Get Account Activities Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}