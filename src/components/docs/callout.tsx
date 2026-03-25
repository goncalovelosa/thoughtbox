type CalloutType = 'info' | 'warning' | 'tip'

const styles: Record<CalloutType, string> = {
  info: 'border-foreground/30 bg-foreground/5',
  warning: 'border-amber-500/40 bg-amber-500/5',
  tip: 'border-emerald-500/40 bg-emerald-500/5',
}

const labels: Record<CalloutType, string> = {
  info: 'Note',
  warning: 'Warning',
  tip: 'Tip',
}

export function Callout({
  type = 'info',
  children,
}: {
  type?: CalloutType
  children: React.ReactNode
}) {
  return (
    <div className={`my-4 border-l-4 px-4 py-3 text-sm ${styles[type]}`}>
      <p className="mb-1 text-xs font-black uppercase tracking-wider text-foreground">
        {labels[type]}
      </p>
      <div className="text-foreground">{children}</div>
    </div>
  )
}
