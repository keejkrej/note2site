Use when you need to create or re-scaffold the Next.js project in the output folder.

# Scaffold a Next.js full-stack site

## Prerequisites

- Target directory: the `outputDir` from the conversion context.
- If a partial project exists, inspect it first with `list_site_pages` before overwriting.

## Create the project

If the output folder is empty or missing `package.json`, scaffold with the `scaffold_nextjs` tool. It runs `create-next-app@latest` with TypeScript, Tailwind, ESLint, App Router, `src/` directory, `@/*` import alias, and Turbopack.

## Required dependencies

After scaffold, add UI and content libraries as needed by writing a `package.json` script or running `npm install` inside the output folder via `build_site` with `install=true`.

Recommended packages:

- `lucide-react`
- `clsx`
- `tailwind-merge`
- `class-variance-authority`

## Project structure

Organize the generated site like this:

```text
outputDir/
├── package.json
├── next.config.ts
├── tsconfig.json
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with nav + theme
│   │   ├── page.tsx            # Course landing page
│   │   ├── globals.css
│   │   ├── chapters/
│   │   │   └── [slug]/
│   │   │       ├── page.tsx
│   │   │       └── [section]/
│   │   │           └── page.tsx
│   │   ├── glossary/
│   │   │   └── page.tsx
│   │   └── api/
│   │       └── search/
│   │           └── route.ts
│   ├── components/
│   │   ├── site-header.tsx
│   │   ├── site-sidebar.tsx
│   │   ├── callout.tsx
│   │   └── mdx-components.tsx
│   └── lib/
│       ├── content.ts          # Load parsed notes / site structure
│       └── utils.ts
```

## Full-stack minimum

Every site must include at least one Route Handler under `src/app/api/`:

- `GET /api/search?q=...` — search page titles and content
- `GET /api/chapters` — return chapter JSON from `site-structure.json`
- `POST /api/quiz` — return quiz questions for a chapter

Store derived data in `src/lib/content.ts` or JSON files under `src/data/`.

## Verify

Run `build_site` after scaffolding and after adding routes.
