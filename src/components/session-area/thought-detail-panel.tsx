'use client'

import { formatOtelDisplayLabel, type ThoughtDetailVM, type OtelEventVM } from '@/lib/session/view-models'
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
    <div className="px-5 py-6 space-y-8">
      {/* Event info */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 border-b-4 border-foreground pb-4">
          <div className="w-10 h-10 border-2 border-foreground flex items-center justify-center bg-foreground text-background">
            <Icon className="h-6 w-6" aria-hidden="true" strokeWidth={3} />
          </div>
          <span className="text-2xl font-black uppercase tracking-tight text-foreground">{detail.eventName}</span>
        </div>
        <div className="flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/70">
          <span className="border-2 border-foreground/20 px-2 py-1">TYPE: {detail.eventType}</span>
          {detail.severity && <span className="border-2 border-foreground/20 px-2 py-1">SEVERITY: {detail.severity}</span>}
          <span className="border-2 border-foreground/20 px-2 py-1" title={detail.absoluteTimeLabel}>{detail.relativeTimeLabel}</span>
        </div>
      </div>

      {/* Metric value */}
      {detail.metricValue != null && (
        <div className="border-4 border-foreground p-6 relative group">
          <div className="absolute top-0 right-0 w-8 h-8 diagonal-lines opacity-10"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60 mb-2">Metric Value</p>
          <p className="text-5xl font-mono-terminal font-black tracking-tighter text-foreground cursor-blink">
            {detail.metricValue.toLocaleString(undefined, { maximumFractionDigits: 4 })}
          </p>
        </div>
      )}

      {/* Body */}
      {detail.body && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60 mb-2">Body</p>
          <pre className="font-mono-terminal text-[12px] bg-foreground text-background p-4 overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-brutal-sm">
            {detail.body}
          </pre>
        </div>
      )}

      {/* Event attributes */}
      {Object.keys(detail.eventAttrs).length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60 mb-2">Event Attributes</p>
          <div className="border-2 border-foreground divide-y-2 divide-foreground bg-background">
            {Object.entries(detail.eventAttrs).map(([key, value]) => (
              <div key={key} className="flex gap-4 p-3 text-xs">
                <span className="font-mono-terminal text-[10px] uppercase tracking-wider text-foreground/60 shrink-0 w-40 truncate" title={key}>{key}</span>
                <span className="font-mono-terminal text-foreground break-all">
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
    <div className="flex flex-col h-full overflow-y-auto relative z-10">
      {/* Header */}
      <div className="border-b-4 border-foreground px-5 py-4 shrink-0 bg-background/95 backdrop-blur sticky top-0 z-30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Prev/Next navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={onPrev}
                disabled={!hasPrev}
                className="flex h-8 w-8 items-center justify-center border-2 border-foreground text-foreground transition-all hover:bg-foreground hover:text-background disabled:opacity-20 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:outline-none"
                aria-label="Previous item"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button
                onClick={onNext}
                disabled={!hasNext}
                className="flex h-8 w-8 items-center justify-center border-2 border-foreground text-foreground transition-all hover:bg-foreground hover:text-background disabled:opacity-20 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:outline-none"
                aria-label="Next item"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
              {positionIndex != null && totalCount != null && (
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60 ml-2">
                  {positionIndex + 1}/{totalCount}
                </span>
              )}
            </div>

            <h2 className="text-2xl font-black uppercase tracking-tight text-foreground flex items-center gap-3">
              {isOtel && (
                <Activity className="h-6 w-6 text-foreground shrink-0" aria-hidden="true" strokeWidth={3} />
              )}
              {headerTitle}
              {!isOtel && detail.branchLabel && (
                <span className="border-2 border-foreground px-2 py-0.5 text-[10px] font-black uppercase tracking-widest bg-foreground text-background">
                  {detail.branchLabel}
                </span>
              )}
              {!isOtel && detail.isRevision && (
                <span className="border-2 border-foreground px-2 py-0.5 text-[10px] font-black uppercase tracking-widest bg-foreground text-background shadow-brutal-sm">
                  REVISION
                </span>
              )}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-foreground">
            {isOtel ? (
              <>
                <span className="font-mono-terminal border-r-2 border-foreground/30 pr-2 text-foreground/50">{detail.eventType}</span>
                <span title={detail.absoluteTimeLabel}>{detail.relativeTimeLabel}</span>
              </>
            ) : (
              <>
                <span className="font-mono-terminal border-r-2 border-foreground/30 pr-2 text-foreground/50">{detail.shortId}</span>
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
