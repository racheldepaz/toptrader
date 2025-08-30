import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  console.log('🔗 Auth callback received:', { code: code ? 'present' : 'missing' })

  if (code) {
    // Create supabase client for server-side
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    try {
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      console.log('🔗 Code exchange result:', { 
        user: data.user ? { id: data.user.id, email: data.user.email } : null,
        error 
      })

      if (!error && data.user) {
        // Successful verification - redirect to main page with password step
        console.log('✅ Email verification successful, redirecting to password setup')
        return NextResponse.redirect(new URL('/?signup=password', request.url))
      } else {
        console.error('❌ Email verification failed:', error)
        return NextResponse.redirect(new URL('/?error=verification_failed', request.url))
      }
    } catch (err) {
      console.error('❌ Code exchange error:', err)
      return NextResponse.redirect(new URL('/?error=exchange_failed', request.url))
    }
  }

  // No code provided - redirect to home
  console.log('❌ No verification code provided')
  return NextResponse.redirect(new URL('/?error=no_code', request.url))
}