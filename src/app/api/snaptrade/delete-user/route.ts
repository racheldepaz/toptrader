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
      const { userId, deleteFromDatabase = false, appUserId, forceDelete = false } = await request.json();
      
      let snapTradeResult = null;
      let snapTradeError = null;
  
      // Try to delete from SnapTrade if userId is provided
      if (userId && userId !== 'unknown') {
        try {
          console.log('Attempting to delete SnapTrade user:', userId);
          const response = await snaptrade.authentication.deleteSnapTradeUser({
            userId: userId
          });
          snapTradeResult = response.data;
          console.log('SnapTrade deletion successful:', snapTradeResult);
        } catch (error) {
          snapTradeError = error;
          console.error('SnapTrade deletion failed with detailed error:', {
            error: error,
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : 'No stack trace',
            userId: userId
          });
          
          // If forceDelete is true, we continue even if SnapTrade deletion fails
          if (!forceDelete) {
            return NextResponse.json(
              { 
                error: error instanceof Error ? error.message : 'SnapTrade deletion failed',
                details: {
                  userId: userId,
                  errorType: error?.constructor?.name || 'Unknown',
                  fullError: error instanceof Error ? error.toString() : String(error)
                }
              },
              { status: 500 }
            );
          }
        }
      } else {
        console.log('No valid userId provided, skipping SnapTrade deletion');
      }
  
      // Always try to clean up database if requested
      let dbResult = null;
      let dbError = null;
      
      if (deleteFromDatabase && appUserId) {
        try {
          console.log('Cleaning up database for app user:', appUserId);
          const { error: updateError } = await supabase
            .from('users')
            .update({
              snaptrade_user_id: null,
              snaptrade_user_secret: null,
              snaptrade_created_at: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', appUserId);
  
          if (updateError) {
            dbError = updateError;
            console.error('Database cleanup error:', updateError);
          } else {
            dbResult = { message: 'Database cleaned up successfully' };
            console.log('Database cleanup successful');
          }
        } catch (error) {
          dbError = error;
          console.error('Database cleanup failed:', error);
        }
      }
  
      // Prepare response based on what succeeded
      const response = {
        snapTrade: snapTradeResult ? {
          success: true,
          data: snapTradeResult
        } : {
          success: false,
          error: snapTradeError instanceof Error ? snapTradeError.message : 'SnapTrade deletion failed'
        },
        database: dbResult ? {
          success: true,
          data: dbResult
        } : {
          success: false,
          error: dbError ? (dbError instanceof Error ? dbError.message : 'Database cleanup failed') : 'Not attempted'
        },
        overall: {
          success: true, // We consider it success if either operation worked or if force delete
          message: 'Cleanup completed',
          warnings: [] as string[]
        }
      };
  
      // Add warnings for partial failures
      if (snapTradeError) {
        const errorDetails = snapTradeError instanceof Error 
          ? `${snapTradeError.message} (${snapTradeError.constructor.name})`
          : String(snapTradeError);
        response.overall.warnings.push(`SnapTrade deletion failed: ${errorDetails}`);
      }
      if (dbError) {
        response.overall.warnings.push(`Database cleanup failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
      }
  
      // Return success if at least one operation worked or if force delete
      if (snapTradeResult || dbResult || forceDelete) {
        return NextResponse.json(response);
      } else {
        return NextResponse.json(
          { 
            error: 'All cleanup operations failed',
            details: response
          },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error('SnapTrade Delete User Error:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  }
  