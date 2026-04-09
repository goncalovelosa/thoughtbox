'use client'

import { useCallback, useState } from 'react'

type KeyMoment = {
  thoughtNumber: number
  label: string
  why: string
}

type Props = {
  keyMoments: KeyMoment[]
}

export function KeyMomentsNav({ keyMoments }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const scrollToThought = useCallback((thoughtNumber: number, index: number) => {
    setActiveIndex(index)
    const el = document.getElementById(`thought-${thoughtNumber}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      history.replaceState(null, '', `#thought-${thoughtNumber}`)
      // Dispatch a custom event so the timeline knows to expand this thought
      window.dispatchEvent(
        new CustomEvent('explorer:expand-thought', {
          detail: { thoughtNumber },
        }),
      )
    }
  }, [])

  return (
    <section className="border-b-4 border-foreground bg-foreground/[0.02]">
      <div className="px-6 py-3 border-b-2 border-foreground/10">
        <span className="font-mono-terminal text-[10px] font-black uppercase tracking-[0.3em] text-foreground/60">
          Key Moments
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="flex gap-3 px-6 py-4" style={{ minWidth: 'max-content' }}>
          {keyMoments.map((moment, i) => (
            <button
              key={moment.thoughtNumber}
              onClick={() => scrollToThought(moment.thoughtNumber, i)}
              className={`flex-shrink-0 border-2 px-4 py-3 text-left transition-all hover:-translate-y-0.5 ${
                activeIndex === i
                  ? 'border-foreground bg-foreground text-background shadow-brutal-sm'
                  : 'border-foreground/30 bg-background text-foreground hover:border-foreground'
              }`}
              style={{ maxWidth: '240px' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono-terminal text-[10px] font-black tabular-nums">
                  #{moment.thoughtNumber}
                </span>
              </div>
              <div className="text-xs font-black uppercase tracking-wide truncate">
                {moment.label}
              </div>
              <div
                className={`mt-1 text-[10px] leading-tight ${
                  activeIndex === i ? 'text-background/70' : 'text-foreground/50'
                }`}
              >
                {moment.why}
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
