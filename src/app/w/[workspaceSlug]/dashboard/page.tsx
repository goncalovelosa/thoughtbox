import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Dashboard' }

type Props = { params: Promise<{ workspaceSlug: string }> }

const stats = [
  { label: 'Thoughts captured', value: '—', sub: 'this month' },
  { label: 'Active projects', value: '—', sub: 'total' },
  { label: 'Runs', value: '—', sub: 'last 30 days' },
  { label: 'API keys', value: '—', sub: 'active' },
]

export default async function DashboardPage({ params }: Props) {
  const { workspaceSlug } = await params
  const base = `/w/${workspaceSlug}`

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 capitalize">
          {workspaceSlug} dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Overview of your workspace activity.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              {stat.label}
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</p>
            <p className="mt-0.5 text-xs text-slate-400">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <QuickAction
          title="Connect your first agent"
          description="Add Thoughtbox to your MCP client config and start capturing thoughts."
          href={`${base}/docs/quickstart`}
          icon="🚀"
        />
        <QuickAction
          title="Create an API key"
          description="Generate a key to authenticate your MCP client or REST requests."
          href={`${base}/api-keys`}
          icon="🔑"
        />
        <QuickAction
          title="Explore your runs"
          description="View every MCP session recorded in this workspace."
          href={`${base}/runs`}
          icon="🔍"
        />
      </div>

      {/* Recent runs placeholder */}
      <div className="mt-8 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Recent runs</h2>
          <Link
            href={`${base}/runs`}
            className="text-xs text-brand-600 hover:text-brand-700 transition-colors"
          >
            View all →
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
          <p className="text-2xl">📋</p>
          <p className="font-medium text-slate-700">No runs yet</p>
          <p className="text-sm text-slate-400">
            Runs appear here once your MCP client connects and makes its first call.
          </p>
          <Link
            href={`${base}/docs/quickstart`}
            className="mt-3 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700 transition-colors"
          >
            See quickstart guide
          </Link>
        </div>
      </div>
    </div>
  )
}

function QuickAction({
  title,
  description,
  href,
  icon,
}: {
  title: string
  description: string
  href: string
  icon: string
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-brand-200 transition-all"
    >
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
    </Link>
  )
}
