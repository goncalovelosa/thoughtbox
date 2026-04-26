import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireActiveSubscription } from '@/lib/stripe/gate'
import { BADGE_BASE, STATUS_BADGE, STATUS_LABEL } from '@/lib/session/badge-styles'
import { format } from 'date-fns'

export const metadata: Metadata = { title: 'Dashboard' }

type Props = { params: Promise<{ workspaceSlug: string }> }

export default async function DashboardPage({ params }: Props) {
  const { workspaceSlug } = await params
  await requireActiveSubscription(workspaceSlug)
  const base = `/w/${workspaceSlug}`

  const supabase = await createClient()

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('slug', workspaceSlug)
    .single()

  if (!workspace) notFound()

  const workspaceId = workspace.id

  const [sessionsResult, thoughtCountResult, apiKeyCountResult, totalRunsResult] =
    await Promise.all([
      supabase
        .from('sessions')
        .select('id, title, status, thought_count, created_at, updated_at')
        .eq('workspace_id', workspaceId)
        .order('updated_at', { ascending: false })
        .limit(5),
      supabase
        .from('thoughts')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId),
      supabase
        .from('api_keys')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('status', 'active'),
      supabase
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId),
    ])

  const recentSessions = sessionsResult.data ?? []
  const totalRuns = totalRunsResult.count ?? 0

  const stats = [
    { label: 'Thoughts captured', value: String(thoughtCountResult.count ?? 0), sub: 'total' },
    { label: 'Runs', value: String(totalRuns), sub: 'total' },
    { label: 'API keys', value: String(apiKeyCountResult.count ?? 0), sub: 'active' },
  ]

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground capitalize">
          {workspaceSlug} dashboard
        </h1>
        <p className="mt-1 text-sm text-foreground">
          Overview of your workspace activity.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5 shadow-sm"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-foreground">
              {stat.label}
            </p>
            <p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
            <p className="mt-0.5 text-xs text-foreground">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <QuickAction
          title="Connect your first agent"
          description="Add Thoughtbox to your MCP client config and start capturing thoughts."
          href={`${base}/connect`}
          icon="🚀"
        />
        <QuickAction
          title="Create an API key"
          description="Generate a key to authenticate your MCP client or REST requests."
          href={`${base}/api-keys`}
          icon="🔑"
        />
        <QuickAction
          title="Explore your sessions"
          description="View every MCP session recorded in this workspace."
          href={`${base}/sessions`}
          icon="🔍"
        />
      </div>

      {/* Recent runs */}
      <div className="mt-8 rounded-2xl border border-foreground/10 bg-foreground/[0.03] shadow-sm">
        <div className="flex items-center justify-between border-b border-foreground/10 px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">Recent sessions</h2>
          <Link
            href={`${base}/sessions`}
            className="text-xs text-foreground hover:underline-thick hover:text-foreground transition-colors"
          >
            View all →
          </Link>
        </div>

        {recentSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
            <p className="text-2xl">📋</p>
            <p className="font-medium text-foreground">No sessions yet</p>
            <p className="text-sm text-foreground">
              Sessions appear here once your MCP client connects and makes its first call.
            </p>
            <Link
              href={`${base}/docs/quickstart`}
              className="mt-3 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background transition-all hover:bg-foreground/80"
            >
              See quickstart guide
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentSessions.map((session) => {
              const status = (session.status ?? 'active') as 'active' | 'completed' | 'abandoned'
              return (
                <li key={session.id}>
                  <Link
                    href={`${base}/sessions/${session.id}`}
                    className="flex items-center justify-between px-6 py-3 hover:bg-background transition-colors"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm font-medium text-foreground truncate">
                        {session.title || `Session ${session.id.slice(0, 7)}`}
                      </span>
                      <span className="text-xs text-foreground">
                        {format(new Date(session.created_at), 'MMM d, HH:mm')}
                        {' · '}
                        {session.thought_count ?? 0} thoughts
                      </span>
                    </div>
                    <span className={`${BADGE_BASE} ${STATUS_BADGE[status]} shrink-0`}>
                      {STATUS_LABEL[status]}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function QuickAction({
  title,
  description,
  href,
  icon,
}: {
  title: string
  description: string
  href: string
  icon: string
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-3 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5 shadow-sm hover:shadow-md transition-all"
    >
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-sm text-foreground">{description}</p>
      </div>
    </Link>
  )
}
