import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ConnectPanel } from './ConnectPanel'

export const metadata: Metadata = { title: 'Connect' }

type Props = { params: Promise<{ workspaceSlug: string }> }

export default async function ConnectPage({ params }: Props) {
  const { workspaceSlug } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: keys } = user
    ? await supabase
        .from('api_keys')
        .select('id, name, prefix')
        .eq('created_by_user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
    : { data: [] }

  const activeKeys = (keys ?? []) as { id: string; name: string; prefix: string }[]

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          Connect your MCP client
        </h1>
        <p className="mt-1 text-sm text-foreground">
          Copy the configuration below into your MCP client
          (e.g.&nbsp;Claude&nbsp;Code, Cursor, Windsurf) to start
          capturing thoughts.
        </p>
      </div>

      <ConnectPanel workspaceSlug={workspaceSlug} apiKeys={activeKeys} />
    </div>
  )
}
