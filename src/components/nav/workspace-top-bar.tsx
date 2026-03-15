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
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      <h1 className="text-sm font-semibold text-slate-900">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Help link */}
        <Link
          href="/support"
          className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
        >
          Help
        </Link>

        {/* Workspace indicator */}
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 capitalize">
          {workspaceSlug}
        </span>

        {/* Sign out */}
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  )
}
