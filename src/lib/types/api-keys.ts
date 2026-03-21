export type ApiKeyRow = {
  id: string
  name: string
  prefix: string
  status: 'active' | 'revoked'
  last_used_at: string | null
  created_at: string
  revoked_at: string | null
}
