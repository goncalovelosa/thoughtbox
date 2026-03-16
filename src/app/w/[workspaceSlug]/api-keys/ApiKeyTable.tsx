'use client'

import { useActionState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import type { ApiKeyRow } from '@/lib/types/api-keys'
import { revokeApiKeyAction, type RevokeKeyState } from './actions'

function RevokeButton({ keyId }: { keyId: string }) {
  const [state, formAction, pending] = useActionState<RevokeKeyState, FormData>(
    revokeApiKeyAction,
    null,
  )

  return (
    <form action={formAction}>
      <input type="hidden" name="keyId" value={keyId} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50 transition-colors"
        title="Revoke this key"
      >
        {pending ? 'Revoking...' : 'Revoke'}
      </button>
      {state?.error && (
        <p className="text-xs text-red-500 mt-1">{state.error}</p>
      )}
    </form>
  )
}

export function ApiKeyTable({ keys }: { keys: ApiKeyRow[] }) {
  if (keys.length === 0) {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Prefix</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Created</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Last used</th>
              <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
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
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-100">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Name</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Prefix</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Created</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Last used</th>
            <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {keys.map((key) => {
            const isRevoked = key.status === 'revoked'
            return (
              <tr key={key.id} className={isRevoked ? 'opacity-50' : undefined}>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">
                  {key.name}
                  {isRevoked && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                      Revoked
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 font-mono text-sm text-slate-600">
                  {key.key_prefix}...
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                  {formatDistanceToNow(new Date(key.created_at), { addSuffix: true })}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                  {key.last_used_at
                    ? formatDistanceToNow(new Date(key.last_used_at), { addSuffix: true })
                    : 'Never'}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                  {!isRevoked && <RevokeButton keyId={key.id} />}
                  {isRevoked && key.revoked_at && (
                    <span className="text-xs text-slate-400">
                      {formatDistanceToNow(new Date(key.revoked_at), { addSuffix: true })}
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
