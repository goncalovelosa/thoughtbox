import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // IMPORTANT: Do not add any code between createServerClient and auth.getUser()
  // that could introduce side effects. A full explanation here:
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Protected paths — require a session
  const isProtected = pathname.startsWith('/w/') || pathname === '/app'

  // Auth pages that authenticated users should be redirected away from
  const isAuthOnlyPage =
    pathname === '/sign-in' ||
    pathname === '/sign-up' ||
    pathname === '/forgot-password'

  if (isProtected && !user) {
    const signInUrl = request.nextUrl.clone()
    signInUrl.pathname = '/sign-in'
    return NextResponse.redirect(signInUrl)
  }

  if (isAuthOnlyPage && user) {
    const appUrl = request.nextUrl.clone()
    appUrl.pathname = '/app'
    return NextResponse.redirect(appUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/w/:path*', '/app', '/sign-in', '/sign-up', '/forgot-password'],
}
