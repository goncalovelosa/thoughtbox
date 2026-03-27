'use client'

import { useState } from 'react'
import type { ThoughtDetailVM } from '@/lib/session/view-models'
import { highlightText } from '@/lib/session/search-utils'
import { BADGE_BASE, THOUGHT_TYPE_BADGE, THOUGHT_TYPE_LABEL } from '@/lib/session/badge-styles'

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
      <div className="border-b border-foreground px-5 py-4 last:border-b-0">
        <div className="overflow-x-auto rounded-none border border-foreground bg-background/80 p-4 font-mono text-[12px] leading-5 text-foreground">
          <HighlightedPre text={detail.rawThought} query={searchQuery} />
        </div>
      </div>
    )
  }

  // Helper for rendering the header of a structured card
  const renderHeader = (badgeStyles: string, label: string) => (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-foreground px-4 py-3">
      <div className="flex items-center gap-2">
        <span className={`${BADGE_BASE} ${badgeStyles}`}>
          {label}
        </span>
        
        {/* Type-specific header additions */}
        {detail.displayType === 'decision_frame' && detail.confidence && (
          <span className="text-xs text-foreground capitalize">
            {detail.confidence} confidence
          </span>
        )}
        
        {detail.displayType === 'action_report' && detail.actionResult && (
          <span className={`text-xs font-medium ${detail.actionResult.success ? 'text-emerald-400' : 'text-rose-400'}`}>
            {detail.actionResult.success ? 'Success' : 'Failure'}
          </span>
        )}
      </div>
      
      {/* Right side metadata */}
      {detail.displayType === 'action_report' && detail.actionResult?.reversible && (
        <span className="text-xs text-foreground capitalize">
          {detail.actionResult.reversible.replace('_', ' ')} reversible
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
              <li key={i} className={`flex items-start gap-3 rounded-none p-3 ${opt.selected ? 'bg-emerald-500/10 ring-1 ring-emerald-500/20' : 'bg-background/50'}`}>
                <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-none border ${opt.selected ? 'border-emerald-500 bg-emerald-500' : 'border-foreground'}`}>
                  {opt.selected && <svg className="h-3 w-3 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                </div>
                <div>
                  <div className={`text-sm font-medium ${opt.selected ? 'text-emerald-300' : 'text-foreground'}`}>{opt.label}</div>
                  {opt.reason && <div className="mt-1 text-xs text-foreground">{opt.reason}</div>}
                </div>
              </li>
            ))}
          </ul>
        )

      case 'action_report':
        if (!detail.actionResult) return <div className="text-foreground italic">Action metadata unavailable</div>
        return (
          <div className="space-y-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground">Tool</span>
              <span className="font-mono text-sm text-sky-300">{detail.actionResult.tool}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground">Target</span>
              <span className="font-mono text-sm text-foreground">{detail.actionResult.target}</span>
            </div>
            {detail.actionResult.sideEffects && detail.actionResult.sideEffects.length > 0 && (
              <div className="flex flex-col gap-1 pt-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground">Side Effects</span>
                <ul className="list-disc pl-4 text-sm text-foreground space-y-1">
                  {detail.actionResult.sideEffects.map((effect, i) => (
                    <li key={i}>{effect}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )

      case 'belief_snapshot':
        if (!detail.beliefs) return <div className="text-foreground italic">Belief metadata unavailable</div>
        return (
          <div className="space-y-4">
            <div className="grid gap-2">
              {detail.beliefs.entities.map((entity, i) => (
                <div key={i} className="flex flex-col gap-0.5 rounded-none bg-background/50 px-3 py-2">
                  <span className="text-sm font-medium text-pink-300">{entity.name}</span>
                  <span className="text-sm text-foreground">{entity.state}</span>
                </div>
              ))}
            </div>
            {detail.beliefs.constraints && detail.beliefs.constraints.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground">Constraints</span>
                <ul className="list-disc pl-4 text-sm text-foreground">
                  {detail.beliefs.constraints.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            )}
            {detail.beliefs.risks && detail.beliefs.risks.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-500">Risks</span>
                <ul className="list-disc pl-4 text-sm text-rose-400">
                  {detail.beliefs.risks.map((r, i) => <li key={i}>{r}</li>)}
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
            <div className="text-sm font-medium text-foreground">
              {detail.assumptionChange.text}
            </div>
            <div className="flex items-center gap-3 bg-background/50 rounded-none p-3 w-fit border border-foreground">
              <span className={`text-sm font-semibold capitalize ${getStatusColor(detail.assumptionChange.oldStatus)}`}>
                {detail.assumptionChange.oldStatus}
              </span>
              <svg className="h-4 w-4 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              <span className={`text-sm font-semibold capitalize ${getStatusColor(detail.assumptionChange.newStatus)}`}>
                {detail.assumptionChange.newStatus}
              </span>
            </div>
            {detail.assumptionChange.trigger && (
              <div className="text-sm text-foreground italic">
                Reason: {detail.assumptionChange.trigger}
              </div>
            )}
          </div>
        )

      case 'context_snapshot':
        if (!detail.contextData) return <div className="text-foreground italic">Context metadata unavailable</div>
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {detail.contextData.modelId && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground">Model</span>
                <span className="text-sm text-foreground">{detail.contextData.modelId}</span>
              </div>
            )}
            {detail.contextData.systemPromptHash && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground">Prompt Hash</span>
                <span className="font-mono text-sm text-foreground">{detail.contextData.systemPromptHash}</span>
              </div>
            )}
            {detail.contextData.toolsAvailable && (
              <div className="flex flex-col gap-1 md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground">Tools Available</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {detail.contextData.toolsAvailable.map(t => (
                    <span key={t} className="px-2 py-1 bg-background rounded-none text-xs font-mono text-foreground border border-foreground">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      case 'progress':
        if (!detail.progressData) return <div className="text-foreground italic">Progress metadata unavailable</div>
        return (
          <div className="space-y-2">
            <div className="text-sm font-medium text-foreground">
              {detail.progressData.task}
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center rounded-none px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                detail.progressData.status === 'done' ? 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20' :
                detail.progressData.status === 'in_progress' ? 'bg-blue-400/10 text-blue-400 ring-blue-400/20' :
                detail.progressData.status === 'blocked' ? 'bg-rose-400/10 text-rose-400 ring-rose-400/20' :
                'bg-background/10 text-foreground ring-foreground/20'
              }`}>
                {detail.progressData.status.replace('_', ' ')}
              </span>
            </div>
            {detail.progressData.note && (
              <div className="mt-2 text-sm text-foreground">
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
    <div className="border-b border-foreground px-5 py-4 last:border-b-0">
      <div className="rounded-none border border-foreground bg-background mb-4">
        {renderHeader(badgeStyles, label)}
        <div className="space-y-4 px-4 py-4 text-sm text-foreground">
          {renderBody()}
        </div>
      </div>

      <button
        onClick={() => setShowRaw(!showRaw)}
        className="flex items-center gap-2 text-xs font-medium text-foreground/60 hover:text-foreground transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
          className={`transition-transform ${showRaw ? 'rotate-90' : ''}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
        Raw thought content
      </button>

      {showRaw && (
        <div className="mt-2 overflow-x-auto rounded-none border border-foreground bg-background/80 p-4 font-mono text-[12px] leading-5 text-foreground">
          <HighlightedPre text={detail.rawThought} query={searchQuery} />
        </div>
      )}
    </div>
  )
}
