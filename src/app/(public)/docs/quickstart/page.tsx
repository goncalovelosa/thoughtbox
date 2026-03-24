import type { Metadata } from 'next'
import Link from 'next/link'
import { THOUGHTBOX_MCP_URL } from '@/lib/thoughtbox-config'

export const metadata: Metadata = {
  title: 'Quickstart — Documentation',
}

export default function QuickstartPage() {
  return (
    <div className="px-6 py-16">
      <div className="mx-auto max-w-3xl">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-foreground">
          <Link href="/docs" className="hover:text-foreground hover:underline-thick transition-colors">Docs</Link>
          <span>/</span>
          <span className="text-foreground">Quickstart</span>
        </nav>

        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Quickstart</h1>
        <p className="mt-4 text-lg text-foreground">
          Connect your first AI agent to Thoughtbox in under 5 minutes.
        </p>

        <div className="prose mt-10 max-w-none">
          {/* Step 1 */}
          <Step number={1} title="Create a workspace and get an API key">
            <p className="text-foreground">
              Sign up for a free account. After your workspace is created, navigate to{' '}
              <strong>API Keys</strong> in the sidebar and click <strong>Create key</strong>.
              Copy the key — it starts with <code className="rounded bg-background px-1.5 py-0.5 font-mono text-sm">tbx_</code> and is shown only once.
            </p>
            <div className="mt-4 flex gap-3">
              <Link
                href="/sign-up"
                className="rounded-none bg-foreground text-background border-2 border-foreground px-5 py-2.5 text-sm font-semibold text-background hover:bg-background transition-colors"
              >
                Create account
              </Link>
              <Link
                href="/sign-in"
                className="rounded-none border border-foreground px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-background transition-colors"
              >
                Sign in
              </Link>
            </div>
          </Step>

          {/* Step 2 */}
          <Step number={2} title="Add Thoughtbox to your MCP client config">
            <p className="text-foreground">
              Open your MCP client configuration file and add the Thoughtbox server:
            </p>
            <CodeBlock>{`{
  "mcpServers": {
    "thoughtbox": {
      "url": "${THOUGHTBOX_MCP_URL}",
      "headers": {
        "Authorization": "Bearer tbx_YOUR_API_KEY"
      }
    }
  }
}`}</CodeBlock>
            <p className="mt-4 text-sm text-foreground">
              Replace <code className="rounded bg-background px-1.5 py-0.5 font-mono text-xs">tbx_YOUR_API_KEY</code> with the key from step 1.
            </p>
          </Step>

          {/* Step 3 */}
          <Step number={3} title="Create your first project">
            <p className="text-foreground">
              In your MCP client, ask your agent to call the <code className="rounded bg-background px-1.5 py-0.5 font-mono text-sm">create_project</code> tool:
            </p>
            <CodeBlock>{`# Example prompt to your agent:
"Use thoughtbox to create a project called 'my-research'.
 Then capture this thought: 'Thoughtbox is connected and working.'"`}</CodeBlock>
            <p className="mt-4 text-foreground">
              The agent will call the Thoughtbox MCP tools and you should see the run appear in your{' '}
              <strong>Runs</strong> dashboard within seconds.
            </p>
          </Step>

          {/* Step 4 */}
          <Step number={4} title="Verify in the dashboard">
            <p className="text-foreground">
              Open your workspace dashboard and check:
            </p>
            <ul className="mt-3 flex flex-col gap-2">
              {[
                'Projects page — your new project is listed',
                'Runs page — the MCP session run is visible with a success status',
                'The run detail shows the thoughts captured in sequence',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </Step>
        </div>

        {/* Next steps */}
        <div className="mt-12 rounded-none border border-foreground bg-background p-6">
          <h2 className="font-semibold text-foreground">Next steps</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-foreground">
            <li>
              <Link href="/docs" className="text-foreground hover:underline-thick hover:underline">Explore the full docs</Link>
              {' '}— learn about knowledge graphs, semantic search, and run analysis.
            </li>
            <li>
              <Link href="/pricing" className="text-foreground hover:underline-thick hover:underline">Check the pricing page</Link>
              {' '}— upgrade to Pro for higher limits and 1-year history.
            </li>
            <li>
              <Link href="/support" className="text-foreground hover:underline-thick hover:underline">Contact support</Link>
              {' '}— if anything isn&apos;t working, we&apos;re here to help.
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function Step({
  number,
  title,
  children,
}: {
  number: number
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="mt-10 flex gap-5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-none bg-foreground text-background border-2 border-foreground text-sm font-bold text-background">
        {number}
      </div>
      <div className="flex-1 pt-0.5">
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  )
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="mt-4 overflow-x-auto rounded-none bg-background p-5 font-mono text-sm leading-relaxed text-foreground">
      <code>{children}</code>
    </pre>
  )
}
