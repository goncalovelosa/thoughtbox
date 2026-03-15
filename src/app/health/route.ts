/**
 * GET /health
 *
 * Cloud Run health check endpoint.
 * Spec: .specs/deployment/cloud-run-service-config.md
 *
 * Returns 200 with a JSON body. Deep health checks (Supabase/Redis connectivity)
 * are deferred to WS-08 (Observability). For v1 this lightweight check is sufficient.
 */
export function GET() {
  return Response.json(
    { status: 'ok', timestamp: new Date().toISOString() },
    { status: 200 },
  )
}
