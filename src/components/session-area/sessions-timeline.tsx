'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { format, formatDistanceStrict } from 'date-fns'
import type { SessionSummaryVM } from '@/lib/session/view-models'

type TimeRange = '24h' | '7d' | '30d'

type Props = {
  sessions: SessionSummaryVM[]
}

const RANGE_MS: Record<TimeRange, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
}

const MIN_THOUGHTS = 3

function thoughtBar(count: number, maxCount: number): number {
  if (maxCount <= 0) return 5
  return Math.max(5, Math.round((count / maxCount) * 100))
}

export function SessionsTimeline({ sessions }: Props) {
  const [range, setRange] = useState<TimeRange>('7d')
  const [showMinor, setShowMinor] = useState(false)

  const now = Date.now()
  const rangeStart = now - RANGE_MS[range]

  const { major, minor } = useMemo(() => {
    const inRange = sessions
      .filter((s) => new Date(s.startedAtISO).getTime() >= rangeStart)
      .sort(
        (a, b) =>
          new Date(b.startedAtISO).getTime() -
          new Date(a.startedAtISO).getTime(),
      )

    const majorSessions: SessionSummaryVM[] = []
    const minorSessions: SessionSummaryVM[] = []

    for (const s of inRange) {
      if ((s.thoughtCount ?? 0) >= MIN_THOUGHTS) {
        majorSessions.push(s)
      } else {
        minorSessions.push(s)
      }
    }

    return { major: majorSessions, minor: minorSessions }
  }, [sessions, rangeStart])

  const maxThoughts = useMemo(
    () => Math.max(1, ...major.map((s) => s.thoughtCount ?? 0)),
    [major],
  )

  const displayed = showMinor ? [...major, ...minor].sort(
    (a, b) =>
      new Date(b.startedAtISO).getTime() -
      new Date(a.startedAtISO).getTime(),
  ) : major

  return (
    <div className="mb-8 rounded-none border border-foreground bg-background/80 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-foreground/20 px-4 py-3">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
            Timeline
          </h2>
          {minor.length > 0 && (
            <button
              type="button"
              onClick={() => setShowMinor(!showMinor)}
              className="text-[11px] text-foreground/40 hover:text-foreground transition-colors"
            >
              {showMinor
                ? 'Hide minor sessions'
                : `+ ${minor.length} minor session${minor.length === 1 ? '' : 's'} (&lt;${MIN_THOUGHTS} thoughts)`}
            </button>
          )}
        </div>
        <div className="flex gap-1">
          {(Object.keys(RANGE_MS) as TimeRange[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`px-2.5 py-1 text-[11px] font-medium transition-colors ${
                range === r
                  ? 'bg-foreground text-background'
                  : 'text-foreground/50 hover:text-foreground'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Session rows */}
      <div className="divide-y divide-foreground/10">
        {displayed.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-foreground/40">
            No sessions with {MIN_THOUGHTS}+ thoughts in the last{' '}
            {range === '24h' ? '24 hours' : range === '7d' ? '7 days' : '30 days'}
          </div>
        ) : (
          displayed.map((session) => {
            const thoughtCount = session.thoughtCount ?? 0
            const barPct = thoughtBar(thoughtCount, maxThoughts)
            const startDate = new Date(session.startedAtISO)
            const isMinor = thoughtCount < MIN_THOUGHTS

            const statusColor =
              session.status === 'active'
                ? 'bg-emerald-500'
                : session.status === 'completed'
                  ? 'bg-blue-500'
                  : 'bg-slate-500'

            const barOpacity = isMinor ? 'opacity-30' : ''

            return (
              <Link
                key={session.id}
                href={session.href}
                className="flex items-center gap-4 px-4 py-2.5 hover:bg-foreground/5 transition-colors group"
              >
                {/* Timestamp */}
                <div className="w-28 shrink-0 text-right">
                  <div className="text-[11px] font-mono text-foreground/60">
                    {format(startDate, range === '30d' ? 'MMM d HH:mm' : 'EEE HH:mm')}
                  </div>
                </div>

                {/* Status dot */}
                <div className={`w-2 h-2 rounded-full shrink-0 ${statusColor}`} />

                {/* Bar + info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`text-sm font-medium truncate ${isMinor ? 'text-foreground/40' : 'text-foreground'}`}>
                      {session.title || session.shortId}
                    </span>
                    {session.tags.length > 0 && (
                      <div className="flex gap-1 shrink-0">
                        {session.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium bg-background text-foreground/30 ring-1 ring-foreground/10"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Thought count bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-foreground/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${statusColor} ${barOpacity} transition-all`}
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-foreground/40 w-20 shrink-0">
                      {thoughtCount}t &middot; {session.durationLabel}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
