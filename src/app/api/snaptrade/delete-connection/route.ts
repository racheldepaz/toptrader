// app/api/snaptrade/delete-connection/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Snaptrade } from 'snaptrade-typescript-sdk';

const snaptrade = new Snaptrade({
  clientId: process.env.SNAPTRADE_CLIENT_ID!,
  consumerKey: process.env.SNAPTRADE_CONSUMER_KEY!,
});

export async function DELETE(request: NextRequest) {
  try {
    const { userId, userSecret, authorizationId } = await request.json();
    
    if (!userId || !userSecret || !authorizationId) {
      return NextResponse.json(
        { error: 'userId, userSecret, and authorizationId are required' },
        { status: 400 }
      );
    }

    console.log('Deleting connection:', { userId, authorizationId });

    // Delete the brokerage authorization (connection)
    const response = await snaptrade.connections.removeBrokerageAuthorization({
      authorizationId: authorizationId,
      userId: userId,
      userSecret: userSecret
    });

    console.log('Delete connection response:', response);

    // Note: SnapTrade API returns 204 (no content) on successful deletion
    // The response.data might be empty
    return NextResponse.json({ 
      success: true, 
      message: 'Connection deleted successfully',
      authorizationId 
    });
  } catch (error) {
    console.error('Delete Connection Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}