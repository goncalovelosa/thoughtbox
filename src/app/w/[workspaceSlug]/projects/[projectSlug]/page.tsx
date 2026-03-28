import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { format, formatDistanceToNow } from 'date-fns'
import { Folder, ArrowLeft, BrainCircuit, GitBranch } from 'lucide-react'
import { BADGE_BASE, STATUS_BADGE, STATUS_LABEL } from '@/lib/session/badge-styles'

export const metadata: Metadata = { title: 'Project' }

type Props = { params: Promise<{ workspaceSlug: string; projectSlug: string }> }

function getProjectDisplayName(project: string): string {
  try {
    const normalized = project.startsWith('file://') ? project.slice(7) : project
    const parts = normalized.split('/').filter(Boolean)
    return parts[parts.length - 1] || project
  } catch {
    return project
  }
}

export default async function ProjectDetailPage({ params }: Props) {
  const { workspaceSlug, projectSlug } = await params
  const project = decodeURIComponent(projectSlug)

  const supabase = await createClient()

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('slug', workspaceSlug)
    .single()

  if (!workspace) notFound()

  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('id, title, status, thought_count, branch_count, created_at, updated_at, completed_at, tags')
    .eq('workspace_id', workspace.id)
    .eq('project', project)
    .order('updated_at', { ascending: false })
    .limit(100)

  if (error) console.error('Failed to fetch project sessions:', error)

  if (!sessions || sessions.length === 0) notFound()

  const totalThoughts = sessions.reduce((sum, s) => sum + (s.thought_count ?? 0), 0)
  const completedCount = sessions.filter(s => s.status === 'completed').length
  const activeCount = sessions.filter(s => s.status === 'active').length
  const displayName = getProjectDisplayName(project)
  const isRootUri = project.startsWith('file://')
  const lastActive = sessions[0].updated_at

  return (
    <div className="mx-auto max-w-4xl">
      {/* Back link */}
      <Link
        href={`/w/${workspaceSlug}/projects`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        All projects
      </Link>

      {/* Header */}
      <div className="mb-6 flex items-start gap-3">
        <Folder className="h-6 w-6 text-foreground mt-0.5 shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
          {isRootUri && (
            <p className="mt-0.5 text-xs font-mono text-muted-foreground truncate" title={project}>
              {project.slice(7)}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Last active {formatDistanceToNow(new Date(lastActive), { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Total runs', value: sessions.length },
          { label: 'Thoughts', value: totalThoughts },
          { label: 'Completed', value: completedCount },
          { label: 'Active', value: activeCount },
        ].map((stat) => (
          <div key={stat.label} className="rounded-none border border-foreground bg-background p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{stat.label}</p>
            <p className="mt-1.5 text-2xl font-bold text-foreground tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Sessions list */}
      <div className="rounded-none border border-foreground bg-background">
        <div className="border-b border-foreground px-5 py-3">
          <h2 className="text-sm font-semibold text-foreground">Runs</h2>
        </div>
        <ul className="divide-y divide-border">
          {sessions.map((session) => {
            const status = (session.status ?? 'abandoned') as 'active' | 'completed' | 'abandoned'
            return (
              <li key={session.id}>
                <Link
                  href={`/w/${workspaceSlug}/runs/${session.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-muted transition-colors group"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium text-foreground truncate">
                      {session.title || `Session ${session.id.slice(0, 7)}`}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-3">
                      <span>{format(new Date(session.created_at), 'MMM d, HH:mm')}</span>
                      <span className="flex items-center gap-1">
                        <BrainCircuit className="h-3 w-3" aria-hidden="true" />
                        <span className="tabular-nums">{session.thought_count ?? 0}</span>
                      </span>
                      {(session.branch_count ?? 0) > 0 && (
                        <span className="flex items-center gap-1">
                          <GitBranch className="h-3 w-3" aria-hidden="true" />
                          <span className="tabular-nums">{session.branch_count}</span>
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className={`${BADGE_BASE} ${STATUS_BADGE[status]}`}>
                      {STATUS_LABEL[status]}
                    </span>
                    <span className="text-muted-foreground text-sm group-hover:text-foreground transition-colors" aria-hidden="true">→</span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>

      {/* MCP Roots context note */}
      <div className="mt-6 rounded-none border border-foreground bg-background px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">MCP Root</p>
        <p className="text-sm text-muted-foreground">
          This project maps to the root{' '}
          <code className="font-mono text-xs text-foreground bg-muted px-1.5 py-0.5">{project}</code>{' '}
          declared by Claude&nbsp;Code at connection time via the{' '}
          <code className="font-mono text-xs text-foreground">roots/list</code> MCP primitive.
          All runs in this project were started while operating in that directory.
        </p>
      </div>
    </div>
  )
}
