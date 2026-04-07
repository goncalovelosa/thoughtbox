import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { loadDoc } from '@/lib/docs/load-doc'
import { mdxComponents } from '@/components/docs/mdx-components'
import { DocLayout } from '@/components/docs/doc-layout'

export const metadata: Metadata = {
  title: 'Ulysses Protocol — Documentation',
}

export default async function UlyssesProtocolPage() {
  const source = await loadDoc('ulysses-protocol')

  return (
    <DocLayout breadcrumb="Ulysses Protocol">
      <MDXRemote source={source} components={mdxComponents} />
    </DocLayout>
  )
}
