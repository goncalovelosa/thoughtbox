import { createClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client for server-side MCP/workspace data access.
 * 
 * Uses the service role key to bypass RLS policies. This is appropriate because:
 * 1. This function is only called from Server Components (not exposed to client)
 * 2. The calling pages are protected by the app's authentication middleware
 * 3. The workspaceSlug parameter is used for query filtering, not security
 * 
 * @param _workspaceSlug - The workspace slug (reserved for future workspace-scoped filtering)
 */
export function createMcpClient(_workspaceSlug: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables for MCP client (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)')
  }

  // Create a client with the service role key to bypass RLS
  // This is safe because this function is only used server-side
  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
}
