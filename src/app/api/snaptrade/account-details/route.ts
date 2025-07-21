// src/app/api/snaptrade/account-details/route.ts
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

    console.log('Fetching account details for:', { userId, accountId });

    // Get account details
    const response = await snaptrade.accountInformation.getUserAccountDetails({
      accountId: accountId,
      userId: userId,
      userSecret: userSecret
    });

    console.log('Account Details Response:', response);

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Account Details Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}