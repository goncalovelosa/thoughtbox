'use client'

import { useState } from 'react'
import type { ThoughtDetailVM } from '@/lib/session/view-models'
import { highlightText } from '@/lib/session/search-utils'
import { THOUGHT_TYPE_BADGE, THOUGHT_TYPE_LABEL } from '@/lib/session/badge-styles'

type Props = {
  detail: ThoughtDetailVM
  searchQuery?: string
}

function HighlightedPre({ text, query }: { text: string; query?: string }) {
  if (!query) {
    return <pre className="whitespace-pre-wrap font-inherit">{text}</pre>
  }
  return (
    <pre className="whitespace-pre-wrap font-inherit">
      {highlightText(text, query).map((seg, i) =>
        seg.type === 'match' ? (
          <mark key={i} className="bg-amber-400/30 text-foreground rounded-sm px-0.5">{seg.value}</mark>
        ) : (
          <span key={i}>{seg.value}</span>
        ),
      )}
    </pre>
  )
}

export function ThoughtCard({ detail, searchQuery }: Props) {
  // If it's pure reasoning, we just return the raw content block
  if (detail.displayType === 'reasoning') {
    return (
      <div className="border-b border-foreground/10 px-5 py-4 last:border-b-0">
        <div className="overflow-x-auto border-4 border-foreground bg-background p-4 font-mono-terminal text-[12px] leading-5 text-foreground relative">
          <div className="absolute top-0 right-0 w-8 h-8 diagonal-lines opacity-10"></div>
          <HighlightedPre text={detail.rawThought} query={searchQuery} />
        </div>
      </div>
    )
  }

  // Helper for rendering the header of a structured card
  const renderHeader = (badgeStyles: string, label: string) => (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b-4 border-foreground px-4 py-3 bg-foreground text-background">
      <div className="flex items-center gap-2">
        <span className={`font-mono-terminal font-black uppercase tracking-widest text-[10px]`}>
          {label}
        </span>
        
        {/* Type-specific header additions */}
        {detail.displayType === 'decision_frame' && detail.confidence && (
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">
            {detail.confidence} CONF
          </span>
        )}
        
        {detail.displayType === 'action_report' && detail.actionResult && (
          <span className={`text-[10px] font-black uppercase tracking-widest ${detail.actionResult.success ? 'text-emerald-400' : 'text-rose-400'}`}>
            {detail.actionResult.success ? 'SUCCESS' : 'FAILURE'}
          </span>
        )}
      </div>
      
      {/* Right side metadata */}
      {detail.displayType === 'action_report' && detail.actionResult?.reversible && (
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">
          {detail.actionResult.reversible.replace('_', ' ')} REV
        </span>
      )}
    </div>
  )

  // Determine what the structured body looks like based on type
  const renderBody = () => {
    switch (detail.displayType) {
      case 'decision_frame':
        if (!detail.options) return <div className="text-foreground italic">Decision metadata unavailable</div>
        return (
          <ul className="space-y-3">
            {detail.options.map((opt, i) => (
              <li key={i} className={`flex items-start gap-3 p-4 border-2 ${opt.selected ? 'border-foreground bg-foreground text-background shadow-brutal-sm' : 'border-foreground/30 bg-background text-foreground'}`}>
                <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border-2 ${opt.selected ? 'border-background bg-background text-foreground' : 'border-foreground/50'}`}>
                  {opt.selected && <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
                </div>
                <div>
                  <div className={`text-sm font-black uppercase tracking-wide ${opt.selected ? 'text-background' : 'text-foreground'}`}>{opt.label}</div>
                  {opt.reason && <div className={`mt-1 text-xs font-mono-terminal ${opt.selected ? 'text-background/80' : 'text-foreground/70'}`}>{opt.reason}</div>}
                </div>
              </li>
            ))}
          </ul>
        )

      case 'action_report':
        if (!detail.actionResult) return <div className="text-foreground italic">Action metadata unavailable</div>
        return (
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60">Tool</span>
              <span className="font-mono-terminal text-sm border-l-2 border-foreground pl-3 py-1">{detail.actionResult.tool}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60">Target</span>
              <span className="font-mono-terminal text-sm border-l-2 border-foreground pl-3 py-1">{detail.actionResult.target}</span>
            </div>
            {detail.actionResult.sideEffects && detail.actionResult.sideEffects.length > 0 && (
              <div className="flex flex-col gap-1 pt-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60">Side Effects</span>
                <ul className="list-none pl-0 text-sm font-mono-terminal space-y-2 mt-2">
                  {detail.actionResult.sideEffects.map((effect, i) => (
                    <li key={i} className="flex gap-3 before:content-['>'] before:text-foreground/50 before:font-bold">{effect}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )

      case 'belief_snapshot':
        if (!detail.beliefs) return <div className="text-foreground italic">Belief metadata unavailable</div>
        return (
          <div className="space-y-6">
            <div className="grid gap-3">
              {detail.beliefs.entities.map((entity, i) => (
                <div key={i} className="flex flex-col gap-1 border-2 border-foreground p-3 relative">
                  <div className="absolute top-0 right-0 w-2 h-2 bg-foreground"></div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">{entity.name}</span>
                  <span className="font-mono-terminal text-sm">{entity.state}</span>
                </div>
              ))}
            </div>
            {detail.beliefs.constraints && detail.beliefs.constraints.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60">Constraints</span>
                <ul className="list-none pl-0 font-mono-terminal text-sm space-y-2">
                  {detail.beliefs.constraints.map((c, i) => <li key={i} className="flex gap-2 before:content-['['] after:content-[']'] before:opacity-50 after:opacity-50"><span>{c}</span></li>)}
                </ul>
              </div>
            )}
            {detail.beliefs.risks && detail.beliefs.risks.length > 0 && (
              <div className="flex flex-col gap-2 p-4 border-2 border-rose-500/50 bg-rose-500/5">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 flex items-center gap-2">
                  <span className="w-2 h-2 bg-rose-500 animate-pulse"></span>
                  Risks
                </span>
                <ul className="list-none pl-0 font-mono-terminal text-sm text-rose-400/90 space-y-2">
                  {detail.beliefs.risks.map((r, i) => <li key={i} className="flex gap-3 before:content-['!']">{r}</li>)}
                </ul>
              </div>
            )}
          </div>
        )

      case 'assumption_update':
        if (!detail.assumptionChange) return <div className="text-foreground italic">Assumption metadata unavailable</div>
        const getStatusColor = (s: string) => {
          if (s === 'believed') return 'text-emerald-400'
          if (s === 'uncertain') return 'text-amber-400'
          if (s === 'refuted') return 'text-rose-400'
          return 'text-foreground'
        }
        return (
          <div className="space-y-4">
            <div className="text-sm font-black uppercase tracking-wide">
              {detail.assumptionChange.text}
            </div>
            <div className="flex items-center gap-4 border-2 border-foreground p-4 w-fit shadow-brutal-sm">
              <span className={`font-mono-terminal text-sm uppercase tracking-wider ${getStatusColor(detail.assumptionChange.oldStatus)}`}>
                {detail.assumptionChange.oldStatus}
              </span>
              <div className="w-8 h-[2px] bg-foreground relative">
                <div className="absolute -top-1 -right-1 border-t-2 border-r-2 border-foreground w-2 h-2 rotate-45"></div>
              </div>
              <span className={`font-mono-terminal text-sm uppercase tracking-wider ${getStatusColor(detail.assumptionChange.newStatus)}`}>
                {detail.assumptionChange.newStatus}
              </span>
            </div>
            {detail.assumptionChange.trigger && (
              <div className="text-xs font-mono-terminal border-l-2 border-foreground/30 pl-3 text-foreground/70">
                <span className="font-bold uppercase tracking-wider block mb-1 text-[10px]">Trigger</span>
                {detail.assumptionChange.trigger}
              </div>
            )}
          </div>
        )

      case 'context_snapshot':
        if (!detail.contextData) return <div className="text-foreground italic">Context metadata unavailable</div>
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {detail.contextData.modelId && (
              <div className="flex flex-col gap-1 border border-foreground/20 p-3 relative">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60 absolute -top-2 left-2 bg-background px-1">Model</span>
                <span className="font-mono-terminal text-sm mt-1">{detail.contextData.modelId}</span>
              </div>
            )}
            {detail.contextData.systemPromptHash && (
              <div className="flex flex-col gap-1 border border-foreground/20 p-3 relative">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60 absolute -top-2 left-2 bg-background px-1">Prompt Hash</span>
                <span className="font-mono-terminal text-sm mt-1 truncate" title={detail.contextData.systemPromptHash}>{detail.contextData.systemPromptHash}</span>
              </div>
            )}
            {detail.contextData.toolsAvailable && (
              <div className="flex flex-col gap-2 md:col-span-2 border border-foreground/20 p-4 relative mt-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60 absolute -top-2 left-2 bg-background px-1">Tools Available</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {detail.contextData.toolsAvailable.map(t => (
                    <span key={t} className="px-2 py-1 bg-foreground text-background font-mono-terminal text-xs uppercase tracking-wider">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      case 'progress':
        if (!detail.progressData) return <div className="text-foreground italic">Progress metadata unavailable</div>
        return (
          <div className="space-y-4">
            <div className="text-sm font-black uppercase tracking-wide">
              {detail.progressData.task}
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center border-2 px-3 py-1 font-mono-terminal text-xs uppercase tracking-wider ${
                detail.progressData.status === 'done' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500' :
                detail.progressData.status === 'in_progress' ? 'border-blue-500 bg-blue-500/10 text-blue-500' :
                detail.progressData.status === 'blocked' ? 'border-rose-500 bg-rose-500/10 text-rose-500' :
                'border-foreground text-foreground'
              }`}>
                {detail.progressData.status === 'in_progress' && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse mr-2"></span>}
                {detail.progressData.status.replace('_', ' ')}
              </span>
            </div>
            {detail.progressData.note && (
              <div className="mt-4 font-mono-terminal text-sm border-l-2 border-foreground pl-4 py-1 text-foreground/80">
                {detail.progressData.note}
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  const badgeStyles = THOUGHT_TYPE_BADGE[detail.displayType] ?? ''
  const label = THOUGHT_TYPE_LABEL[detail.displayType] ?? detail.displayType

  return (
    <TypedThoughtCard
      detail={detail}
      badgeStyles={badgeStyles}
      label={label}
      renderHeader={renderHeader}
      renderBody={renderBody}
      searchQuery={searchQuery}
    />
  )
}

function TypedThoughtCard({
  detail,
  badgeStyles,
  label,
  renderHeader,
  renderBody,
  searchQuery,
}: {
  detail: ThoughtDetailVM
  badgeStyles: string
  label: string
  renderHeader: (badgeStyles: string, label: string) => React.ReactNode
  renderBody: () => React.ReactNode
  searchQuery?: string
}) {
  const [showRaw, setShowRaw] = useState(false)

  return (
    <div className="border-b-4 border-foreground px-5 py-6 last:border-b-0 relative group">
      <div className="absolute top-0 right-0 w-full h-full dots-pattern opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none"></div>
      
      <div className="border-4 border-foreground bg-background mb-4 shadow-brutal-sm relative">
        <div className="reticle-tl text-foreground"></div>
        <div className="reticle-tr text-foreground"></div>
        <div className="reticle-bl text-foreground"></div>
        <div className="reticle-br text-foreground"></div>
        
        {renderHeader(badgeStyles, label)}
        <div className="p-6 text-foreground">
          {renderBody()}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowRaw(!showRaw)}
        aria-expanded={showRaw}
        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60 hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:outline-none"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="4"
          stroke="currentColor"
          className={`transition-transform motion-reduce:transition-none ${showRaw ? 'rotate-90' : ''}`}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
        RAW THOUGHT
      </button>

      {showRaw && (
        <div className="mt-4 overflow-x-auto border-2 border-foreground/30 bg-background p-4 font-mono-terminal text-[12px] leading-5 text-foreground/80 relative">
          <div className="absolute inset-0 scanlines opacity-5 pointer-events-none"></div>
          <HighlightedPre text={detail.rawThought} query={searchQuery} />
        </div>
      )}
    </div>
  )
}
