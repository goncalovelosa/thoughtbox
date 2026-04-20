import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { loadDoc } from '@/lib/docs/load-doc'
import { mdxComponents } from '@/components/docs/mdx-components'
import { DocLayout } from '@/components/docs/doc-layout'

export const metadata: Metadata = {
  title: 'Observability — Documentation',
}

export default async function ObservabilityPage() {
  const source = await loadDoc('observability')

  return (
    <DocLayout breadcrumb="Observability">
      <MDXRemote source={source} components={mdxComponents} />
    </DocLayout>
  )
}
