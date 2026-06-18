# note2site

Convert lecture notes into full-stack **Next.js** course websites using [Vercel Eve](https://vercel.com/eve), an open-source agent framework for durable AI agents.

Paste markdown lecture notes, outlines, or course materials into the chat UI. The agent analyzes your content, plans a site structure, scaffolds a Next.js App Router project in an isolated sandbox, and builds pages, components, and API routes.

## Features

- **Filesystem-first agent** — Instructions, skills, tools, and subagents live under `agent/`
- **Durable sessions** — Long-running builds survive restarts via Vercel Workflow
- **Isolated sandbox** — Generated sites are built in `/workspace/site` without touching the host app
- **Subagents** — `content_architect` structures notes; `site_builder` implements the site
- **Web chat UI** — Next.js frontend powered by `eve/react` and the Eve HTTP channel

## Prerequisites

- **Node.js 24+** (required by Eve)
- A model credential:
  - `AI_GATEWAY_API_KEY`, or
  - `VERCEL_OIDC_TOKEN` via `vercel link`, or
  - A direct provider key (e.g. `ANTHROPIC_API_KEY` with `@ai-sdk/anthropic`)

## Quick start

```bash
# Requires Node 24+
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and paste lecture notes. Try the sample in `examples/sample-lecture-notes.md`.

## Example prompt

```text
Convert these lecture notes into a Next.js course website with chapters,
a glossary, search API, and quiz page:

[paste notes here]
```

## Agent architecture

```text
agent/
├── instructions.md          # note2site persona and workflow
├── agent.ts                 # Model config
├── skills/
│   ├── parse_lecture_notes.md
│   ├── scaffold_nextjs.md
│   └── design_course_site.md
├── tools/
│   ├── build_site.ts        # npm run build in sandbox
│   └── list_site_pages.ts   # Audit generated routes
├── subagents/
│   ├── content_architect/   # Structures notes → site-structure.json
│   └── site_builder/        # Implements Next.js pages & APIs
└── sandbox/
    ├── sandbox.ts           # Node 24 sandbox with network for npm
    └── workspace/           # Seeded /workspace layout
```

## Deploy

Deploy to Vercel like any Next.js + Eve project:

```bash
vercel deploy
```

Set your model credentials in the Vercel project environment variables.

## License

Apache-2.0 (Eve framework). See [Vercel Eve](https://github.com/vercel/eve) for framework terms.
