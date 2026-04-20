import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AccountSettingsClient } from './AccountSettingsClient'

export const metadata: Metadata = { title: 'Account settings' }

type Props = { params: Promise<{ workspaceSlug: string }> }

export default async function AccountSettingsPage({ params }: Props) {
  await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const firstName = (user?.user_metadata?.first_name as string | undefined)?.trim() ?? ''
  const lastName = (user?.user_metadata?.last_name as string | undefined)?.trim() ?? ''
  const email = user?.email ?? ''

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Account settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your personal profile and security settings.
        </p>
      </div>

      <AccountSettingsClient
        initialFirstName={firstName}
        initialLastName={lastName}
        email={email}
      />
    </div>
  )
}
