/**
 * GET /health
 *
 * Health check endpoint for uptime monitoring.
 * Returns 200 with a JSON body.
 */
export function GET() {
  return Response.json(
    { status: 'ok', timestamp: new Date().toISOString() },
    { status: 200 },
  )
}
