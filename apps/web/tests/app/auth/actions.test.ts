import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  signInAction,
  forgotPasswordAction,
  resetPasswordAction,
  resendWelcomeEmailAction,
} from '@/app/(auth)/actions'
import { redirect } from 'next/navigation'

// Mock dependencies
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

const mockSignInWithPassword = vi.fn()
const mockResetPasswordForEmail = vi.fn()
const mockUpdateUser = vi.fn()
const mockGetUser = vi.fn()
const mockSingle = vi.fn()
const mockEq = vi.fn(() => ({ single: mockSingle }))
const mockSelect = vi.fn(() => ({ eq: mockEq }))
const mockFrom = vi.fn(() => ({ select: mockSelect }))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      resetPasswordForEmail: mockResetPasswordForEmail,
      getUser: mockGetUser,
      updateUser: mockUpdateUser,
    },
    from: mockFrom,
  })),
}))

describe('Auth Actions', () => {
  let formData: FormData

  beforeEach(() => {
    vi.clearAllMocks()
    formData = new FormData()
    delete process.env.NEXT_PUBLIC_SITE_URL
    delete process.env.VERCEL_URL
    mockSingle.mockResolvedValue({
      data: { workspaces: { slug: 'demo' } },
      error: null,
    })
  })

  describe('signInAction', () => {
    it('redirects on success', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
        error: null,
      })
      formData.append('email', 'test@example.com')
      formData.append('password', 'password123')

      await signInAction(null, formData)

      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(redirect).toHaveBeenCalledWith('/w/demo/dashboard')
    })

    it('returns error message on failure', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Invalid credentials' },
      })
      formData.append('email', 'test@example.com')
      formData.append('password', 'wrong')

      const result = await signInAction(null, formData)

      expect(result).toEqual({ error: 'Invalid credentials' })
      expect(redirect).not.toHaveBeenCalled()
    })
  })

  describe('resendWelcomeEmailAction', () => {
    it('returns ok:true on success', async () => {
      mockResetPasswordForEmail.mockResolvedValueOnce({ error: null })
      process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'

      const result = await resendWelcomeEmailAction('test@example.com')

      expect(mockResetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
        redirectTo: 'http://localhost:3000/reset-password',
      })
      expect(result).toEqual({ ok: true })
    })

    it('returns ok:false on Supabase failure', async () => {
      mockResetPasswordForEmail.mockResolvedValueOnce({ error: { message: 'boom' } })

      const result = await resendWelcomeEmailAction('test@example.com')

      expect(result).toEqual({ ok: false })
    })

    it('rejects empty email without calling Supabase', async () => {
      const result = await resendWelcomeEmailAction('')

      expect(result).toEqual({ ok: false })
      expect(mockResetPasswordForEmail).not.toHaveBeenCalled()
    })
  })

  describe('forgotPasswordAction', () => {
    it('returns success object on success', async () => {
      mockResetPasswordForEmail.mockResolvedValueOnce({ error: null })
      formData.append('email', 'test@example.com')

      process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'

      const result = await forgotPasswordAction(null, formData)

      expect(mockResetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
        redirectTo: 'http://localhost:3000/reset-password',
      })
      expect(result).toEqual({ success: true })
    })

    it('returns error message on failure', async () => {
      mockResetPasswordForEmail.mockResolvedValueOnce({ error: { message: 'User not found' } })
      formData.append('email', 'test@example.com')

      const result = await forgotPasswordAction(null, formData)

      expect(result).toEqual({ error: 'User not found' })
    })
  })

  describe('resetPasswordAction', () => {
    it('redirects on success', async () => {
      mockGetUser
        .mockResolvedValueOnce({
          data: { user: { id: 'user-123' } },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { user: { id: 'user-123' } },
          error: null,
        })
      mockUpdateUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
        error: null,
      })
      formData.append('password', 'newpassword123')
      formData.append('confirmPassword', 'newpassword123')
      formData.append('recoveryToken', 'recovery-token')
      formData.append('recoveryUserId', 'user-123')

      await resetPasswordAction(null, formData)

      expect(mockGetUser).toHaveBeenNthCalledWith(1, 'recovery-token')
      expect(mockGetUser).toHaveBeenNthCalledWith(2)
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'newpassword123' })
      expect(redirect).toHaveBeenCalledWith('/w/demo/dashboard')
    })

    it('returns error if passwords do not match', async () => {
      formData.append('password', 'newpassword123')
      formData.append('confirmPassword', 'different123')

      const result = await resetPasswordAction(null, formData)

      expect(result).toEqual({ error: 'Passwords do not match.' })
      expect(mockUpdateUser).not.toHaveBeenCalled()
    })

    it('returns error if password is too short', async () => {
      formData.append('password', 'short')
      formData.append('confirmPassword', 'short')

      const result = await resetPasswordAction(null, formData)

      expect(result).toEqual({ error: 'Password must be at least 12 characters.' })
      expect(mockUpdateUser).not.toHaveBeenCalled()
    })

    it('returns error if recovery proof is missing', async () => {
      formData.append('password', 'newpassword123')
      formData.append('confirmPassword', 'newpassword123')

      const result = await resetPasswordAction(null, formData)

      expect(result).toEqual({ error: 'Password reset proof is missing.' })
      expect(mockGetUser).not.toHaveBeenCalled()
      expect(mockUpdateUser).not.toHaveBeenCalled()
    })

    it('returns error if recovery proof is invalid', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'bad token' },
      })
      formData.append('password', 'newpassword123')
      formData.append('confirmPassword', 'newpassword123')
      formData.append('recoveryToken', 'bad-token')
      formData.append('recoveryUserId', 'user-123')

      const result = await resetPasswordAction(null, formData)

      expect(result).toEqual({ error: 'Password reset proof is invalid or expired.' })
      expect(mockUpdateUser).not.toHaveBeenCalled()
    })

    it('returns error if recovery proof user id does not match the submitted proof', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: 'user-456' } },
        error: null,
      })
      formData.append('password', 'newpassword123')
      formData.append('confirmPassword', 'newpassword123')
      formData.append('recoveryToken', 'recovery-token')
      formData.append('recoveryUserId', 'user-123')

      const result = await resetPasswordAction(null, formData)

      expect(result).toEqual({ error: 'Password reset proof does not match this request.' })
      expect(mockUpdateUser).not.toHaveBeenCalled()
    })

    it('returns error if cookie session does not match recovery proof', async () => {
      mockGetUser
        .mockResolvedValueOnce({
          data: { user: { id: 'user-123' } },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { user: { id: 'user-456' } },
          error: null,
        })
      formData.append('password', 'newpassword123')
      formData.append('confirmPassword', 'newpassword123')
      formData.append('recoveryToken', 'recovery-token')
      formData.append('recoveryUserId', 'user-123')

      const result = await resetPasswordAction(null, formData)

      expect(result).toEqual({ error: 'Password reset session mismatch.' })
      expect(mockUpdateUser).not.toHaveBeenCalled()
    })

    it('returns error message on Supabase failure', async () => {
      mockGetUser
        .mockResolvedValueOnce({
          data: { user: { id: 'user-123' } },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { user: { id: 'user-123' } },
          error: null,
        })
      mockUpdateUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Token expired' },
      })
      formData.append('password', 'newpassword123')
      formData.append('confirmPassword', 'newpassword123')
      formData.append('recoveryToken', 'recovery-token')
      formData.append('recoveryUserId', 'user-123')

      const result = await resetPasswordAction(null, formData)

      expect(result).toEqual({ error: 'Token expired' })
      expect(redirect).not.toHaveBeenCalled()
    })
  })
})
