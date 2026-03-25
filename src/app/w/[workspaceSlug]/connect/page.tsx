import type { Metadata } from 'next'
import { ConnectPanel } from './ConnectPanel'

export const metadata: Metadata = { title: 'Connect' }

type Props = { params: Promise<{ workspaceSlug: string }> }

export default async function ConnectPage({ params }: Props) {
  const { workspaceSlug } = await params

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

      <ConnectPanel workspaceSlug={workspaceSlug} />
    </div>
  )
}
