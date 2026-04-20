import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { loadDoc } from '@/lib/docs/load-doc'
import { mdxComponents } from '@/components/docs/mdx-components'
import { DocLayout } from '@/components/docs/doc-layout'

export const metadata: Metadata = {
  title: 'Subagent Patterns — Documentation',
}

export default async function SubagentPatternsPage() {
  const source = await loadDoc('subagent-patterns')

  return (
    <DocLayout breadcrumb="Subagent Patterns">
      <MDXRemote source={source} components={mdxComponents} />
    </DocLayout>
  )
}
