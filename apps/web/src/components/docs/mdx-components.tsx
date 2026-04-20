import type { MDXComponents } from 'mdx/types'
import type { ComponentPropsWithoutRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Callout } from '@/components/docs/callout'

export const mdxComponents: MDXComponents = {
  Callout,
  h1: (props: ComponentPropsWithoutRef<'h1'>) => (
    <h1
      className="mt-0 mb-8 text-5xl md:text-6xl font-black uppercase tracking-tighter text-foreground"
      {...props}
    />
  ),
  h2: (props: ComponentPropsWithoutRef<'h2'>) => {
    const id = typeof props.children === 'string'
      ? props.children.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      : undefined
    return (
      <h2
        className="mt-16 mb-6 text-3xl md:text-4xl font-black uppercase tracking-tight text-foreground"
        id={id}
        {...props}
      />
    )
  },
  h3: (props: ComponentPropsWithoutRef<'h3'>) => (
    <h3
      className="mt-12 mb-4 text-xl md:text-2xl font-black uppercase tracking-wide text-foreground"
      {...props}
    />
  ),
  p: (props: ComponentPropsWithoutRef<'p'>) => (
    <p className="my-5 text-base md:text-lg font-medium leading-relaxed text-foreground font-serif" {...props} />
  ),
  a: ({ href, ...props }: ComponentPropsWithoutRef<'a'>) => {
    if (href?.startsWith('/')) {
      return (
        <Link
          href={href}
          className="text-accent font-bold underline decoration-2 underline-offset-4 hover:bg-accent hover:text-accent-foreground transition-colors"
          {...props}
        />
      )
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent font-bold underline decoration-2 underline-offset-4 hover:bg-accent hover:text-accent-foreground transition-colors"
        {...props}
      />
    )
  },
  ul: (props: ComponentPropsWithoutRef<'ul'>) => (
    <ul className="my-5 flex flex-col gap-3 pl-6 text-base md:text-lg font-medium text-foreground list-disc font-serif" {...props} />
  ),
  ol: (props: ComponentPropsWithoutRef<'ol'>) => (
    <ol className="my-5 flex flex-col gap-3 pl-6 text-base md:text-lg font-medium text-foreground list-decimal font-serif" {...props} />
  ),
  li: (props: ComponentPropsWithoutRef<'li'>) => (
    <li className="leading-relaxed text-foreground" {...props} />
  ),
  code: (props: ComponentPropsWithoutRef<'code'>) => (
    <code
      className="bg-foreground/10 px-1.5 py-0.5 font-mono-terminal font-bold text-sm md:text-base text-foreground border-b-2 border-foreground/20"
      {...props}
    />
  ),
  pre: (props: ComponentPropsWithoutRef<'pre'>) => (
    <pre className="my-8 overflow-x-auto border-4 border-foreground bg-background p-6 font-mono-terminal text-sm md:text-base leading-relaxed text-foreground shadow-brutal-sm relative">
      <div className="absolute top-0 right-0 w-8 h-8 diagonal-lines opacity-10 pointer-events-none"></div>
      {props.children}
    </pre>
  ),
  table: (props: ComponentPropsWithoutRef<'table'>) => (
    <div className="my-8 overflow-x-auto border-4 border-foreground bg-background shadow-brutal-sm">
      <table className="w-full text-base md:text-lg font-medium font-serif" {...props} />
    </div>
  ),
  thead: (props: ComponentPropsWithoutRef<'thead'>) => (
    <thead className="bg-foreground text-background font-sans" {...props} />
  ),
  th: (props: ComponentPropsWithoutRef<'th'>) => (
    <th className="px-4 py-3 text-left text-xs md:text-sm font-black uppercase tracking-widest" {...props} />
  ),
  td: (props: ComponentPropsWithoutRef<'td'>) => (
    <td className="border-t-4 border-foreground px-4 py-3 text-foreground" {...props} />
  ),
  strong: (props: ComponentPropsWithoutRef<'strong'>) => (
    <strong className="font-black text-foreground" {...props} />
  ),
  blockquote: (props: ComponentPropsWithoutRef<'blockquote'>) => (
    <blockquote className="my-8 border-l-8 border-foreground bg-foreground/5 p-6 text-lg md:text-xl font-bold italic text-foreground font-serif" {...props} />
  ),
  hr: () => <hr className="my-12 border-t-4 border-foreground" />,
  img: ({ src, alt }: ComponentPropsWithoutRef<'img'>) => {
    if (!src || typeof src !== 'string') return null
    return (
      <div className="my-10 border-4 border-foreground shadow-brutal-sm overflow-hidden bg-background">
        <Image
          src={src}
          alt={alt ?? ''}
          width={800}
          height={450}
          className="w-full"
        />
      </div>
    )
  },
}
