// src/app/api/snaptrade/option-positions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Snaptrade } from 'snaptrade-typescript-sdk';

// Initialize SnapTrade client
const snaptrade = new Snaptrade({
  clientId: process.env.SNAPTRADE_CLIENT_ID!,
  consumerKey: process.env.SNAPTRADE_CONSUMER_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { userId, userSecret, accountId } = await request.json();
    
    if (!userId || !userSecret || !accountId) {
      return NextResponse.json(
        { error: 'userId, userSecret, and accountId are required' },
        { status: 400 }
      );
    }

    console.log('Fetching option positions for:', { userId, accountId });

    // Get option positions (separate endpoint as mentioned in the guide)
    const response = await snaptrade.options.listOptionHoldings({
      accountId: accountId,
      userId: userId,
      userSecret: userSecret
    });

    console.log('Option Positions Response:', response);
    console.log('Number of option positions found:', response.data?.length || 0);

    return NextResponse.json(response.data || []);
  } catch (error) {
    console.error('Option Positions Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}