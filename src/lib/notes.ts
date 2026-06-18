import { readFile, readdir, stat } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";
import { pdfToPng, type PngPageOutput } from "pdf-to-png-converter";

export interface NoteFileEntry {
  /** Relative path inside the input folder. */
  relativePath: string;
  /** One of: text, image, pdf-page. */
  kind: "text" | "image" | "pdf-page";
  /** For text files: the UTF-8 content. */
  content?: string;
  /** For image / pdf-page: the PNG bytes. */
  bytes?: Uint8Array;
  /** Original source file (image or pdf). */
  sourceFile: string;
  /** For pdf-page entries: the 1-based page number. */
  pageNumber?: number;
}

const TEXT_EXTENSIONS = new Set([
  ".md",
  ".mdx",
  ".txt",
  ".markdown",
]);

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".bmp",
]);

const MAX_TEXT_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_PDF_BYTES = 50 * 1024 * 1024;

const SKIP_DIRS = new Set([
  ".git",
  "node_modules",
  ".next",
  "dist",
  ".eve",
  "out",
  "build",
  "transcripts",
]);

/**
 * Walk the input directory and collect text files, images, and PDF pages.
 * PDFs are rendered to PNG pages. Images are read as-is.
 */
export async function collectNotes(inputDir: string): Promise<NoteFileEntry[]> {
  const notes: NoteFileEntry[] = [];

  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = join(dir, entry.name);
      const relPath = relative(inputDir, entryPath);

      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name) || entry.name.startsWith(".")) {
          continue;
        }
        await walk(entryPath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const ext = extname(entry.name).toLowerCase();

      if (TEXT_EXTENSIONS.has(ext)) {
        const info = await stat(entryPath);
        if (info.size > MAX_TEXT_BYTES) {
          continue; // skip text files larger than 5 MB
        }
        notes.push({
          relativePath: relPath,
          kind: "text",
          content: await readFile(entryPath, "utf-8"),
          sourceFile: relPath,
        });
        continue;
      }

      if (IMAGE_EXTENSIONS.has(ext)) {
        const info = await stat(entryPath);
        if (info.size > MAX_IMAGE_BYTES) {
          continue; // skip image files larger than 20 MB
        }
        notes.push({
          relativePath: relPath,
          kind: "image",
          bytes: await readFile(entryPath),
          sourceFile: relPath,
        });
        continue;
      }

      if (ext === ".pdf") {
        const info = await stat(entryPath);
        if (info.size > MAX_PDF_BYTES) {
          continue; // skip PDFs larger than 50 MB
        }
        const pages = await renderPdfPages(entryPath);
        for (const page of pages) {
          if (!page.content) continue;
          notes.push({
            relativePath: `${relPath}#page-${page.pageNumber}`,
            kind: "pdf-page",
            bytes: new Uint8Array(page.content.buffer, page.content.byteOffset, page.content.length),
            sourceFile: relPath,
            pageNumber: page.pageNumber,
          });
        }
      }
    }
  }

  await walk(inputDir);

  // Sort for deterministic ordering: text first, then images/pdf pages by path.
  notes.sort((a, b) => {
    if (a.kind === "text" && b.kind !== "text") return -1;
    if (a.kind !== "text" && b.kind === "text") return 1;
    return a.relativePath.localeCompare(b.relativePath);
  });

  return notes;
}

async function renderPdfPages(pdfPath: string): Promise<PngPageOutput[]> {
  return await pdfToPng(pdfPath, {
    viewportScale: 1.5,
    disableFontFace: true,
    returnPageContent: true,
    verbosityLevel: 0,
  });
}

/**
 * Build an AI SDK UserContent array mixing text and image parts, with a text
 * label before every image so the model knows what each image represents.
 */
export function buildUserMessage(
  notes: NoteFileEntry[],
  inputDir: string,
): Array<{ type: "text"; text: string } | { type: "image"; image: Uint8Array }> {
  const parts: Array<{ type: "text"; text: string } | { type: "image"; image: Uint8Array }> = [];

  parts.push({
    type: "text",
    text: [
      "Convert the lecture notes below into a full-stack Next.js course website.",
      `Input folder: ${resolve(inputDir)}`,
      "",
      "The message contains:",
      "- Text files as markdown blocks",
      "- Images and PDF pages as image parts, each preceded by a label",
      "",
      "Start by calling set_conversion_context, then transcribe every image/PDF page into a markdown file under outputDir/transcripts/ before building the site.",
      "",
      "Files in this message:",
      ...notes.map((n) => `- ${n.kind}: ${n.relativePath}`),
      "",
      "---",
      "",
    ].join("\n"),
  });

  for (const note of notes) {
    if (note.kind === "text") {
      parts.push({
        type: "text",
        text: `## Text file: ${note.relativePath}\n\n${note.content ?? ""}`,
      });
      continue;
    }

    const label = note.kind === "pdf-page"
      ? `## PDF page: ${note.sourceFile} (page ${note.pageNumber})`
      : `## Image: ${note.relativePath}`;

    parts.push({ type: "text", text: label });
    if (note.bytes) {
      parts.push({ type: "image", image: note.bytes });
    }
  }

  return parts;
}
