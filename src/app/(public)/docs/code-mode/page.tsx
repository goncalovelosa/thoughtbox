import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { loadDoc } from '@/lib/docs/load-doc'
import { mdxComponents } from '@/components/docs/mdx-components'
import { DocLayout } from '@/components/docs/doc-layout'

export const metadata: Metadata = {
  title: 'Code Mode — Documentation',
}

export default async function CodeModePage() {
  const source = await loadDoc('code-mode')

  return (
    <DocLayout breadcrumb="Code Mode">
      <MDXRemote source={source} components={mdxComponents} />
    </DocLayout>
  )
}
