# Documentation Restructure Spec

## Current State Analysis
The current documentation structure (visible in `src/components/docs/doc-layout.tsx` and `src/app/(public)/docs/page.tsx`) organizes content into three broad categories:
1. Getting Started
2. Core Concepts
3. Guides

While this is a common pattern, it often leads to mixed content types (e.g., a "Guide" that tries to be both a tutorial and a reference). We will apply the **Diátaxis framework** to systematically restructure the documentation into four distinct types based on user needs: Acquisition vs. Application, and Action vs. Cognition.

## Proposed Diátaxis Structure

### 1. Tutorials (Learning-oriented, Action)
*Goal: Take the learner by the hand through a practical experience.*
- **Quickstart:** Move from "Getting Started". Focus strictly on getting a first MCP client connected and running a basic session. Remove any deep explanations of *why* it works.

### 2. How-to Guides (Goal-oriented, Action)
*Goal: Practical directions for an already-competent user to achieve a specific real-world goal.*
- **How to Authenticate:** Extract practical steps from the current "Authentication" concept.
- **How to Manage Session Lifecycle:** Extract actionable steps (search, resume, export) from the current "Session Lifecycle" guide.
- **How to Set Up Observability:** Extract OTEL setup and cost tracking steps from the current "Observability" guide.

### 3. Reference (Information-oriented, Cognition)
*Goal: Technical description of the machinery. Austere, authoritative.*
- **Code Mode API Reference:** Move from "Core Concepts". Detail the `tb` SDK, available methods, and parameters.
- **Knowledge Graph Schema:** Extract the entity, relation, and observation definitions from the current "Knowledge Graph" guide.
- **Ulysses Protocol Specification:** Move from "Guides". Detail the exact states and transitions of the protocol.
- **Authentication Reference:** Detail API key formats, rotation policies, and workspace scoping.

### 4. Explanation (Understanding-oriented, Cognition)
*Goal: Discursive treatment that deepens understanding. Answer "Can you tell me about...?"*
- **About Sessions & Thoughts:** Move from "Core Concepts". Explain the structured reasoning trace, branching, and revisions.
- **About Interleaved Thinking (IRCoT):** Move from "Guides". Explain the theory behind think, act, reflect, repeat.
- **About Subagent Patterns:** Move from "Guides". Discuss context isolation and thought evolution strategies.
- **About the Knowledge Graph:** Explain the *why* behind the graph structure, separate from the schema reference.

## Implementation Plan
1. **Reorganize Files:** Move existing `.mdx` files in `user-docs/` into subdirectories corresponding to the four Diátaxis types (`tutorials/`, `how-to/`, `reference/`, `explanation/`).
2. **Update Navigation:** Modify `navSections` in `src/components/docs/doc-layout.tsx` and `src/app/(public)/docs/page.tsx` to reflect the four new top-level categories.
3. **Content Audit:** Review each document to ensure it strictly adheres to its Diátaxis type. For example, strip explanatory paragraphs out of the Quickstart and move them to the relevant Explanation document, replacing them with cross-links.
4. **Update Routing:** Ensure Next.js routing in `src/app/(public)/docs/` matches the new structure, adding redirects for old URLs if necessary.