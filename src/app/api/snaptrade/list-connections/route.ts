import { NextRequest, NextResponse } from 'next/server';
import { Snaptrade } from 'snaptrade-typescript-sdk';

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

    console.log('Fetching connections for user:', userId);

    const response = await snaptrade.connections.listBrokerageAuthorizations({
      userId: userId,
      userSecret: userSecret
    });

    console.log('Connections Response:', response.data);

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('List Connections Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}