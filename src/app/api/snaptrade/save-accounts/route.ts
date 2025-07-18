// app/api/snaptrade/save-accounts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { connectionId, accounts } = await request.json();
    
    if (!connectionId || !accounts || !Array.isArray(accounts)) {
      return NextResponse.json(
        { error: 'connectionId and accounts array are required' },
        { status: 400 }
      );
    }

    // Get the connection to find user_id
    const { data: connection, error: connectionError } = await supabase
      .from('snaptrade_connections')
      .select('user_id')
      .eq('id', connectionId)
      .single();

    if (connectionError || !connection) {
      throw new Error('Connection not found');
    }

    // Save accounts to snaptrade_accounts table
    const accountsToInsert = accounts.map(account => ({
      user_id: connection.user_id,
      connection_id: connectionId,
      account_id: account.id,
      account_number: account.number,
      account_name: account.name,
      brokerage_name: account.brokerage,
      account_type: account.type,
      balance_total: account.balance?.total || 0,
      balance_currency: account.balance?.currency || 'USD',
    }));

    const { data, error } = await supabase
      .from('snaptrade_accounts')
      .upsert(accountsToInsert, {
        onConflict: 'connection_id,account_id'
      });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Save SnapTrade Accounts Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}