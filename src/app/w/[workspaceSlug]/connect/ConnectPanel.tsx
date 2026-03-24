'use client'

import { useState } from 'react'
import Link from 'next/link'
import { THOUGHTBOX_MCP_URL } from '@/lib/thoughtbox-config'

const PLACEHOLDER_KEY = '<YOUR_API_KEY>'

function buildConfig(apiKey: string): string {
  return JSON.stringify(
    {
      mcpServers: {
        thoughtbox: {
          type: 'http',
          url: THOUGHTBOX_MCP_URL,
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        },
      },
    },
    null,
    2,
  )
}

export function ConnectPanel({ workspaceSlug }: { workspaceSlug: string }) {
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState<string | null>(null)
  const configJson = buildConfig(PLACEHOLDER_KEY)

  async function handleCopy() {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API unavailable')
      }
      await navigator.clipboard.writeText(configJson)
      setCopyError(null)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
      setCopyError('Copy failed. Select the config below and copy it manually.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-none border border-amber-200 bg-amber-50 px-5 py-4">
        <p className="text-sm font-medium text-amber-900">
          API key required
        </p>
        <p className="mt-1 text-sm text-amber-700">
          Create an API key on the{' '}
          <Link
            href={`/w/${workspaceSlug}/api-keys`}
            className="font-medium underline hover:text-amber-900"
          >
            API Keys
          </Link>{' '}
          page, then replace{' '}
          <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-xs">{PLACEHOLDER_KEY}</code>{' '}
          in the config below with your key.
        </p>
      </div>

      <section className="rounded-none border border-foreground bg-background shadow-sm">
        <div className="flex items-center justify-between border-b border-foreground px-6 py-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              1. Copy your MCP config
            </h2>
            <p className="mt-0.5 text-xs text-foreground">
              Paste this into your MCP client&apos;s configuration
              file.
            </p>
          </div>
          <button
            onClick={handleCopy}
            className="rounded-none border border-foreground px-3 py-1.5 text-xs font-medium text-foreground hover:bg-background transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div className="overflow-x-auto p-6">
          <pre className="rounded-none bg-background p-4 text-sm leading-relaxed text-foreground font-mono">
            {configJson}
          </pre>
          {copyError && (
            <p className="mt-3 text-xs text-amber-700">{copyError}</p>
          )}
        </div>
      </section>

      <section className="rounded-none border border-foreground bg-background shadow-sm">
        <div className="border-b border-foreground px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">
            2. Add to your MCP client
          </h2>
        </div>
        <div className="px-6 py-4 space-y-4 text-sm text-foreground">
          <div>
            <p className="font-medium text-foreground">Claude Code</p>
            <p className="mt-1">
              Add the config above to{' '}
              <code className="rounded bg-background px-1.5 py-0.5 font-mono text-xs">
                .claude/settings.json
              </code>{' '}
              or{' '}
              <code className="rounded bg-background px-1.5 py-0.5 font-mono text-xs">
                .mcp.json
              </code>{' '}
              under the{' '}
              <code className="rounded bg-background px-1.5 py-0.5 font-mono text-xs">
                mcpServers
              </code>{' '}
              key, then restart Claude Code.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">
              Other MCP clients
            </p>
            <p className="mt-1">
              Consult your client&apos;s docs for where MCP server
              configs are stored. The shape is the same:{' '}
              <code className="rounded bg-background px-1.5 py-0.5 font-mono text-xs">
                {'{ "type": "http", "url": "...", "headers": { ... } }'}
              </code>
            </p>
          </div>
        </div>
      </section>

      <p className="text-xs text-foreground">
        Your API key authenticates your MCP client to the Thoughtbox
        server. Never share it publicly.
      </p>
    </div>
  )
}
