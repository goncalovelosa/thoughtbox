import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Supabase Auth callback — handles OAuth code exchange and PKCE email confirmations.
 * After a successful exchange the user is redirected to `next` (default: /w/demo/dashboard).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/w/demo/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Redirect to sign-in with an error hint
  return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_error`)
}
