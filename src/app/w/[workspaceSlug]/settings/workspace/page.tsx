import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Workspace settings' }

type Props = { params: Promise<{ workspaceSlug: string }> }

export default async function WorkspaceSettingsPage({ params }: Props) {
  const { workspaceSlug } = await params

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Workspace settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Configure workspace-level options and membership.{' '}
          <span className="italic text-slate-400">Auth wired up in ADR-FE-02.</span>
        </p>
      </div>

      {/* General */}
      <Section title="General">
        <div>
          <label className="block text-sm font-medium text-slate-700">Workspace name</label>
          <input
            type="text"
            disabled
            defaultValue={workspaceSlug}
            className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 capitalize disabled:cursor-not-allowed disabled:opacity-70"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Workspace slug</label>
          <input
            type="text"
            disabled
            defaultValue={workspaceSlug}
            className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
          />
          <p className="mt-1.5 text-xs text-slate-400">
            Used in URLs — e.g.{' '}
            <code className="rounded bg-slate-100 px-1 font-mono">/w/{workspaceSlug}/dashboard</code>.
            Changing the slug will break existing links.
          </p>
        </div>
        <div className="pt-1">
          <button
            disabled
            className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white opacity-50 cursor-not-allowed"
          >
            Save changes
          </button>
        </div>
      </Section>

      {/* Members */}
      <Section title="Members">
        <div className="overflow-hidden rounded-lg border border-slate-100">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Member
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Role
                </th>
                <th className="relative px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-3 text-sm text-slate-700">you@example.com</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                    Owner
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-xs text-slate-300">—</td>
              </tr>
            </tbody>
          </table>
        </div>
        <button
          disabled
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 opacity-50 cursor-not-allowed hover:bg-slate-50 transition-colors"
        >
          + Invite member
        </button>
        <p className="text-xs text-slate-400">
          Team invitations are planned for a future release.
        </p>
      </Section>

      {/* Danger zone */}
      <Section title="Danger zone">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="font-semibold text-red-900">Delete workspace</p>
          <p className="mt-1 text-sm text-red-700">
            Permanently delete this workspace, all projects, thoughts, and run history. This
            cannot be undone.
          </p>
          <button
            disabled
            className="mt-4 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 opacity-50 cursor-not-allowed hover:bg-red-50 transition-colors"
          >
            Delete workspace
          </button>
        </div>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 border-b border-slate-100 pb-3 text-base font-semibold text-slate-900">
        {title}
      </h2>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  )
}
