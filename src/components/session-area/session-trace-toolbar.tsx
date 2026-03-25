'use client'

type Props = {
  isLive?: boolean
  sessionStatus: 'active' | 'completed' | 'abandoned'
  search: string
  onSearchChange: (value: string) => void
}

export function SessionTraceToolbar({
  isLive,
  sessionStatus,
  search,
  onSearchChange,
}: Props) {
  // Only show live indicator for active sessions
  const showLiveIndicator = sessionStatus === 'active'
  return (
    <div className="sticky top-0 z-10 border-b border-foreground bg-background/95 backdrop-blur px-4 py-3 flex items-center justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search thoughts…"
          className="h-9 w-full max-w-sm rounded-none border border-foreground bg-background px-3 text-sm text-foreground placeholder:text-foreground focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
        />
      </div>

      {showLiveIndicator && isLive != null && (
        <div className={`flex items-center gap-2 px-3 py-1 rounded-none border ${
          isLive
            ? 'bg-emerald-500/10 border-emerald-500/20'
            : 'bg-background/50 border-foreground'
        }`}>
          <div className={`w-2 h-2 rounded-none ${
            isLive ? 'bg-emerald-500 animate-pulse' : 'bg-background0'
          }`} />
          <span className={`text-[10px] font-bold uppercase tracking-wider ${
            isLive ? 'text-emerald-400' : 'text-foreground'
          }`}>
            {isLive ? 'Live' : 'Connecting'}
          </span>
        </div>
      )}
    </div>
  )
}
