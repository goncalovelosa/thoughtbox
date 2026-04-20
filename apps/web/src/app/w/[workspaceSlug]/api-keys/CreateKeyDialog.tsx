'use client'

import { useActionState, useCallback, useEffect, useRef, useState } from 'react'
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
  const dialogRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const hasKey = state?.plainKey != null

  useEffect(() => {
    if (hasKey) inputRef.current?.select()
  }, [hasKey])

  const handleClose = useCallback(() => {
    setOpen(false)
    setCopied(false)
    setCopyError(null)
    if (hasKey) router.refresh()
  }, [hasKey, router])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, handleClose])

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
        className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-all hover:bg-foreground/80"
      >
        + Create key
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-background"
            onClick={handleClose}
            role="presentation"
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-key-title"
            className="relative w-full max-w-md rounded-2xl border border-foreground/10 bg-background p-6 shadow-xl"
            style={{ overscrollBehavior: 'contain' }}
          >
            {hasKey ? (
              <>
                <h2 id="create-key-title" className="text-lg font-semibold text-foreground">
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
                    aria-label="API key value"
                    className="flex-1 rounded-xl border border-foreground/10 bg-foreground/5 px-3 py-2 font-mono text-sm text-foreground focus:border-foreground/20 focus:ring-2 focus:ring-foreground/10"
                  />
                  <button
                    onClick={handleCopy}
                    className="rounded-xl border border-foreground/10 px-3 py-2 text-sm font-medium text-foreground hover:bg-foreground/5 transition-all"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                {copyError && (
                  <p className="mt-3 text-sm text-amber-700">{copyError}</p>
                )}
                <button
                  onClick={handleClose}
                  className="mt-4 w-full rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-all hover:bg-foreground/80"
                >
                  Done
                </button>
              </>
            ) : (
              <form action={formAction}>
                <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
                <h2 id="create-key-title" className="text-lg font-semibold text-foreground">
                  Create API key
                </h2>
                <p className="mt-1 text-sm text-foreground">
                  Give your key a descriptive name so you can identify it later.
                </p>
                <label htmlFor="key-name" className="sr-only">Key name</label>
                <input
                  id="key-name"
                  name="name"
                  required
                  maxLength={64}
                  autoComplete="off"
                  placeholder="e.g. Production MCP server"
                  className="mt-4 w-full rounded-xl border border-foreground/10 bg-foreground/5 px-3 py-2 text-sm text-black placeholder:text-neutral-400 focus:border-foreground/20 focus:outline-none focus:ring-2 focus:ring-foreground/10"
                />
                {state?.error && (
                  <p className="mt-2 text-sm text-red-600">{state.error}</p>
                )}
                <div className="mt-4 flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-full border border-foreground/10 px-4 py-2 text-sm font-medium text-foreground hover:bg-foreground/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-all hover:bg-foreground/80 disabled:opacity-50"
                  >
                    {pending ? 'Creating\u2026' : 'Create'}
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
