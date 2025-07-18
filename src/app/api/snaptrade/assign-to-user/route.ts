// app/api/snaptrade/assign-to-user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { appUserId, snapTradeUserId, snapTradeUserSecret } = await request.json();
    
    if (!appUserId || !snapTradeUserId || !snapTradeUserSecret) {
      return NextResponse.json(
        { error: 'appUserId, snapTradeUserId, and snapTradeUserSecret are required' },
        { status: 400 }
      );
    }

    // Update the user with SnapTrade credentials
    const { data, error } = await supabase
      .from('users')
      .update({
        snaptrade_user_id: snapTradeUserId,
        snaptrade_user_secret: snapTradeUserSecret,
        snaptrade_created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', appUserId)
      .select('id, username, display_name, snaptrade_user_id, snaptrade_user_secret, snaptrade_created_at')
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, user: data });
  } catch (error) {
    console.error('Assign SnapTrade to User Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}