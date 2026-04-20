# Frontend Design Improvements Spec

## Current State Analysis
The current public-facing web app, particularly the documentation section (`src/app/(public)/docs`), employs a strong brutalist design language. This is evidenced by the use of:
- Heavy borders (`border-4 border-foreground`)
- High-contrast typography (`font-black uppercase tracking-tighter`)
- Decorative elements like diagonal lines (`diagonal-lines opacity-10`)
- Hard shadows (`shadow-brutal`)

While this provides a distinct and memorable aesthetic, it risks violating some core principles from our `frontend-design-principles` if not applied with careful intention, particularly regarding readability and subtle layering.

## Proposed Improvements

### 1. Typography Hierarchy and Readability
**Issue:** The heavy use of uppercase, tightly tracked text is excellent for headers and navigation but detrimental to long-form reading in documentation.
**Solution:** 
- Retain the brutalist uppercase typography for structural elements (page titles, sidebar navigation, section headers).
- Implement a highly readable, serif or clean sans-serif typography scale for the actual documentation content (`<article className="prose-none">`). 
- Ensure line height (leading) and line length (measure) are optimized for reading comprehension.

### 2. Intentional Color World
**Issue:** The current design relies almost entirely on `foreground` and `background` (monochrome). While stark, it lacks a specific domain identity.
**Solution:**
- Define a "Color World" that reflects the Thoughtbox domain (AI agents, reasoning, terminals, blueprints).
- Introduce a single, strong accent color (e.g., a vibrant "Terminal Green" or "Blueprint Cyan") used strictly for interactive elements (links, primary buttons) and active states in the sidebar.
- Use subtle off-whites or warm grays for the background to reduce eye strain compared to pure white, maintaining the "paper" or "canvas" feel of a brutalist design.

### 3. Subtle Layering within Brutalism
**Issue:** Brutalism often relies on flat, harsh transitions.
**Solution:**
- Apply the "Subtle Layering" principle by standardizing the `shadow-brutal` implementation. Ensure that interactive elements (like the cards on the docs index page) have a clear, consistent hover state that lifts them slightly (e.g., translating up and increasing the hard shadow offset) to provide tactile feedback without relying on soft blurs.
- Use subtle background color shifts (e.g., `bg-foreground/5`) to delineate code blocks or callouts within the documentation content, ensuring they stand out from the main text without requiring heavy borders everywhere.

### 4. Component Consistency
**Issue:** Need to ensure the brutalist theme doesn't degrade into generic patterns on utility pages.
**Solution:**
- Audit `src/components/docs/callout.tsx` and `src/components/docs/mdx-components.tsx` to ensure they align with the refined typography and color world.
- Ensure the `DocLayout` sidebar has clear active states for the current page, using the new accent color or a distinct brutalist marker (like a solid block or arrow).
