import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  signInAction,
  signUpAction,
  forgotPasswordAction,
  resetPasswordAction,
} from '@/app/(auth)/actions'
import { redirect } from 'next/navigation'

// Mock dependencies
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

const mockSignInWithPassword = vi.fn()
const mockSignUp = vi.fn()
const mockResetPasswordForEmail = vi.fn()
const mockUpdateUser = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      resetPasswordForEmail: mockResetPasswordForEmail,
      updateUser: mockUpdateUser,
    },
  })),
}))

describe('Auth Actions', () => {
  let formData: FormData

  beforeEach(() => {
    vi.clearAllMocks()
    formData = new FormData()
  })

  describe('signInAction', () => {
    it('redirects on success', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({ error: null })
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
      mockSignInWithPassword.mockResolvedValueOnce({ error: { message: 'Invalid credentials' } })
      formData.append('email', 'test@example.com')
      formData.append('password', 'wrong')

      const result = await signInAction(null, formData)

      expect(result).toEqual({ error: 'Invalid credentials' })
      expect(redirect).not.toHaveBeenCalled()
    })
  })

  describe('signUpAction', () => {
    it('returns success object on success', async () => {
      mockSignUp.mockResolvedValueOnce({ error: null })
      formData.append('email', 'test@example.com')
      formData.append('password', 'password123')

      process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'

      const result = await signUpAction(null, formData)

      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          emailRedirectTo: 'http://localhost:3000/api/auth/callback',
        },
      })
      expect(result).toEqual({ success: true })
    })

    it('returns error message on failure', async () => {
      mockSignUp.mockResolvedValueOnce({ error: { message: 'Email already in use' } })
      formData.append('email', 'test@example.com')
      formData.append('password', 'password123')

      const result = await signUpAction(null, formData)

      expect(result).toEqual({ error: 'Email already in use' })
    })
  })

  describe('forgotPasswordAction', () => {
    it('returns success object on success', async () => {
      mockResetPasswordForEmail.mockResolvedValueOnce({ error: null })
      formData.append('email', 'test@example.com')

      process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'

      const result = await forgotPasswordAction(null, formData)

      expect(mockResetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
        redirectTo: 'http://localhost:3000/api/auth/callback?next=/reset-password',
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
      mockUpdateUser.mockResolvedValueOnce({ error: null })
      formData.append('password', 'newpassword123')
      formData.append('confirmPassword', 'newpassword123')

      await resetPasswordAction(null, formData)

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

    it('returns error message on Supabase failure', async () => {
      mockUpdateUser.mockResolvedValueOnce({ error: { message: 'Token expired' } })
      formData.append('password', 'newpassword123')
      formData.append('confirmPassword', 'newpassword123')

      const result = await resetPasswordAction(null, formData)

      expect(result).toEqual({ error: 'Token expired' })
      expect(redirect).not.toHaveBeenCalled()
    })
  })
})
