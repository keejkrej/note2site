Use when you need to create or re-scaffold the Next.js project under `/workspace/site`.

# Scaffold a Next.js full-stack site

## Prerequisites

- Target directory: `/workspace/site`
- If a partial project exists, inspect it first with `glob` and `read_file` before overwriting.

## Create the project

If `/workspace/site` is empty or missing `package.json`, scaffold with:

```bash
cd /workspace && npx create-next-app@latest site \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --turbopack \
  --yes
```

## Required dependencies

After scaffold, add UI and content libraries as needed:

```bash
cd /workspace/site && npm install lucide-react clsx tailwind-merge class-variance-authority
```

For MDX or rich content, optionally add:

```bash
npm install @next/mdx @mdx-js/loader @mdx-js/react
```

## Project structure

Organize the generated site like this:

```text
site/
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
└── package.json
```

## Full-stack minimum

Every site must include at least one **Route Handler** under `src/app/api/`:

- `GET /api/search?q=...` — search page titles and content
- `GET /api/chapters` — return chapter JSON from `site-structure.json`
- `POST /api/quiz` — return quiz questions for a chapter

Store derived data in `src/lib/content.ts` or JSON files under `src/data/`.

## Verify

Run `build_site` after scaffolding and after adding routes.
