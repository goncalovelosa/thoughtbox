'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/actions'

const ROUTE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  projects: 'Projects',
  runs: 'Runs',
  'api-keys': 'API Keys',
  observability: 'Observability',
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
  userEmail?: string
  userDisplayName?: string
  /** Ignored — title is derived from the current path */
  pageTitle?: string
}

export function WorkspaceTopBar({ userEmail, userDisplayName }: WorkspaceTopBarProps) {
  const pathname = usePathname()
  const title = deriveTitle(pathname)

  const avatarInitial = (userDisplayName || userEmail || '?')[0].toUpperCase()

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-foreground bg-background px-6">
      <h1 className="text-sm font-semibold text-foreground">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Help link — opens in new tab to avoid leaving the workspace */}
        <Link
          href="/support"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Help
        </Link>

        {/* User identity */}
        {userEmail && (
          <div className="flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-none border border-foreground bg-foreground text-background text-xs font-bold"
              aria-label={`Signed in as ${userEmail}`}
            >
              {avatarInitial}
            </span>
            <span className="hidden sm:inline text-xs text-muted-foreground truncate max-w-[140px]" title={userEmail}>
              {userDisplayName || userEmail}
            </span>
          </div>
        )}

        {/* Sign out */}
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-none border border-foreground px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  )
}
