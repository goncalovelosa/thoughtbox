'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ProfileState =
  | { error: string; success?: never }
  | { success: true; error?: never }
  | null

export async function updateProfileAction(
  _prevState: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const firstName = (formData.get('firstName') as string | null)?.trim() ?? ''
  const lastName = (formData.get('lastName') as string | null)?.trim() ?? ''

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    data: { first_name: firstName, last_name: lastName },
  })

  if (error) return { error: error.message }

  revalidatePath('/w/[workspaceSlug]/settings/account', 'page')
  return { success: true }
}

export async function updatePasswordAction(
  _prevState: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const current = (formData.get('currentPassword') as string | null) ?? ''
  const next = (formData.get('newPassword') as string | null) ?? ''
  const confirm = (formData.get('confirmPassword') as string | null) ?? ''

  if (!current) return { error: 'Current password is required.' }
  if (next.length < 12) return { error: 'New password must be at least 12 characters.' }
  if (next !== confirm) return { error: 'Passwords do not match.' }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { error: 'Not authenticated.' }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: current,
  })
  if (signInError) return { error: 'Current password is incorrect.' }

  const { error: updateError } = await supabase.auth.updateUser({ password: next })
  if (updateError) return { error: updateError.message }

  return { success: true }
}
