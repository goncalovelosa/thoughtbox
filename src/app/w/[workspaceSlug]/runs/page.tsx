import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Runs' }

type Props = { params: Promise<{ workspaceSlug: string }> }

const statusColors: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-500/20',
  active: 'bg-blue-100 text-blue-700 ring-1 ring-blue-500/20',
  abandoned: 'bg-rose-100 text-rose-700 ring-1 ring-rose-500/20',
}

// Placeholder rows shown until real data is available (WS-04/WS-05)
const mockRuns = [
  {
    id: 'run_placeholder_1',
    status: 'completed',
    thoughts: 12,
    started: '2026-03-13 12:00 UTC',
    duration: '3.2s',
  },
  {
    id: 'run_placeholder_2',
    status: 'abandoned',
    thoughts: 2,
    started: '2026-03-13 11:45 UTC',
    duration: '0.8s',
  },
]

export default async function RunsPage({ params }: Props) {
  await params

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Runs</h1>
        <p className="mt-1 text-sm text-slate-500">
          Every MCP session logged in this workspace.{' '}
          <span className="italic text-slate-400">(Showing placeholder data — real runs appear once WS-04 is deployed.)</span>
        </p>
      </div>

      {/* Filters row (stub) */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          disabled
          placeholder="Search runs…"
          className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-400 placeholder-slate-400 disabled:cursor-not-allowed"
        />
        <select
          disabled
          className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-400 disabled:cursor-not-allowed"
        >
          <option>All statuses</option>
          <option>Succeeded</option>
          <option>Failed</option>
          <option>Running</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Run ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Thoughts
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Started
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Duration
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mockRuns.map((run) => (
              <tr key={run.id} className="hover:bg-slate-50 transition-colors">
                <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-slate-600">
                  {run.id}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[run.status]}`}
                  >
                    {run.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                  {run.thoughts}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-400">
                  {run.started}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-400">
                  {run.duration}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
