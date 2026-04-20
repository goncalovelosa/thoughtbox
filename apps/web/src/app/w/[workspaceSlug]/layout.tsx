import { WorkspaceSidebar } from '@/components/nav/workspace-sidebar'
import { WorkspaceTopBar } from '@/components/nav/workspace-top-bar'
import { createClient } from '@/lib/supabase/server'

type Props = {
  children: React.ReactNode
  params: Promise<{ workspaceSlug: string }>
}

export default async function WorkspaceLayout({ children, params }: Props) {
  const { workspaceSlug } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userEmail = user?.email ?? ''
  const userDisplayName =
    (user?.user_metadata?.first_name as string | undefined)?.trim() ||
    userEmail.split('@')[0] ||
    ''

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <WorkspaceSidebar workspaceSlug={workspaceSlug} />

      {/* Main column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <WorkspaceTopBar
          workspaceSlug={workspaceSlug}
          userEmail={userEmail}
          userDisplayName={userDisplayName}
        />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
