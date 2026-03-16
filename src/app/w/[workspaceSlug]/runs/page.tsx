import type { Metadata } from 'next'
import { SessionsIndexHeader } from '@/components/session-area/sessions-index-header'
import { SessionsIndexControls } from '@/components/session-area/sessions-index-controls'
import { SessionsTableShell } from '@/components/session-area/sessions-table-shell'
import { createSessionSummaryVM, type RawSessionRecord } from '@/lib/session/view-models'
import { createMcpClient } from '@/lib/supabase/mcp'

export const metadata: Metadata = { title: 'Runs' }

type Props = { params: Promise<{ workspaceSlug: string }> }

export default async function RunsPage({ params }: Props) {
  const { workspaceSlug } = await params
  
  // Data fetch from Supabase
  const supabase = createMcpClient(workspaceSlug)
  
  const { data: rawSessions, error } = await supabase
    .from('sessions')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(100)
    
  if (error) {
    console.error('Failed to fetch sessions:', error)
    // Could render an error state component here instead, but for now fallback to empty array
  }

  // Normalize to View Models
  const sessions = (rawSessions || []).map(row => {
    // Adapter mapping from snake_case DB columns to camelCase RawSessionRecord
    const raw: RawSessionRecord = {
      id: row.id,
      title: row.title,
      tags: row.tags,
      createdAt: row.created_at,
      completedAt: row.completed_at,
      updatedAt: row.updated_at,
      status: row.status || 'abandoned', // Note: database schema doesn't define status yet, this may need migration
      // thoughts array is not needed for the summary VM, it relies on thought_count if thoughts is undefined
    }
    
    const vm = createSessionSummaryVM(raw, workspaceSlug)
    
    // Override the thoughtCount in the VM with the denormalized DB column if available
    if (row.thought_count != null) {
      vm.thoughtCount = row.thought_count
    }
    
    return vm
  })

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 bg-slate-950 min-h-[calc(100vh-theme(spacing.16))]">
      <SessionsIndexHeader />
      <SessionsIndexControls />
      <SessionsTableShell sessions={sessions} />
    </div>
  )
}
