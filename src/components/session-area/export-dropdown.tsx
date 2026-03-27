'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { SessionDetailVM, ThoughtDetailVM } from '@/lib/session/view-models'
import {
  formatSessionMarkdown,
  formatSessionJSON,
  downloadAsFile,
  copyToClipboard,
} from '@/lib/session/export-formatters'

type Props = {
  session: SessionDetailVM
  thoughts: ThoughtDetailVM[]
  hasActiveFilters: boolean
}

export function ExportDropdown({
  session,
  thoughts,
  hasActiveFilters,
}: Props) {
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2000)
    return () => clearTimeout(timer)
  }, [toast])

  const shortId = session.shortId

  const handleMarkdown = useCallback(() => {
    const md = formatSessionMarkdown(session, thoughts)
    downloadAsFile(md, `session-${shortId}.md`, 'text/markdown')
    setOpen(false)
  }, [session, thoughts, shortId])

  const handleJSON = useCallback(() => {
    const json = formatSessionJSON(session, thoughts)
    downloadAsFile(json, `session-${shortId}.json`, 'application/json')
    setOpen(false)
  }, [session, thoughts, shortId])

  const handleClipboard = useCallback(async () => {
    const md = formatSessionMarkdown(session, thoughts)
    const ok = await copyToClipboard(md)
    setToast(ok ? 'Copied to clipboard' : 'Failed to copy')
    setOpen(false)
  }, [session, thoughts])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-none border border-foreground/30 text-foreground/70 hover:text-foreground hover:border-foreground/50 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
          />
        </svg>
        Export{hasActiveFilters ? ' (filtered)' : ''}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 w-48 rounded-none border border-foreground bg-background shadow-lg">
          <button
            type="button"
            onClick={handleMarkdown}
            className="w-full px-3 py-2 text-left text-xs text-foreground hover:bg-foreground/5 transition-colors"
          >
            Export Markdown
          </button>
          <button
            type="button"
            onClick={handleJSON}
            className="w-full px-3 py-2 text-left text-xs text-foreground hover:bg-foreground/5 transition-colors border-t border-foreground/10"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={handleClipboard}
            className="w-full px-3 py-2 text-left text-xs text-foreground hover:bg-foreground/5 transition-colors border-t border-foreground/10"
          >
            Copy to clipboard
          </button>
        </div>
      )}

      {toast && (
        <div className="absolute right-0 top-full mt-10 z-20 px-3 py-1.5 rounded-none border border-foreground/30 bg-background text-xs text-foreground shadow-md whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  )
}
