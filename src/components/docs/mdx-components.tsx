import type { MDXComponents } from 'mdx/types'
import type { ComponentPropsWithoutRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Callout } from '@/components/docs/callout'

export const mdxComponents: MDXComponents = {
  Callout,
  h1: (props: ComponentPropsWithoutRef<'h1'>) => (
    <h1
      className="mt-0 text-4xl font-bold tracking-tight text-foreground"
      {...props}
    />
  ),
  h2: (props: ComponentPropsWithoutRef<'h2'>) => {
    const id = typeof props.children === 'string'
      ? props.children.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      : undefined
    return (
      <h2
        className="mt-10 mb-4 text-xl font-semibold text-foreground"
        id={id}
        {...props}
      />
    )
  },
  h3: (props: ComponentPropsWithoutRef<'h3'>) => (
    <h3
      className="mt-8 mb-3 text-lg font-bold text-foreground"
      {...props}
    />
  ),
  p: (props: ComponentPropsWithoutRef<'p'>) => (
    <p className="my-3 text-sm leading-relaxed text-foreground" {...props} />
  ),
  a: ({ href, ...props }: ComponentPropsWithoutRef<'a'>) => {
    if (href?.startsWith('/')) {
      return (
        <Link
          href={href}
          className="text-foreground underline hover:underline-thick"
          {...props}
        />
      )
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-foreground underline hover:underline-thick"
        {...props}
      />
    )
  },
  ul: (props: ComponentPropsWithoutRef<'ul'>) => (
    <ul className="my-3 flex flex-col gap-1.5 pl-5 text-sm text-foreground list-disc" {...props} />
  ),
  ol: (props: ComponentPropsWithoutRef<'ol'>) => (
    <ol className="my-3 flex flex-col gap-1.5 pl-5 text-sm text-foreground list-decimal" {...props} />
  ),
  li: (props: ComponentPropsWithoutRef<'li'>) => (
    <li className="text-sm leading-relaxed text-foreground" {...props} />
  ),
  code: (props: ComponentPropsWithoutRef<'code'>) => (
    <code
      className="rounded bg-foreground/10 px-1.5 py-0.5 font-mono text-xs text-foreground"
      {...props}
    />
  ),
  pre: (props: ComponentPropsWithoutRef<'pre'>) => (
    <pre className="my-4 overflow-x-auto rounded-xl border border-foreground/10 bg-foreground/[0.03] p-5 font-mono text-sm leading-relaxed text-foreground">
      {props.children}
    </pre>
  ),
  table: (props: ComponentPropsWithoutRef<'table'>) => (
    <div className="my-4 overflow-x-auto">
      <table className="w-full text-sm" {...props} />
    </div>
  ),
  thead: (props: ComponentPropsWithoutRef<'thead'>) => (
    <thead className="border-b border-foreground" {...props} />
  ),
  th: (props: ComponentPropsWithoutRef<'th'>) => (
    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-foreground" {...props} />
  ),
  td: (props: ComponentPropsWithoutRef<'td'>) => (
    <td className="border-b border-foreground/10 px-3 py-2 text-sm text-foreground" {...props} />
  ),
  strong: (props: ComponentPropsWithoutRef<'strong'>) => (
    <strong className="font-semibold text-foreground" {...props} />
  ),
  blockquote: (props: ComponentPropsWithoutRef<'blockquote'>) => (
    <blockquote className="my-4 border-l-4 border-foreground/30 pl-4 text-sm italic text-foreground" {...props} />
  ),
  hr: () => <hr className="my-8 border-foreground/20" />,
  img: ({ src, alt }: ComponentPropsWithoutRef<'img'>) => {
    if (!src || typeof src !== 'string') return null
    return (
      <Image
        src={src}
        alt={alt ?? ''}
        width={800}
        height={450}
        className="my-6 w-full rounded-xl border border-foreground/10"
      />
    )
  },
}
