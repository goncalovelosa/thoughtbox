'use client'

import type { ThoughtDetailVM } from '@/lib/session/view-models'
import { BADGE_BASE, THOUGHT_TYPE_BADGE, THOUGHT_TYPE_LABEL } from '@/lib/session/badge-styles'

type Props = {
  detail: ThoughtDetailVM
}

export function ThoughtCard({ detail }: Props) {
  // If it's pure reasoning, we just return the raw content block
  if (detail.displayType === 'reasoning') {
    return (
      <div className="border-b border-slate-800 px-5 py-4 last:border-b-0">
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80 p-4 font-mono text-[12px] leading-5 text-slate-200">
          <pre className="whitespace-pre-wrap font-inherit">{detail.rawThought}</pre>
        </div>
      </div>
    )
  }

  // Helper for rendering the header of a structured card
  const renderHeader = (badgeStyles: string, label: string) => (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
      <div className="flex items-center gap-2">
        <span className={`${BADGE_BASE} ${badgeStyles}`}>
          {label}
        </span>
        
        {/* Type-specific header additions */}
        {detail.displayType === 'decision_frame' && detail.confidence && (
          <span className="text-xs text-slate-400 capitalize">
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
        <span className="text-xs text-slate-500 capitalize">
          {detail.actionResult.reversible.replace('_', ' ')} reversible
        </span>
      )}
    </div>
  )

  // Determine what the structured body looks like based on type
  const renderBody = () => {
    switch (detail.displayType) {
      case 'decision_frame':
        if (!detail.options) return <div className="text-slate-500 italic">Decision metadata unavailable</div>
        return (
          <ul className="space-y-3">
            {detail.options.map((opt, i) => (
              <li key={i} className={`flex items-start gap-3 rounded-lg p-3 ${opt.selected ? 'bg-emerald-500/10 ring-1 ring-emerald-500/20' : 'bg-slate-800/50'}`}>
                <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${opt.selected ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'}`}>
                  {opt.selected && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                </div>
                <div>
                  <div className={`text-sm font-medium ${opt.selected ? 'text-emerald-300' : 'text-slate-300'}`}>{opt.label}</div>
                  {opt.reason && <div className="mt-1 text-xs text-slate-400">{opt.reason}</div>}
                </div>
              </li>
            ))}
          </ul>
        )

      case 'action_report':
        if (!detail.actionResult) return <div className="text-slate-500 italic">Action metadata unavailable</div>
        return (
          <div className="space-y-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tool</span>
              <span className="font-mono text-sm text-sky-300">{detail.actionResult.tool}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Target</span>
              <span className="font-mono text-sm text-slate-300">{detail.actionResult.target}</span>
            </div>
            {detail.actionResult.sideEffects && detail.actionResult.sideEffects.length > 0 && (
              <div className="flex flex-col gap-1 pt-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Side Effects</span>
                <ul className="list-disc pl-4 text-sm text-slate-400 space-y-1">
                  {detail.actionResult.sideEffects.map((effect, i) => (
                    <li key={i}>{effect}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )

      case 'belief_snapshot':
        if (!detail.beliefs) return <div className="text-slate-500 italic">Belief metadata unavailable</div>
        return (
          <div className="space-y-4">
            <div className="grid gap-2">
              {detail.beliefs.entities.map((entity, i) => (
                <div key={i} className="flex flex-col gap-0.5 rounded-lg bg-slate-800/50 px-3 py-2">
                  <span className="text-sm font-medium text-pink-300">{entity.name}</span>
                  <span className="text-sm text-slate-300">{entity.state}</span>
                </div>
              ))}
            </div>
            {detail.beliefs.constraints && detail.beliefs.constraints.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Constraints</span>
                <ul className="list-disc pl-4 text-sm text-slate-400">
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
        if (!detail.assumptionChange) return <div className="text-slate-500 italic">Assumption metadata unavailable</div>
        const getStatusColor = (s: string) => {
          if (s === 'believed') return 'text-emerald-400'
          if (s === 'uncertain') return 'text-amber-400'
          if (s === 'refuted') return 'text-rose-400'
          return 'text-slate-400'
        }
        return (
          <div className="space-y-4">
            <div className="text-sm font-medium text-slate-200">
              {detail.assumptionChange.text}
            </div>
            <div className="flex items-center gap-3 bg-slate-950/50 rounded-lg p-3 w-fit border border-slate-800">
              <span className={`text-sm font-semibold capitalize ${getStatusColor(detail.assumptionChange.oldStatus)}`}>
                {detail.assumptionChange.oldStatus}
              </span>
              <svg className="h-4 w-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              <span className={`text-sm font-semibold capitalize ${getStatusColor(detail.assumptionChange.newStatus)}`}>
                {detail.assumptionChange.newStatus}
              </span>
            </div>
            {detail.assumptionChange.trigger && (
              <div className="text-sm text-slate-400 italic">
                Reason: {detail.assumptionChange.trigger}
              </div>
            )}
          </div>
        )

      case 'context_snapshot':
        if (!detail.contextData) return <div className="text-slate-500 italic">Context metadata unavailable</div>
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {detail.contextData.modelId && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Model</span>
                <span className="text-sm text-slate-300">{detail.contextData.modelId}</span>
              </div>
            )}
            {detail.contextData.systemPromptHash && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Prompt Hash</span>
                <span className="font-mono text-sm text-slate-300">{detail.contextData.systemPromptHash}</span>
              </div>
            )}
            {detail.contextData.toolsAvailable && (
              <div className="flex flex-col gap-1 md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tools Available</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {detail.contextData.toolsAvailable.map(t => (
                    <span key={t} className="px-2 py-1 bg-slate-800 rounded-md text-xs font-mono text-slate-300 border border-slate-700">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      case 'progress':
        if (!detail.progressData) return <div className="text-slate-500 italic">Progress metadata unavailable</div>
        return (
          <div className="space-y-2">
            <div className="text-sm font-medium text-slate-200">
              {detail.progressData.task}
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                detail.progressData.status === 'done' ? 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20' :
                detail.progressData.status === 'in_progress' ? 'bg-blue-400/10 text-blue-400 ring-blue-400/20' :
                detail.progressData.status === 'blocked' ? 'bg-rose-400/10 text-rose-400 ring-rose-400/20' :
                'bg-slate-400/10 text-slate-400 ring-slate-400/20'
              }`}>
                {detail.progressData.status.replace('_', ' ')}
              </span>
            </div>
            {detail.progressData.note && (
              <div className="mt-2 text-sm text-slate-400">
                {detail.progressData.note}
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  const badgeStyles = THOUGHT_TYPE_BADGE[detail.displayType]
  const label = THOUGHT_TYPE_LABEL[detail.displayType]

  return (
    <div className="border-b border-slate-800 px-5 py-4 last:border-b-0">
      <div className="rounded-xl border border-slate-800 bg-slate-900 mb-4">
        {renderHeader(badgeStyles, label)}
        <div className="space-y-4 px-4 py-4 text-sm text-slate-200">
          {renderBody()}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80 p-4 font-mono text-[12px] leading-5 text-slate-200">
        <pre className="whitespace-pre-wrap font-inherit">{detail.rawThought}</pre>
      </div>
    </div>
  )
}
