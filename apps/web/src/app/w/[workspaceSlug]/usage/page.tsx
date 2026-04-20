import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { subDays } from 'date-fns'

export const metadata: Metadata = { title: 'Usage' }

type Props = { params: Promise<{ workspaceSlug: string }> }

export default async function UsagePage({ params }: Props) {
  const { workspaceSlug } = await params

  const supabase = await createClient()

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('slug', workspaceSlug)
    .single()

  if (!workspace) notFound()

  const since30d = subDays(new Date(), 30).toISOString()

  const [
    thoughtAllTimeResult,
    thoughtThisPeriodResult,
    sessionAllTimeResult,
    sessionThisPeriodResult,
    activeKeyResult,
    projectResult,
  ] = await Promise.all([
    supabase
      .from('thoughts')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspace.id),
    supabase
      .from('thoughts')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspace.id)
      .gte('created_at', since30d),
    supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspace.id),
    supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspace.id)
      .gte('created_at', since30d),
    supabase
      .from('api_keys')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspace.id)
      .eq('status', 'active'),
    supabase
      .from('sessions')
      .select('tags')
      .eq('workspace_id', workspace.id),
  ])

  const distinctTags = new Set(
    (projectResult.data ?? []).flatMap(r => r.tags ?? []).filter(Boolean),
  ).size

  const stats: { label: string; value: string; sub: string }[] = [
    {
      label: 'Thoughts (all time)',
      value: String(thoughtAllTimeResult.count ?? 0),
      sub: `${thoughtThisPeriodResult.count ?? 0} in last 30 days`,
    },
    {
      label: 'Runs (all time)',
      value: String(sessionAllTimeResult.count ?? 0),
      sub: `${sessionThisPeriodResult.count ?? 0} in last 30 days`,
    },
    {
      label: 'Active API keys',
      value: String(activeKeyResult.count ?? 0),
      sub: 'currently active',
    },
    {
      label: 'Tags',
      value: String(distinctTags),
      sub: 'distinct tags seen',
    },
  ]

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Usage</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Activity counters and entitlements for your workspace.
        </p>
      </div>

      {/* Current plan badge */}
      <div className="mb-6 flex items-center justify-between rounded-2xl border border-foreground/10 bg-foreground/[0.03] px-6 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Current plan
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-lg font-bold text-foreground">Founding Beta</p>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-foreground text-background uppercase tracking-tight">
              Active
            </span>
          </div>
        </div>
        <Link
          href={`/w/${workspaceSlug}/billing`}
          className="rounded-full border border-foreground/10 px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-all"
        >
          Manage Billing
        </Link>
      </div>

      {/* Live counters */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.03]">
        <div className="border-b border-foreground/10 px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">Activity</h2>
        </div>
        <ul className="divide-y divide-foreground/10">
          {stats.map(stat => (
            <li key={stat.label} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{stat.label}</span>
                <div className="text-right">
                  <span className="text-sm font-bold text-foreground tabular-nums">{stat.value}</span>
                  <p className="text-xs text-muted-foreground">{stat.sub}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Plan entitlements */}
      <div className="overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.03]">
        <div className="border-b border-foreground/10 px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">Plan Entitlements</h2>
        </div>
        <ul className="divide-y divide-foreground/10">
          {[
            'Thoughts captured',
            'API requests',
            'Run history',
            'Workspaces',
            'Active API keys',
          ].map(label => (
            <li key={label} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{label}</span>
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                  Unlimited
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-4 text-xs text-muted-foreground italic">
        * &ldquo;Unlimited&rdquo; is subject to our fair-use policy. High-volume usage may be
        throttled to ensure service stability for all users.
      </p>
    </div>
  )
}
