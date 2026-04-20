# SPEC: Docs Content Pipeline

**Status**: Draft
**Depends on**: `information-architecture.md` (URL structure, page map)
**Blocks**: `design-system.md` (component integration)

---

## 1. Decision: `@next/mdx`

| Option | Verdict | Rationale |
|--------|---------|-----------|
| Keep static React | Reject | ~5000 lines of prose as JSX is unmaintainable |
| `@next/mdx` | **Accept** | First-party Next.js support, lightest integration, source is already markdown |
| `next-mdx-remote` | Defer | Extra dependency, more indirection — better for CMS-driven content we don't have |
| fumadocs / Contentlayer | Reject | Full documentation frameworks — overkill for 9 pages |

---

## 2. Dependencies

| Package | Purpose |
|---------|---------|
| `@next/mdx` | Next.js MDX plugin — enables `.mdx` files as pages |
| `@mdx-js/mdx` | MDX compiler (peer dep of `@next/mdx`) |
| `rehype-pretty-code` | Syntax highlighting via Shiki — zero client JS, build-time only |
| `gray-matter` | Frontmatter parsing for metadata extraction |

All are build-time dependencies. `rehype-pretty-code` uses Shiki under the hood, which bundles language grammars — no additional Shiki install needed.

---

## 3. Next.js Configuration

Update `next.config.ts` to wrap with the MDX plugin:

```typescript
import createMDX from '@next/mdx'
import rehypePrettyCode from 'rehype-pretty-code'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  pageExtensions: ['ts', 'tsx', 'mdx'],
  poweredByHeader: false,
  images: {
    remotePatterns: [],
  },
}

const withMDX = createMDX({
  options: {
    rehypePlugins: [
      [rehypePrettyCode, {
        theme: 'github-dark',
        defaultLang: 'typescript',
      }],
    ],
  },
})

export default withMDX(nextConfig)
```

### Key points

- `pageExtensions` adds `'mdx'` so Next.js treats `.mdx` files as pages
- `rehype-pretty-code` runs at build time — no client-side JS for highlighting
- Theme `github-dark` pairs with the existing `bg-slate-900` code block style
- Uses existing JetBrains Mono font (already loaded via `next/font` as `--font-mono`)

---

## 4. MDX Components File

Create `src/mdx-components.tsx` (required by `@next/mdx`). This maps HTML elements to custom React components for consistent styling:

```typescript
import type { MDXComponents } from 'mdx/types'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: (props) => <h1 className="..." {...props} />,
    h2: (props) => <h2 className="..." {...props} />,
    h3: (props) => <h3 className="..." {...props} />,
    p: (props) => <p className="..." {...props} />,
    a: (props) => <a className="..." {...props} />,
    ul: (props) => <ul className="..." {...props} />,
    ol: (props) => <ol className="..." {...props} />,
    li: (props) => <li className="..." {...props} />,
    code: (props) => <code className="..." {...props} />,
    pre: (props) => <pre className="..." {...props} />,
    table: (props) => <table className="..." {...props} />,
    th: (props) => <th className="..." {...props} />,
    td: (props) => <td className="..." {...props} />,
    blockquote: (props) => <blockquote className="..." {...props} />,
    // Custom components available in MDX
    Callout: (props) => <Callout {...props} />,
    Step: (props) => <Step {...props} />,
    ...components,
  }
}
```

Exact Tailwind classes defined in `design-system.md`. The `...` placeholders are intentional — this spec defines the mapping, the design spec defines the styling.

---

## 5. Frontmatter Schema

Every MDX page includes frontmatter parsed by `gray-matter`:

```yaml
---
title: "Core Concepts"
description: "Understanding how Thoughtbox structures and manages reasoning."
section: "Core Concepts"
order: 2
---
```

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `title` | string | Yes | Page `<title>`, breadcrumb label, prev/next link text |
| `description` | string | Yes | Meta description, index page card text |
| `section` | string | Yes | Sidebar section grouping (must match a section title in `docs-nav.ts`) |
| `order` | number | Yes | Sort order within section (1-indexed) |

Frontmatter is consumed by:
- Next.js `generateMetadata` for `<title>` and `<meta name="description">`
- The docs index page for card descriptions
- Breadcrumb component for the page label

---

## 6. File Placement

Each page lives as an MDX file inside the App Router:

```
src/app/(public)/docs/
├── layout.tsx                    # Docs layout (sidebar + content)
├── page.tsx                      # Index page (keeps React, reads nav config)
├── quickstart/page.mdx           # ← from getting-started.md
├── core-concepts/page.mdx        # ← from core-concepts.md
├── tools-reference/page.mdx      # ← from tools-reference.md
├── configuration/page.mdx        # ← from configuration.md
├── mental-models/page.mdx        # ← from mental-models.md
├── notebooks/page.mdx            # ← from notebooks.md
├── observability/page.mdx        # ← from observability.md
└── architecture/page.mdx         # ← from architecture.md
```

Each MDX file is a direct migration of its source markdown from `docs-staging/docs-for-humans/`. The migration process:

1. Copy markdown content from source file
2. Add frontmatter block at the top
3. Replace any custom formatting with MDX components (e.g., admonition blocks become `<Callout>`)
4. Rename to `page.mdx` and place in the correct slug directory

---

## 7. Migration: Existing Quickstart

The current `src/app/(public)/docs/quickstart/page.tsx` is a React component with inline `Step` and `CodeBlock` components. Migration path:

1. Extract `Step` and `CodeBlock` to shared components (see `design-system.md`)
2. Convert the page content to MDX using those components
3. Replace `page.tsx` with `page.mdx`
4. Content comes from `docs-staging/docs-for-humans/getting-started.md`, not the current quickstart — the staging version is more complete

---

## 8. Syntax Highlighting

`rehype-pretty-code` with Shiki handles all code blocks at build time:

- **Theme**: `github-dark` — matches existing `bg-slate-900` code blocks
- **Font**: JetBrains Mono via `--font-mono` CSS variable (already loaded)
- **Languages**: Auto-detected from fenced code block language tags (` ```typescript `, ` ```json `, etc.)
- **Line numbers**: Not needed for docs — most blocks are short config snippets
- **Copy button**: Added via a client component wrapper (see `design-system.md`)
- **Zero client JS**: Shiki tokenizes at build time and outputs `<span>` elements with inline styles

---

## 9. Build Verification

After implementation, verify:

- [ ] `pnpm build` succeeds with no MDX compilation errors
- [ ] Every page in the page map (§6) resolves to a valid route
- [ ] Frontmatter `title` renders in the browser tab
- [ ] Code blocks render with syntax highlighting
- [ ] No client JS bundle increase from syntax highlighting (check with `next/bundle-analyzer` if needed)
