import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Usage' }

type Props = { params: Promise<{ workspaceSlug: string }> }

const planBenefits = [
  { label: 'Thoughts captured', status: 'unlimited' },
  { label: 'API requests', status: 'unlimited' },
  { label: 'Runs history', status: 'unlimited' },
  { label: 'Workspaces', status: 'unlimited' },
  { label: 'Active API keys', status: 'unlimited' },
]

export default async function UsagePage({ params }: Props) {
  const { workspaceSlug } = await params

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Usage</h1>
        <p className="mt-1 text-sm text-slate-500">
          Status and entitlements for your workspace.
        </p>
      </div>

      {/* Current plan badge */}
      <div className="mb-6 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Current plan
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-lg font-bold text-slate-900">Free</p>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 uppercase tracking-tight">Active</span>
          </div>
        </div>
        <Link
          href={`/w/${workspaceSlug}/billing`}
          className="rounded-lg border border-brand-600 px-4 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-50 transition-colors"
        >
          Manage Billing
        </Link>
      </div>

      {/* Plan Benefits */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Plan Entitlements
          </h2>
        </div>
        <ul className="divide-y divide-slate-100">
          {planBenefits.map((row) => {
            return (
              <li key={row.label} className="px-6 py-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-800">{row.label}</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                    {row.status}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      <p className="mt-4 text-xs text-slate-400 italic">
        * &quot;Unlimited&quot; is subject to our fair-use policy. High-volume usage may be throttled to ensure service stability for all users.
      </p>
    </div>
  )
}
