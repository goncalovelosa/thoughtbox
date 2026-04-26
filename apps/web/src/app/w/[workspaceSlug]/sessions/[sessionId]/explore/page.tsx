import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ExplorerTimeline } from '@/components/explorer/explorer-timeline'
import { SessionDetailHeader } from '@/components/session-area/session-detail-header'
import {
  createSessionDetailVM,
  type RawSessionRecord,
  type RawThoughtRecord,
} from '@/lib/session/view-models'
import { createClient } from '@/lib/supabase/server'
import { requireActiveSubscription } from '@/lib/stripe/gate'

export const metadata: Metadata = { title: 'Session Explorer' }

type Props = {
  params: Promise<{ workspaceSlug: string; sessionId: string }>
}

export default async function SessionExplorePage({ params }: Props) {
  const { workspaceSlug, sessionId } = await params
  await requireActiveSubscription(workspaceSlug)
  const supabase = await createClient()

  const { data: sessionRow, error: sessionError } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (sessionError || !sessionRow) notFound()

  const { data: thoughtRows } = await supabase
    .from('thoughts')
    .select('*')
    .eq('session_id', sessionId)
    .order('thought_number', { ascending: true })

  const thoughts: RawThoughtRecord[] = (thoughtRows ?? []).map((row) => ({
    id: row.id,
    thoughtNumber: row.thought_number ?? undefined,
    totalThoughts: row.total_thoughts ?? undefined,
    thought: row.thought,
    timestamp: row.timestamp,
    nextThoughtNeeded: row.next_thought_needed ?? undefined,
    isRevision: row.is_revision ?? undefined,
    revisesThought: row.revises_thought ?? undefined,
    branchId: row.branch_id ?? undefined,
    branchFromThought: row.branch_from_thought ?? undefined,
    thoughtType: row.thought_type as RawThoughtRecord['thoughtType'],
    confidence: row.confidence as RawThoughtRecord['confidence'],
    options: row.options as RawThoughtRecord['options'],
    actionResult: row.action_result as RawThoughtRecord['actionResult'],
    beliefs: row.beliefs as RawThoughtRecord['beliefs'],
    assumptionChange: row.assumption_change as RawThoughtRecord['assumptionChange'],
    contextData: row.context_data as RawThoughtRecord['contextData'],
    progressData: row.progress_data as RawThoughtRecord['progressData'],
    agentId: row.agent_id ?? undefined,
    agentName: row.agent_name ?? undefined,
    contentHash: row.content_hash ?? undefined,
    parentHash: row.parent_hash ?? undefined,
    critique: row.critique ?? undefined,
  }))

  const [entityResult, relationResult] = await Promise.all([
    supabase
      .from('entities')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', sessionRow.workspace_id),
    supabase
      .from('relations')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', sessionRow.workspace_id),
  ])

  const entityCount = entityResult.count ?? 0
  const relationCount = relationResult.count ?? 0

  const durationMs = sessionRow.completed_at
    ? new Date(sessionRow.completed_at).getTime() -
      new Date(sessionRow.created_at).getTime()
    : Date.now() - new Date(sessionRow.created_at).getTime()

  const typeCounts = thoughts.reduce(
    (acc, t) => {
      const type = t.thoughtType || 'reasoning'
      acc[type] = (acc[type] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const beliefCount = typeCounts['belief_snapshot'] || 0
  const thoughtCount = sessionRow.thought_count ?? thoughts.length

  const rawSession: RawSessionRecord = {
    id: sessionRow.id,
    title: sessionRow.title ?? undefined,
    tags: sessionRow.tags ?? undefined,
    createdAt: sessionRow.created_at,
    completedAt: sessionRow.completed_at ?? undefined,
    updatedAt: sessionRow.updated_at ?? undefined,
    status: (sessionRow.status || 'abandoned') as RawSessionRecord['status'],
  }
  const sessionVM = createSessionDetailVM(rawSession)
  if (sessionRow.thought_count != null) {
    sessionVM.thoughtCount = sessionRow.thought_count
  }

  const minutes = Math.round(durationMs / 60000)
  const durationLabel =
    minutes < 60
      ? `${minutes}m`
      : `${Math.floor(minutes / 60)}h ${minutes % 60}m`

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 bg-background min-h-[calc(100vh-theme(spacing.16))] text-foreground">
      <SessionDetailHeader
        session={sessionVM}
        workspaceSlug={workspaceSlug}
        activeView="explore"
      />

      {/* Explorer stats */}
      <div className="mb-8 flex flex-wrap gap-6 border-4 border-foreground bg-foreground/5 p-6">
        <Stat value={thoughtCount} label="thoughts" />
        <Stat value={durationLabel} label="duration" />
        <Stat value={beliefCount} label="belief snapshots" />
        <Stat value={entityCount} label="knowledge entities" />
        <Stat value={relationCount} label="relations" />
      </div>

      <ExplorerTimeline
        thoughts={thoughts}
        keyMoments={[]}
        showInlineCTAs={false}
      />
    </div>
  )
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono-terminal text-2xl font-black tabular-nums text-foreground md:text-3xl">
        {value}
      </span>
      <span className="font-mono-terminal text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60">
        {label}
      </span>
    </div>
  )
}
