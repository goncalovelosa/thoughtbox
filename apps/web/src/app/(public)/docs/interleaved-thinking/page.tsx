import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { loadDoc } from '@/lib/docs/load-doc'
import { mdxComponents } from '@/components/docs/mdx-components'
import { DocLayout } from '@/components/docs/doc-layout'

export const metadata: Metadata = {
  title: 'Interleaved Thinking — Documentation',
}

export default async function InterleavedThinkingPage() {
  const source = await loadDoc('interleaved-thinking')

  return (
    <DocLayout breadcrumb="Interleaved Thinking">
      <MDXRemote source={source} components={mdxComponents} />
    </DocLayout>
  )
}
