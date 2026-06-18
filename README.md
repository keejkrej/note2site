# note2site

Convert a folder of lecture notes into a full-stack **Next.js** course website.

note2site is a CLI powered by [Vercel Eve](https://vercel.com/eve) and a local [Ollama](https://ollama.com/) endpoint. It reads markdown/text notes **and** images, photographed whiteboards, handwritten scans, and PDF slides, then plans a site structure, scaffolds a Next.js App Router project, and generates pages, components, and API routes in an output folder of your choice.

## Features

- **CLI-first** — Run from your terminal with a notes folder and an output folder.
- **Multimodal input** — Handles text, images, and PDF pages. Visuals are transcribed to markdown before the site is built.
- **Filesystem-first agent** — Instructions, skills, tools, and subagents live under `agent/`.
- **Durable sessions** — Long-running builds survive restarts via Vercel Workflow.
- **Host output folder** — Generated sites are written directly to the output folder you specify.
- **Subagents** — `content_architect` structures notes; `site_builder` implements the site.
- **Optional build** — The CLI can run `npm install` + `npm run build` automatically, or leave it to you.

## Prerequisites

- **Node.js 24+** (required by Eve)
- **Ollama** running locally and reachable at `http://127.0.0.1:11434`
- The model `glm-5.2:cloud` pulled in Ollama:

  ```bash
  ollama pull glm-5.2:cloud
  ```

  Ollama acts as a proxy; the actual inference runs in the cloud.

## Quick start

```bash
# Requires Node 24+ and Ollama with glm-5.2:cloud
npm install --legacy-peer-deps

# Convert sample lecture notes into a Next.js site in ./my-course-site
npx note2site examples/sample-lecture-notes ./my-course-site
```

Preview the generated site:

```bash
cd ./my-course-site && npm run dev
```

## Usage

```bash
note2site <notes-folder> <output-folder> [options]
```

| Option | Description |
| --- | --- |
| `--skip-build` | Generate the site but skip `npm install` + `npm run build` |
| `--model <id>` | Override the Ollama model (default: `glm-5.2:cloud`) |
| `--port <number>` | Port for the internal Eve dev server (default: ephemeral) |
| `--verbose` | Stream agent server logs to stdout |
| `-h, --help` | Show help |

## Example

```bash
note2site ./lectures ./intro-to-ml-site --verbose
```

## Supported note files

- **Text:** `.md`, `.mdx`, `.txt`, `.markdown`
- **Images:** `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.bmp`
- **PDFs:** `.pdf` — each page is rendered to an image and transcribed

## How multimodal notes work

1. The CLI scans the notes folder.
2. Text files are read into the prompt.
3. Images are attached as AI SDK image parts.
4. PDF pages are rendered to PNG and attached as image parts.
5. The agent transcribes every image/PDF page into `outputDir/transcripts/`.
6. The agent reads all text + transcripts and builds the course website.

This **extract-then-build** approach keeps transcripts as editable artifacts and avoids overloading the site-building step with raw image tokens.

## Agent architecture

```text
agent/
├── instructions.md          # note2site persona and CLI workflow
├── agent.ts                 # Ollama model config
├── channels/
│   └── eve.ts               # Localhost-only HTTP channel
├── skills/
│   ├── parse_lecture_notes.md
│   ├── scaffold_nextjs.md
│   └── design_course_site.md
├── tools/
│   ├── set_conversion_context.ts  # Store inputDir/outputDir in session state
│   ├── read_notes.ts              # Read text files from inputDir
│   ├── read_site_file.ts          # Read generated files from outputDir
│   ├── write_site_file.ts         # Write generated files to outputDir
│   ├── scaffold_nextjs.ts         # create-next-app into outputDir
│   ├── build_site.ts              # npm install + npm run build in outputDir
│   └── list_site_pages.ts         # Audit generated routes
├── subagents/
│   ├── content_architect/   # Structures notes → site-structure.json
│   └── site_builder/        # Implements Next.js pages & APIs
└── sandbox/
    └── sandbox.ts           # Default backend (Docker/microsandbox/justbash)
```

## Configuration

Environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `OLLAMA_BASE_URL` | `http://127.0.0.1:11434` | Ollama API base URL |
| `OLLAMA_MODEL` | `glm-5.2:cloud` | Default model |
| `OLLAMA_API_KEY` | unset | Optional bearer token for authenticated endpoints |

## Development

```bash
npm run dev       # Run the CLI against examples/sample-lecture-notes → ./tmp-output
npm run typecheck # Type-check the CLI and agent tools
npm run build     # Compile the CLI to dist/
```

## License

Apache-2.0 (Eve framework). See [Vercel Eve](https://github.com/vercel/eve) for framework terms.
