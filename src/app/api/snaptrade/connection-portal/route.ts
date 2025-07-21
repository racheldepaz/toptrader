// src/app/api/snaptrade/connection-portal/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Snaptrade } from 'snaptrade-typescript-sdk';

// Initialize SnapTrade client
const snaptrade = new Snaptrade({
  clientId: process.env.SNAPTRADE_CLIENT_ID!,
  consumerKey: process.env.SNAPTRADE_CONSUMER_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { userId, userSecret, returnToUrl } = await request.json();
    
    if (!userId || !userSecret) {
      return NextResponse.json(
        { error: 'userId and userSecret are required' },
        { status: 400 }
      );
    }

    console.log('Generating connection portal for user:', userId);

    // Generate connection portal URL
    const response = await snaptrade.authentication.loginSnapTradeUser({
      userId: userId,
      userSecret: userSecret,
      // Use customRedirect instead of redirectURI based on SDK
      customRedirect: returnToUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/test?step=4`
    });

    console.log('Connection Portal Response:', response);
    console.log('Response data:', response.data);

    // Handle the response - it might be encrypted or have different structure
    const responseData = response.data as any;
    
    // Check if response contains redirectURI directly
    if (responseData && typeof responseData === 'object') {
      // Try different possible response structures
      const redirectURI = responseData.redirectURI || 
                          responseData.redirect_uri || 
                          responseData.loginUrl ||
                          responseData.url;
                          
      const sessionId = responseData.sessionId || 
                       responseData.session_id ||
                       responseData.id;

      if (redirectURI) {
        return NextResponse.json({
          redirectURI: redirectURI,
          sessionId: sessionId || 'unknown'
        });
      }
    }

    // If response is a string (sometimes happens), it might be the URL directly
    if (typeof responseData === 'string' && responseData.includes('snaptrade.com')) {
      return NextResponse.json({
        redirectURI: responseData,
        sessionId: 'string-response'
      });
    }

    // Log full response for debugging
    console.error('Unexpected response structure:', {
      type: typeof responseData,
      data: responseData,
      keys: responseData ? Object.keys(responseData) : 'no keys'
    });

    // If we can't parse the response properly, return what we got
    return NextResponse.json({
      error: 'Unexpected response format from SnapTrade API',
      debug: {
        responseType: typeof responseData,
        responseData: responseData
      }
    }, { status: 500 });

  } catch (error) {
    console.error('Connection Portal Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}