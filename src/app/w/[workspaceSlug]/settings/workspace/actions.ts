'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type WorkspaceSettingsState =
  | { error: string; success?: never }
  | { success: true; error?: never }
  | null

export async function updateWorkspaceNameAction(
  _prevState: WorkspaceSettingsState,
  formData: FormData,
): Promise<WorkspaceSettingsState> {
  const workspaceId = (formData.get('workspaceId') as string | null)?.trim() ?? ''
  const name = (formData.get('name') as string | null)?.trim() ?? ''

  if (!workspaceId) return { error: 'Workspace ID is missing.' }
  if (name.length === 0) return { error: 'Workspace name cannot be empty.' }
  if (name.length > 64) return { error: 'Workspace name must be 64 characters or fewer.' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('workspaces')
    .update({ name })
    .eq('id', workspaceId)

  if (error) return { error: error.message }

  revalidatePath('/w/[workspaceSlug]/settings/workspace', 'page')
  revalidatePath('/w/[workspaceSlug]', 'layout')
  return { success: true }
}
