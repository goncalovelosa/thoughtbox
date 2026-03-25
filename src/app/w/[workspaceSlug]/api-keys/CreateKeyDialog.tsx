'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createApiKeyAction, type CreateKeyState } from './actions'

type CreateKeyDialogProps = {
  workspaceSlug: string
}

export function CreateKeyDialog({ workspaceSlug }: CreateKeyDialogProps) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState<CreateKeyState, FormData>(
    createApiKeyAction,
    null,
  )
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const hasKey = state?.plainKey != null

  useEffect(() => {
    if (hasKey) inputRef.current?.select()
  }, [hasKey])

  function handleClose() {
    setOpen(false)
    setCopied(false)
    setCopyError(null)
    if (hasKey) router.refresh()
  }

  async function handleCopy() {
    if (!state?.plainKey) return
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API unavailable')
      }
      await navigator.clipboard.writeText(state.plainKey)
      setCopyError(null)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      inputRef.current?.select()
      setCopied(false)
      setCopyError('Copy failed. The key is selected so you can copy it manually.')
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-none bg-foreground text-background border-2 border-foreground px-4 py-2 text-sm font-semibold text-background hover:bg-background transition-colors"
      >
        + Create key
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-background"
            onClick={handleClose}
            onKeyDown={(e) => { if (e.key === 'Escape') handleClose() }}
            role="presentation"
          />
          <div className="relative w-full max-w-md rounded-none border border-foreground bg-background p-6 shadow-xl">
            {hasKey ? (
              <>
                <h2 className="text-lg font-semibold text-foreground">
                  Key created
                </h2>
                <p className="mt-2 text-sm text-amber-700 font-medium">
                  Copy this key now. It will not be shown again.
                </p>
                <div className="mt-4 flex gap-2">
                  <input
                    ref={inputRef}
                    readOnly
                    value={state.plainKey}
                    className="flex-1 rounded-none border border-foreground bg-background px-3 py-2 font-mono text-sm text-foreground"
                  />
                  <button
                    onClick={handleCopy}
                    className="rounded-none border border-foreground px-3 py-2 text-sm font-medium text-foreground hover:bg-background transition-colors"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                {copyError && (
                  <p className="mt-3 text-sm text-amber-700">{copyError}</p>
                )}
                <button
                  onClick={handleClose}
                  className="mt-4 w-full rounded-none bg-foreground text-background border-2 border-foreground px-4 py-2 text-sm font-semibold text-background hover:bg-background transition-colors"
                >
                  Done
                </button>
              </>
            ) : (
              <form action={formAction}>
                <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
                <h2 className="text-lg font-semibold text-foreground">
                  Create API key
                </h2>
                <p className="mt-1 text-sm text-foreground">
                  Give your key a descriptive name so you can identify it later.
                </p>
                <input
                  name="name"
                  required
                  maxLength={64}
                  placeholder="e.g. Production MCP server"
                  className="mt-4 w-full rounded-none border border-foreground px-3 py-2 text-sm text-foreground placeholder:text-foreground focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                />
                {state?.error && (
                  <p className="mt-2 text-sm text-red-600">{state.error}</p>
                )}
                <div className="mt-4 flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-none border border-foreground px-4 py-2 text-sm font-medium text-foreground hover:bg-background transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="rounded-none bg-foreground text-background border-2 border-foreground px-4 py-2 text-sm font-semibold text-background hover:bg-background disabled:opacity-50 transition-colors"
                  >
                    {pending ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
