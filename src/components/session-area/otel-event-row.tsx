'use client'

import { Activity, BarChart3 } from 'lucide-react'
import type { OtelEventVM } from '@/lib/session/view-models'

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

/**
 * Build a human-readable label from an OTEL event name.
 * Strips common prefixes (`claude_code.`, `gen_ai.`) and replaces
 * dots/underscores with spaces so `hook_tool_result` → `hook tool result`
 * and `gen_ai.content.prompt` → `content prompt`.
 */
function formatDisplayName(eventName: string): { label: string; category: string | null } {
  const stripped = eventName
    .replace(/^claude_code\./, '')
    .replace(/^gen_ai\./, '')

  const parts = stripped.split('.')
  const category = parts.length > 1 ? parts[0] : null
  const label = (parts.length > 1 ? parts.slice(1).join('.') : stripped)
    .replaceAll('_', ' ')

  return { label, category }
}

export function OtelEventRow({ row, isSelected, onClick, searchQuery }: Props) {
  const Icon = row.eventType === 'metric' ? BarChart3 : Activity
  const severityClass = row.severity ? SEVERITY_COLORS[row.severity] ?? 'bg-muted text-muted-foreground' : null
  const { label, category } = formatDisplayName(row.eventName)

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

      <span className="flex-1 min-w-0 truncate text-foreground">
        {category && (
          <span className="text-muted-foreground mr-1.5">{category}</span>
        )}
        {highlightMatch(label, searchQuery ?? '')}
      </span>

      {severityClass && (
        <span className={`shrink-0 rounded-none px-1.5 py-0.5 text-[10px] font-semibold uppercase ${severityClass}`}>
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
