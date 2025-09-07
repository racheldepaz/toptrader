import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('💰 save-accounts: === FINAL VERSION STARTED ===');
    
    const body = await request.json();
    const { connectionId, accounts } = body;
    
    if (!connectionId || !accounts || !Array.isArray(accounts)) {
      return NextResponse.json(
        { error: 'connectionId and accounts array are required' },
        { status: 400 }
      );
    }

    console.log('💰 save-accounts: Processing', accounts.length, 'accounts');

    // Get the connection info
    const { data: connection, error: connectionError } = await supabase
      .from('snaptrade_connections')
      .select('id, snaptrade_user_id, snaptrade_connection_id')
      .eq('id', connectionId)
      .single();

    if (connectionError || !connection) {
      console.error('💰 save-accounts: Connection not found');
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    console.log('💰 save-accounts: Connection found:', connection.id);

    // Process accounts one by one to handle duplicates gracefully
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const account of accounts) {
      try {
        console.log('💰 save-accounts: Processing account:', account.id);

        const accountData = {
          snaptrade_user_id: connection.snaptrade_user_id,
          snaptrade_account_id: account.id,
          snaptrade_connection_id: connection.snaptrade_connection_id,
          brokerage_authorization_id: account.brokerage_authorization,
          account_name: account.name || null,
          account_number: account.number || null,
          institution_name: account.institution_name || null,
          account_status: account.status || account.meta?.status || null,
          raw_type: account.meta?.type || account.raw_type || null,
          balance_amount: account.balance?.total?.amount || 0,
          balance_currency: account.balance?.total?.currency || 'USD',
          holdings_initial_sync_completed: account.sync_status?.holdings?.initial_sync_completed || false,
          holdings_last_successful_sync: account.sync_status?.holdings?.last_successful_sync ? 
            new Date(account.sync_status.holdings.last_successful_sync).toISOString() : null,
          transactions_initial_sync_completed: account.sync_status?.transactions?.initial_sync_completed || false,
          transactions_last_successful_sync: account.sync_status?.transactions?.last_successful_sync || null,
          transactions_first_transaction_date: account.sync_status?.transactions?.first_transaction_date || null,
          account_data: account,
          sync_status_data: account.sync_status || null,
          balance_data: account.balance || null,
          account_created_date: account.created_date ? new Date(account.created_date).toISOString() : null,
          last_sync_at: new Date().toISOString()
        };

        // Try insert first, then update if it exists
        let result;
        try {
          // Attempt insert
          const { data: insertData, error: insertError } = await supabase
            .from('snaptrade_accounts')
            .insert(accountData)
            .select()
            .single();

          if (insertError) {
            // If it's a duplicate key error, try update instead
            if (insertError.code === '23505') {
              console.log('💰 save-accounts: Account exists, updating instead');
              const { data: updateData, error: updateError } = await supabase
                .from('snaptrade_accounts')
                .update(accountData)
                .eq('snaptrade_account_id', account.id)
                .select()
                .single();

              if (updateError) {
                throw updateError;
              }
              result = updateData;
            } else {
              throw insertError;
            }
          } else {
            result = insertData;
          }
        } catch (dbError) {
          console.error('💰 save-accounts: Database error for account:', account.id, dbError);
          errorCount++;
          results.push({
            accountId: account.id,
            success: false,
            error: dbError instanceof Error ? dbError.message : 'Unknown error'
          });
          continue;
        }

        console.log('💰 save-accounts: ✅ Account saved:', account.id);
        successCount++;
        results.push({
          accountId: account.id,
          success: true,
          data: result
        });

      } catch (error) {
        console.error('💰 save-accounts: Error processing account:', account.id, error);
        errorCount++;
        results.push({
          accountId: account.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log('💰 save-accounts: ✅ Processing complete:', {
      total: accounts.length,
      success: successCount,
      errors: errorCount
    });

    return NextResponse.json({ 
      success: true,
      message: `Processed ${accounts.length} accounts: ${successCount} saved, ${errorCount} errors`,
      results: results,
      summary: {
        total: accounts.length,
        saved: successCount,
        errors: errorCount
      }
    });

  } catch (error) {
    console.error('💰 save-accounts: ❌ CRITICAL ERROR:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : 'No stack trace'
      },
      { status: 500 }
    );
  }
}