'use client'

import type { ThoughtDetailVM } from '@/lib/session/view-models'
import { useState } from 'react'

type Props = {
  detail: ThoughtDetailVM
}

export function ThoughtMetadataDisclosure({ detail }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  // Omit the heavily structured typed data from the raw disclosure
  // since they are rendered natively in the card, but keep the core primitives.
  const {
    id,
    thoughtNumber,
    totalThoughts,
    nextThoughtNeeded,
    branchId,
    branchFromThought,
    displayType,
    debugMeta
  } = detail

  const raw = {
    id,
    thoughtNumber,
    totalThoughts,
    nextThoughtNeeded,
    branchId,
    branchFromThought,
    displayType,
    ...debugMeta
  }

  // Filter out null/undefined fields to reduce noise
  const payload = Object.fromEntries(
    Object.entries(raw).filter(([, v]) => v != null)
  )

  return (
    <div className="border-t border-foreground px-5 py-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs font-medium text-foreground hover:text-foreground transition-colors"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="16" 
          height="16" 
          fill="none" 
          viewBox="0 0 24 24" 
          strokeWidth="2" 
          stroke="currentColor"
          className={`transition-transform ${isOpen ? 'rotate-90' : ''}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
        Raw Metadata
      </button>

      {isOpen && (
        <div className="mt-3 overflow-x-auto rounded-none border border-foreground bg-background/80 p-4">
          <pre className="font-mono text-[12px] leading-5 text-foreground">
            {JSON.stringify(payload, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
