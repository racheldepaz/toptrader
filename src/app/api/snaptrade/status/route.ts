// src/app/api/snaptrade/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Snaptrade } from 'snaptrade-typescript-sdk';

// Initialize SnapTrade client
const snaptrade = new Snaptrade({
  clientId: process.env.SNAPTRADE_CLIENT_ID!,
  consumerKey: process.env.SNAPTRADE_CONSUMER_KEY!,
});

export async function GET(request: NextRequest) {
  try {
    console.log('Testing SnapTrade API connection...');
    
    // Test the API by calling a simple endpoint
    const response = await snaptrade.apiStatus.check();
    
    console.log('SnapTrade API Status Response:', response);

    return NextResponse.json({
      status: 'success',
      message: 'SnapTrade API connection successful',
      data: response.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('SnapTrade API Status Error:', error);
    
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}