// src/app/api/snaptrade/register-user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Snaptrade } from 'snaptrade-typescript-sdk';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize SnapTrade client
const snaptrade = new Snaptrade({
  clientId: process.env.SNAPTRADE_CLIENT_ID!,
  consumerKey: process.env.SNAPTRADE_CONSUMER_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { userId, appUserId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    console.log('Registering SnapTrade user with details:', {
      userId,
      appUserId,
      clientId: process.env.SNAPTRADE_CLIENT_ID,
      hasConsumerKey: !!process.env.SNAPTRADE_CONSUMER_KEY
    });

    // Register user with SnapTrade
    try {
      const response = await snaptrade.authentication.registerSnapTradeUser({
        userId: userId
      });

      console.log('SnapTrade Registration Response:', response);

      if (response.data && response.data.userSecret) {
        const userData = {
          userId: response.data.userId || userId,
          userSecret: response.data.userSecret
        };

        // Store in database if appUserId provided
        if (appUserId) {
          const { error: dbError } = await supabase
            .from('users')
            .update({
              snaptrade_user_id: userData.userId,
              snaptrade_user_secret: userData.userSecret,
              snaptrade_created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', appUserId);

          if (dbError) {
            console.error('Database update error:', dbError);
            // Don't fail the request if SnapTrade registration succeeded
            return NextResponse.json({
              ...userData,
              warning: 'SnapTrade user created but failed to update database',
              dbError: dbError.message
            });
          }
        }

        return NextResponse.json(userData);
      } else {
        console.error('Invalid response structure from SnapTrade:', response);
        throw new Error('Invalid response from SnapTrade API - missing userSecret');
      }
    } catch (snapTradeError) {
      console.error('SnapTrade Registration Error Details:', {
        error: snapTradeError,
        message: snapTradeError instanceof Error ? snapTradeError.message : 'Unknown error',
        stack: snapTradeError instanceof Error ? snapTradeError.stack : 'No stack trace',
        userId: userId,
        errorType: snapTradeError?.constructor?.name || 'Unknown'
      });

      // Check if it's a specific type of error
      let errorMessage = 'SnapTrade registration failed';
      let statusCode = 500;

      if (snapTradeError instanceof Error) {
        errorMessage = snapTradeError.message;
        
        // Check for specific error patterns
        if (snapTradeError.message.includes('400')) {
          statusCode = 400;
          if (snapTradeError.message.includes('already exists') || 
              snapTradeError.message.includes('duplicate')) {
            errorMessage = `User ${userId} already exists in SnapTrade. Try using a different user ID or delete the existing user first.`;
          } else {
            errorMessage = `Bad request to SnapTrade API: ${snapTradeError.message}`;
          }
        } else if (snapTradeError.message.includes('401')) {
          statusCode = 401;
          errorMessage = 'Invalid SnapTrade API credentials. Check your clientId and consumerKey.';
        } else if (snapTradeError.message.includes('403')) {
          statusCode = 403;
          errorMessage = 'SnapTrade API access forbidden. Check your API permissions.';
        }
      }

      return NextResponse.json(
        { 
          error: errorMessage,
          details: {
            userId: userId,
            originalError: snapTradeError instanceof Error ? snapTradeError.message : String(snapTradeError),
            errorType: snapTradeError?.constructor?.name || 'Unknown',
            suggestions: [
              'Check if this user ID already exists',
              'Verify your SnapTrade API credentials',
              'Try using a different, unique user ID'
            ]
          }
        },
        { status: statusCode }
      );
    }
  } catch (error) {
    console.error('General Registration Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}