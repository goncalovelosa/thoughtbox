import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Projects' }

type Props = { params: Promise<{ workspaceSlug: string }> }

export default async function ProjectsPage({ params }: Props) {
  const { workspaceSlug } = await params

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <p className="mt-1 text-sm text-slate-500">
            Isolated memory namespaces within your workspace.
          </p>
        </div>
        <button
          disabled
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white opacity-50 cursor-not-allowed"
          title="Project creation via API key integration — coming soon"
        >
          + New project
        </button>
      </div>

      {/* Empty state */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
          <p className="text-3xl">📁</p>
          <p className="text-lg font-semibold text-slate-800">No projects yet</p>
          <p className="max-w-sm text-sm text-slate-400">
            Projects are created when your MCP client first calls{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">
              create_project
            </code>
            . Connect your agent to get started.
          </p>
          <Link
            href={`/w/${workspaceSlug}/docs/quickstart`}
            className="mt-3 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
          >
            View quickstart guide
          </Link>
        </div>
      </div>
    </div>
  )
}
