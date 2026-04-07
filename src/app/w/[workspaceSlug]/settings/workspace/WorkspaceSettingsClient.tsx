'use client'

import { useActionState } from 'react'
import { updateWorkspaceNameAction, type WorkspaceSettingsState } from './actions'

type Member = {
  userId: string
  role: 'owner' | 'admin' | 'member'
  isCurrentUser: boolean
  email: string
}

type Props = {
  workspaceId: string
  initialName: string
  workspaceSlug: string
  members: Member[]
}

export function WorkspaceSettingsClient({ workspaceId, initialName, workspaceSlug, members }: Props) {
  return (
    <>
      <GeneralSection workspaceId={workspaceId} initialName={initialName} workspaceSlug={workspaceSlug} />
      <MembersSection members={members} />
      <DangerSection />
    </>
  )
}

function GeneralSection({
  workspaceId,
  initialName,
  workspaceSlug,
}: {
  workspaceId: string
  initialName: string
  workspaceSlug: string
}) {
  const [state, formAction, pending] = useActionState<WorkspaceSettingsState, FormData>(
    updateWorkspaceNameAction,
    null,
  )

  return (
    <Section title="General">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="workspaceId" value={workspaceId} />

        <div>
          <label htmlFor="workspaceName" className="block text-sm font-medium text-foreground">
            Workspace name
          </label>
          <input
            id="workspaceName"
            name="name"
            type="text"
            autoComplete="organization"
            defaultValue={initialName}
            spellCheck={false}
            className="mt-1.5 block w-full rounded-xl border border-foreground/10 bg-foreground/5 px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground">Workspace slug</label>
          <input
            type="text"
            disabled
            defaultValue={workspaceSlug}
            className="mt-1.5 block w-full rounded-xl border border-foreground/10 bg-foreground/5 px-3.5 py-2.5 font-mono text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Used in URLs — e.g.{' '}
            <code className="rounded bg-muted px-1 font-mono text-foreground">/w/{workspaceSlug}/dashboard</code>.
            Slug changes are not supported via the UI.
          </p>
        </div>

        {state?.error && (
          <p className="text-sm text-red-600" role="alert" aria-live="polite">{state.error}</p>
        )}
        {state?.success && (
          <p className="text-sm text-emerald-600" role="status" aria-live="polite">Workspace name saved.</p>
        )}

        <div className="pt-1">
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-foreground text-background font-semibold px-5 py-2.5 text-sm transition-all hover:bg-foreground/80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </Section>
  )
}

function MembersSection({ members }: { members: Member[] }) {
  const ROLE_LABEL: Record<Member['role'], string> = {
    owner: 'Owner',
    admin: 'Admin',
    member: 'Member',
  }

  return (
    <Section title="Members">
      <div className="overflow-hidden rounded-xl border border-foreground/10">
        <table className="min-w-full divide-y divide-foreground/10">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground">
                Member
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground">
                Role
              </th>
              <th className="relative px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-foreground/10">
            {members.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No members found.
                </td>
              </tr>
            ) : (
              members.map(m => (
                <tr key={m.userId}>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {m.email}
                    {m.isCurrentUser && (
                      <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-lg border border-foreground/10 bg-foreground/5 px-2.5 py-0.5 text-xs font-semibold text-foreground">
                      {ROLE_LABEL[m.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-muted-foreground">—</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <button
        disabled
        className="rounded-full border border-foreground/10 px-4 py-2 text-sm font-medium text-foreground opacity-40 cursor-not-allowed"
        title="Team invitations coming in a future release"
      >
        + Invite member
      </button>
      <p className="text-xs text-muted-foreground">
        Team invitations are planned for a future release.
      </p>
    </Section>
  )
}

function DangerSection() {
  return (
    <Section title="Danger zone">
      <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5">
        <p className="font-semibold text-foreground">Delete workspace</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Permanently delete this workspace, all projects, thoughts, and run history. This cannot be undone.
        </p>
        <button
          disabled
          className="mt-4 rounded-full border border-foreground/10 px-4 py-2 text-sm font-semibold text-foreground opacity-40 cursor-not-allowed"
          title="Contact support to delete your workspace"
        >
          Delete workspace
        </button>
        <p className="mt-2 text-xs text-muted-foreground">
          To delete your workspace, email{' '}
          <a href="mailto:support@thoughtbox.dev" className="underline underline-offset-2 hover:text-foreground transition-colors">
            support@thoughtbox.dev
          </a>.
        </p>
      </div>
    </Section>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-6">
      <h2 className="mb-5 border-b border-foreground/10 pb-3 text-base font-semibold text-foreground">
        {title}
      </h2>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  )
}
