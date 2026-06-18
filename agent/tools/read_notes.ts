import { defineState } from "eve/context";
import { defineTool } from "eve/tools";
import { z } from "zod";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

interface ConversionState {
  inputDir: string;
  outputDir: string;
  skipBuild: boolean;
  verbose: boolean;
}

const conversionState = defineState<ConversionState | null>("note2site.context", () => null);

const SUPPORTED_EXTENSIONS = new Set([
  ".md",
  ".mdx",
  ".txt",
  ".markdown",
]);

const SKIP_DIRS = new Set([
  ".git",
  "node_modules",
  ".next",
  "dist",
  ".eve",
  "out",
  "build",
]);

export default defineTool({
  description:
    "Read lecture notes from the input folder passed in the conversion context. Returns file paths relative to the input folder and their contents. Optionally filter by a specific subpath.",
  inputSchema: z.object({
    subpath: z
      .string()
      .optional()
      .describe("Optional relative subpath inside inputDir to narrow the scan."),
    maxFileSizeBytes: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Skip files larger than this many bytes (default: 5 MB)."),
  }),
  async execute({ subpath, maxFileSizeBytes = 5 * 1024 * 1024 }) {
    const ctx = conversionState.get();
    if (!ctx) {
      throw new Error(
        "Conversion context is not set. Call set_conversion_context first.",
      );
    }

    const targetPath = subpath ? resolve(join(ctx.inputDir, subpath)) : ctx.inputDir;
    if (!isPathInside(targetPath, ctx.inputDir)) {
      throw new Error(`Resolved subpath escapes inputDir: ${subpath}`);
    }

    const files: Array<{ relativePath: string; content: string }> = [];

    const targetInfo = await stat(targetPath).catch(() => null);
    if (targetInfo?.isFile()) {
      const content = await readFile(targetPath, "utf-8");
      files.push({
        relativePath: relative(ctx.inputDir, targetPath),
        content,
      });
      return {
        inputDir: ctx.inputDir,
        files,
        count: files.length,
      };
    }

    async function walk(dir: string): Promise<void> {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const entryPath = join(dir, entry.name);
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
        const extIndex = entry.name.lastIndexOf(".");
        const ext = extIndex > 0 ? entry.name.slice(extIndex).toLowerCase() : "";
        if (!SUPPORTED_EXTENSIONS.has(ext)) {
          continue;
        }
        const info = await stat(entryPath);
        if (info.size > maxFileSizeBytes) {
          if (ctx.verbose) {
            console.log(`[note2site] skipping large file: ${entryPath}`);
          }
          continue;
        }
        const content = await readFile(entryPath, "utf-8");
        files.push({
          relativePath: relative(ctx.inputDir, entryPath),
          content,
        });
      }
    }

    await walk(targetPath);

    files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

    if (ctx.verbose) {
      console.log(`[note2site] read ${files.length} note files from ${targetPath}`);
    }

    return {
      inputDir: ctx.inputDir,
      files,
      count: files.length,
    };
  },
});

function isPathInside(child: string, parent: string): boolean {
  const relativePath = relative(parent, child);
  return relativePath === "" || !relativePath.startsWith("..");
}
