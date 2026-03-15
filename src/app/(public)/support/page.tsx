import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Support',
}

const resources = [
  {
    title: 'Documentation',
    description: 'Browse guides, API references, and quickstart tutorials.',
    href: '/docs',
    icon: '📖',
  },
  {
    title: 'Quickstart',
    description: 'Connect your first agent in under 5 minutes.',
    href: '/docs/quickstart',
    icon: '🚀',
  },
  {
    title: 'Pricing FAQ',
    description: 'Questions about plans, limits, and billing.',
    href: '/pricing',
    icon: '💳',
  },
]

export default function SupportPage() {
  return (
    <div className="px-6 py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          How can we help?
        </h1>
        <p className="mt-4 text-lg text-slate-500">
          Check the resources below, or reach out directly — we typically respond within one business day.
        </p>

        {/* Contact */}
        <div className="mt-10 rounded-2xl border border-brand-200 bg-brand-50 p-8">
          <h2 className="text-lg font-semibold text-slate-900">Email support</h2>
          <p className="mt-2 text-slate-600">
            For account issues, billing questions, or anything not covered in the docs:
          </p>
          <a
            href="mailto:support@thoughtbox.dev"
            className="mt-4 inline-block rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
          >
            support@thoughtbox.dev
          </a>
          <p className="mt-3 text-xs text-slate-400">
            Pro and Enterprise customers receive priority responses.
          </p>
        </div>

        {/* Self-serve resources */}
        <div className="mt-12">
          <h2 className="text-left text-sm font-semibold uppercase tracking-widest text-slate-400">
            Self-serve resources
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {resources.map((resource) => (
              <Link
                key={resource.title}
                href={resource.href}
                className="flex flex-col items-start gap-2 rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm hover:shadow-md transition-shadow"
              >
                <span className="text-2xl">{resource.icon}</span>
                <span className="font-semibold text-slate-900">{resource.title}</span>
                <span className="text-sm text-slate-500">{resource.description}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
