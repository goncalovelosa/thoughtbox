'use client'

import { CheckCircle2, AlertTriangle, Minus } from 'lucide-react'

type Props = {
  thoughtboxSessionId: string
  otelSessionId: string | null
  otelShown: number
  otelTotal: number
}

export function SessionIdDiagnostic({ thoughtboxSessionId, otelSessionId, otelShown, otelTotal }: Props) {
  const hasOtel = otelSessionId != null
  const match = hasOtel && otelSessionId === thoughtboxSessionId
  const isTruncated = otelTotal > otelShown

  return (
    <div className="flex items-center gap-4 px-4 py-2 border-b border-border text-[11px] text-muted-foreground bg-muted/30">
      <span className="font-medium">Session ID</span>
      <code className="font-mono">{thoughtboxSessionId.slice(0, 12)}</code>

      {hasOtel ? (
        match ? (
          <span className="flex items-center gap-1 text-emerald-600">
            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
            OTEL matched
          </span>
        ) : (
          <span className="flex items-center gap-1 text-amber-600">
            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
            OTEL ID differs: <code className="font-mono">{otelSessionId.slice(0, 12)}</code>
          </span>
        )
      ) : (
        <span className="flex items-center gap-1">
          <Minus className="h-3 w-3" aria-hidden="true" />
          No OTEL events
        </span>
      )}

      {isTruncated && (
        <span
          className="flex items-center gap-1.5 px-2 py-1 rounded-sm bg-amber-500/15 text-amber-600 font-semibold"
          role="alert"
        >
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Showing {otelShown.toLocaleString()} of {otelTotal.toLocaleString()} OTEL events
          <span className="font-normal text-amber-600/70">
            ({(otelTotal - otelShown).toLocaleString()} hidden)
          </span>
        </span>
      )}
    </div>
  )
}
