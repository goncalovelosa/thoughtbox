import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

export function createMcpClient(workspaceSlug: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const secret = process.env.SUPABASE_JWT_SECRET

  if (!url || !key || !secret) {
    throw new Error('Missing Supabase environment variables for MCP client')
  }

  // Create a JWT signed with the Supabase JWT secret
  // This token carries the 'project' claim required by the RLS policies in data-01
  const token = jwt.sign(
    { 
      role: 'authenticated', 
      project: workspaceSlug 
    },
    secret,
    { expiresIn: '1h' }
  )

  // Create a client instance pre-configured with this auth header
  // This bypasses the normal user session since this is an admin/workspace scoped read
  return createClient(url, key, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    },
    auth: {
      persistSession: false
    }
  })
}
