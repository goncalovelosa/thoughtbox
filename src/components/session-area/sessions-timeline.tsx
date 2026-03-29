'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import type { SessionSummaryVM } from '@/lib/session/view-models'
import { STATUS_BADGE, STATUS_LABEL } from '@/lib/session/badge-styles'

type TimeRange = '24h' | '7d' | '30d'

type Props = {
  sessions: SessionSummaryVM[]
}

const RANGE_MS: Record<TimeRange, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
}

const RANGE_LABELS: Record<TimeRange, string> = {
  '24h': 'Last 24 hours',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function getBarOpacity(thoughtCount: number): number {
  if (thoughtCount <= 1) return 0.2
  if (thoughtCount <= 5) return 0.35
  if (thoughtCount <= 20) return 0.5
  if (thoughtCount <= 50) return 0.7
  return 0.9
}

function getBarHeight(thoughtCount: number): number {
  if (thoughtCount <= 1) return 8
  if (thoughtCount <= 5) return 14
  if (thoughtCount <= 20) return 22
  if (thoughtCount <= 50) return 30
  if (thoughtCount <= 100) return 38
  return 44
}

function formatTimeLabel(date: Date, range: TimeRange): string {
  if (range === '24h') return format(date, 'HH:mm')
  if (range === '7d') return format(date, 'EEE HH:mm')
  return format(date, 'MMM d')
}

export function SessionsTimeline({ sessions }: Props) {
  const [range, setRange] = useState<TimeRange>('7d')

  const now = Date.now()
  const rangeStart = now - RANGE_MS[range]

  const filtered = useMemo(() => {
    return sessions
      .filter((s) => {
        const start = new Date(s.startedAtISO).getTime()
        return start >= rangeStart
      })
      .sort(
        (a, b) =>
          new Date(a.startedAtISO).getTime() -
          new Date(b.startedAtISO).getTime(),
      )
  }, [sessions, rangeStart])

  // Generate time axis labels
  const tickCount = range === '24h' ? 6 : range === '7d' ? 7 : 6
  const ticks = useMemo(() => {
    const result: { label: string; pct: number }[] = []
    for (let i = 0; i <= tickCount; i++) {
      const t = rangeStart + (i / tickCount) * RANGE_MS[range]
      result.push({
        label: formatTimeLabel(new Date(t), range),
        pct: (i / tickCount) * 100,
      })
    }
    return result
  }, [rangeStart, range, tickCount])

  return (
    <div className="mb-8 rounded-none border border-foreground bg-background/80 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-foreground/20 px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
          Timeline
        </h2>
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

      {/* Timeline area */}
      <div className="relative px-4 pt-3 pb-6">
        {/* Time axis */}
        <div className="relative h-6 mb-2">
          {ticks.map((tick, i) => (
            <span
              key={i}
              className="absolute text-[10px] text-foreground/40 -translate-x-1/2"
              style={{ left: `${tick.pct}%` }}
            >
              {tick.label}
            </span>
          ))}
        </div>

        {/* Grid lines */}
        <div className="relative">
          <div className="absolute inset-0 pointer-events-none">
            {ticks.map((tick, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 w-px bg-foreground/10"
                style={{ left: `${tick.pct}%` }}
              />
            ))}
          </div>

          {/* Session bars */}
          <div
            className="relative"
            style={{
              minHeight: filtered.length === 0 ? '48px' : `${Math.max(48, filtered.length * 12 + 16)}px`,
            }}
          >
            {filtered.length === 0 ? (
              <div className="flex items-center justify-center h-12 text-sm text-foreground/40">
                No sessions in {RANGE_LABELS[range].toLowerCase()}
              </div>
            ) : (
              filtered.map((session, idx) => {
                const startMs = new Date(session.startedAtISO).getTime()
                const thoughtCount = session.thoughtCount ?? 0

                // End time: use duration label or default to 5min minimum for visibility
                const durationMatch = session.durationLabel.match(
                  /(?:(\d+)h\s*)?(?:(\d+)m\s*)?(?:(\d+)s)?/,
                )
                let durationMs = 5 * 60 * 1000 // 5min minimum for visibility
                if (durationMatch) {
                  const h = parseInt(durationMatch[1] || '0', 10)
                  const m = parseInt(durationMatch[2] || '0', 10)
                  const s = parseInt(durationMatch[3] || '0', 10)
                  const parsed = (h * 3600 + m * 60 + s) * 1000
                  if (parsed > 0) durationMs = Math.max(parsed, durationMs)
                }

                const leftPct = clamp(
                  ((startMs - rangeStart) / RANGE_MS[range]) * 100,
                  0,
                  100,
                )
                const widthPct = clamp(
                  (durationMs / RANGE_MS[range]) * 100,
                  0.5, // minimum bar width
                  100 - leftPct,
                )

                const barHeight = getBarHeight(thoughtCount)
                const opacity = getBarOpacity(thoughtCount)
                const topOffset = idx * 12 + 4

                const statusColor =
                  session.status === 'active'
                    ? 'rgb(52, 211, 153)' // emerald
                    : session.status === 'completed'
                      ? 'rgb(96, 165, 250)' // blue
                      : 'rgb(148, 163, 184)' // slate

                return (
                  <Link
                    key={session.id}
                    href={session.href}
                    className="absolute group"
                    style={{
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                      top: `${topOffset}px`,
                      height: `${barHeight}px`,
                      minWidth: '6px',
                    }}
                    title={`${session.title || session.shortId} — ${thoughtCount} thoughts — ${session.durationLabel}`}
                  >
                    <div
                      className="h-full w-full transition-all group-hover:brightness-125 group-hover:scale-y-110"
                      style={{
                        backgroundColor: statusColor,
                        opacity,
                      }}
                    />
                    {/* Label — only show for bars wide enough */}
                    {widthPct > 8 && (
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] font-medium text-background truncate pointer-events-none max-w-[calc(100%-12px)]">
                        {session.title || session.shortId}
                      </span>
                    )}
                    {/* Tooltip on hover */}
                    <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block z-20 pointer-events-none">
                      <div className="bg-foreground text-background text-[11px] px-2.5 py-1.5 whitespace-nowrap shadow-lg">
                        <div className="font-medium">
                          {session.title || session.shortId}
                        </div>
                        <div className="text-background/70">
                          {thoughtCount} thoughts &middot;{' '}
                          {session.durationLabel} &middot;{' '}
                          {session.status}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
