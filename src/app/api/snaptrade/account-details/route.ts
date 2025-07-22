// src/app/api/snaptrade/account-details/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Snaptrade } from 'snaptrade-typescript-sdk';
import { supabase } from '@/lib/supabase';

// Initialize SnapTrade client
const snaptrade = new Snaptrade({
  clientId: process.env.SNAPTRADE_CLIENT_ID!,
  consumerKey: process.env.SNAPTRADE_CONSUMER_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { userId, userSecret, accountId, topTraderUserId } = await request.json();
    
    if (!userId || !userSecret || !accountId) {
      return NextResponse.json(
        { error: 'userId, userSecret, and accountId are required' },
        { status: 400 }
      );
    }

    console.log('Fetching account details for:', { userId, accountId });

    // Get account details from SnapTrade
    const response = await snaptrade.accountInformation.getUserAccountDetails({
      accountId: accountId,
      userId: userId,
      userSecret: userSecret
    });

    console.log('Account Details Response:', response.data);

    // Store account details in database if topTraderUserId is provided
    if (topTraderUserId && response.data) {
      try {
        // First, get the connection ID for this account
        const connectionId = response.data.brokerage_authorization;
        
        console.log('Storing account details in database...');
        
        // Store the account details
        const { data: storeResult, error: storeError } = await supabase
          .rpc('store_snaptrade_account', {
            p_snaptrade_user_id: userId,
            p_connection_id: connectionId,
            p_account_data: response.data
          });

        if (storeError) {
          console.error('Error storing account details:', storeError);
          // Don't fail the request, just log the error
        } else {
          console.log('✅ Account details stored successfully:', storeResult);
        }

        // Also update the connection's last sync time
        const { error: syncError } = await supabase
          .from('snaptrade_connections')
          .update({ 
            last_sync_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('snaptrade_connection_id', connectionId)
          .eq('snaptrade_user_id', userId);

        if (syncError) {
          console.error('Error updating connection sync time:', syncError);
        }

      } catch (dbError) {
        console.error('Database storage error:', dbError);
        // Continue execution - don't fail the API call for DB issues
      }
    }

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Account Details Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// New GET endpoint to fetch stored account details from database
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topTraderUserId = searchParams.get('userId');
    
    if (!topTraderUserId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    console.log('Fetching stored account details for user:', topTraderUserId);

    // Get account details from database
    const { data: accounts, error } = await supabase
      .rpc('get_user_account_details', { p_user_id: topTraderUserId });

    if (error) {
      console.error('Error fetching account details from DB:', error);
      return NextResponse.json(
        { error: 'Failed to fetch account details' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      accounts: accounts || [],
      totalAccounts: accounts?.length || 0,
      totalBalance: accounts?.reduce((sum: number, acc: any) => sum + parseFloat(acc.balance_amount.toString()), 0) || 0
    });

  } catch (error) {
    console.error('GET Account Details Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}