import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { loadDoc } from '@/lib/docs/load-doc'
import { mdxComponents } from '@/components/docs/mdx-components'
import { DocLayout } from '@/components/docs/doc-layout'

export const metadata: Metadata = {
  title: 'Sessions & Thoughts — Documentation',
}

export default async function SessionsAndThoughtsPage() {
  const source = await loadDoc('sessions-and-thoughts')

  return (
    <DocLayout breadcrumb="Sessions & Thoughts">
      <MDXRemote source={source} components={mdxComponents} />
    </DocLayout>
  )
}
