import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/auth/callback/route'
import { NextRequest } from 'next/server'

// Mock the response to be able to read its properties instead of it just being an empty object
const mockNextResponseRedirect = vi.fn((url: URL | string) => ({ type: 'redirect', url }))
vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>()
  return {
    ...actual,
    NextResponse: {
      redirect: (...args: [URL | string]) => mockNextResponseRedirect(...args),
    },
  }
})

const mockExchangeCodeForSession = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      exchangeCodeForSession: mockExchangeCodeForSession,
    },
  })),
}))

describe('Auth Callback Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exchanges code and redirects to next if successful', async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({ error: null })
    
    const request = new NextRequest(
      new URL('http://localhost:3000/api/auth/callback?code=123456&next=/my-page')
    )

    const result = await GET(request)

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('123456')
    expect(mockNextResponseRedirect).toHaveBeenCalledWith('http://localhost:3000/my-page')
    expect((result as { url: string }).url).toBe('http://localhost:3000/my-page')
  })

  it('exchanges code and redirects to default dashboard if successful but no next param', async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({ error: null })
    
    const request = new NextRequest(
      new URL('http://localhost:3000/api/auth/callback?code=123456')
    )

    await GET(request)

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('123456')
    expect(mockNextResponseRedirect).toHaveBeenCalledWith('http://localhost:3000/w/demo/dashboard')
  })

  it('redirects to sign-in with error if exchange fails', async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({ error: { message: 'Invalid code' } })

    const request = new NextRequest(
      new URL('http://localhost:3000/api/auth/callback?code=bad-code')
    )

    await GET(request)

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('bad-code')
    expect(mockNextResponseRedirect).toHaveBeenCalledWith('http://localhost:3000/sign-in?error=auth_callback_error')
  })

  it('redirects to sign-in with error if no code is provided', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/auth/callback')
    )

    await GET(request)

    expect(mockExchangeCodeForSession).not.toHaveBeenCalled()
    expect(mockNextResponseRedirect).toHaveBeenCalledWith('http://localhost:3000/sign-in?error=auth_callback_error')
  })
})
