import { describe, it, expect, vi, beforeEach } from 'vitest'
import { middleware } from './middleware'
import { NextRequest, NextResponse } from 'next/server'

const mockGetUser = vi.fn()
const mockCreateServerClient = vi.fn(() => ({
  auth: {
    getUser: mockGetUser,
  },
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: (...args: any[]) => mockCreateServerClient(...args),
}))

// Mock NextResponse
vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>()
  return {
    ...actual,
    NextResponse: {
      next: vi.fn((...args) => actual.NextResponse.next(...args)),
      redirect: vi.fn((url) => {
        // Return a mock response with a test-friendly url property
        return { type: 'redirect', url: url.toString() } as unknown as NextResponse
      }),
    },
  }
})

describe('Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
  })

  function createMockRequest(path: string) {
    const url = new URL(`http://localhost:3000${path}`)
    return new NextRequest(url)
  }

  describe('Protected Routes (/w/*, /app)', () => {
    it('redirects unauthenticated users to /sign-in', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } })
      const request = createMockRequest('/w/demo/dashboard')

      const response = await middleware(request)

      expect(response).toBeDefined()
      expect((response as any).type).toBe('redirect')
      expect((response as any).url).toBe('http://localhost:3000/sign-in')
    })

    it('allows authenticated users to access protected routes', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: '123' } } })
      const request = createMockRequest('/w/demo/dashboard')

      const response = await middleware(request)

      // It should call NextResponse.next() implicitly by returning the supabaseResponse
      expect(response).toBeDefined()
      expect((response as any).type).not.toBe('redirect')
    })
  })

  describe('Auth Routes (/sign-in, /sign-up, /forgot-password)', () => {
    it('redirects authenticated users away from auth pages to /app', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: '123' } } })
      const request = createMockRequest('/sign-in')

      const response = await middleware(request)

      expect(response).toBeDefined()
      expect((response as any).type).toBe('redirect')
      expect((response as any).url).toBe('http://localhost:3000/app')
    })

    it('allows unauthenticated users to access auth pages', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } })
      const request = createMockRequest('/sign-in')

      const response = await middleware(request)

      expect(response).toBeDefined()
      expect((response as any).type).not.toBe('redirect')
    })
  })

  describe('Public Routes', () => {
    it('allows access regardless of auth state', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } })
      const request = createMockRequest('/about')

      const response = await middleware(request)

      expect(response).toBeDefined()
      expect((response as any).type).not.toBe('redirect')
    })
  })
})
