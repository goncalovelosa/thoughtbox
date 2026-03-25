'use client'

import type { ThoughtDetailVM } from '@/lib/session/view-models'
import { BADGE_BASE, REVISION_BADGE } from '@/lib/session/badge-styles'
import { ThoughtCard } from './thought-card'
import { ThoughtMetadataDisclosure } from './thought-metadata-disclosure'

type Props = {
  detail: ThoughtDetailVM | null
  onPrev?: () => void
  onNext?: () => void
  hasPrev?: boolean
  hasNext?: boolean
}

export function ThoughtDetailPanel({ detail, onPrev, onNext, hasPrev, hasNext }: Props) {
  if (!detail) {
    return (
      <div className="p-12 text-center text-sm text-foreground my-auto">
        Select a thought to view details
      </div>
    )
  }

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
                className="flex h-7 w-7 items-center justify-center rounded-none border border-foreground/30 text-foreground transition-colors hover:bg-foreground/10 disabled:opacity-20 disabled:cursor-not-allowed"
                aria-label="Previous thought"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button
                onClick={onNext}
                disabled={!hasNext}
                className="flex h-7 w-7 items-center justify-center rounded-none border border-foreground/30 text-foreground transition-colors hover:bg-foreground/10 disabled:opacity-20 disabled:cursor-not-allowed"
                aria-label="Next thought"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>

            <h2 className="text-lg font-semibold text-background flex items-center gap-3">
              Thought #{detail.thoughtNumber}
              {detail.branchLabel && (
                <span className={`${BADGE_BASE} bg-background text-foreground`}>
                  {detail.branchLabel}
                </span>
              )}
              {detail.isRevision && (
                <span className={`${BADGE_BASE} ${REVISION_BADGE}`}>
                  Revision
                </span>
              )}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-foreground">
            <span className="font-mono text-foreground/50">{detail.shortId}</span>
            <span>•</span>
            <span title={detail.absoluteTimeLabel}>{detail.relativeTimeLabel}</span>
            {detail.totalThoughts && (
              <>
                <span>•</span>
                <span>Step {detail.thoughtNumber} of {detail.totalThoughts}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <ThoughtCard detail={detail} />

        {/* Fill remaining space to push disclosure down if needed */}
        <div className="flex-1" />

        <ThoughtMetadataDisclosure detail={detail} />
      </div>
    </div>
  )
}
