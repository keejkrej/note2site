Use when styling the course website, choosing layout patterns, or making UX decisions.

# Design a course website

## Visual identity

Pick a palette that fits the subject:

| Subject | Primary | Accent | Mood |
| --- | --- | --- | --- |
| Computer science | Slate / zinc | Blue or violet | Clean, technical |
| Mathematics | Stone | Indigo | Precise, calm |
| Biology | Emerald / green | Teal | Organic, fresh |
| History | Amber / stone | Rose | Warm, scholarly |
| Physics | Slate | Cyan | Sharp, modern |

Use Tailwind CSS variables in `globals.css` for theming. Support **light and dark mode** via `class` strategy.

## Layout patterns

**Sidebar + content** (recommended for multi-chapter courses):

- Fixed left sidebar (240–280px) with chapter tree
- Scrollable main content area (max-width ~48rem for prose)
- Mobile: collapsible drawer nav

**Components to build:**

- `SiteHeader` — course title, theme toggle, search trigger
- `SiteSidebar` — nested chapter links with active state
- `Callout` — variants: `info`, `warning`, `definition`, `example`
- `Prose` wrapper — typography plugin styles for markdown content
- `TableOfContents` — sticky right rail on wide screens (optional)

## Content presentation

- **Definitions** — bordered callout with bold term
- **Code** — syntax-highlighted blocks with language label
- **Formulas** — use KaTeX or plain monospace if math is light
- **Diagrams** — Mermaid in client components where needed
- **Exercises** — collapsible `<details>` sections with answers

## Interactions

- Full-text search (client-side filter or `/api/search`)
- "Back to top" on long pages
- Breadcrumbs: Home → Chapter → Section
- Optional progress indicator in sidebar

## Accessibility

- `nav` landmarks, `main`, `aside`
- Focus rings on interactive elements
- `aria-current="page"` on active nav links
- Skip-to-content link
