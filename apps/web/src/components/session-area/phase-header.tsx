'use client'

import type { Phase } from '@/lib/session/phase-detection'

type Props = {
  phase: Phase
  isCollapsed: boolean
  onToggle: () => void
}

export function PhaseHeader({ phase, isCollapsed, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-3 px-4 py-2.5 bg-foreground/5 border-l-2 border-foreground/30 hover:bg-foreground/10 transition-colors text-left"
      aria-expanded={!isCollapsed}
      aria-label={`${phase.label}, ${phase.thoughtCount} thoughts${isCollapsed ? ', collapsed' : ''}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="12"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="2"
        stroke="currentColor"
        className={`shrink-0 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m8.25 4.5 7.5 7.5-7.5 7.5"
        />
      </svg>

      <span className="text-xs font-semibold text-foreground/80 truncate min-w-0">
        {phase.label}
      </span>

      <span className="text-[10px] font-mono text-foreground/50 shrink-0 tabular-nums">
        {phase.thoughtCount} thought{phase.thoughtCount === 1 ? '' : 's'}
      </span>
    </button>
  )
}
