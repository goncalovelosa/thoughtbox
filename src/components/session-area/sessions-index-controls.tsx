'use client'

import { useState } from 'react'

const TAG_COLLAPSE_LIMIT = 15

type Props = {
  search: string
  onSearchChange: (value: string) => void
  status: string
  onStatusChange: (value: string) => void
  allTags: string[]
  activeTags: string[]
  onTagToggle: (tag: string) => void
  onTagClear: () => void
}

export function SessionsIndexControls({
  search,
  onSearchChange,
  status,
  onStatusChange,
  allTags,
  activeTags,
  onTagToggle,
  onTagClear,
}: Props) {
  return (
    <div className="mb-6 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
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
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="abandoned">Abandoned</option>
        </select>
      </div>

      {allTags.length > 0 && (
        <TagCloud
          allTags={allTags}
          activeTags={activeTags}
          onTagToggle={onTagToggle}
          onTagClear={onTagClear}
        />
      )}
    </div>
  )
}

function TagCloud({
  allTags,
  activeTags,
  onTagToggle,
  onTagClear,
}: {
  allTags: string[]
  activeTags: string[]
  onTagToggle: (tag: string) => void
  onTagClear: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const shouldCollapse = allTags.length > TAG_COLLAPSE_LIMIT
  const visibleTags = shouldCollapse && !expanded
    ? allTags.slice(0, TAG_COLLAPSE_LIMIT)
    : allTags
  const hiddenCount = allTags.length - TAG_COLLAPSE_LIMIT

  return (
    <div className="flex flex-wrap items-center gap-2">
      {activeTags.length > 0 && (
        <button
          type="button"
          onClick={onTagClear}
          className="text-[11px] font-medium text-foreground/50 hover:text-foreground transition-colors"
        >
          Clear tags
        </button>
      )}
      {visibleTags.map((tag) => {
        const isActive = activeTags.includes(tag)
        return (
          <button
            key={tag}
            type="button"
            onClick={() => onTagToggle(tag)}
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
              isActive
                ? 'bg-foreground/15 text-foreground ring-1 ring-foreground/30'
                : 'bg-background text-foreground/50 ring-1 ring-foreground/15 hover:text-foreground'
            }`}
          >
            {tag}
            {isActive && (
              <span className="ml-1 text-foreground/40">&times;</span>
            )}
          </button>
        )
      })}
      {shouldCollapse && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-[11px] font-medium text-foreground/50 hover:text-foreground transition-colors"
        >
          +{hiddenCount} more
        </button>
      )}
      {shouldCollapse && expanded && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-[11px] font-medium text-foreground/50 hover:text-foreground transition-colors"
        >
          Show less
        </button>
      )}
    </div>
  )
}
