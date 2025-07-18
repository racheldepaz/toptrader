// app/api/snaptrade/save-connection/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId, authorizationId, brokerageName, connectionType = 'read' } = await request.json();
    
    if (!userId || !authorizationId) {
      return NextResponse.json(
        { error: 'userId and authorizationId are required' },
        { status: 400 }
      );
    }

    // Save connection to snaptrade_connections table
    const { data, error } = await supabase
      .from('snaptrade_connections')
      .insert({
        user_id: userId,
        authorization_id: authorizationId,
        brokerage_name: brokerageName,
        connection_type: connectionType,
        status: 'active',
      });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Save SnapTrade Connection Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}