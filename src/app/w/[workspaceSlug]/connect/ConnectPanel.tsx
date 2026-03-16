'use client'

import { useState } from 'react'
import Link from 'next/link'

const MCP_SERVER_URL = 'https://thoughtbox-mcp-272720136470.us-central1.run.app/mcp'

const PLACEHOLDER_KEY = '<YOUR_API_KEY>'

function buildConfig(apiKey: string): string {
  return JSON.stringify(
    {
      mcpServers: {
        thoughtbox: {
          type: 'http',
          url: MCP_SERVER_URL,
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
  const configJson = buildConfig(PLACEHOLDER_KEY)

  async function handleCopy() {
    await navigator.clipboard.writeText(configJson)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
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

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              1. Copy your MCP config
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Paste this into your MCP client&apos;s configuration
              file.
            </p>
          </div>
          <button
            onClick={handleCopy}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div className="overflow-x-auto p-6">
          <pre className="rounded-lg bg-slate-900 p-4 text-sm leading-relaxed text-slate-100 font-mono">
            {configJson}
          </pre>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-900">
            2. Add to your MCP client
          </h2>
        </div>
        <div className="px-6 py-4 space-y-4 text-sm text-slate-600">
          <div>
            <p className="font-medium text-slate-900">Claude Code</p>
            <p className="mt-1">
              Add the config above to{' '}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">
                .claude/settings.json
              </code>{' '}
              or{' '}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">
                .mcp.json
              </code>{' '}
              under the{' '}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">
                mcpServers
              </code>{' '}
              key, then restart Claude Code.
            </p>
          </div>
          <div>
            <p className="font-medium text-slate-900">
              Other MCP clients
            </p>
            <p className="mt-1">
              Consult your client&apos;s docs for where MCP server
              configs are stored. The shape is the same:{' '}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">
                {'{ "type": "http", "url": "...", "headers": { ... } }'}
              </code>
            </p>
          </div>
        </div>
      </section>

      <p className="text-xs text-slate-400">
        Your API key authenticates your MCP client to the Thoughtbox
        server. Never share it publicly.
      </p>
    </div>
  )
}
