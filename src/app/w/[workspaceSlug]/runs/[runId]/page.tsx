import type { Metadata } from 'next'
import { SessionDetailHeader } from '@/components/session-area/session-detail-header'
import { SessionTraceExplorer } from '@/components/session-area/session-trace-explorer'
import type { SessionDetailVM } from '@/lib/session/view-models'

export const metadata: Metadata = { title: 'Session' }

type Props = { params: Promise<{ workspaceSlug: string, runId: string }> }

// Temporary mock data until data layer is connected
const mockSession: SessionDetailVM = {
  id: 'sess_mock123',
  shortId: 'sess_mo',
  title: 'Setup Hooks Workspace',
  status: 'completed',
  tags: ['cli', 'setup'],
  startedAtISO: '2026-03-16T10:00:00Z',
  startedAtLabel: 'Mar 16, 2026 10:00',
  completedAtISO: '2026-03-16T10:05:00Z',
  durationLabel: '300.0s',
  thoughtCount: 42,
  lastUpdatedAtISO: '2026-03-16T10:05:00Z',
  isLiveCapable: false
}

export default async function SessionDetailPage({ params }: Props) {
  const { workspaceSlug } = await params

  // TODO: Fetch real session and thoughts here

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 bg-slate-950 min-h-[calc(100vh-theme(spacing.16))] text-slate-100">
      <SessionDetailHeader session={mockSession} workspaceSlug={workspaceSlug} />
      
      <SessionTraceExplorer 
        rows={[]} // TODO
        details={{}} // TODO
      />
    </div>
  )
}
