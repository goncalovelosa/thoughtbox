import { redirect } from 'next/navigation'

/**
 * /app — entry point for authenticated users.
 *
 * In production this will redirect to the user's first workspace.
 * For now redirects to the demo workspace placeholder.
 * Auth middleware and dynamic workspace resolution are added in WS-07 / ADR-FE-02.
 */
export default function AppPage() {
  redirect('/w/demo/dashboard')
}
