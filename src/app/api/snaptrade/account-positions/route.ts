// src/app/api/snaptrade/account-positions/route.ts
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

    console.log('Fetching account positions for:', { userId, accountId });

    // Get account positions (stock/ETF/crypto/mutual fund positions)
    const response = await snaptrade.accountInformation.getUserAccountPositions({
      accountId: accountId,
      userId: userId,
      userSecret: userSecret
    });

    console.log('Account Positions Response:', response);
    console.log('Number of positions found:', response.data?.length || 0);

    return NextResponse.json(response.data || []);
  } catch (error) {
    console.error('Account Positions Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}