'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { RawThoughtRecord, ThoughtDisplayType } from '@/lib/session/view-models'
import { createThoughtViewModels } from '@/lib/session/view-models'
import { ThoughtRow } from '@/components/session-area/thought-row'
import { ThoughtCard } from '@/components/session-area/thought-card'

type KeyMoment = {
  thoughtNumber: number
  label: string
  why: string
}

type Props = {
  thoughts: RawThoughtRecord[]
  keyMoments: KeyMoment[]
}

const TYPE_LABELS: Record<string, string> = {
  reasoning: 'Reasoning',
  belief_snapshot: 'Belief',
  decision_frame: 'Decision',
  action_report: 'Action',
  assumption_update: 'Assumption',
  context_snapshot: 'Context',
  progress: 'Progress',
}

export function ExplorerTimeline({ thoughts }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<ThoughtDisplayType | 'all'>('all')
  const [visibleCount, setVisibleCount] = useState(30)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Transform raw thoughts to view models
  const { rows, details } = useMemo(() => {
    return createThoughtViewModels(thoughts as RawThoughtRecord[])
  }, [thoughts])

  // Type counts for filter chips
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const row of rows) {
      counts[row.displayType] = (counts[row.displayType] || 0) + 1
    }
    return counts
  }, [rows])

  // Filtered rows
  const filteredRows = useMemo(() => {
    if (activeFilter === 'all') return rows
    return rows.filter((r) => r.displayType === activeFilter)
  }, [rows, activeFilter])

  // Visible rows (lazy loading)
  const visibleRows = useMemo(() => {
    return filteredRows.slice(0, visibleCount)
  }, [filteredRows, visibleCount])

  // Intersection observer for lazy loading
  useEffect(() => {
    const el = loadMoreRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < filteredRows.length) {
          setVisibleCount((prev) => Math.min(prev + 20, filteredRows.length))
        }
      },
      { rootMargin: '200px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [visibleCount, filteredRows.length])

  // Handle expand/collapse
  const handleToggle = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }, [])

  // Listen for key moments nav clicks
  useEffect(() => {
    const handler = (e: Event) => {
      const { thoughtNumber } = (e as CustomEvent).detail
      const row = rows.find((r) => r.thoughtNumber === thoughtNumber)
      if (row) {
        setActiveFilter('all')
        setVisibleCount(Math.max(thoughtNumber + 10, 30))
        setTimeout(() => {
          setExpandedId(row.id)
        }, 100)
      }
    }
    window.addEventListener('explorer:expand-thought', handler)
    return () => window.removeEventListener('explorer:expand-thought', handler)
  }, [rows])

  // Handle URL fragment on mount
  useEffect(() => {
    const hash = window.location.hash
    if (hash.startsWith('#thought-')) {
      const num = parseInt(hash.slice(9), 10)
      if (!isNaN(num)) {
        const row = rows.find((r) => r.thoughtNumber === num)
        if (row) {
          setVisibleCount(Math.max(num + 10, 30))
          setTimeout(() => {
            setExpandedId(row.id)
            const el = document.getElementById(`thought-${num}`)
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }, 200)
        }
      }
    }
  }, [rows])

  return (
    <section className="border-b-4 border-foreground">
      {/* Filter chips */}
      <div className="sticky top-0 z-10 border-b-2 border-foreground bg-background px-6 py-3">
        <div className="flex flex-wrap gap-2">
          <FilterChip
            label="All"
            count={rows.length}
            active={activeFilter === 'all'}
            onClick={() => {
              setActiveFilter('all')
              setVisibleCount(30)
            }}
          />
          {Object.entries(typeCounts)
            .filter(([type]) => type !== 'reasoning')
            .sort(([, a], [, b]) => b - a)
            .map(([type, count]) => (
              <FilterChip
                key={type}
                label={TYPE_LABELS[type] || type}
                count={count}
                active={activeFilter === type}
                onClick={() => {
                  setActiveFilter(type as ThoughtDisplayType)
                  setVisibleCount(30)
                }}
              />
            ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="divide-y-0">
        {visibleRows.map((row) => {
          const isExpanded = expandedId === row.id

          return (
            <div key={row.id} id={`thought-${row.thoughtNumber}`}>
              {/* Inline CTA at thought 50 and 100 */}
              {activeFilter === 'all' &&
                (row.thoughtNumber === 50 || row.thoughtNumber === 100) && (
                  <InlineCTA thoughtNumber={row.thoughtNumber} total={rows.length} />
                )}

              <ThoughtRow
                row={row}
                isSelected={isExpanded}
                onClick={() => {
                  handleToggle(row.id)
                  history.replaceState(null, '', `#thought-${row.thoughtNumber}`)
                }}
              />

              {isExpanded && details[row.id] && (
                <div className="border-l-4 border-foreground ml-[84px] mr-4 mb-4">
                  <ThoughtCard detail={details[row.id]} />
                </div>
              )}
            </div>
          )
        })}

        {/* Load more sentinel */}
        {visibleCount < filteredRows.length && (
          <div ref={loadMoreRef} className="px-6 py-8 text-center">
            <span className="font-mono-terminal text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40">
              Loading more thoughts ({visibleCount} of {filteredRows.length})...
            </span>
          </div>
        )}

        {visibleCount >= filteredRows.length && filteredRows.length > 0 && (
          <div className="px-6 py-8 text-center border-t-2 border-foreground/10">
            <span className="font-mono-terminal text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40">
              End of session — {filteredRows.length} thoughts
            </span>
          </div>
        )}
      </div>
    </section>
  )
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`border-2 px-3 py-1 font-mono-terminal text-[10px] font-black uppercase tracking-widest transition-colors ${
        active
          ? 'border-foreground bg-foreground text-background'
          : 'border-foreground/20 bg-background text-foreground/60 hover:border-foreground/50'
      }`}
    >
      {label} ({count})
    </button>
  )
}

function InlineCTA({
  thoughtNumber,
  total,
}: {
  thoughtNumber: number
  total: number
}) {
  return (
    <div className="mx-6 my-4 border-2 border-foreground/20 bg-foreground/[0.02] px-6 py-4 text-center">
      <p className="font-mono-terminal text-xs font-black uppercase tracking-[0.15em] text-foreground/60 mb-2">
        This is thought {thoughtNumber} of {total}.
      </p>
      <p className="font-mono-terminal text-xs uppercase tracking-[0.1em] text-foreground/40 mb-3">
        Your agents reason like this too. You just can&apos;t see it.
      </p>
      <a
        href="/pricing"
        className="inline-block border-2 border-foreground bg-foreground px-4 py-1.5 font-mono-terminal text-[10px] font-black uppercase tracking-widest text-background transition-transform hover:-translate-y-0.5"
      >
        Try Thoughtbox Free
      </a>
    </div>
  )
}
