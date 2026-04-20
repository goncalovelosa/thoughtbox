'use client'

import { Activity, BarChart3, Check, X } from 'lucide-react'
import { formatOtelDisplayLabel, type OtelEventVM } from '@/lib/session/view-models'

type Props = {
  row: OtelEventVM
  isSelected: boolean
  onClick: () => void
  searchQuery?: string
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200/60 text-inherit">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

const SEVERITY_COLORS: Record<string, string> = {
  ERROR: 'bg-rose-500/20 text-rose-700',
  WARN: 'bg-amber-500/20 text-amber-700',
  INFO: 'bg-blue-500/20 text-blue-700',
  DEBUG: 'bg-muted text-muted-foreground',
}

function formatDurationCompact(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`
  }
  return `${(ms / 1000).toFixed(1)}s`
}

function extractDuration(attrs: Record<string, unknown>): number | null {
  const duration = attrs['DURATION_MS'] ?? attrs['duration_ms'] ?? attrs['duration']
  if (typeof duration === 'number') return duration
  if (typeof duration === 'string') {
    const parsed = parseFloat(duration)
    return isNaN(parsed) ? null : parsed
  }
  return null
}

function extractSuccess(attrs: Record<string, unknown>): boolean | null {
  const success = attrs['SUCCESS'] ?? attrs['success']
  if (typeof success === 'boolean') return success
  if (typeof success === 'string') {
    const lower = success.toLowerCase()
    if (lower === 'true') return true
    if (lower === 'false') return false
  }
  return null
}

export function OtelEventRow({ row, isSelected, onClick, searchQuery }: Props) {
  const Icon = row.eventType === 'metric' ? BarChart3 : Activity
  const severityClass = row.severity ? SEVERITY_COLORS[row.severity] ?? 'bg-muted text-muted-foreground' : null
  const { label, detail } = formatOtelDisplayLabel(row.eventName, row.eventAttrs)
  
  const duration = extractDuration(row.eventAttrs)
  const success = extractSuccess(row.eventAttrs)

  return (
    <button
      type="button"
      data-thought-id={row.id}
      onClick={onClick}
      title={row.eventName}
      className={`w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs transition-colors border-l-2 ${
        isSelected
          ? 'bg-blue-50 border-l-blue-500'
          : 'bg-blue-50/30 border-l-blue-300/50 hover:bg-blue-50/60'
      }`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-blue-500/70" aria-hidden="true" />

      <span className="flex-1 min-w-0 flex items-center gap-1.5">
        <span className="truncate text-foreground">
          {highlightMatch(label, searchQuery ?? '')}
          {detail && (
            <span className="ml-1.5 text-muted-foreground">{detail}</span>
          )}
        </span>
        
        {success !== null && (
          <span className="shrink-0 inline-flex items-center" title={success ? 'Success' : 'Failed'}>
            {success ? (
              <Check className="h-3 w-3 text-green-600" aria-label="Success" />
            ) : (
              <X className="h-3 w-3 text-rose-600" aria-label="Failed" />
            )}
          </span>
        )}
        
        {duration !== null && (
          <span className="shrink-0 text-[10px] font-medium text-muted-foreground tabular-nums" title={`Duration: ${duration}ms`}>
            {formatDurationCompact(duration)}
          </span>
        )}
      </span>

      {severityClass && (
        <span className={`shrink-0 rounded-lg px-1.5 py-0.5 text-[10px] font-semibold uppercase ${severityClass}`}>
          {row.severity}
        </span>
      )}

      {row.metricValue != null && (
        <span className="shrink-0 tabular-nums text-muted-foreground font-medium">
          {row.metricValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </span>
      )}

      <span className="shrink-0 text-muted-foreground whitespace-nowrap">
        {row.relativeTimeLabel}
      </span>
    </button>
  )
}
