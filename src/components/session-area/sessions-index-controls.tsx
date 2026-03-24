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
        className="h-10 w-full max-w-sm rounded-none border border-foreground bg-background px-3 text-sm text-foreground placeholder:text-foreground focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
      />
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        className="h-10 rounded-none border border-foreground bg-background px-3 text-sm text-foreground focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
      >
        <option value="all">All statuses</option>
        <option value="active">Active</option>
        <option value="completed">Completed</option>
        <option value="abandoned">Abandoned</option>
      </select>
    </div>
  )
}
