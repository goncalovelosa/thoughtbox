# SPEC: Docs Information Architecture

**Status**: Draft
**Depends on**: None
**Blocks**: `content-pipeline.md`, `design-system.md`

---

## 1. URL Structure

Flat hierarchy — all pages at `/docs/<slug>`. Only 9 pages total; nesting adds complexity for no benefit. Revisit if any section exceeds 5 pages.

```
/docs                   → Index (landing page)
/docs/quickstart        → Getting Started
/docs/core-concepts     → Core Concepts
/docs/tools-reference   → Tools Reference
/docs/configuration     → Configuration
/docs/mental-models     → Mental Models
/docs/notebooks         → Notebooks
/docs/observability     → Observability
/docs/architecture      → Architecture
```

---

## 2. Content Mapping

1:1 mapping — each `docs-staging/docs-for-humans/*.md` file becomes one page. No splitting or combining.

| Section | Page | URL | Source File | Notes |
|---------|------|-----|-------------|-------|
| — | Docs Index | `/docs` | `index.md` | Rework into landing; see §5 |
| Getting Started | Quickstart | `/docs/quickstart` | `getting-started.md` | Replaces current React quickstart |
| Core Concepts | Core Concepts | `/docs/core-concepts` | `core-concepts.md` | |
| Reference | Tools Reference | `/docs/tools-reference` | `tools-reference.md` | |
| Reference | Configuration | `/docs/configuration` | `configuration.md` | |
| Reference | Mental Models | `/docs/mental-models` | `mental-models.md` | |
| Guides | Notebooks | `/docs/notebooks` | `notebooks.md` | |
| Guides | Observability | `/docs/observability` | `observability.md` | |
| Advanced | Architecture | `/docs/architecture` | `architecture.md` | |

**Excluded**: `DOC-INCONSISTENCIES.md` (both human and LLM versions) — internal audit files, not for the website.

---

## 3. Sidebar Navigation

### Layout strategy

Add a docs-specific nested layout at `src/app/(public)/docs/layout.tsx`. This keeps docs pages under the existing `PublicNav` + `PublicFooter` from `src/app/(public)/layout.tsx` while adding a left sidebar for docs navigation.

### Nav data structure

Static config file at `src/lib/docs-nav.ts`. No filesystem scanning needed at this scale.

```typescript
export type DocsNavItem = {
  label: string
  slug: string
}

export type DocsNavSection = {
  title: string
  items: DocsNavItem[]
}

export const docsNav: DocsNavSection[] = [
  {
    title: 'Getting Started',
    items: [
      { label: 'Quickstart', slug: 'quickstart' },
    ],
  },
  {
    title: 'Core Concepts',
    items: [
      { label: 'Core Concepts', slug: 'core-concepts' },
    ],
  },
  {
    title: 'Reference',
    items: [
      { label: 'Tools Reference', slug: 'tools-reference' },
      { label: 'Configuration', slug: 'configuration' },
      { label: 'Mental Models', slug: 'mental-models' },
    ],
  },
  {
    title: 'Guides',
    items: [
      { label: 'Notebooks', slug: 'notebooks' },
      { label: 'Observability', slug: 'observability' },
    ],
  },
  {
    title: 'Advanced',
    items: [
      { label: 'Architecture', slug: 'architecture' },
    ],
  },
]
```

Section order matches the sidebar render order. Within each section, items render in array order.

---

## 4. Navigation Patterns

### Breadcrumb

Pattern: `Docs / Section / Page`

- `Docs` links to `/docs`
- `Section` is the section title from `docsNav` (not a link — sections are not standalone pages)
- `Page` is the current page label (not a link)

Seed implementation exists in `src/app/(public)/docs/quickstart/page.tsx:13-17`.

### Prev/Next

Bottom-of-page links to the previous and next pages in the nav config order. Driven entirely by flattening `docsNav` into a linear array and finding the current page's index.

- First page (`quickstart`): no "Previous" link, "Next" links to `core-concepts`
- Last page (`architecture`): "Previous" links to `observability`, no "Next" link

### Active state

Sidebar highlights the current page with `text-brand-600` and `font-semibold`. All other items use `text-slate-600`.

---

## 5. Index Page Evolution

The current index at `src/app/(public)/docs/page.tsx` uses a card grid with section headers. When the docs section ships:

1. **Keep the card grid layout** — it provides a good overview
2. **Replace stub links** (`href="#"`) with real page URLs from the nav config
3. **Remove "Coming soon" badges** for pages that now exist
4. **Update section grouping** to match the nav config sections (Getting Started, Core Concepts, Reference, Guides, Advanced) instead of the current grouping
5. **Pull descriptions** from frontmatter metadata on each page (see `content-pipeline.md`)

The index page does NOT get a sidebar — it serves as a standalone landing that links into the sidebar-equipped doc pages.

---

## 6. Future Considerations

- If the Reference section grows beyond 5 pages, consider a `/docs/reference/<slug>` nesting
- If a search feature is needed, add it to the sidebar header as a search input — not as a separate page
- The `docs-for-llms/` content is served via a separate mechanism (see `llm-content-strategy.md`), not through this page hierarchy
