# SPEC: Docs Design System

**Status**: Draft
**Depends on**: `information-architecture.md` (nav config, breadcrumb pattern), `content-pipeline.md` (MDX component mapping)

---

## 1. Layout

### DocsLayout (`src/app/(public)/docs/layout.tsx`)

Three-column layout: left sidebar, main content, optional right-rail TOC.

```
+--PublicNav--(from parent layout)--+
+----------+------------------+----+
| Sidebar  | Content          | TOC|
| 240px    | flex-1, max-3xl  |200p|
| sticky   | py-16 px-8       |    |
+----------+------------------+----+
+--PublicFooter--(from parent)------+
```

- Sidebar: `w-60`, `sticky top-16` (below PublicNav), `h-[calc(100vh-4rem)]`, `overflow-y-auto`
- Content: `flex-1`, `max-w-3xl`, `mx-auto`, `py-16 px-8`
- TOC: `w-[200px]`, `hidden lg:block`, `sticky top-16`
- Full width container uses `flex` to arrange the three columns

### Responsive behavior

| Breakpoint | Sidebar | Content | TOC |
|------------|---------|---------|-----|
| `< md` (mobile) | Hidden — slide-out drawer via hamburger button | Full width, `px-6 py-10` | Hidden |
| `md` – `lg` | Visible, fixed 240px | Remaining width | Hidden |
| `≥ lg` | Visible, fixed 240px | Remaining width minus TOC | Visible, fixed 200px |

Mobile drawer: opens from left edge, `bg-white`, `z-40`, with a backdrop overlay. Toggled by a hamburger button fixed to the top-left of the content area on mobile.

---

## 2. Components

### DocsSidebar

Left navigation with grouped links and active state.

| Element | Tailwind |
|---------|----------|
| Section title | `text-xs font-semibold uppercase tracking-widest text-slate-400 mt-6 first:mt-0` |
| Nav link (default) | `block py-1.5 pl-3 text-sm text-slate-600 hover:text-slate-900 transition-colors` |
| Nav link (active) | `block py-1.5 pl-3 text-sm text-brand-600 font-semibold border-l-2 border-brand-600` |
| "Docs" header link | `text-sm font-bold text-slate-900` — links back to `/docs` |

Data source: `docsNav` from `src/lib/docs-nav.ts` (see `information-architecture.md` §3).

Active state: compare current pathname against `/docs/<slug>`.

### TableOfContents

Right-rail auto-generated from page headings. Desktop only (`lg`+).

- Extracts `h2` and `h3` elements from the rendered page
- Renders as a list of anchor links with `text-xs text-slate-400` styling
- Active heading highlighted with `text-brand-600` via scroll-spy (Intersection Observer)
- `h3` items indented with `pl-3`
- Sticky positioning, scrolls independently if TOC is taller than viewport

Implementation: client component that reads heading elements from the DOM on mount.

### Breadcrumb

Pattern: `Docs / Section / Page` (see `information-architecture.md` §4).

| Element | Tailwind |
|---------|----------|
| Container | `flex items-center gap-2 text-sm text-slate-400 mb-8` |
| "Docs" link | `hover:text-brand-600 transition-colors` |
| Separator | `text-slate-300` — literal `/` character |
| Section label | `text-slate-400` (not a link) |
| Page label | `text-slate-700` |

Seed exists at `src/app/(public)/docs/quickstart/page.tsx:13-17`. Extend with section name from nav config.

### CodeBlock

Shiki-highlighted code with copy button and language label. Wraps the `<pre>` output from `rehype-pretty-code`.

| Element | Tailwind |
|---------|----------|
| Container | `relative mt-4 rounded-xl bg-slate-900 overflow-hidden` |
| Language label | `absolute top-3 right-12 text-[10px] font-mono uppercase text-slate-500` |
| Copy button | `absolute top-2.5 right-3 p-1 rounded text-slate-500 hover:text-slate-300` — copies code to clipboard |
| `<pre>` | `overflow-x-auto p-5 font-mono text-sm leading-relaxed text-slate-200` |

Seed exists at `src/app/(public)/docs/quickstart/page.tsx:149-155`. Extract, add copy button and language label.

The copy button is a client component (`'use client'`). The rest of CodeBlock is server-rendered.

### Callout

Admonition boxes for info, warning, and tip content. Used in MDX as `<Callout type="info">`.

| Variant | Border | Background | Icon | Text color |
|---------|--------|------------|------|------------|
| `info` | `border-blue-200` | `bg-blue-50` | Info circle (blue) | `text-blue-900` |
| `warning` | `border-amber-200` | `bg-amber-50` | Warning triangle (amber) | `text-amber-900` |
| `tip` | `border-green-200` | `bg-green-50` | Lightbulb (green) | `text-green-900` |

Shared styles: `rounded-lg border p-4 my-6 text-sm`.

Props: `type: 'info' | 'warning' | 'tip'` and `children: React.ReactNode`.

### StepList

Numbered walkthrough steps for tutorials. Used in MDX as `<Step number={1} title="...">`.

| Element | Tailwind |
|---------|----------|
| Container | `mt-10 flex gap-5` |
| Number circle | `flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white` |
| Title | `text-xl font-bold text-slate-900` |
| Body | `mt-3` — renders children |

Seed exists at `src/app/(public)/docs/quickstart/page.tsx:127-146`. Extract as-is — the design is already correct.

### PrevNextNav

Previous/Next page links at the bottom of every doc page.

| Element | Tailwind |
|---------|----------|
| Container | `mt-16 flex items-center justify-between border-t border-slate-200 pt-6` |
| Link (each side) | `group flex flex-col gap-1` |
| Direction label | `text-xs text-slate-400 group-hover:text-brand-600` — "Previous" or "Next" |
| Page title | `text-sm font-semibold text-slate-700 group-hover:text-brand-600` |

Left-aligned for Previous, right-aligned for Next. If only one exists, the other side is empty (`<div />` spacer).

Data source: flattened `docsNav` array, find current page index, look ±1.

---

## 3. MDX Element Styling

These classes apply to the `useMDXComponents` mapping in `src/mdx-components.tsx`.

| Element | Tailwind |
|---------|----------|
| `h1` | `text-4xl font-extrabold tracking-tight text-slate-900` |
| `h2` | `text-2xl font-bold text-slate-900 mt-12 mb-4 scroll-mt-20` |
| `h3` | `text-lg font-semibold text-slate-900 mt-8 mb-3 scroll-mt-20` |
| `p` | `text-base text-slate-600 leading-7 mt-4` |
| `a` | `text-brand-600 hover:underline` |
| `ul` | `mt-4 flex flex-col gap-2 list-disc pl-5 text-slate-600` |
| `ol` | `mt-4 flex flex-col gap-2 list-decimal pl-5 text-slate-600` |
| `li` | `text-base leading-7` |
| `code` (inline) | `rounded bg-slate-100 px-1.5 py-0.5 font-mono text-sm text-slate-800` |
| `pre` | Handled by CodeBlock wrapper (see §2) |
| `table` | `mt-6 w-full text-sm` |
| `th` | `border-b border-slate-200 py-2 text-left font-semibold text-slate-900` |
| `td` | `border-b border-slate-100 py-2 text-slate-600` |
| `blockquote` | `border-l-2 border-slate-200 pl-4 italic text-slate-500 mt-4` |
| `hr` | `my-10 border-slate-200` |

The `scroll-mt-20` on `h2` and `h3` ensures anchor-linked headings aren't hidden behind the sticky PublicNav.

---

## 4. Design Constraints

- **No component library**: All hand-authored Tailwind — consistent with the rest of the site
- **Brand color scale**: Indigo-based `brand-*` tokens from `tailwind.config.ts`
- **Fonts**: Inter for prose, JetBrains Mono for code — both already loaded
- **Light theme**: Matches the public site. Code blocks use `bg-slate-900` (dark) for contrast — this is the existing pattern from the quickstart page
- **Existing seeds**: `Step` and `CodeBlock` in `src/app/(public)/docs/quickstart/page.tsx` are extracted and generalized, not rewritten

---

## 5. Component File Locations

```
src/components/docs/
├── docs-sidebar.tsx          # DocsSidebar
├── table-of-contents.tsx     # TableOfContents (client component)
├── breadcrumb.tsx            # Breadcrumb
├── code-block.tsx            # CodeBlock wrapper with copy button
├── callout.tsx               # Callout (info/warning/tip)
├── step.tsx                  # Step (numbered walkthrough)
└── prev-next-nav.tsx         # PrevNextNav
```

All are Server Components except:
- `table-of-contents.tsx` — needs Intersection Observer for scroll-spy
- The copy button inside `code-block.tsx` — needs clipboard API access
