'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const MCP_SERVER_URL = 'https://thoughtbox-mcp-1082615885989.us-central1.run.app/mcp'

function buildConfig(token: string): string {
  return JSON.stringify(
    {
      mcpServers: {
        thoughtbox: {
          type: 'http',
          url: `${MCP_SERVER_URL}?token=${token}`,
        },
      },
    },
    null,
    2,
  )
}

export function ConnectPanel({
  accessToken,
}: {
  accessToken: string | null
}) {
  const [token, setToken] = useState(accessToken)
  const [copied, setCopied] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  async function handleRefresh() {
    setRefreshing(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      setToken(session?.access_token ?? null)
    } finally {
      setRefreshing(false)
    }
  }

  async function handleCopy() {
    if (!token) return
    await navigator.clipboard.writeText(buildConfig(token))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!token) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
        <p className="text-sm font-medium text-amber-900">
          No active session
        </p>
        <p className="mt-1 text-sm text-amber-700">
          Your session may have expired. Try refreshing or signing in
          again.
        </p>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="mt-3 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
        >
          {refreshing ? 'Refreshing\u2026' : 'Refresh session'}
        </button>
      </div>
    )
  }

  const configJson = buildConfig(token)

  return (
    <div className="space-y-6">
      {/* Step 1: Config snippet */}
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

      {/* Step 2: Instructions */}
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
                ~/.claude/claude_desktop_config.json
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
                {'{ "type": "http", "url": "..." }'}
              </code>
            </p>
          </div>
        </div>
      </section>

      {/* Token info */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Session token
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              This token is from your current browser session and
              expires after 1 hour. Refresh this page to get a new one.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            {refreshing ? 'Refreshing\u2026' : 'Refresh token'}
          </button>
        </div>
        <div className="mt-3 overflow-x-auto">
          <code className="block rounded-lg bg-slate-50 border border-slate-100 p-3 text-xs font-mono text-slate-500 break-all">
            {token}
          </code>
        </div>
      </section>

      <p className="text-xs text-slate-400">
        Your token is a Supabase session JWT. It authenticates your MCP
        client to the Thoughtbox server. Never share it publicly.
      </p>
    </div>
  )
}
