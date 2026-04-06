'use client'

import { formatOtelDisplayLabel, type ThoughtDetailVM, type OtelEventVM } from '@/lib/session/view-models'
import { BADGE_BASE, REVISION_BADGE } from '@/lib/session/badge-styles'
import { ThoughtCard } from './thought-card'
import { ThoughtMetadataDisclosure } from './thought-metadata-disclosure'
import { Activity, BarChart3 } from 'lucide-react'

type Props = {
  detail: ThoughtDetailVM | OtelEventVM | null
  onPrev?: () => void
  onNext?: () => void
  hasPrev?: boolean
  hasNext?: boolean
  positionIndex?: number
  totalCount?: number
  searchQuery?: string
}

function isOtelEvent(d: ThoughtDetailVM | OtelEventVM): d is OtelEventVM {
  return 'kind' in d && d.kind === 'otel_event'
}

function OtelEventDetail({ detail }: { detail: OtelEventVM }) {
  const Icon = detail.eventType === 'metric' ? BarChart3 : Activity

  return (
    <div className="px-5 py-4 space-y-4">
      {/* Event info */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-blue-500" aria-hidden="true" />
          <span className="text-sm font-semibold text-foreground">{detail.eventName}</span>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span>Type: {detail.eventType}</span>
          {detail.severity && <span>Severity: {detail.severity}</span>}
          <span title={detail.absoluteTimeLabel}>{detail.relativeTimeLabel}</span>
        </div>
      </div>

      {/* Metric value */}
      {detail.metricValue != null && (
        <div className="rounded-none border border-foreground/20 bg-muted/30 p-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Metric Value</p>
          <p className="text-2xl font-bold text-foreground tabular-nums">
            {detail.metricValue.toLocaleString(undefined, { maximumFractionDigits: 4 })}
          </p>
        </div>
      )}

      {/* Body */}
      {detail.body && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Body</p>
          <pre className="text-xs font-mono bg-muted text-foreground p-3 overflow-x-auto whitespace-pre-wrap leading-relaxed">
            {detail.body}
          </pre>
        </div>
      )}

      {/* Event attributes */}
      {Object.keys(detail.eventAttrs).length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Event Attributes</p>
          <div className="rounded-none border border-foreground/20 divide-y divide-foreground/10">
            {Object.entries(detail.eventAttrs).map(([key, value]) => (
              <div key={key} className="flex gap-3 px-3 py-2 text-xs">
                <span className="font-mono text-muted-foreground shrink-0 w-40 truncate" title={key}>{key}</span>
                <span className="font-mono text-foreground break-all">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function ThoughtDetailPanel({ detail, onPrev, onNext, hasPrev, hasNext, positionIndex, totalCount, searchQuery }: Props) {
  if (!detail) {
    return (
      <div className="p-12 text-center text-sm text-foreground my-auto">
        Select an item to view details
      </div>
    )
  }

  const isOtel = isOtelEvent(detail)
  const headerTitle = (() => {
    if (isOtel) {
      const { label, detail: qualifier } = formatOtelDisplayLabel(detail.eventName, detail.eventAttrs)
      return qualifier ? `${label} · ${qualifier}` : label
    }
    return `Thought #${detail.thoughtNumber}`
  })()

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="border-b border-foreground px-5 py-4 shrink-0 bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Prev/Next navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={onPrev}
                disabled={!hasPrev}
                className="flex h-7 w-7 items-center justify-center rounded-none border border-foreground/30 text-foreground transition-colors hover:bg-foreground/10 disabled:opacity-20 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:outline-none"
                aria-label="Previous item"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button
                onClick={onNext}
                disabled={!hasNext}
                className="flex h-7 w-7 items-center justify-center rounded-none border border-foreground/30 text-foreground transition-colors hover:bg-foreground/10 disabled:opacity-20 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:outline-none"
                aria-label="Next item"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
              {positionIndex != null && totalCount != null && (
                <span className="text-xs font-mono text-foreground/60 tabular-nums">
                  {positionIndex + 1}/{totalCount}
                </span>
              )}
            </div>

            <h2 className="text-lg font-semibold text-foreground flex items-center gap-3">
              {isOtel && (
                <Activity className="h-4 w-4 text-blue-500 shrink-0" aria-hidden="true" />
              )}
              {headerTitle}
              {!isOtel && detail.branchLabel && (
                <span className={`${BADGE_BASE} bg-background text-foreground`}>
                  {detail.branchLabel}
                </span>
              )}
              {!isOtel && detail.isRevision && (
                <span className={`${BADGE_BASE} ${REVISION_BADGE}`}>
                  Revision
                </span>
              )}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-foreground">
            {isOtel ? (
              <>
                <span className="font-mono text-foreground/50">{detail.eventType}</span>
                <span>•</span>
                <span title={detail.absoluteTimeLabel}>{detail.relativeTimeLabel}</span>
              </>
            ) : (
              <>
                <span className="font-mono text-foreground/50">{detail.shortId}</span>
                <span>•</span>
                <span title={detail.absoluteTimeLabel}>{detail.relativeTimeLabel}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div>
        {isOtel ? (
          <OtelEventDetail detail={detail} />
        ) : (
          <>
            <ThoughtCard detail={detail} searchQuery={searchQuery} />
            <ThoughtMetadataDisclosure detail={detail} />
          </>
        )}
      </div>
    </div>
  )
}
