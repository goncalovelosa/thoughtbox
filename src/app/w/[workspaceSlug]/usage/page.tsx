import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Usage' }

type Props = { params: Promise<{ workspaceSlug: string }> }

const usageRows = [
  { label: 'Thoughts captured', used: 0, limit: 10000, unit: '' },
  { label: 'API requests', used: 0, limit: 50000, unit: '' },
  { label: 'Runs', used: 0, limit: null, unit: '' },
  { label: 'Projects', used: 0, limit: 3, unit: '' },
  { label: 'Active API keys', used: 0, limit: 1, unit: '' },
]

export default async function UsagePage({ params }: Props) {
  const { workspaceSlug } = await params

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Usage</h1>
        <p className="mt-1 text-sm text-slate-500">
          Your workspace usage this billing period.{' '}
          <span className="italic text-slate-400">
            Live usage data available once WS-06 (Billing) is deployed.
          </span>
        </p>
      </div>

      {/* Current plan badge */}
      <div className="mb-6 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Current plan
          </p>
          <p className="mt-0.5 text-lg font-bold text-slate-900">Free</p>
        </div>
        <Link
          href={`/w/${workspaceSlug}/billing`}
          className="rounded-lg border border-brand-600 px-4 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-50 transition-colors"
        >
          Upgrade to Pro
        </Link>
      </div>

      {/* Usage meters */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-900">
            March 2026 — billing period
          </h2>
        </div>
        <ul className="divide-y divide-slate-100">
          {usageRows.map((row) => {
            const pct = row.limit ? Math.min((row.used / row.limit) * 100, 100) : 0
            return (
              <li key={row.label} className="px-6 py-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-800">{row.label}</span>
                  <span className="text-sm text-slate-500">
                    {row.used.toLocaleString()}
                    {row.limit ? ` / ${row.limit.toLocaleString()}` : ' (unlimited)'}
                    {row.unit ? ` ${row.unit}` : ''}
                  </span>
                </div>
                {row.limit !== null && (
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-brand-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      <p className="mt-4 text-xs text-slate-400">
        Usage resets at the start of each billing period. Upgrade for higher limits.
      </p>
    </div>
  )
}
