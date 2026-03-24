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
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="mt-1 text-sm text-foreground">
            Isolated memory namespaces within your workspace.
          </p>
        </div>
        <button
          disabled
          className="rounded-none bg-foreground text-background border-2 border-foreground px-4 py-2 text-sm font-semibold text-background opacity-50 cursor-not-allowed"
          title="Project creation via API key integration — coming soon"
        >
          + New project
        </button>
      </div>

      {/* Empty state */}
      <div className="rounded-none border border-foreground bg-background shadow-sm">
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
          <p className="text-3xl">📁</p>
          <p className="text-lg font-semibold text-foreground">No projects yet</p>
          <p className="max-w-sm text-sm text-foreground">
            Projects are created when your MCP client first calls the{' '}
            <code className="rounded bg-background px-1.5 py-0.5 font-mono text-xs">
              thoughtbox
            </code>
            {' '}tool. Connect your agent to get started.
          </p>
          <Link
            href={`/w/${workspaceSlug}/docs/quickstart`}
            className="mt-3 rounded-none bg-foreground text-background border-2 border-foreground px-5 py-2.5 text-sm font-semibold text-background hover:bg-background transition-colors"
          >
            View quickstart guide
          </Link>
        </div>
      </div>
    </div>
  )
}
