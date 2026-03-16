import Link from 'next/link'
import type { SessionSummaryVM } from '@/lib/session/view-models'

type Props = {
  sessions: SessionSummaryVM[]
}

export function SessionsTableShell({ sessions }: Props) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-sm p-12 text-center">
        <h3 className="text-lg font-medium text-slate-200">No sessions yet</h3>
        <p className="mt-2 text-sm text-slate-400">
          Reasoning traces will appear here once agents run through Thoughtbox.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-sm overflow-hidden">
      <table className="min-w-full divide-y divide-slate-800/60">
        <thead className="bg-slate-950/50">
          <tr>
            <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Session
            </th>
            <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Status
            </th>
            <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Thoughts
            </th>
            <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Started
            </th>
            <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Duration
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {sessions.map((session) => (
            <tr key={session.id} className="group relative transition-colors hover:bg-slate-800/40">
              <td className="whitespace-nowrap px-6 py-4">
                <Link href={session.href} className="absolute inset-0">
                  <span className="sr-only">View session {session.shortId}</span>
                </Link>
                <div className="flex flex-col">
                  {session.title && (
                    <span className="text-sm font-medium text-slate-200">{session.title}</span>
                  )}
                  <span className="font-mono text-[12px] leading-5 text-slate-400">
                    {session.shortId}
                  </span>
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                {session.status === 'active' && (
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/20">
                    Active
                  </span>
                )}
                {session.status === 'completed' && (
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/20">
                    Completed
                  </span>
                )}
                {session.status === 'abandoned' && (
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/20">
                    Abandoned
                  </span>
                )}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-300">
                {session.thoughtCount ?? '—'}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-400">
                {session.startedAtLabel}
              </td>
              <td className="whitespace-nowrap px-6 py-4 font-mono text-[12px] leading-5 text-slate-400">
                {session.durationLabel}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
