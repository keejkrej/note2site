import { defineState } from "eve/context";
import { defineTool } from "eve/tools";
import { z } from "zod";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
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
    "Read a generated file from outputDir. Paths must be relative to outputDir; absolute paths and path-escape attempts are rejected. Use this to read transcripts or inspect generated source files.",
  inputSchema: z.object({
    path: z.string().describe("Relative path inside outputDir to read."),
  }),
  async execute({ path }) {
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

    if (!existsSync(targetPath)) {
      throw new Error(`File not found: ${targetPath}`);
    }

    const content = await readFile(targetPath, "utf-8");

    return {
      path: targetPath,
      relativePath: relativeToOutput,
      content,
    };
  },
});
