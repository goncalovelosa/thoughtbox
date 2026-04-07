type CalloutType = 'info' | 'warning' | 'tip'

const styles: Record<CalloutType, string> = {
  info: 'border-foreground bg-foreground/5 shadow-brutal-sm',
  warning: 'border-amber-500 bg-amber-500/10 shadow-brutal-sm',
  tip: 'border-emerald-500 bg-emerald-500/10 shadow-brutal-sm',
}

const labels: Record<CalloutType, string> = {
  info: 'NOTE',
  warning: 'WARNING',
  tip: 'TIP',
}

export function Callout({
  type = 'info',
  children,
}: {
  type?: CalloutType
  children: React.ReactNode
}) {
  return (
    <div className={`my-8 border-4 px-6 py-5 text-base md:text-lg font-medium relative ${styles[type]}`}>
      <div className="absolute top-0 right-0 w-8 h-8 diagonal-lines opacity-10 pointer-events-none"></div>
      <p className="mb-3 text-xs md:text-sm font-black uppercase tracking-widest flex items-center gap-2">
        <span className={`w-2 h-2 ${type === 'warning' ? 'bg-amber-500' : type === 'tip' ? 'bg-emerald-500' : 'bg-accent'}`}></span>
        {labels[type]}
      </p>
      <div className="text-foreground leading-relaxed font-serif">{children}</div>
    </div>
  )
}
