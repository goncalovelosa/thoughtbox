const LOCAL_DEV_SITE_URL = 'http://localhost:3000'

export const THOUGHTBOX_MCP_URL =
  process.env.NEXT_PUBLIC_THOUGHTBOX_MCP_URL ?? 'https://api.thoughtbox.dev/mcp'

export function getSiteUrl(): string {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (configuredSiteUrl) return configuredSiteUrl

  const vercelUrl = process.env.VERCEL_URL?.trim()
  if (vercelUrl) return `https://${vercelUrl}`

  return LOCAL_DEV_SITE_URL
}
