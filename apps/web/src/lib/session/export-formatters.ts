import type {
  SessionDetailVM,
  ThoughtDetailVM,
} from '@/lib/session/view-models'
import { THOUGHT_TYPE_LABEL } from '@/lib/session/badge-styles'

function formatThoughtMarkdown(
  thought: ThoughtDetailVM,
): string {
  const label = THOUGHT_TYPE_LABEL[thought.displayType]
  const lines: string[] = []

  lines.push(`## Thought #${thought.thoughtNumber} — ${label}`)
  lines.push('')

  if (thought.confidence) {
    lines.push(`**Confidence:** ${thought.confidence}`)
    lines.push('')
  }

  if (thought.isRevision && thought.revisesThought != null) {
    lines.push(`*Revises thought #${thought.revisesThought}*`)
    lines.push('')
  }

  if (thought.branchId) {
    lines.push(`*Branch: ${thought.branchId}*`)
    lines.push('')
  }

  switch (thought.displayType) {
    case 'decision_frame':
      if (thought.options && thought.options.length > 0) {
        lines.push('| Option | Selected | Reason |')
        lines.push('|--------|----------|--------|')
        for (const opt of thought.options) {
          const selected = opt.selected ? 'Yes' : 'No'
          const reason = opt.reason ?? ''
          lines.push(
            `| ${opt.label} | ${selected} | ${reason} |`,
          )
        }
        lines.push('')
      }
      lines.push(thought.rawThought)
      break

    case 'action_report':
      if (thought.actionResult) {
        const ar = thought.actionResult
        lines.push(`**Tool:** ${ar.tool}`)
        lines.push(`**Target:** ${ar.target}`)
        lines.push(
          `**Success:** ${ar.success ? 'Yes' : 'No'}`,
        )
        lines.push(`**Reversible:** ${ar.reversible}`)
        if (ar.sideEffects && ar.sideEffects.length > 0) {
          lines.push(
            `**Side Effects:** ${ar.sideEffects.join(', ')}`,
          )
        }
        lines.push('')
      }
      lines.push(thought.rawThought)
      break

    case 'belief_snapshot':
      if (thought.beliefs) {
        for (const entity of thought.beliefs.entities) {
          lines.push(`- **${entity.name}**: ${entity.state}`)
        }
        if (
          thought.beliefs.constraints &&
          thought.beliefs.constraints.length > 0
        ) {
          lines.push('')
          lines.push('**Constraints:**')
          for (const c of thought.beliefs.constraints) {
            lines.push(`  - ${c}`)
          }
        }
        if (
          thought.beliefs.risks &&
          thought.beliefs.risks.length > 0
        ) {
          lines.push('')
          lines.push('**Risks:**')
          for (const r of thought.beliefs.risks) {
            lines.push(`  - ${r}`)
          }
        }
        lines.push('')
      }
      lines.push(thought.rawThought)
      break

    case 'assumption_update':
      if (thought.assumptionChange) {
        const ac = thought.assumptionChange
        lines.push(`> ${ac.text}`)
        lines.push('')
        lines.push(
          `**Status:** ${ac.oldStatus} \u2192 ${ac.newStatus}`,
        )
        if (ac.trigger) {
          lines.push(`**Trigger:** ${ac.trigger}`)
        }
        if (ac.downstream && ac.downstream.length > 0) {
          lines.push(
            `**Downstream:** thoughts ${ac.downstream.join(', ')}`,
          )
        }
        lines.push('')
      }
      lines.push(thought.rawThought)
      break

    case 'progress':
      if (thought.progressData) {
        const pd = thought.progressData
        lines.push(`**Task:** ${pd.task}`)
        lines.push(`**Status:** ${pd.status}`)
        if (pd.note) {
          lines.push(`**Note:** ${pd.note}`)
        }
        lines.push('')
      }
      lines.push(thought.rawThought)
      break

    default:
      lines.push(thought.rawThought)
      break
  }

  return lines.join('\n')
}

export function formatSessionMarkdown(
  session: SessionDetailVM,
  thoughts: ThoughtDetailVM[],
): string {
  const parts: string[] = []

  parts.push(`# ${session.title ?? 'Untitled Session'}`)
  parts.push('')
  parts.push(`- **ID:** ${session.id}`)
  parts.push(`- **Status:** ${session.status}`)
  parts.push(`- **Started:** ${session.startedAtLabel}`)
  parts.push(`- **Duration:** ${session.durationLabel}`)
  parts.push(`- **Thoughts:** ${session.thoughtCount}`)
  if (session.tags.length > 0) {
    parts.push(`- **Tags:** ${session.tags.join(', ')}`)
  }
  parts.push('')

  for (let i = 0; i < thoughts.length; i++) {
    if (i > 0) {
      parts.push('')
      parts.push('---')
      parts.push('')
    }
    parts.push(formatThoughtMarkdown(thoughts[i]))
  }

  parts.push('')
  return parts.join('\n')
}

type ExportThought = Omit<
  ThoughtDetailVM,
  | 'shortId'
  | 'previewText'
  | 'searchIndexText'
  | 'laneIndex'
  | 'laneColorToken'
  | 'showGapBefore'
  | 'gapLabel'
  | 'debugMeta'
>

export function formatSessionJSON(
  session: SessionDetailVM,
  thoughts: ThoughtDetailVM[],
): string {
  const UI_ONLY_KEYS = new Set([
    'shortId',
    'previewText',
    'searchIndexText',
    'laneIndex',
    'laneColorToken',
    'showGapBefore',
    'gapLabel',
    'debugMeta',
  ])

  const exportThoughts: ExportThought[] = thoughts.map((t) => {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(t)) {
      if (!UI_ONLY_KEYS.has(key)) {
        result[key] = value
      }
    }
    return result as ExportThought
  })

  const payload = {
    exportFormat: 'thoughtbox-session-v1' as const,
    exportedAt: new Date().toISOString(),
    session: {
      id: session.id,
      title: session.title,
      status: session.status,
      tags: session.tags,
      startedAtISO: session.startedAtISO,
      completedAtISO: session.completedAtISO,
      durationLabel: session.durationLabel,
      thoughtCount: session.thoughtCount,
      lastUpdatedAtISO: session.lastUpdatedAtISO,
    },
    thoughts: exportThoughts,
  }

  return JSON.stringify(payload, null, 2)
}

export function downloadAsFile(
  content: string,
  filename: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

export async function copyToClipboard(
  text: string,
): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
