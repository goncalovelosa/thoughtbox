import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AppPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/sign-in')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('workspaces!profiles_default_workspace_id_fkey(slug)')
    .eq('user_id', user.id)
    .single();

  const ws = profile?.workspaces as unknown as { slug: string } | null
  if (ws?.slug) redirect(`/w/${ws.slug}/dashboard`)

  if (profileError) {
    console.error('Failed to resolve default workspace for authenticated user:', profileError)
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-2xl items-center px-6 py-16">
      <div className="w-full rounded-none border border-amber-200 bg-amber-50 p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-800">
          Workspace setup required
        </p>
        <h1 className="mt-3 text-3xl font-bold text-foreground">
          We couldn&apos;t resolve your default workspace.
        </h1>
        <p className="mt-3 text-sm leading-6 text-foreground">
          Your account is signed in, but this app does not currently have a valid
          default workspace to send you to. If this is unexpected, contact support
          or sign out and try again after workspace provisioning completes.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/support"
            className="rounded-none bg-foreground text-background border-2 border-foreground px-4 py-2 text-sm font-semibold text-background hover:bg-background transition-colors"
          >
            Contact support
          </Link>
          <Link
            href="/sign-in"
            className="rounded-none border border-foreground px-4 py-2 text-sm font-medium text-foreground hover:bg-background transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </main>
  )
}
