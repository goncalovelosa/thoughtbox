import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SessionsIndexHeader } from '@/components/session-area/sessions-index-header'
import { SessionsIndexClient } from '@/components/session-area/sessions-index-client'
import { createSessionSummaryVM, type RawSessionRecord, type SessionSignals } from '@/lib/session/view-models'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Runs' }

type Props = { params: Promise<{ workspaceSlug: string }> }

export default async function RunsPage({ params }: Props) {
  const { workspaceSlug } = await params

  const supabase = await createClient()

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('slug', workspaceSlug)
    .single()

  if (!workspace) notFound()

  const { data: rawSessions, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('workspace_id', workspace.id)
    .order('updated_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Failed to fetch sessions:', error)
  }

  // Fetch OTEL presence per session — select only session_id (minimal payload)
  // Capped to avoid unbounded scans in high-telemetry workspaces.
  // TODO: replace with a grouped-count RPC once the migration is deployed
  const sessionIds = (rawSessions || []).map(r => r.id)
  const otelCountMap = new Map<string, number>()
  if (sessionIds.length > 0) {
    const { data: otelRows } = await supabase
      .from('otel_events')
      .select('session_id')
      .eq('workspace_id', workspace.id)
      .in('session_id', sessionIds)
      .limit(5000)

    for (const row of otelRows ?? []) {
      if (row.session_id) {
        otelCountMap.set(row.session_id, (otelCountMap.get(row.session_id) ?? 0) + 1)
      }
    }
  }

  // Fetch thought type breakdown per session for reasoning signals
  const signalsMap = new Map<string, SessionSignals>()
  if (sessionIds.length > 0) {
    const { data: thoughtRows } = await supabase
      .from('thoughts')
      .select('session_id, thought_type, is_revision')
      .eq('workspace_id', workspace.id)
      .in('session_id', sessionIds)
      .limit(5000)

    for (const row of thoughtRows ?? []) {
      const sid = row.session_id as string
      if (!signalsMap.has(sid)) {
        signalsMap.set(sid, { decisions: 0, assumptions: 0, beliefs: 0, actions: 0, revisions: 0 })
      }
      const s = signalsMap.get(sid)!
      switch (row.thought_type) {
        case 'decision_frame': s.decisions++; break
        case 'assumption_update': s.assumptions++; break
        case 'belief_snapshot': s.beliefs++; break
        case 'action_report': s.actions++; break
      }
      if (row.is_revision) s.revisions++
    }
  }

  const sessions = (rawSessions || []).map(row => {
    const raw: RawSessionRecord = {
      id: row.id,
      title: row.title ?? undefined,
      tags: row.tags ?? undefined,
      createdAt: row.created_at,
      completedAt: row.completed_at ?? undefined,
      updatedAt: row.updated_at ?? undefined,
      status: (row.status || 'abandoned') as RawSessionRecord['status'],
    }

    const vm = createSessionSummaryVM(raw, workspaceSlug)

    if (row.thought_count != null) {
      vm.thoughtCount = row.thought_count
    }

    vm.otelEventCount = otelCountMap.get(row.id) ?? 0
    vm.signals = signalsMap.get(row.id)

    return vm
  })

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 bg-background min-h-[calc(100vh-theme(spacing.16))]">
      <SessionsIndexHeader />
      <SessionsIndexClient sessions={sessions} />
    </div>
  )
}
