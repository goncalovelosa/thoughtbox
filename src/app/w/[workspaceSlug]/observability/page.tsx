import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { format, subDays, startOfDay } from 'date-fns'
import { Activity, BrainCircuit, Zap, Lock, Terminal, TrendingUp } from 'lucide-react'

export const metadata: Metadata = { title: 'Observability' }

type Props = { params: Promise<{ workspaceSlug: string }> }

export default async function ObservabilityPage({ params }: Props) {
  const { workspaceSlug } = await params

  const supabase = await createClient()

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('slug', workspaceSlug)
    .single()

  if (!workspace) notFound()

  const since30d = subDays(new Date(), 30).toISOString()

  const [allSessionsResult, thoughtCountResult, otelCountResult, otelCostResult] = await Promise.all([
    supabase
      .from('sessions')
      .select('id, status, thought_count, created_at, updated_at, tags')
      .eq('workspace_id', workspace.id)
      .gte('created_at', since30d)
      .order('created_at', { ascending: true })
      .limit(1000),
    supabase
      .from('thoughts')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspace.id),
    supabase
      .from('otel_events')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspace.id),
    supabase
      .rpc('otel_session_cost', { p_workspace_id: workspace.id }),
  ])

  const sessions = allSessionsResult.data ?? []
  const totalThoughts = thoughtCountResult.count ?? 0
  const otelEventCount = otelCountResult.count ?? 0
  const otelConnected = otelEventCount > 0

  // Cost data from RPC
  const costRows = (otelCostResult.data ?? []) as Array<{
    model: string
    total_cost: number
    data_points: number
  }>
  const totalCost = costRows.reduce((sum, r) => sum + r.total_cost, 0)
  const maxCost = Math.max(...costRows.map(r => r.total_cost), 1)

  // Tool performance — count tool_result events by tool name
  let toolStats: { tool: string; count: number }[] = []
  if (otelConnected) {
    const { data: toolRows } = await supabase
      .from('otel_events')
      .select('event_attrs')
      .eq('workspace_id', workspace.id)
      .eq('event_type', 'log')
      .like('event_name', '%tool%')
      .limit(500)

    const toolMap = new Map<string, number>()
    for (const row of toolRows ?? []) {
      const attrs = row.event_attrs as Record<string, unknown> | null
      const toolName = typeof attrs?.['tool.name'] === 'string'
        ? attrs['tool.name']
        : typeof attrs?.['event.name'] === 'string'
          ? attrs['event.name']
          : 'unknown'
      toolMap.set(toolName, (toolMap.get(toolName) ?? 0) + 1)
    }
    toolStats = Array.from(toolMap.entries())
      .map(([tool, count]) => ({ tool, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }
  const maxToolCount = Math.max(...toolStats.map(t => t.count), 1)

  // KPI computations
  const totalRuns = sessions.length
  const activeRuns = sessions.filter(s => s.status === 'active').length
  const completedRuns = sessions.filter(s => s.status === 'completed').length
  const abandonedRuns = sessions.filter(s => s.status === 'abandoned').length

  // Sessions per day — last 14 days
  const days: { date: string; label: string; shortLabel: string; count: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = startOfDay(subDays(new Date(), i))
    days.push({
      date: d.toISOString().slice(0, 10),
      label: format(d, 'MMM d'),
      shortLabel: i === 0 ? 'Today' : i === 13 ? format(d, 'MMM d') : format(d, 'd'),
      count: 0,
    })
  }
  for (const s of sessions) {
    const day = s.created_at.slice(0, 10)
    const bucket = days.find(d => d.date === day)
    if (bucket) bucket.count++
  }
  const maxDayCount = Math.max(...days.map(d => d.count), 1)

  // Top tags by session count
  const tagMap = new Map<string, number>()
  for (const s of sessions) {
    for (const tag of s.tags ?? []) {
      tagMap.set(tag, (tagMap.get(tag) ?? 0) + 1)
    }
  }
  const topTags = Array.from(tagMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
  const maxTagCount = Math.max(...topTags.map(t => t.count), 1)

  // Status distribution percentages
  const statusTotal = totalRuns || 1
  const completedPct = Math.round((completedRuns / statusTotal) * 100)
  const activePct = Math.round((activeRuns / statusTotal) * 100)
  const abandonedPct = 100 - completedPct - activePct

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Observability</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Claude&nbsp;Code usage across your workspace — last&nbsp;30&nbsp;days.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Total runs" value={String(totalRuns)} sub="last 30 days" icon={<Zap className="h-4 w-4" aria-hidden="true" />} />
        <KpiCard label="Active" value={String(activeRuns)} sub="in progress" icon={<Activity className="h-4 w-4" aria-hidden="true" />} />
        <KpiCard label="Thoughts" value={String(totalThoughts)} sub="all time" icon={<BrainCircuit className="h-4 w-4" aria-hidden="true" />} />
        <KpiCard label="OTEL Events" value={String(otelEventCount)} sub={otelConnected ? 'telemetry records' : 'not connected'} icon={<Activity className="h-4 w-4" aria-hidden="true" />} />
      </div>

      {/* Activity row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sessions per day */}
        <Panel title="Sessions per day" subtitle="Last 14 days">
          {totalRuns === 0 ? (
            <EmptyChart message="No runs recorded in the last 14 days." />
          ) : (
            <div className="pt-2">
              <div className="flex items-end gap-1 h-24">
                {days.map((day) => (
                  <div
                    key={day.date}
                    className="flex-1 flex flex-col items-center justify-end"
                    title={`${day.label}: ${day.count} run${day.count !== 1 ? 's' : ''}`}
                  >
                    <div
                      className="w-full bg-foreground transition-all duration-300"
                      style={{ height: day.count === 0 ? '2px' : `${(day.count / maxDayCount) * 100}%`, opacity: day.count === 0 ? 0.15 : 1 }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-1 mt-2">
                {days.map((day, i) => (
                  <div key={day.date} className="flex-1 text-center">
                    {(i === 0 || i === 6 || i === 13) && (
                      <span className="text-[9px] text-muted-foreground">{day.shortLabel}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>

        {/* Top tags */}
        <Panel title="Top tags" subtitle="By session count">
          {topTags.length === 0 ? (
            <EmptyChart message="No tag data yet." />
          ) : (
            <div className="space-y-2.5 pt-1">
              {topTags.map((t) => (
                <div key={t.tag} className="flex items-center gap-3">
                  <span
                    className="text-xs text-muted-foreground w-28 shrink-0 truncate text-right"
                    title={t.tag}
                  >
                    {t.tag}
                  </span>
                  <div className="flex-1 bg-muted h-2">
                    <div
                      className="h-full bg-foreground transition-all duration-300"
                      style={{ width: `${(t.count / maxTagCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-foreground font-medium tabular-nums w-6 text-right">{t.count}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* Status breakdown */}
      <Panel title="Run status breakdown" subtitle="Last 30 days">
        {totalRuns === 0 ? (
          <EmptyChart message="No runs recorded yet." />
        ) : (
          <div className="space-y-4">
            {/* Stacked bar */}
            <div className="flex h-4 w-full overflow-hidden rounded-none border border-foreground">
              {completedPct > 0 && (
                <div
                  className="h-full bg-emerald-500/80"
                  style={{ width: `${completedPct}%` }}
                  title={`Completed: ${completedRuns} (${completedPct}%)`}
                />
              )}
              {activePct > 0 && (
                <div
                  className="h-full bg-blue-500/80"
                  style={{ width: `${activePct}%` }}
                  title={`Active: ${activeRuns} (${activePct}%)`}
                />
              )}
              {abandonedPct > 0 && (
                <div
                  className="h-full bg-rose-500/80"
                  style={{ width: `${abandonedPct}%` }}
                  title={`Abandoned: ${abandonedRuns} (${abandonedPct}%)`}
                />
              )}
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500/80" aria-hidden="true" />
                Completed <strong className="text-foreground ml-1 tabular-nums">{completedRuns}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500/80" aria-hidden="true" />
                Active <strong className="text-foreground ml-1 tabular-nums">{activeRuns}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-rose-500/80" aria-hidden="true" />
                Abandoned <strong className="text-foreground ml-1 tabular-nums">{abandonedRuns}</strong>
              </span>
            </div>
          </div>
        )}
      </Panel>

      {/* OTel telemetry section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2.5 border-b border-foreground pb-3">
          <TrendingUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-foreground">Claude&nbsp;Code Telemetry</h2>
          {otelConnected ? (
            <span className="ml-auto flex items-center gap-1 rounded-none border border-emerald-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
              Connected
            </span>
          ) : (
            <span className="ml-auto flex items-center gap-1 rounded-none border border-foreground px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Lock className="h-3 w-3" aria-hidden="true" />
              Requires OTel
            </span>
          )}
        </div>

        {otelConnected ? (
          <>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Telemetry active — {otelEventCount.toLocaleString()} events ingested.
              {totalCost > 0 && ` Total cost: $${totalCost.toFixed(4)}.`}
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Cost by model */}
              <Panel title="Cost by model" subtitle={`$${totalCost.toFixed(4)} total`}>
                {costRows.length === 0 ? (
                  <EmptyChart message="No cost data yet." />
                ) : (
                  <div className="space-y-2.5 pt-1">
                    {costRows.map((r) => (
                      <div key={r.model} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-24 shrink-0 truncate text-right" title={r.model}>
                          {r.model}
                        </span>
                        <div className="flex-1 bg-muted h-2">
                          <div className="h-full bg-foreground transition-all duration-300" style={{ width: `${(r.total_cost / maxCost) * 100}%` }} />
                        </div>
                        <span className="text-xs text-foreground font-medium tabular-nums w-16 text-right">${r.total_cost.toFixed(4)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>

              {/* Data points by model */}
              <Panel title="Data points" subtitle="By model">
                {costRows.length === 0 ? (
                  <EmptyChart message="No metric data yet." />
                ) : (
                  <div className="space-y-2.5 pt-1">
                    {costRows.map((r) => {
                      const maxDp = Math.max(...costRows.map(c => c.data_points), 1)
                      return (
                        <div key={r.model} className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-24 shrink-0 truncate text-right" title={r.model}>
                            {r.model}
                          </span>
                          <div className="flex-1 bg-muted h-2">
                            <div className="h-full bg-foreground transition-all duration-300" style={{ width: `${(r.data_points / maxDp) * 100}%` }} />
                          </div>
                          <span className="text-xs text-foreground font-medium tabular-nums w-10 text-right">{r.data_points}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Panel>

              {/* Tool performance */}
              <Panel title="Tool usage" subtitle="By event count">
                {toolStats.length === 0 ? (
                  <EmptyChart message="No tool data yet." />
                ) : (
                  <div className="space-y-2.5 pt-1">
                    {toolStats.map((t) => (
                      <div key={t.tool} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-24 shrink-0 truncate text-right" title={t.tool}>
                          {t.tool}
                        </span>
                        <div className="flex-1 bg-muted h-2">
                          <div className="h-full bg-foreground transition-all duration-300" style={{ width: `${(t.count / maxToolCount) * 100}%` }} />
                        </div>
                        <span className="text-xs text-foreground font-medium tabular-nums w-6 text-right">{t.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Connect Claude&nbsp;Code&apos;s OpenTelemetry pipeline to unlock cost tracking, token analytics,
              model-level breakdowns, and tool performance metrics. The panels below show what becomes
              available once configured.
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <OtelLockedCard
                title="Cost by model"
                description="Total spend broken down by claude-opus, claude-sonnet, claude-haiku per session and over time."
              />
              <OtelLockedCard
                title="Token usage"
                description="Input, output, cache read, and cache creation tokens — per model, per project, per day."
              />
              <OtelLockedCard
                title="Tool performance"
                description="Success rates and average execution times for every Claude Code tool (Edit, Write, Bash, etc.)."
              />
            </div>
          </>
        )}

        {/* Setup instructions */}
        <div className="rounded-none border border-foreground bg-background p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-semibold text-foreground">Enable Claude Code telemetry</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Set these environment variables before running{' '}
            <code className="font-mono text-foreground bg-muted px-1 py-0.5">claude</code>, or configure them in your{' '}
            <code className="font-mono text-foreground bg-muted px-1 py-0.5">managed-settings.json</code>.
          </p>
          <pre className="text-xs font-mono bg-muted text-foreground p-4 overflow-x-auto leading-relaxed">
{`export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_METRICS_EXPORTER=otlp
export OTEL_LOGS_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_PROTOCOL=http/json
export OTEL_EXPORTER_OTLP_ENDPOINT=https://mcp.kastalienresearch.ai
export OTEL_METRICS_INCLUDE_ACCOUNT_UUID=true`}
          </pre>
          <p className="text-xs text-muted-foreground">
            The endpoint points directly at Thoughtbox, which ingests and stores your telemetry. See the{' '}
            <a
              href="https://docs.anthropic.com/en/docs/claude-code/monitoring"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 text-foreground hover:text-muted-foreground transition-colors"
            >
              Claude Code Observability docs
            </a>{' '}
            for details.
          </p>
        </div>
      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string
  value: string
  sub: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-none border border-foreground bg-background p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-foreground tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
    </div>
  )
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-none border border-foreground bg-background p-5">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
      </div>
      {children}
    </div>
  )
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-16 text-xs text-muted-foreground">
      {message}
    </div>
  )
}

function OtelLockedCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-none border border-foreground/30 bg-background p-4 opacity-50">
      <div className="flex items-center gap-2 mb-2">
        <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      {/* Mock bar */}
      <div className="mt-3 space-y-1.5">
        {[70, 45, 25].map((w, i) => (
          <div key={i} className="h-2 bg-muted">
            <div className="h-full bg-foreground/30" style={{ width: `${w}%` }} />
          </div>
        ))}
      </div>
    </div>
  )
}
