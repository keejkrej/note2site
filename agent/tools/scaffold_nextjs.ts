import { defineState } from "eve/context";
import { defineTool } from "eve/tools";
import { z } from "zod";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";

interface ConversionState {
  inputDir: string;
  outputDir: string;
  skipBuild: boolean;
  verbose: boolean;
}

const conversionState = defineState<ConversionState | null>("note2site.context", () => null);

export default defineTool({
  description:
    "Scaffold a fresh Next.js 15+ App Router project into outputDir using create-next-app. If outputDir already contains a package.json, the tool reports it instead of overwriting.",
  inputSchema: z.object({}),
  async execute() {
    const ctx = conversionState.get();
    if (!ctx) {
      throw new Error(
        "Conversion context is not set. Call set_conversion_context first.",
      );
    }

    if (existsSync(`${ctx.outputDir}/package.json`)) {
      return {
        scaffolded: false,
        message: `A project already exists at ${ctx.outputDir}. Clear the directory first to scaffold a new one.`,
      };
    }

    await mkdir(ctx.outputDir, { recursive: true });

    const args = [
      "create-next-app@latest",
      ctx.outputDir,
      "--typescript",
      "--tailwind",
      "--eslint",
      "--app",
      "--src-dir",
      "--import-alias",
      "@/*",
      "--turbopack",
      "--yes",
    ];

    if (ctx.verbose) {
      console.log(`[note2site] scaffolding Next.js in ${ctx.outputDir}`);
    }

    const result = await runCommand("npx", args);

    return {
      scaffolded: result.exitCode === 0,
      exitCode: result.exitCode,
      stdout: result.stdout?.slice(-2000),
      stderr: result.stderr?.slice(-2000),
    };
  },
});

function runCommand(command: string, args: string[]): Promise<{
  exitCode: number | null;
  stdout?: string;
  stderr?: string;
}> {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf-8");
    });

    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf-8");
    });

    child.on("close", (exitCode) => {
      resolve({ exitCode, stdout, stderr });
    });

    child.on("error", (error) => {
      resolve({ exitCode: 1, stderr: String(error), stdout });
    });
  });
}
