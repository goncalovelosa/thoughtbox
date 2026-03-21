import type { ThoughtRowVM } from '@/lib/session/view-models'

type SessionStatus = 'active' | 'completed' | 'abandoned'
type ThoughtDisplayType = ThoughtRowVM['displayType']

export const BADGE_BASE =
  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide'

export const STATUS_BADGE: Record<SessionStatus, string> = {
  active: 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/20',
  completed: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/20',
  abandoned: 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/20',
}

export const STATUS_LABEL: Record<SessionStatus, string> = {
  active: 'Active',
  completed: 'Completed',
  abandoned: 'Abandoned',
}

export const THOUGHT_TYPE_BADGE: Record<ThoughtDisplayType, string> = {
  decision_frame: 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/20',
  action_report: 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/20',
  progress: 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/20',
  belief_snapshot: 'bg-pink-500/15 text-pink-300 ring-1 ring-pink-500/20',
  assumption_update: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/20',
  context_snapshot: 'bg-slate-500/15 text-slate-300 ring-1 ring-slate-500/20',
  reasoning: 'bg-slate-700/50 text-slate-200 ring-1 ring-slate-600',
}

export const THOUGHT_TYPE_LABEL: Record<ThoughtDisplayType, string> = {
  decision_frame: 'Decision',
  action_report: 'Action',
  progress: 'Progress',
  belief_snapshot: 'Beliefs',
  assumption_update: 'Assumption',
  context_snapshot: 'Context',
  reasoning: 'Reasoning',
}

export const REVISION_BADGE =
  'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/20'
