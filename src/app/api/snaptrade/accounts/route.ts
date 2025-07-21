// src/app/api/snaptrade/accounts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Snaptrade } from 'snaptrade-typescript-sdk';

// Initialize SnapTrade client
const snaptrade = new Snaptrade({
  clientId: process.env.SNAPTRADE_CLIENT_ID!,
  consumerKey: process.env.SNAPTRADE_CONSUMER_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { userId, userSecret } = await request.json();
    
    if (!userId || !userSecret) {
      return NextResponse.json(
        { error: 'userId and userSecret are required' },
        { status: 400 }
      );
    }

    console.log('Fetching accounts for user:', userId);

    // List user accounts
    const response = await snaptrade.accountInformation.listUserAccounts({
      userId: userId,
      userSecret: userSecret
    });

    console.log('Accounts Response:', response);
    console.log('Number of accounts found:', response.data?.length || 0);

    // Log account IDs for saving as mentioned in the guide
    if (response.data && Array.isArray(response.data)) {
      response.data.forEach((account: any) => {
        console.log(`::SAVE[ACCOUNTS]/${account.id}`);
      });
    }

    return NextResponse.json(response.data || []);
  } catch (error) {
    console.error('List Accounts Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}