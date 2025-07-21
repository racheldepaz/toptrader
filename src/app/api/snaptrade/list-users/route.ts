// src/app/api/snaptrade/list-users/route.ts
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

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching all SnapTrade users...');

    // Note: SnapTrade doesn't have a "list all users" endpoint
    // So we'll get users from our database and check their status
    const { data: dbUsers, error: dbError } = await supabase
      .from('users')
      .select('id, snaptrade_user_id, snaptrade_user_secret, snaptrade_created_at')
      .not('snaptrade_user_id', 'is', null);

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    const userStatuses = [];

    for (const dbUser of dbUsers || []) {
      const userStatus = {
        appUserId: dbUser.id,
        snapTradeUserId: dbUser.snaptrade_user_id,
        createdAt: dbUser.snaptrade_created_at,
        snapTradeStatus: 'unknown',
        error: null as string | null
      };

      // Try to verify if the user still exists in SnapTrade by attempting to list their accounts
      if (dbUser.snaptrade_user_id && dbUser.snaptrade_user_secret) {
        try {
          await snaptrade.accountInformation.listUserAccounts({
            userId: dbUser.snaptrade_user_id,
            userSecret: dbUser.snaptrade_user_secret
          });
          userStatus.snapTradeStatus = 'active';
        } catch (error) {
          userStatus.snapTradeStatus = 'error';
          userStatus.error = error instanceof Error ? error.message : 'Unknown error';
        }
      }

      userStatuses.push(userStatus);
    }

    return NextResponse.json({
      totalUsersInDatabase: userStatuses.length,
      users: userStatuses,
      summary: {
        active: userStatuses.filter(u => u.snapTradeStatus === 'active').length,
        errors: userStatuses.filter(u => u.snapTradeStatus === 'error').length,
        unknown: userStatuses.filter(u => u.snapTradeStatus === 'unknown').length
      }
    });

  } catch (error) {
    console.error('List Users Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}