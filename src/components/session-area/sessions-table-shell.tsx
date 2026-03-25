import Link from 'next/link'
import type { SessionSummaryVM } from '@/lib/session/view-models'
import { BADGE_BASE, STATUS_BADGE, STATUS_LABEL } from '@/lib/session/badge-styles'

type Props = {
  sessions: SessionSummaryVM[]
}

export function SessionsTableShell({ sessions }: Props) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-none border border-foreground bg-background/80 shadow-sm p-12 text-center">
        <h3 className="text-lg font-medium text-foreground">No sessions yet</h3>
        <p className="mt-2 text-sm text-foreground">
          Reasoning traces will appear here once agents run through Thoughtbox.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-none border border-foreground bg-background/80 shadow-sm overflow-hidden">
      <table className="min-w-full divide-y divide-slate-800/60">
        <thead className="bg-background/50">
          <tr>
            <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground">
              Session
            </th>
            <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground">
              Status
            </th>
            <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground">
              Thoughts
            </th>
            <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground">
              Started
            </th>
            <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground min-w-[5rem]">
              Duration
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {sessions.map((session) => (
            <tr key={session.id} className="group relative transition-colors hover:bg-background/40">
              <td className="whitespace-nowrap px-6 py-4">
                <Link href={session.href} className="absolute inset-0">
                  <span className="sr-only">View session {session.shortId}</span>
                </Link>
                <div className="flex flex-col">
                  {session.title && (
                    <span className="text-sm font-medium text-foreground">{session.title}</span>
                  )}
                  <span className="font-mono text-[12px] leading-5 text-foreground">
                    {session.shortId}
                  </span>
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <span className={`${BADGE_BASE} ${STATUS_BADGE[session.status]}`}>
                  {STATUS_LABEL[session.status]}
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-foreground">
                {session.thoughtCount ?? '—'}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-foreground">
                {session.startedAtLabel}
              </td>
              <td className="whitespace-nowrap px-6 py-4 font-mono text-[12px] leading-5 text-foreground">
                {session.durationLabel}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
