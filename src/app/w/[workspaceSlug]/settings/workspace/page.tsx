import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WorkspaceSettingsClient } from './WorkspaceSettingsClient'

export const metadata: Metadata = { title: 'Workspace settings' }

type Props = { params: Promise<{ workspaceSlug: string }> }

export default async function WorkspaceSettingsPage({ params }: Props) {
  const { workspaceSlug } = await params

  const supabase = await createClient()

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, name, slug')
    .eq('slug', workspaceSlug)
    .single()

  if (!workspace) notFound()

  const { data: memberships } = await supabase
    .from('workspace_memberships')
    .select('user_id, role')
    .eq('workspace_id', workspace.id)

  const { data: { user } } = await supabase.auth.getUser()
  const currentUserId = user?.id ?? ''
  const currentUserEmail = user?.email ?? ''

  const members = (memberships ?? []).map(m => ({
    userId: m.user_id,
    role: m.role as 'owner' | 'admin' | 'member',
    isCurrentUser: m.user_id === currentUserId,
    email: m.user_id === currentUserId ? currentUserEmail : `user-${m.user_id.slice(0, 6)}`,
  }))

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Workspace settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure workspace-level options and membership.
        </p>
      </div>

      <WorkspaceSettingsClient
        workspaceId={workspace.id}
        initialName={workspace.name}
        workspaceSlug={workspace.slug}
        members={members}
      />
    </div>
  )
}
