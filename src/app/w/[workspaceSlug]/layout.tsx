import { WorkspaceSidebar } from '@/components/nav/workspace-sidebar'
import { WorkspaceTopBar } from '@/components/nav/workspace-top-bar'

type Props = {
  children: React.ReactNode
  params: Promise<{ workspaceSlug: string }>
}

/**
 * Workspace shell layout — wraps all /w/[workspaceSlug]/* routes.
 *
 * Renders the sidebar + top bar. The sidebar receives `workspaceSlug` so it
 * can build correctly-prefixed navigation links. The top bar is a server
 * component placeholder; auth-aware user info is added in ADR-FE-02.
 */
export default async function WorkspaceLayout({ children, params }: Props) {
  const { workspaceSlug } = await params

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <WorkspaceSidebar workspaceSlug={workspaceSlug} />

      {/* Main column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <WorkspaceTopBar workspaceSlug={workspaceSlug} pageTitle="" />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
