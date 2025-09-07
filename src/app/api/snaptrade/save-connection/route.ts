import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('🔗 save-connection: === COMPLETE VERSION STARTED ===');
    
    const body = await request.json();
    console.log('🔗 save-connection: Request body:', body);
    
    const { userId, authorizationId, brokerageName, connectionType = 'read', connectionData } = body;
    
    if (!userId || !authorizationId) {
      console.error('🔗 save-connection: Missing required fields');
      return NextResponse.json(
        { error: 'userId and authorizationId are required' },
        { status: 400 }
      );
    }

    // Get user's SnapTrade credentials
    console.log('🔗 save-connection: Getting user SnapTrade credentials...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('snaptrade_user_id')
      .eq('id', userId)
      .single();

    if (userError || !userData?.snaptrade_user_id) {
      console.error('🔗 save-connection: No SnapTrade credentials found for user:', userId);
      return NextResponse.json(
        { error: 'User does not have SnapTrade credentials' },
        { status: 400 }
      );
    }

    console.log('🔗 save-connection: Found SnapTrade user ID:', userData.snaptrade_user_id);

    // If we have full connection data from SnapTrade, use it. Otherwise fetch it.
    let fullConnectionData = connectionData;
    
    if (!fullConnectionData) {
      console.log('🔗 save-connection: No connection data provided, fetching from SnapTrade...');
      
      try {
        // Fetch the full connection data from SnapTrade to get brokerage details
        const response = await fetch('/api/snaptrade/list-connections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userData.snaptrade_user_id,
            userSecret: await getUserSecret(userId) // You'll need to implement this
          })
        });

        if (response.ok) {
          const connections = await response.json();
          fullConnectionData = connections.find((conn: any) => conn.id === authorizationId);
          console.log('🔗 save-connection: Found connection data:', fullConnectionData?.name);
        }
      } catch (error) {
        console.warn('🔗 save-connection: Could not fetch full connection data:', error);
      }
    }

    // Prepare connection data with all fields populated
    const connectionRecord = {
      snaptrade_user_id: userData.snaptrade_user_id,
      snaptrade_connection_id: authorizationId,
      connection_name: brokerageName || fullConnectionData?.name || 'Unknown Connection',
      connection_type: connectionType,
      
      // Brokerage details from the SnapTrade connection data
      brokerage_id: fullConnectionData?.brokerage?.id || null,
      brokerage_slug: fullConnectionData?.brokerage?.slug || null,
      brokerage_name: fullConnectionData?.brokerage?.name || brokerageName || null,
      brokerage_display_name: fullConnectionData?.brokerage?.display_name || fullConnectionData?.brokerage?.name || null,
      brokerage_logo_url: fullConnectionData?.brokerage?.aws_s3_logo_url || null,
      brokerage_square_logo_url: fullConnectionData?.brokerage?.aws_s3_square_logo_url || null,
      
      // Status fields
      disabled: fullConnectionData?.disabled || false,
      disabled_date: fullConnectionData?.disabled_date ? new Date(fullConnectionData.disabled_date).toISOString() : null,
      is_eligible_for_payout: fullConnectionData?.is_eligible_for_payout || false,
      
      // Timestamps
      created_date: fullConnectionData?.created_date ? new Date(fullConnectionData.created_date).toISOString() : null,
      last_sync_at: new Date().toISOString()
    };

    console.log('🔗 save-connection: Prepared connection record:', {
      snaptrade_connection_id: connectionRecord.snaptrade_connection_id,
      brokerage_name: connectionRecord.brokerage_name,
      brokerage_display_name: connectionRecord.brokerage_display_name,
      has_logo: !!connectionRecord.brokerage_logo_url,
      has_square_logo: !!connectionRecord.brokerage_square_logo_url
    });

    // Try insert first, then update if it exists
    let result;
    try {
      console.log('🔗 save-connection: Attempting database insert...');
      const { data: insertData, error: insertError } = await supabase
        .from('snaptrade_connections')
        .insert(connectionRecord)
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          // Connection already exists, update it instead
          console.log('🔗 save-connection: Connection exists, updating with latest data...');
          const { data: updateData, error: updateError } = await supabase
            .from('snaptrade_connections')
            .update({
              ...connectionRecord,
              updated_at: new Date().toISOString() // Force update timestamp
            })
            .eq('snaptrade_connection_id', authorizationId)
            .select()
            .single();

          if (updateError) {
            console.error('🔗 save-connection: Update error:', updateError);
            throw updateError;
          }
          result = updateData;
          console.log('🔗 save-connection: ✅ Connection updated successfully');
        } else {
          console.error('🔗 save-connection: Insert error:', insertError);
          throw insertError;
        }
      } else {
        result = insertData;
        console.log('🔗 save-connection: ✅ Connection inserted successfully');
      }
    } catch (dbError) {
      console.error('🔗 save-connection: Database error:', dbError);
      throw dbError;
    }

    console.log('🔗 save-connection: Final result:', {
      id: result.id,
      snaptrade_connection_id: result.snaptrade_connection_id,
      brokerage_name: result.brokerage_name,
      brokerage_display_name: result.brokerage_display_name
    });

    return NextResponse.json({ 
      success: true, 
      data: result,
      message: 'Connection saved successfully with complete brokerage information'
    });

  } catch (error) {
    console.error('🔗 save-connection: ❌ CRITICAL ERROR:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : 'No stack trace'
      },
      { status: 500 }
    );
  }
}

// Helper function to get user secret (you may need to adjust this)
async function getUserSecret(userId: string): Promise<string> {
  const { data } = await supabase
    .from('users')
    .select('snaptrade_user_secret')
    .eq('id', userId)
    .single();
  
  return data?.snaptrade_user_secret || '';
}