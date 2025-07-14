// src/lib/api/social.ts
import { supabase } from '../supabase'
import { TradeWithSocialStats, TradeComment } from '../types'

// LIKES FUNCTIONALITY
export const toggleTradeLike = async (tradeId: string): Promise<{ success: boolean; liked: boolean; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, liked: false, error: 'User not authenticated' }
    }

    // Check if user has already liked this trade
    const { data: existingLike, error: checkError } = await supabase
      .from('trade_likes')
      .select('id')
      .eq('trade_id', tradeId)
      .eq('user_id', user.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
      return { success: false, liked: false, error: checkError.message }
    }

    if (existingLike) {
      // Unlike: Remove the like
      const { error: deleteError } = await supabase
        .from('trade_likes')
        .delete()
        .eq('id', existingLike.id)

      if (deleteError) {
        return { success: false, liked: true, error: deleteError.message }
      }

      return { success: true, liked: false }
    } else {
      // Like: Add the like
      const { error: insertError } = await supabase
        .from('trade_likes')
        .insert({
          trade_id: tradeId,
          user_id: user.id
        })

      if (insertError) {
        return { success: false, liked: false, error: insertError.message }
      }

      return { success: true, liked: true }
    }
  } catch (_error) {
    return { success: false, liked: false, error: 'Unexpected error occurred' }
  }
}

// COMMENTS FUNCTIONALITY
export const getTradeComments = async (tradeId: string): Promise<{ success: boolean; comments: TradeComment[]; error?: string }> => {
  try {
    // Get comments first
    const { data: commentsData, error: commentsError } = await supabase
      .from('trade_comments')
      .select('id, trade_id, user_id, content, created_at, updated_at')
      .eq('trade_id', tradeId)
      .order('created_at', { ascending: true })

    if (commentsError) {
      return { success: false, comments: [], error: commentsError.message }
    }

    if (!commentsData || commentsData.length === 0) {
      return { success: true, comments: [] }
    }

    // Get unique user IDs from comments
    const userIds = [...new Set(commentsData.map(comment => comment.user_id))]
    
    // Get user data separately
    const { data: usersData } = await supabase
      .from('users')
      .select('id, username, display_name, avatar_url')
      .in('id', userIds)

    // Create user lookup map
    const userLookup = new Map()
    usersData?.forEach(user => {
      userLookup.set(user.id, user)
    })

    // Format comments with user data
    const formattedComments: TradeComment[] = commentsData.map((comment) => {
      const user = userLookup.get(comment.user_id)
      return {
        id: comment.id,
        tradeId: comment.trade_id,
        userId: comment.user_id,
        content: comment.content,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
        user: {
          username: user?.username || '',
          displayName: user?.display_name,
          avatar: user?.display_name?.charAt(0) || user?.username?.charAt(0) || 'U'
        }
      }
    })

    return { success: true, comments: formattedComments }
  } catch (_error) {
    return { success: false, comments: [], error: 'Unexpected error occurred' }
  }
}

export const addTradeComment = async (tradeId: string, content: string): Promise<{ success: boolean; comment?: TradeComment; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    if (!content.trim()) {
      return { success: false, error: 'Comment cannot be empty' }
    }

    // Insert comment first
    const { data: commentData, error: insertError } = await supabase
      .from('trade_comments')
      .insert({
        trade_id: tradeId,
        user_id: user.id,
        content: content.trim()
      })
      .select('id, trade_id, user_id, content, created_at, updated_at')
      .single()

    if (insertError) {
      return { success: false, error: insertError.message }
    }

    // Get user data separately
    const { data: userData } = await supabase
      .from('users')
      .select('username, display_name, avatar_url')
      .eq('id', user.id)
      .single()

    const formattedComment: TradeComment = {
      id: commentData.id,
      tradeId: commentData.trade_id,
      userId: commentData.user_id,
      content: commentData.content,
      createdAt: commentData.created_at,
      updatedAt: commentData.updated_at,
      user: {
        username: userData?.username || '',
        displayName: userData?.display_name,
        avatar: userData?.display_name?.charAt(0) || userData?.username?.charAt(0) || 'U'
      }
    }

    return { success: true, comment: formattedComment }
  } catch (_error) {
    return { success: false, error: 'Unexpected error occurred' }
  }
}

export const deleteTradeComment = async (commentId: string): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }
  
      const { data, error } = await supabase.rpc('delete_trade_comment', {
        comment_id: commentId,
        requesting_user_id: user.id
      });
  
      if (error) {
        console.error('Delete comment error:', error);
        return { success: false, error: error.message };
      }
  
      if (!data.success) {
        return { success: false, error: data.error };
      }
  
      return { success: true };
    } catch (err) {
      console.error('Unexpected error deleting comment:', err);
      return { success: false, error: 'Unexpected error occurred' };
    }
  };

export const getTradesWithSocialStats = async (): Promise<{
    success: boolean;
    trades: TradeWithSocialStats[];
    error?: string;
  }> => {
    try {
      const { data, error } = await supabase.rpc('get_trades_with_social_stats');
  
      if (error) {
        console.error('Supabase RPC error:', error);
        return { success: false, trades: [], error: error.message };
      }
  
      // The function returns JSON array, so we can use it directly
      const trades: TradeWithSocialStats[] = data || [];
  
      console.log('✅ Loaded trades from RPC:', trades.length, 'trades');
      
      return { success: true, trades };
    } catch (err) {
      console.error('Unexpected error in getTradesWithSocialStats:', err);
      return { success: false, trades: [], error: 'Unexpected error occurred' };
    }
  };



// UTILITY FUNCTIONS
export const getLikesCount = async (tradeId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('trade_likes')
    .select('id', { count: 'exact' })
    .eq('trade_id', tradeId)

  if (error) return 0
  return data?.length || 0
}

export const getCommentsCount = async (tradeId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('trade_comments')
    .select('id', { count: 'exact' })
    .eq('trade_id', tradeId)

  if (error) return 0
  return data?.length || 0
}

export const hasUserLikedTrade = async (tradeId: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data, error } = await supabase
    .from('trade_likes')
    .select('id')
    .eq('trade_id', tradeId)
    .eq('user_id', user.id)
    .single()

  return !error && !!data
}