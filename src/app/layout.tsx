import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Thoughtbox',
    template: '%s | Thoughtbox',
  },
  description:
    'Thoughtbox gives AI agents a persistent, queryable memory. Capture thoughts, build knowledge graphs, and trace every reasoning step.',
  metadataBase: new URL('https://thoughtbox.dev'),
  openGraph: {
    type: 'website',
    siteName: 'Thoughtbox',
    title: 'Thoughtbox — Persistent memory for AI agents',
    description:
      'Capture thoughts, build knowledge graphs, and trace every reasoning step.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Thoughtbox',
    description: 'Persistent memory for AI agents.',
  },
}

export const viewport: Viewport = {
  themeColor: '#000000',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  )
}
