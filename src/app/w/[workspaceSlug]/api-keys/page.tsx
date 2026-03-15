import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'API Keys' }

type Props = { params: Promise<{ workspaceSlug: string }> }

export default async function ApiKeysPage({ params }: Props) {
  // workspaceSlug resolved for future use (key scoping, link generation)
  await params

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">API Keys</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage keys used to authenticate MCP and REST API requests.
          </p>
        </div>
        <button
          disabled
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white opacity-50 cursor-not-allowed"
          title="Key issuance coming soon — ADR-AUTH-02"
        >
          + Create key
        </button>
      </div>

      {/* Info banner */}
      <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
        <p className="text-sm font-medium text-blue-900">Key format</p>
        <p className="mt-1 text-sm text-blue-700">
          Keys are prefixed <code className="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-xs">tbx_</code> and
          shown only once at creation. Store them in your secrets manager immediately.
          Revoke compromised keys using the trash icon in the table below.
        </p>
      </div>

      {/* Keys table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Prefix
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Last used
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} className="px-6 py-14 text-center">
                <p className="text-2xl">🔑</p>
                <p className="mt-2 font-medium text-slate-700">No API keys yet</p>
                <p className="mt-1 text-sm text-slate-400">
                  Create your first key to start authenticating MCP requests.
                </p>
                <p className="mt-3 text-xs text-slate-400">
                  Key issuance and revocation will be available once ADR-AUTH-02 is implemented.
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-slate-400">
        Keys are stored as bcrypt hashes. The plaintext is shown only at creation time.
      </p>
    </div>
  )
}
