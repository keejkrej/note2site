# note2site workspace

This sandbox is where the agent builds course websites.

## Directories

| Path | Purpose |
| --- | --- |
| `/workspace/site/` | Generated Next.js full-stack project |
| `/workspace/notes/` | Optional raw lecture note files |
| `/workspace/site-structure.json` | Site map (chapters, sections, slugs) |

## Getting started

The agent scaffolds `/workspace/site` with `create-next-app` and populates pages from your lecture notes.

To preview a finished site:

```bash
cd /workspace/site && npm run dev
```
