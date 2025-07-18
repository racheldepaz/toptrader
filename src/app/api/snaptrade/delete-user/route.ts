// app/api/snaptrade/delete-user/route.ts
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
    const { userId, deleteFromDatabase = false, appUserId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Delete from SnapTrade using their official SDK - much simpler!
    const response = await snaptrade.authentication.deleteSnapTradeUser({
      userId: userId
    });

    // If successful and deleteFromDatabase is true, also clear from our database
    if (deleteFromDatabase && appUserId) {
      const { error: dbError } = await supabase
        .from('users')
        .update({
          snaptrade_user_id: null,
          snaptrade_user_secret: null,
          snaptrade_created_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', appUserId);

      if (dbError) {
        console.error('Database update error:', dbError);
        // Don't fail the request if SnapTrade deletion succeeded but DB update failed
        return NextResponse.json({
          ...response.data,
          warning: 'SnapTrade user deleted but failed to update database'
        });
      }
    }

    return NextResponse.json({
      ...response.data,
      success: true,
      message: 'User successfully deleted from SnapTrade'
    });
  } catch (error) {
    console.error('SnapTrade Delete User Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}