'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  createThoughtViewModels, 
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

    console.log(`[Realtime] Subscribing to workspace:${workspaceId}`)
    
    const channel = supabase.channel(`workspace:${workspaceId}`)
      .on('broadcast', { event: 'thought:added' }, (payload) => {
        const data = payload.payload as { sessionId: string; thought: RawThoughtRecord }
        if (data.sessionId === sessionId) {
          setThoughts(prev => {
            if (prev.some(t => t.id === data.thought.id)) return prev
            return [...prev, data.thought]
          })
        }
      })
      .on('broadcast', { event: 'thought:revised' }, (payload) => {
        const data = payload.payload as { sessionId: string; thought: RawThoughtRecord }
        if (data.sessionId === sessionId) {
          setThoughts(prev => prev.map(t => t.id === data.thought.id ? data.thought : t))
        }
      })
      .on('broadcast', { event: 'thought:branched' }, (payload) => {
        const data = payload.payload as { sessionId: string; thought: RawThoughtRecord }
        if (data.sessionId === sessionId) {
          setThoughts(prev => {
            if (prev.some(t => t.id === data.thought.id)) return prev
            return [...prev, data.thought]
          })
        }
      })
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
