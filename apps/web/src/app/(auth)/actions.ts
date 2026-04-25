'use server'

import { getSiteUrl } from '@/lib/thoughtbox-config'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// ── Types ────────────────────────────────────────────────────────────────────

export type AuthFormState =
  | { error: string; success?: never }
  | { success: true; error?: never }
  | null

// ── Sign In ───────────────────────────────────────────────────────────────────

export async function signInAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({ email, password })

  if (authError) {
    return { error: authError.message }
  }

  if (!user) return { error: 'Authentication failed' }

  // Resolve user's default workspace slug
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('default_workspace_id, workspaces!profiles_default_workspace_id_fkey(slug)')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile?.workspaces) {
    console.error('Failed to resolve workspace for user:', profileError)
    // Fallback to a generic app home if workspace lookup fails
    redirect('/app')
  }

  const workspaceSlug = (profile.workspaces as unknown as { slug: string }).slug
  redirect(`/w/${workspaceSlug}/dashboard`)
}

// ── Forgot Password ───────────────────────────────────────────────────────────

export async function forgotPasswordAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = formData.get('email') as string

  const siteUrl = getSiteUrl()

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

// ── Resend Welcome Email (Stripe-gated signup) ────────────────────────────────

// Used by /sign-up/claim to re-send the set-password link to a user whose
// account was just created by the Stripe webhook. Wraps resetPasswordForEmail
// so the claim page can expose a "resend" button without exposing the admin key.
export async function resendWelcomeEmailAction(email: string): Promise<{ ok: boolean }> {
  if (!email || typeof email !== 'string') return { ok: false }

  const siteUrl = getSiteUrl()
  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/reset-password`,
  })
  if (error) {
    console.error('resendWelcomeEmailAction failed:', error)
    return { ok: false }
  }
  return { ok: true }
}

// ── Reset Password ────────────────────────────────────────────────────────────

export async function resetPasswordAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  const recoveryToken = formData.get('recoveryToken')
  const recoveryUserId = formData.get('recoveryUserId')

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' }
  }

  if (password.length < 12) {
    return { error: 'Password must be at least 12 characters.' }
  }

  if (typeof recoveryToken !== 'string' || !recoveryToken) {
    return { error: 'Password reset proof is missing.' }
  }

  if (typeof recoveryUserId !== 'string' || !recoveryUserId) {
    return { error: 'Password reset proof is missing.' }
  }

  const supabase = await createClient()
  const { data: { user: recoveryUser }, error: recoveryError } = await supabase.auth.getUser(recoveryToken)

  if (recoveryError || !recoveryUser) {
    return { error: 'Password reset proof is invalid or expired.' }
  }

  if (recoveryUser.id !== recoveryUserId) {
    return { error: 'Password reset proof does not match this request.' }
  }

  const { data: { user: sessionUser }, error: sessionError } = await supabase.auth.getUser()

  if (sessionError || !sessionUser) {
    return { error: 'Authentication failed' }
  }

  if (sessionUser.id !== recoveryUser.id) {
    return { error: 'Password reset session mismatch.' }
  }

  const { data: { user }, error: authError } = await supabase.auth.updateUser({ password })

  if (authError) {
    return { error: authError.message }
  }

  if (!user) return { error: 'Authentication failed' }

  // Resolve user's default workspace slug
  const { data: profile } = await supabase
    .from('profiles')
    .select('workspaces!profiles_default_workspace_id_fkey(slug)')
    .eq('user_id', user.id)
    .single()

  const workspaceSlug = (profile?.workspaces as unknown as { slug: string } | null)?.slug
  if (!workspaceSlug) {
    redirect('/sign-in')
  }
  redirect(`/w/${workspaceSlug}/dashboard`)
}
