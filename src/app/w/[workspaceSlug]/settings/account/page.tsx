import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Account settings' }

type Props = { params: Promise<{ workspaceSlug: string }> }

export default async function AccountSettingsPage({ params }: Props) {
  await params

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Account settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your personal profile and security settings.{' '}
          <span className="italic text-slate-400">Auth wired up in ADR-FE-02.</span>
        </p>
      </div>

      {/* Profile section */}
      <Section title="Profile">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" placeholder="Ada" />
          <Field label="Last name" placeholder="Lovelace" />
        </div>
        <Field label="Email address" placeholder="ada@example.com" type="email" />
        <div className="pt-2">
          <SaveButton />
        </div>
      </Section>

      {/* Password section */}
      <Section title="Password">
        <Field label="Current password" placeholder="••••••••" type="password" />
        <Field label="New password" placeholder="Min. 12 characters" type="password" />
        <Field label="Confirm new password" placeholder="Repeat new password" type="password" />
        <div className="pt-2">
          <SaveButton label="Update password" />
        </div>
      </Section>

      {/* Danger zone */}
      <Section title="Danger zone">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="font-semibold text-red-900">Delete account</p>
          <p className="mt-1 text-sm text-red-700">
            Permanently delete your account and all associated data. This action cannot be
            undone.
          </p>
          <button
            disabled
            className="mt-4 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 opacity-50 cursor-not-allowed hover:bg-red-50 transition-colors"
          >
            Delete my account
          </button>
        </div>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-base font-semibold text-slate-900 border-b border-slate-100 pb-3">
        {title}
      </h2>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  )
}

function Field({
  label,
  placeholder,
  type = 'text',
}: {
  label: string
  placeholder: string
  type?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        disabled
        placeholder={placeholder}
        className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500 placeholder-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </div>
  )
}

function SaveButton({ label = 'Save changes' }: { label?: string }) {
  return (
    <button
      disabled
      className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white opacity-50 cursor-not-allowed"
    >
      {label}
    </button>
  )
}
