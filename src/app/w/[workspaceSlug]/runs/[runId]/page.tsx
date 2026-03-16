import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SessionDetailHeader } from '@/components/session-area/session-detail-header'
import { SessionTraceExplorer } from '@/components/session-area/session-trace-explorer'
import { 
  createSessionDetailVM, 
  type RawSessionRecord,
  type RawThoughtRecord
} from '@/lib/session/view-models'
import { createMcpClient } from '@/lib/supabase/mcp'

export const metadata: Metadata = { title: 'Session' }

type Props = { params: Promise<{ workspaceSlug: string, runId: string }> }

export default async function SessionDetailPage({ params }: Props) {
  const { workspaceSlug, runId } = await params

  const supabase = createMcpClient(workspaceSlug)
  
  // Fetch session details - ensure we get workspace_id for realtime
  const { data: sessionRow, error: sessionError } = await supabase
    .from('sessions')
    .select('*, workspace_id')
    .eq('id', runId)
    .single()
    
  if (sessionError || !sessionRow) {
    console.error('Failed to fetch session:', sessionError)
    notFound()
  }

  // Fetch thoughts for the session
  const { data: thoughtRows, error: thoughtsError } = await supabase
    .from('thoughts')
    .select('*')
    .eq('session_id', runId)
    .order('thought_number', { ascending: true })
    
  if (thoughtsError) {
    console.error('Failed to fetch thoughts:', thoughtsError)
    // We'll proceed with empty thoughts rather than fully failing the page
  }

  // Map Session
  const rawSession: RawSessionRecord = {
    id: sessionRow.id,
    title: sessionRow.title,
    tags: sessionRow.tags,
    createdAt: sessionRow.created_at,
    completedAt: sessionRow.completed_at,
    updatedAt: sessionRow.updated_at,
    status: sessionRow.status || 'abandoned'
  }
  const sessionVM = createSessionDetailVM(rawSession)
  
  // Override the thoughtCount in the VM with the denormalized DB column if available
  if (sessionRow.thought_count != null) {
    sessionVM.thoughtCount = sessionRow.thought_count
  }

  const rawThoughts: RawThoughtRecord[] = (thoughtRows || []).map(row => ({
    id: row.id,
    thoughtNumber: row.thought_number,
    totalThoughts: row.total_thoughts,
    thought: row.thought,
    timestamp: row.timestamp,
    nextThoughtNeeded: row.next_thought_needed,
    isRevision: row.is_revision,
    revisesThought: row.revises_thought,
    branchId: row.branch_id,
    branchFromThought: row.branch_from_thought,
    thoughtType: row.thought_type,
    confidence: row.confidence,
    options: row.options,
    actionResult: row.action_result,
    beliefs: row.beliefs,
    assumptionChange: row.assumption_change,
    contextData: row.context_data,
    progressData: row.progress_data,
    agentId: row.agent_id,
    agentName: row.agent_name,
    contentHash: row.content_hash,
    parentHash: row.parent_hash,
    critique: row.critique
  }))

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 bg-slate-950 min-h-[calc(100vh-theme(spacing.16))] text-slate-100">
      <SessionDetailHeader session={sessionVM} workspaceSlug={workspaceSlug} />
      
      <SessionTraceExplorer 
        initialThoughts={rawThoughts}
        workspaceId={sessionRow.workspace_id}
        sessionId={runId}
      />
    </div>
  )
}
