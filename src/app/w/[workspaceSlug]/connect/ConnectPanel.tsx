'use client'

import { useState } from 'react'
import Link from 'next/link'

const MCP_SERVER_URL = 'https://thoughtbox-mcp-272720136470.us-central1.run.app/mcp'
const PLACEHOLDER_KEY = '<YOUR_API_KEY>'

type ApiKeyOption = { id: string; name: string; prefix: string }

function buildConfig(apiKey: string): string {
  return JSON.stringify(
    {
      mcpServers: {
        thoughtbox: {
          type: 'http',
          url: `${MCP_SERVER_URL}?key=${apiKey}`,
        },
      },
    },
    null,
    2,
  )
}

export function ConnectPanel({
  workspaceSlug,
  apiKeys = [],
}: {
  workspaceSlug: string
  apiKeys?: ApiKeyOption[]
}) {
  const hasKeys = apiKeys.length > 0
  const [selectedKeyId, setSelectedKeyId] = useState<string>(hasKeys ? apiKeys[0].id : '')
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState<string | null>(null)

  const selectedKey = apiKeys.find(k => k.id === selectedKeyId)
  const displayKey = selectedKey ? `tbx_${selectedKey.prefix}_…` : PLACEHOLDER_KEY
  const configJson = buildConfig(displayKey)

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
      setCopyError('Copy failed — select the config below and copy it manually.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Key selector / no-key warning */}
      {hasKeys ? (
        <div className="rounded-none border border-foreground bg-background px-5 py-4">
          <label htmlFor="key-select" className="block text-sm font-medium text-foreground mb-2">
            API key
          </label>
          <select
            id="key-select"
            value={selectedKeyId}
            onChange={e => setSelectedKeyId(e.target.value)}
            className="w-full rounded-none border border-foreground bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
            autoComplete="off"
          >
            {apiKeys.map(k => (
              <option key={k.id} value={k.id}>
                {k.name} (tbx_{k.prefix}_…)
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-muted-foreground">
            Select a key to embed it in the config below.{' '}
            <Link href={`/w/${workspaceSlug}/api-keys`} className="underline hover:text-foreground transition-colors">
              Manage keys →
            </Link>
          </p>
        </div>
      ) : (
        <div className="rounded-none border border-foreground bg-muted px-5 py-4">
          <p className="text-sm font-medium text-foreground">No API keys yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a key on the{' '}
            <Link href={`/w/${workspaceSlug}/api-keys`} className="font-medium underline hover:text-foreground transition-colors">
              API Keys
            </Link>{' '}
            page, then return here to copy the config.
          </p>
        </div>
      )}

      {/* Config block */}
      <section className="rounded-none border border-foreground bg-background">
        <div className="flex items-center justify-between border-b border-foreground px-6 py-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              1. Copy your MCP config
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Paste this into your MCP client&apos;s configuration file.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-none border border-foreground px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div className="overflow-x-auto p-6">
          <pre className="rounded-none bg-muted p-4 text-sm leading-relaxed text-foreground font-mono">
            {configJson}
          </pre>
          {!hasKeys && (
            <p className="mt-3 text-xs text-muted-foreground">
              Replace <code className="font-mono text-foreground">{PLACEHOLDER_KEY}</code> with your actual key before using.
            </p>
          )}
          {copyError && (
            <p className="mt-3 text-xs text-muted-foreground">{copyError}</p>
          )}
        </div>
      </section>

      {/* Add-to-client instructions */}
      <section className="rounded-none border border-foreground bg-background">
        <div className="border-b border-foreground px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">
            2. Add to your MCP client
          </h2>
        </div>
        <div className="px-6 py-4 space-y-4 text-sm text-foreground">
          <div>
            <p className="font-medium text-foreground">Claude Code</p>
            <p className="mt-1 text-muted-foreground">
              Add the config above to{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                .claude/settings.json
              </code>{' '}
              under the{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                mcpServers
              </code>{' '}
              key, then restart Claude Code. Roots you have open become projects in Thoughtbox automatically.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">Cursor / Windsurf / other MCP clients</p>
            <p className="mt-1 text-muted-foreground">
              Consult your client&apos;s docs for the MCP config path. The shape is the same:{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                {'{ "type": "http", "url": "..." }'}
              </code>
            </p>
          </div>
        </div>
      </section>

      <p className="text-xs text-muted-foreground">
        Your API key authenticates your MCP client to the Thoughtbox server. Never share it publicly.
      </p>
    </div>
  )
}
