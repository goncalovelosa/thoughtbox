'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  createThoughtViewModels,
  fromThoughtsRow,
  type RawThoughtRecord,
} from './view-models'

export function useSessionRealtime(
  initialThoughts: RawThoughtRecord[],
  workspaceId: string,
  sessionId: string
) {
  const [thoughts, setThoughts] = useState<RawThoughtRecord[]>(initialThoughts)
  const [status, setStatus] = useState<string>('connecting')
  const supabase = useMemo(() => createClient(), [])

  // Reset thoughts when navigating to a different session (client-side navigation)
  // useState initializer only runs on mount, so we need this effect to handle prop changes
  useEffect(() => {
    setThoughts(initialThoughts)
  }, [sessionId, initialThoughts])

  useEffect(() => {
    if (!workspaceId) return

    console.log(`[Realtime] Subscribing to thoughts for workspace:${workspaceId}`)

    const channel = supabase.channel(`thoughts:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'thoughts',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          const raw = payload.new as Record<string, unknown>
          if (!raw || raw.session_id !== sessionId) return
          const row = fromThoughtsRow(raw)
          if (payload.eventType === 'INSERT') {
            setThoughts(prev =>
              prev.some(t => t.id === row.id) ? prev : [...prev, row]
            )
          } else if (payload.eventType === 'UPDATE') {
            setThoughts(prev => prev.map(t => t.id === row.id ? row : t))
          }
        }
      )
      .subscribe((newStatus) => {
        console.log(`[Realtime] Subscription status: ${newStatus}`)
        setStatus(newStatus)
      })

    return () => {
      console.log(`[Realtime] Unsubscribing from workspace:${workspaceId}`)
      supabase.removeChannel(channel)
    }
  }, [supabase, workspaceId, sessionId])

  const vm = useMemo(() => createThoughtViewModels(thoughts), [thoughts])

  return {
    rows: vm.rows,
    details: vm.details,
    isLive: status === 'SUBSCRIBED'
  }
}
