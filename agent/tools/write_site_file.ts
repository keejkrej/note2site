import { defineState } from "eve/context";
import { defineTool } from "eve/tools";
import { z } from "zod";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";

interface ConversionState {
  inputDir: string;
  outputDir: string;
  skipBuild: boolean;
  verbose: boolean;
}

const conversionState = defineState<ConversionState | null>("note2site.context", () => null);

export default defineTool({
  description:
    "Write a file into the generated Next.js project under outputDir. Paths must be relative to outputDir; absolute paths and path-escape attempts are rejected.",
  inputSchema: z.object({
    path: z.string().describe("Relative path inside outputDir where the file should be written."),
    content: z.string().describe("File content to write."),
  }),
  async execute({ path, content }) {
    const ctx = conversionState.get();
    if (!ctx) {
      throw new Error(
        "Conversion context is not set. Call set_conversion_context first.",
      );
    }

    if (path.startsWith("/") || path.includes("..")) {
      throw new Error(
        `Invalid path: ${path}. Only relative paths inside outputDir are allowed.`,
      );
    }

    const targetPath = resolve(join(ctx.outputDir, path));
    const relativeToOutput = relative(ctx.outputDir, targetPath);

    if (relativeToOutput.startsWith("..") || relativeToOutput.startsWith("/")) {
      throw new Error(`Resolved path escapes outputDir: ${path}`);
    }

    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, content, "utf-8");

    if (ctx.verbose) {
      console.log(`[note2site] wrote ${path}`);
    }

    return {
      path: targetPath,
      relativePath: relativeToOutput,
      bytes: Buffer.byteLength(content, "utf-8"),
    };
  },
});
