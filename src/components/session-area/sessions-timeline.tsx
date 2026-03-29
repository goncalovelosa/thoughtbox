'use client'

import { useMemo } from 'react'
import { format } from 'date-fns'
import type { SessionSummaryVM } from '@/lib/session/view-models'

type TimeRange = '24h' | '7d' | '30d'

type Props = {
  sessions: SessionSummaryVM[]
  range: TimeRange
  onRangeChange: (range: TimeRange) => void
  selectedBucket: number | null
  onBucketClick: (bucket: number | null) => void
}

const RANGE_MS: Record<TimeRange, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
}

const BUCKET_MS: Record<TimeRange, number> = {
  '24h': 60 * 60 * 1000,
  '7d': 6 * 60 * 60 * 1000,
  '30d': 24 * 60 * 60 * 1000,
}

const BUCKET_COUNT: Record<TimeRange, number> = {
  '24h': 24,
  '7d': 28,
  '30d': 30,
}

function formatBucketLabel(
  timestamp: number,
  range: TimeRange,
  index: number,
  total: number,
): string | null {
  const d = new Date(timestamp)
  if (range === '24h') {
    if (index % 4 !== 0) return null
    return format(d, 'HH:mm')
  }
  if (range === '7d') {
    if (index % 4 !== 0) return null
    return format(d, 'EEE')
  }
  if (index % 7 !== 0 && index !== total - 1) return null
  return format(d, 'MMM d')
}

const BAR_MAX_HEIGHT = 56

export function SessionsTimeline({
  sessions,
  range,
  onRangeChange,
  selectedBucket,
  onBucketClick,
}: Props) {
  const now = Date.now()
  const rangeStart = now - RANGE_MS[range]
  const bucketMs = BUCKET_MS[range]
  const bucketCount = BUCKET_COUNT[range]

  const buckets = useMemo(() => {
    const counts = new Array(bucketCount).fill(0) as number[]

    for (const s of sessions) {
      const startMs = new Date(s.startedAtISO).getTime()
      if (startMs < rangeStart) continue
      const idx = Math.min(
        Math.floor((startMs - rangeStart) / bucketMs),
        bucketCount - 1,
      )
      counts[idx] += s.thoughtCount ?? 0
    }

    const max = Math.max(1, ...counts)

    return counts.map((count, i) => ({
      index: i,
      count,
      heightPct: count > 0 ? Math.max(4, (count / max) * 100) : 0,
      timestamp: rangeStart + i * bucketMs,
    }))
  }, [sessions, rangeStart, bucketMs, bucketCount])

  return (
    <div className="mb-6 rounded-none border border-foreground bg-background/80 shadow-sm">
      <div className="flex items-center justify-between border-b border-foreground/20 px-4 py-2.5">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
          Activity
        </h2>
        <div className="flex gap-1">
          {(Object.keys(RANGE_MS) as TimeRange[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onRangeChange(r)}
              className={`px-2 py-0.5 text-[11px] font-medium transition-colors ${
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

      <div className="px-4 pt-2 pb-1">
        <div
          className="flex items-end gap-px"
          style={{ height: `${BAR_MAX_HEIGHT}px` }}
        >
          {buckets.map((bucket) => {
            const isSelected = selectedBucket === bucket.index
            const hasData = bucket.count > 0

            return (
              <button
                key={bucket.index}
                type="button"
                onClick={() =>
                  onBucketClick(isSelected ? null : bucket.index)
                }
                className="flex-1 relative group"
                style={{ height: '100%' }}
                title={
                  hasData
                    ? `${bucket.count} thoughts — ${format(new Date(bucket.timestamp), 'MMM d, HH:mm')}`
                    : undefined
                }
              >
                <div
                  className={`absolute bottom-0 left-0 right-0 transition-all ${
                    isSelected
                      ? 'bg-blue-400'
                      : hasData
                        ? 'bg-foreground/40 group-hover:bg-foreground/60'
                        : 'bg-foreground/5'
                  }`}
                  style={{
                    height: hasData ? `${bucket.heightPct}%` : '1px',
                  }}
                />
              </button>
            )
          })}
        </div>

        <div className="flex mt-1 mb-1">
          {buckets.map((bucket, i) => {
            const label = formatBucketLabel(
              bucket.timestamp,
              range,
              i,
              buckets.length,
            )
            if (!label) return <div key={i} className="flex-1" />
            return (
              <div
                key={i}
                className="flex-1 text-[9px] text-foreground/30 text-center"
              >
                {label}
              </div>
            )
          })}
        </div>
      </div>

      {selectedBucket !== null && (
        <div className="border-t border-foreground/10 px-4 py-1.5 flex items-center justify-between">
          <span className="text-[11px] text-foreground/60">
            Showing sessions from{' '}
            <span className="text-foreground font-medium">
              {format(
                new Date(rangeStart + selectedBucket * bucketMs),
                'MMM d, HH:mm',
              )}
            </span>
            {' — '}
            <span className="text-foreground font-medium">
              {format(
                new Date(rangeStart + (selectedBucket + 1) * bucketMs),
                'HH:mm',
              )}
            </span>
          </span>
          <button
            type="button"
            onClick={() => onBucketClick(null)}
            className="text-[11px] text-foreground/40 hover:text-foreground"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  )
}

export function sessionInBucket(
  session: SessionSummaryVM,
  bucketIndex: number,
  range: TimeRange,
): boolean {
  const now = Date.now()
  const rangeStart = now - RANGE_MS[range]
  const bucketMs = BUCKET_MS[range]
  const bucketStart = rangeStart + bucketIndex * bucketMs
  const bucketEnd = bucketStart + bucketMs
  const sessionStart = new Date(session.startedAtISO).getTime()
  return sessionStart >= bucketStart && sessionStart < bucketEnd
}

export type { TimeRange }
