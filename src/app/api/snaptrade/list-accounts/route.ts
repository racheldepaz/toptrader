// app/api/snaptrade/list-accounts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { makeSnapTradeRequest } from '../utils';

export async function POST(request: NextRequest) {
  try {
    const { userId, userSecret } = await request.json();
    
    if (!userId || !userSecret) {
      return NextResponse.json(
        { error: 'userId and userSecret are required' },
        { status: 400 }
      );
    }

    const data = await makeSnapTradeRequest(
      'GET',
      '/api/v1/accounts',
      { userId, userSecret }
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error('SnapTrade List Accounts Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}