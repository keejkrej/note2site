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

## Project structure

Organize the generated site like this:

```text
site/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── chapters/[slug]/page.tsx
│   │   └── api/search/route.ts
│   ├── components/
│   └── lib/content.ts
└── package.json
```

## Full-stack minimum

Every site must include at least one Route Handler under `src/app/api/`.

Run `npm run build` after scaffolding.
