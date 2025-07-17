// app/api/snaptrade/register-user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { makeSnapTradeRequest } from '../utils';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const data = await makeSnapTradeRequest(
      'POST',
      '/api/v1/snapTrade/registerUser',
      {},
      { userId }
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error('SnapTrade Register User Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}