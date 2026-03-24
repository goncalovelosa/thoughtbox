'use client'

import type { ThoughtDetailVM } from '@/lib/session/view-models'
import { BADGE_BASE, REVISION_BADGE } from '@/lib/session/badge-styles'
import { ThoughtCard } from './thought-card'
import { ThoughtMetadataDisclosure } from './thought-metadata-disclosure'

type Props = {
  detail: ThoughtDetailVM | null
}

export function ThoughtDetailPanel({ detail }: Props) {
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
          
          <div className="flex flex-wrap items-center gap-2 text-xs text-foreground">
            <span className="font-mono">{detail.shortId}</span>
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
