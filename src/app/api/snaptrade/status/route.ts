// app/api/snaptrade/status/route.ts
import { NextResponse } from 'next/server';
import { makeSnapTradeRequest } from '../utils';

export async function GET() {
  try {
    const data = await makeSnapTradeRequest('GET', '/api/v1/apiStatus');
    return NextResponse.json(data);
  } catch (error) {
    console.error('SnapTrade API Status Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}