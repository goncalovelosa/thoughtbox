'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/actions'

const ROUTE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  projects: 'Projects',
  runs: 'Runs',
  'api-keys': 'API Keys',
  usage: 'Usage',
  billing: 'Billing',
  account: 'Account settings',
  workspace: 'Workspace settings',
  connect: 'Connect',
  quickstart: 'Quickstart',
}

function deriveTitle(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)
  // Find the last meaningful segment
  for (let i = segments.length - 1; i >= 0; i--) {
    const title = ROUTE_TITLES[segments[i]]
    if (title) return title
  }
  return 'Workspace'
}

interface WorkspaceTopBarProps {
  workspaceSlug: string
  /** Ignored — title is derived from the current path */
  pageTitle?: string
}

export function WorkspaceTopBar({ workspaceSlug }: WorkspaceTopBarProps) {
  const pathname = usePathname()
  const title = deriveTitle(pathname)

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-foreground bg-background px-6">
      <h1 className="text-sm font-semibold text-foreground">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Help link */}
        <Link
          href="/support"
          className="text-xs text-foreground hover:text-foreground transition-colors"
        >
          Help
        </Link>

        {/* Workspace indicator */}
        <span className="rounded-none border border-foreground bg-background px-3 py-1 text-xs font-medium text-foreground capitalize">
          {workspaceSlug}
        </span>

        {/* Sign out */}
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-none border border-foreground px-3 py-1.5 text-xs font-medium text-foreground hover:bg-background transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  )
}
