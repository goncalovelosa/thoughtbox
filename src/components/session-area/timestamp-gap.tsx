'use client'

type Props = {
  label: string
}

export function TimestampGap({ label }: Props) {
  return (
    <div className="relative my-2 flex items-center gap-3 px-4 py-1 text-[11px] uppercase tracking-wide text-slate-500">
      <div className="h-px flex-1 bg-slate-800" />
      <span>{label}</span>
      <div className="h-px flex-1 bg-slate-800" />
    </div>
  )
}
