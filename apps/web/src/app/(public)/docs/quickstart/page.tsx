import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { loadDoc } from '@/lib/docs/load-doc'
import { mdxComponents } from '@/components/docs/mdx-components'
import { DocLayout } from '@/components/docs/doc-layout'

export const metadata: Metadata = {
  title: 'Quickstart — Documentation',
}

export default async function QuickstartPage() {
  const source = await loadDoc('quickstart')

  return (
    <DocLayout breadcrumb="Quickstart">
      <MDXRemote source={source} components={mdxComponents} />
    </DocLayout>
  )
}
