// app/api/snaptrade/save-user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId, userSecret, appUserId } = await request.json();
    
    if (!userId || !userSecret) {
      return NextResponse.json(
        { error: 'userId and userSecret are required' },
        { status: 400 }
      );
    }

    // Update existing users table with SnapTrade credentials
    const { data, error } = await supabase
      .from('users')
      .update({
        snaptrade_user_id: userId,
        snaptrade_user_secret: userSecret,
        snaptrade_created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', appUserId || 'test-user-id'); // Use actual user ID in production

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Save SnapTrade User Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}