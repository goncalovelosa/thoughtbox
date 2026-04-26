import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Server-side gate: ensure the workspace has an active subscription.
 * Redirects to the workspace's billing page if the subscription is not
 * active (canceled, past_due, inactive, etc.). Call this at the top of
 * any protected workspace page.
 *
 * Do NOT call this from /w/[slug]/billing — that page must remain
 * reachable for users to resubscribe or update payment.
 */
export async function requireActiveSubscription(workspaceSlug: string): Promise<void> {
  const supabase = await createClient()

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('subscription_status')
    .eq('slug', workspaceSlug)
    .single()

  if (!workspace) {
    notFound()
  }

  if (workspace.subscription_status !== 'active') {
    redirect(`/w/${workspaceSlug}/billing`)
  }
}
