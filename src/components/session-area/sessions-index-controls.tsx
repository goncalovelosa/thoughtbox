'use client'

type Props = {
  search: string
  onSearchChange: (value: string) => void
  status: string
  onStatusChange: (value: string) => void
}

export function SessionsIndexControls({
  search,
  onSearchChange,
  status,
  onStatusChange,
}: Props) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <input
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search sessions…"
        className="h-10 w-full max-w-sm rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      />
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        className="h-10 rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-slate-100 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      >
        <option value="all">All statuses</option>
        <option value="active">Active</option>
        <option value="completed">Completed</option>
        <option value="abandoned">Abandoned</option>
      </select>
    </div>
  )
}
