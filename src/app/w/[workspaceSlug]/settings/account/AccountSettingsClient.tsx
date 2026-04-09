'use client'

import { useActionState } from 'react'
import { updateProfileAction, updatePasswordAction, type ProfileState } from './actions'

type Props = {
  initialFirstName: string
  initialLastName: string
  email: string
}

export function AccountSettingsClient({ initialFirstName, initialLastName, email }: Props) {
  return (
    <>
      <ProfileSection initialFirstName={initialFirstName} initialLastName={initialLastName} email={email} />
      <PasswordSection />
      <DangerSection />
    </>
  )
}

function ProfileSection({ initialFirstName, initialLastName, email }: Props) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(
    updateProfileAction,
    null,
  )

  return (
    <Section title="Profile">
      <form action={formAction} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-foreground">
              First name
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              defaultValue={initialFirstName}
              spellCheck={false}
              className="mt-1.5 block w-full rounded-xl border border-foreground/10 bg-foreground/5 px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-foreground">
              Last name
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              defaultValue={initialLastName}
              spellCheck={false}
              className="mt-1.5 block w-full rounded-xl border border-foreground/10 bg-foreground/5 px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground">
            Email address
          </label>
          <input
            type="email"
            value={email}
            disabled
            className="mt-1.5 block w-full rounded-xl border border-foreground/10 bg-foreground/5 px-3.5 py-2.5 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            title="Email changes are not supported — contact support"
          />
          <p className="mt-1 text-xs text-muted-foreground">Email cannot be changed after sign-up.</p>
        </div>

        {state?.error && (
          <p className="text-sm text-red-600" role="alert" aria-live="polite">{state.error}</p>
        )}
        {state?.success && (
          <p className="text-sm text-emerald-600" role="status" aria-live="polite">Profile updated.</p>
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

function PasswordSection() {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(
    updatePasswordAction,
    null,
  )

  return (
    <Section title="Password">
      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-foreground">
            Current password
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="mt-1.5 block w-full rounded-xl border border-foreground/10 bg-foreground/5 px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
          />
        </div>
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-foreground">
            New password
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            placeholder="Min.&nbsp;12 characters"
            className="mt-1.5 block w-full rounded-xl border border-foreground/10 bg-foreground/5 px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            placeholder="Repeat password"
            className="mt-1.5 block w-full rounded-xl border border-foreground/10 bg-foreground/5 px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
          />
        </div>

        {state?.error && (
          <p className="text-sm text-red-600" role="alert" aria-live="polite">{state.error}</p>
        )}
        {state?.success && (
          <p className="text-sm text-emerald-600" role="status" aria-live="polite">Password updated.</p>
        )}

        <div className="pt-1">
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-foreground text-background font-semibold px-5 py-2.5 text-sm transition-all hover:bg-foreground/80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? 'Updating…' : 'Update password'}
          </button>
        </div>
      </form>
    </Section>
  )
}

function DangerSection() {
  return (
    <Section title="Danger zone">
      <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5">
        <p className="font-semibold text-foreground">Delete account</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <button
          disabled
          className="mt-4 rounded-full border border-foreground/10 px-4 py-2 text-sm font-semibold text-foreground opacity-40 cursor-not-allowed"
          title="Contact support to delete your account"
        >
          Delete my account
        </button>
        <p className="mt-2 text-xs text-muted-foreground">
          To delete your account, email{' '}
          <a href="mailto:thoughtboxsupport@kastalienresearch.ai" className="underline underline-offset-2 hover:text-foreground transition-colors">
            thoughtboxsupport@kastalienresearch.ai
          </a>.
        </p>
      </div>
    </Section>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-6">
      <h2 className="mb-5 text-base font-semibold text-foreground border-b border-foreground/10 pb-3">
        {title}
      </h2>
      {children}
    </div>
  )
}
