import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Quickstart' }

type Props = { params: Promise<{ workspaceSlug: string }> }

export default async function WorkspaceQuickstartPage({ params }: Props) {
  const { workspaceSlug } = await params
  const apiKeysHref = `/w/${workspaceSlug}/api-keys`
  const runsHref = `/w/${workspaceSlug}/sessions`

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Quickstart</h1>
        <p className="mt-1 text-sm text-foreground">
          Connect your AI agent to this workspace in under 5 minutes.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-6">
        <StepCard number={1} title="Create an API key">
          <p className="text-sm text-foreground">
            Go to the{' '}
            <Link href={apiKeysHref} className="text-foreground hover:underline-thick hover:underline font-medium">
              API Keys page
            </Link>{' '}
            and click <strong>Create key</strong>. Copy the key — it starts with{' '}
            <code className="rounded bg-background px-1.5 py-0.5 font-mono text-xs">tbx_</code>{' '}
            and is shown only once.
          </p>
        </StepCard>

        <StepCard number={2} title="Configure your MCP client">
          <p className="text-sm text-foreground">
            Add Thoughtbox to your MCP client config file (e.g.{' '}
            <code className="rounded bg-background px-1.5 py-0.5 font-mono text-xs">
              claude_desktop_config.json
            </code>{' '}
            or Cursor settings):
          </p>
          <pre className="mt-3 overflow-x-auto rounded-xl border border-foreground/10 bg-foreground/5 px-5 py-4 font-mono text-xs leading-relaxed text-foreground">
            <code>{`{
  "mcpServers": {
    "thoughtbox": {
      "type": "http",
      "url": "https://thoughtbox-mcp-272720136470.us-central1.run.app/mcp?key=tbx_YOUR_API_KEY"
    }
  }
}`}</code>
          </pre>
          <p className="mt-2 text-xs text-foreground">
            Replace <code className="rounded bg-background px-1 font-mono">tbx_YOUR_API_KEY</code> with the key from step 1.
          </p>
        </StepCard>

        <StepCard number={3} title="Make your first call">
          <p className="text-sm text-foreground">
            Prompt your agent to use Thoughtbox:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-xl border border-foreground/10 bg-foreground/5 px-5 py-4 font-mono text-xs leading-relaxed text-foreground">
            <code>{`# Example prompt:
"Use thoughtbox to capture this thought: 'Thoughtbox is connected.'"`}</code>
          </pre>
          <p className="mt-3 text-sm text-foreground">
            Your agent will call the MCP tools. The run should appear in{' '}
            <Link href={runsHref} className="text-foreground hover:underline-thick hover:underline font-medium">
              Runs
            </Link>{' '}
            within seconds.
          </p>
        </StepCard>

        <StepCard number={4} title="Explore the dashboard">
          <p className="text-sm text-foreground">
            Once your first run is recorded, use the sidebar to:
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {[
              { label: 'Runs', href: runsHref, desc: 'Inspect MCP session traces step-by-step' },
              { label: 'API Keys', href: apiKeysHref, desc: 'Issue and revoke keys' },
            ].map((item) => (
              <li key={item.label} className="flex items-start gap-2 text-sm">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>
                  <Link href={item.href} className="font-medium text-foreground hover:underline-thick hover:underline">
                    {item.label}
                  </Link>{' '}
                  — {item.desc}
                </span>
              </li>
            ))}
          </ul>
        </StepCard>
      </div>

      {/* Help link */}
      <div className="mt-10 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5 text-center">
        <p className="text-sm text-foreground">
          Need help?{' '}
          <Link href="/docs" className="text-foreground hover:underline-thick hover:underline">
            Full documentation
          </Link>{' '}
          ·{' '}
          <Link href="/support" className="text-foreground hover:underline-thick hover:underline">
            Contact support
          </Link>
        </p>
      </div>
    </div>
  )
}

function StepCard({
  number,
  title,
  children,
}: {
  number: number
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background">
          {number}
        </div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  )
}
