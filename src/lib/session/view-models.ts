import { format, formatDistanceToNow, differenceInMilliseconds } from 'date-fns'

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000)
  if (totalSeconds < 60) return `${totalSeconds}s`
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes < 60) return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}

/**
 * Raw Persistence Records
 * These approximate the data shape coming from the MCP server or database
 */

export type RawThoughtRecord = {
  id: string
  thoughtNumber?: number
  totalThoughts?: number
  thought: string
  timestamp: string
  nextThoughtNeeded?: boolean

  isRevision?: boolean
  revisesThought?: number

  branchId?: string
  branchFromThought?: number

  thoughtType?: 'reasoning' | 'decision_frame' | 'action_report' |
    'belief_snapshot' | 'assumption_update' | 'context_snapshot' | 'progress'

  confidence?: 'high' | 'medium' | 'low'
  options?: { label: string; selected: boolean; reason?: string }[]
  actionResult?: {
    success: boolean
    reversible: 'yes' | 'no' | 'partial'
    tool: string
    target: string
    sideEffects?: string[]
  }
  beliefs?: {
    entities: { name: string; state: string }[]
    constraints?: string[]
    risks?: string[]
  }
  assumptionChange?: {
    text: string
    oldStatus: string
    newStatus: 'believed' | 'uncertain' | 'refuted'
    trigger?: string
    downstream?: number[]
  }
  contextData?: {
    toolsAvailable?: string[]
    systemPromptHash?: string
    modelId?: string
    constraints?: string[]
    dataSourcesAccessed?: string[]
  }
  progressData?: {
    task: string
    status: 'pending' | 'in_progress' | 'done' | 'blocked'
    note?: string
  }

  agentId?: string
  agentName?: string
  contentHash?: string
  parentHash?: string
  critique?: unknown
}

export type RawSessionRecord = {
  id: string
  title?: string
  tags?: string[]
  createdAt: string
  completedAt?: string
  updatedAt?: string
  status: 'active' | 'completed' | 'abandoned'
  thoughts?: RawThoughtRecord[]
}

/**
 * View Models
 * These represent the normalized state consumed by the UI components
 */

export type SessionSummaryVM = {
  id: string
  shortId: string
  title?: string
  status: 'active' | 'completed' | 'abandoned'
  tags: string[]
  thoughtCount?: number
  startedAtISO: string
  startedAtLabel: string
  durationLabel: string
  href: string
}

export type SessionDetailVM = {
  id: string
  shortId: string
  title?: string
  status: 'active' | 'completed' | 'abandoned'
  tags: string[]
  startedAtISO: string
  startedAtLabel: string
  completedAtISO?: string
  durationLabel: string
  thoughtCount: number
  lastUpdatedAtISO?: string
  isLiveCapable: boolean
}

export type ThoughtDisplayType =
  | 'reasoning'
  | 'decision_frame'
  | 'action_report'
  | 'belief_snapshot'
  | 'assumption_update'
  | 'context_snapshot'
  | 'progress'

export type ThoughtRowVM = {
  id: string
  thoughtNumber: number
  totalThoughts?: number
  shortId: string
  previewText: string
  timestampISO: string
  relativeTimeLabel: string
  absoluteTimeLabel: string
  displayType: ThoughtDisplayType
  isTyped: boolean
  isRevision: boolean
  revisesThought?: number
  laneIndex: number
  laneColorToken: string
  branchId?: string
  branchLabel?: string
  branchFromThought?: number
  showGapBefore: boolean
  gapLabel?: string
  searchIndexText: string
}

export type ThoughtDetailVM = ThoughtRowVM & {
  rawThought: string
  nextThoughtNeeded?: boolean
  confidence?: 'high' | 'medium' | 'low'
  options?: { label: string; selected: boolean; reason?: string }[]
  actionResult?: {
    success: boolean
    reversible: 'yes' | 'no' | 'partial'
    tool: string
    target: string
    sideEffects?: string[]
  }
  beliefs?: {
    entities: { name: string; state: string }[]
    constraints?: string[]
    risks?: string[]
  }
  assumptionChange?: {
    text: string
    oldStatus: string
    newStatus: 'believed' | 'uncertain' | 'refuted'
    trigger?: string
    downstream?: number[]
  }
  contextData?: {
    toolsAvailable?: string[]
    systemPromptHash?: string
    modelId?: string
    constraints?: string[]
    dataSourcesAccessed?: string[]
  }
  progressData?: {
    task: string
    status: 'pending' | 'in_progress' | 'done' | 'blocked'
    note?: string
  }
  debugMeta: Record<string, unknown>
}

/**
 * Adapter Functions
 */

export function createSessionSummaryVM(raw: RawSessionRecord, workspaceSlug: string): SessionSummaryVM {
  const shortId = raw.id.slice(0, 7)
  const title = raw.title?.trim()
  const startedAt = new Date(raw.createdAt)
  
  let durationLabel = '—'
  if (raw.completedAt) {
    const ms = differenceInMilliseconds(new Date(raw.completedAt), startedAt)
    durationLabel = formatDuration(ms)
  } else if (raw.status === 'active') {
    // For active sessions, we use updated at or just show a pulse
    const end = raw.updatedAt ? new Date(raw.updatedAt) : new Date()
    const ms = differenceInMilliseconds(end, startedAt)
    durationLabel = formatDuration(ms)
  }

  const thoughtCount = raw.thoughts?.length

  return {
    id: raw.id,
    shortId,
    title: title || undefined,
    status: raw.status,
    tags: raw.tags || [],
    thoughtCount,
    startedAtISO: raw.createdAt,
    startedAtLabel: format(startedAt, 'MMM d, yyyy HH:mm'),
    durationLabel,
    href: `/w/${workspaceSlug}/runs/${raw.id}`
  }
}

export function createSessionDetailVM(raw: RawSessionRecord): SessionDetailVM {
  const shortId = raw.id.slice(0, 7)
  const title = raw.title?.trim()
  const startedAt = new Date(raw.createdAt)
  
  let durationLabel = '—'
  if (raw.completedAt) {
    const ms = differenceInMilliseconds(new Date(raw.completedAt), startedAt)
    durationLabel = formatDuration(ms)
  } else if (raw.status === 'active') {
    const end = raw.updatedAt ? new Date(raw.updatedAt) : new Date()
    const ms = differenceInMilliseconds(end, startedAt)
    durationLabel = formatDuration(ms)
  }

  return {
    id: raw.id,
    shortId,
    title: title || undefined,
    status: raw.status,
    tags: raw.tags || [],
    startedAtISO: raw.createdAt,
    startedAtLabel: format(startedAt, 'MMM d, yyyy HH:mm'),
    completedAtISO: raw.completedAt,
    durationLabel,
    thoughtCount: raw.thoughts?.length || 0,
    lastUpdatedAtISO: raw.updatedAt || raw.completedAt || raw.createdAt,
    isLiveCapable: raw.status === 'active'
  }
}

export function createThoughtViewModels(rawThoughts: RawThoughtRecord[]): { rows: ThoughtRowVM[], details: Record<string, ThoughtDetailVM> } {
  // Sort thoughts robustly: by thoughtNumber if present, falling back to timestamp
  const sorted = [...rawThoughts].sort((a, b) => {
    if (a.thoughtNumber != null && b.thoughtNumber != null) {
      return a.thoughtNumber - b.thoughtNumber
    }
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  })

  // Determine lane assignments based on branch topology
  // Lane 0 is main chain. We assign sequential lanes to new branches as they appear.
  const laneAssignments = new Map<string, number>()
  laneAssignments.set('__main__', 0)
  
  const laneColors = [
    'primary',
    'secondary',
    'secondary',
    'secondary',
    'secondary',
    'secondary'
  ]

  let nextAvailableLane = 1

  const rows: ThoughtRowVM[] = []
  const details: Record<string, ThoughtDetailVM> = {}

  let lastTimestamp: Date | null = null

  sorted.forEach((raw, index) => {
    const isRevision = raw.isRevision === true || raw.revisesThought != null
    const displayType = raw.thoughtType ?? 'reasoning'
    const isTyped = raw.thoughtType != null

    // Branch lane assignment
    const branchKey = raw.branchId || '__main__'
    if (!laneAssignments.has(branchKey)) {
      laneAssignments.set(branchKey, nextAvailableLane++)
    }
    const laneIndex = laneAssignments.get(branchKey)!
    const laneColorToken = laneColors[laneIndex % laneColors.length]

    // Timestamps and gap calculation
    const currentTimestamp = new Date(raw.timestamp)
    let showGapBefore = false
    let gapLabel: string | undefined

    if (lastTimestamp) {
      const diffMs = currentTimestamp.getTime() - lastTimestamp.getTime()
      if (diffMs > 5 * 60 * 1000) { // > 5 minutes
        showGapBefore = true
        if (diffMs > 60 * 60 * 1000) {
          const hours = Math.floor(diffMs / (60 * 60 * 1000))
          const mins = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000))
          gapLabel = `${hours}h ${mins}m gap`
        } else {
          gapLabel = `${Math.floor(diffMs / (60 * 1000))}m gap`
        }
      }
    }
    lastTimestamp = currentTimestamp

    // Preview text (first line)
    const previewText = raw.thought.split('\n')[0].substring(0, 120).trim() + (raw.thought.length > 120 ? '\u2026' : '')

    // Search index string
    const searchParts = [
      raw.thought,
      raw.branchId,
      raw.thoughtType,
      raw.actionResult?.tool,
      raw.actionResult?.target,
      raw.assumptionChange?.text,
      raw.progressData?.task,
      raw.progressData?.note
    ].filter(Boolean).map(s => String(s).toLowerCase())
    
    // Add nested text like option labels or belief entities
    raw.options?.forEach(opt => searchParts.push(opt.label.toLowerCase(), opt.reason?.toLowerCase() || ''))
    raw.beliefs?.entities.forEach(ent => searchParts.push(ent.name.toLowerCase(), ent.state.toLowerCase()))

    const searchIndexText = searchParts.join(' ')

    const rowVM: ThoughtRowVM = {
      id: raw.id,
      thoughtNumber: raw.thoughtNumber ?? (index + 1), // fallback
      totalThoughts: raw.totalThoughts,
      shortId: raw.id.slice(0, 7),
      previewText,
      timestampISO: raw.timestamp,
      relativeTimeLabel: formatDistanceToNow(currentTimestamp, { addSuffix: true }),
      absoluteTimeLabel: format(currentTimestamp, 'MMM d, yyyy HH:mm:ss'),
      displayType,
      isTyped,
      isRevision,
      revisesThought: raw.revisesThought,
      laneIndex,
      laneColorToken,
      branchId: raw.branchId,
      branchLabel: raw.branchId ? `Branch: ${raw.branchId.slice(0, 6)}` : undefined,
      branchFromThought: raw.branchFromThought,
      showGapBefore,
      gapLabel,
      searchIndexText
    }

    // Extract debugging metadata
    const debugMeta: Record<string, unknown> = {}
    const knownKeys = new Set([
      'id', 'thoughtNumber', 'totalThoughts', 'thought', 'timestamp',
      'nextThoughtNeeded', 'isRevision', 'revisesThought', 'branchId',
      'branchFromThought', 'thoughtType', 'confidence', 'options',
      'actionResult', 'beliefs', 'assumptionChange', 'contextData', 'progressData'
    ])
    
    for (const [k, v] of Object.entries(raw)) {
      if (!knownKeys.has(k)) {
        debugMeta[k] = v
      }
    }

    const detailVM: ThoughtDetailVM = {
      ...rowVM,
      rawThought: raw.thought,
      nextThoughtNeeded: raw.nextThoughtNeeded,
      confidence: raw.confidence,
      options: raw.options,
      actionResult: raw.actionResult,
      beliefs: raw.beliefs,
      assumptionChange: raw.assumptionChange,
      contextData: raw.contextData,
      progressData: raw.progressData,
      debugMeta
    }

    rows.push(rowVM)
    details[raw.id] = detailVM
  })

  return { rows, details }
}
