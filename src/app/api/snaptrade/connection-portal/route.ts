// app/api/snaptrade/connection-portal/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { makeSnapTradeRequest } from '../utils';

export async function POST(request: NextRequest) {
  try {
    const { userId, userSecret, broker, customRedirect, immediateRedirect } = await request.json();
    
    if (!userId || !userSecret) {
      return NextResponse.json(
        { error: 'userId and userSecret are required' },
        { status: 400 }
      );
    }

    const body: any = {
      userId,
      userSecret
    };

    // Optional parameters
    if (broker) body.broker = broker;
    if (customRedirect) body.customRedirect = customRedirect;
    if (immediateRedirect !== undefined) body.immediateRedirect = immediateRedirect;

    const data = await makeSnapTradeRequest(
      'POST',
      '/api/v1/snapTrade/login',
      {},
      body
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error('SnapTrade Connection Portal Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}