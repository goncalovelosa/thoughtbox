import type { Metadata } from 'next'
import { SessionsIndexHeader } from '@/components/session-area/sessions-index-header'
import { SessionsIndexControls } from '@/components/session-area/sessions-index-controls'
import { SessionsTableShell } from '@/components/session-area/sessions-table-shell'
import type { SessionSummaryVM } from '@/lib/session/view-models'

export const metadata: Metadata = { title: 'Runs' }

type Props = { params: Promise<{ workspaceSlug: string }> }

// Placeholder rows shown until real data is available (WS-04/WS-05)
// Now using the SessionSummaryVM format instead of the old raw format
const mockRuns: SessionSummaryVM[] = [
  {
    id: 'run_placeholder_1',
    shortId: 'run_pla',
    status: 'completed',
    thoughtCount: 12,
    startedAtISO: '2026-03-13T12:00:00Z',
    startedAtLabel: '2026-03-13 12:00 UTC',
    durationLabel: '3.2s',
    href: '#' // Will be dynamically generated when real data is fetched
  },
  {
    id: 'run_placeholder_2',
    shortId: 'run_pla',
    status: 'abandoned',
    thoughtCount: 2,
    startedAtISO: '2026-03-13T11:45:00Z',
    startedAtLabel: '2026-03-13 11:45 UTC',
    durationLabel: '0.8s',
    href: '#'
  },
]

export default async function RunsPage({ params }: Props) {
  const { workspaceSlug } = await params

  // Inject real workspace slug into mock hrefs for now
  const sessions = mockRuns.map(run => ({
    ...run,
    href: `/w/${workspaceSlug}/runs/${run.id}`
  }))

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 bg-slate-950 min-h-[calc(100vh-theme(spacing.16))]">
      <SessionsIndexHeader />
      <SessionsIndexControls />
      <SessionsTableShell sessions={sessions} />
    </div>
  )
}
