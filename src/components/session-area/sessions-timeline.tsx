'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
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
const LANE_HEIGHT = 36
const LANE_GAP = 4
const MIN_BAR_WIDTH_PCT = 1.5

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function parseDurationMs(label: string): number {
  const match = label.match(/(?:(\d+)h\s*)?(?:(\d+)m\s*)?(?:(\d+)s)?/)
  if (!match) return 0
  const h = parseInt(match[1] || '0', 10)
  const m = parseInt(match[2] || '0', 10)
  const s = parseInt(match[3] || '0', 10)
  return (h * 3600 + m * 60 + s) * 1000
}

function formatTimeLabel(date: Date, range: TimeRange): string {
  if (range === '24h') return format(date, 'HH:mm')
  if (range === '7d') return format(date, 'EEE d, HH:mm')
  return format(date, 'MMM d')
}

type PlacedSession = {
  session: SessionSummaryVM
  lane: number
  leftPct: number
  widthPct: number
  startMs: number
  endMs: number
}

function packIntoLanes(
  sessions: SessionSummaryVM[],
  rangeStart: number,
  rangeMs: number,
): PlacedSession[] {
  // Sort by start time
  const sorted = [...sessions].sort(
    (a, b) =>
      new Date(a.startedAtISO).getTime() -
      new Date(b.startedAtISO).getTime(),
  )

  // Each lane tracks when it's free (end time of last session in that lane)
  const laneEnds: number[] = []
  const placed: PlacedSession[] = []

  for (const session of sorted) {
    const startMs = new Date(session.startedAtISO).getTime()
    const durationMs = Math.max(
      parseDurationMs(session.durationLabel),
      // Minimum visual duration: scale with range so bars are always visible
      rangeMs * (MIN_BAR_WIDTH_PCT / 100),
    )
    const endMs = startMs + durationMs

    // Find first lane where this session fits (doesn't overlap)
    let lane = -1
    for (let i = 0; i < laneEnds.length; i++) {
      if (startMs >= laneEnds[i]) {
        lane = i
        break
      }
    }
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(0)
    }
    laneEnds[lane] = endMs

    const leftPct = clamp(
      ((startMs - rangeStart) / rangeMs) * 100,
      0,
      100,
    )
    const widthPct = clamp(
      (durationMs / rangeMs) * 100,
      MIN_BAR_WIDTH_PCT,
      100 - leftPct,
    )

    placed.push({ session, lane, leftPct, widthPct, startMs, endMs })
  }

  return placed
}

export function SessionsTimeline({ sessions }: Props) {
  const [range, setRange] = useState<TimeRange>('7d')
  const [showMinor, setShowMinor] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const now = Date.now()
  const rangeStart = now - RANGE_MS[range]
  const rangeMs = RANGE_MS[range]

  const { placed, minorCount, laneCount } = useMemo(() => {
    const inRange = sessions.filter(
      (s) => new Date(s.startedAtISO).getTime() >= rangeStart,
    )

    const major = inRange.filter(
      (s) => (s.thoughtCount ?? 0) >= MIN_THOUGHTS,
    )
    const minor = inRange.filter(
      (s) => (s.thoughtCount ?? 0) < MIN_THOUGHTS,
    )

    const toPlace = showMinor ? inRange : major
    const placedSessions = packIntoLanes(toPlace, rangeStart, rangeMs)
    const maxLane = placedSessions.reduce(
      (max, p) => Math.max(max, p.lane),
      -1,
    )

    return {
      placed: placedSessions,
      minorCount: minor.length,
      laneCount: maxLane + 1,
    }
  }, [sessions, rangeStart, rangeMs, showMinor])

  // Time axis ticks
  const tickCount = range === '24h' ? 8 : range === '7d' ? 7 : 6
  const ticks = useMemo(() => {
    const result: { label: string; pct: number }[] = []
    for (let i = 0; i <= tickCount; i++) {
      const t = rangeStart + (i / tickCount) * rangeMs
      result.push({
        label: formatTimeLabel(new Date(t), range),
        pct: (i / tickCount) * 100,
      })
    }
    return result
  }, [rangeStart, rangeMs, range, tickCount])

  const contentHeight = Math.max(
    60,
    laneCount * (LANE_HEIGHT + LANE_GAP) + 8,
  )

  return (
    <div className="mb-8 rounded-none border border-foreground bg-background/80 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-foreground/20 px-4 py-3">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
            Timeline
          </h2>
          {minorCount > 0 && (
            <button
              type="button"
              onClick={() => setShowMinor(!showMinor)}
              className="text-[11px] text-foreground/40 hover:text-foreground transition-colors"
            >
              {showMinor
                ? 'Hide minor'
                : `+ ${minorCount} minor`}
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

      {/* Timeline */}
      <div className="px-4 pt-2 pb-4">
        {/* Time axis */}
        <div className="relative h-5 mb-1">
          {ticks.map((tick, i) => (
            <span
              key={i}
              className="absolute text-[10px] text-foreground/40 -translate-x-1/2 whitespace-nowrap"
              style={{ left: `${tick.pct}%` }}
            >
              {tick.label}
            </span>
          ))}
        </div>

        {/* Lanes */}
        <div className="relative" style={{ height: `${contentHeight}px` }}>
          {/* Grid lines */}
          {ticks.map((tick, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-px bg-foreground/8"
              style={{ left: `${tick.pct}%` }}
            />
          ))}

          {/* "Now" marker */}
          <div
            className="absolute top-0 bottom-0 w-px bg-red-500/40"
            style={{ left: '100%' }}
          />

          {placed.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-foreground/30">
              No sessions in range
            </div>
          ) : (
            placed.map(({ session, lane, leftPct, widthPct }) => {
              const thoughtCount = session.thoughtCount ?? 0
              const isMinor = thoughtCount < MIN_THOUGHTS
              const isHovered = hoveredId === session.id

              const bgColor =
                session.status === 'active'
                  ? 'bg-emerald-500'
                  : session.status === 'completed'
                    ? 'bg-blue-500'
                    : 'bg-slate-500'

              const opacity = isMinor
                ? 'opacity-20'
                : thoughtCount >= 50
                  ? 'opacity-90'
                  : thoughtCount >= 10
                    ? 'opacity-60'
                    : 'opacity-40'

              const top = lane * (LANE_HEIGHT + LANE_GAP) + 4

              return (
                <Link
                  key={session.id}
                  href={session.href}
                  className="absolute group"
                  style={{
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                    top: `${top}px`,
                    height: `${LANE_HEIGHT}px`,
                  }}
                  onMouseEnter={() => setHoveredId(session.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div
                    className={`h-full w-full ${bgColor} ${opacity} transition-opacity ${
                      isHovered ? '!opacity-100 ring-1 ring-foreground/40' : ''
                    }`}
                  />

                  {/* Label inside bar */}
                  {widthPct > 6 && (
                    <div className="absolute inset-0 flex items-center px-2 overflow-hidden pointer-events-none">
                      <span className="text-[10px] font-medium text-white truncate drop-shadow-sm">
                        {session.title || session.shortId}
                      </span>
                    </div>
                  )}

                  {/* Thought count badge */}
                  {widthPct > 4 && (
                    <div className="absolute top-0.5 right-1 pointer-events-none">
                      <span className="text-[9px] font-mono text-white/70 drop-shadow-sm">
                        {thoughtCount}t
                      </span>
                    </div>
                  )}

                  {/* Tooltip */}
                  {isHovered && (
                    <div className="absolute left-0 bottom-full mb-1 z-30 pointer-events-none">
                      <div className="bg-foreground text-background text-[11px] px-3 py-2 shadow-lg whitespace-nowrap">
                        <div className="font-medium">
                          {session.title || session.shortId}
                        </div>
                        <div className="text-background/70 mt-0.5">
                          {thoughtCount} thoughts &middot;{' '}
                          {session.durationLabel} &middot;{' '}
                          {session.status}
                        </div>
                        {session.tags.length > 0 && (
                          <div className="text-background/50 mt-0.5">
                            {session.tags.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Link>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
