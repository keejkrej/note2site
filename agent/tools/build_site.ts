import { defineState } from "eve/context";
import { defineTool } from "eve/tools";
import { z } from "zod";
import { existsSync } from "node:fs";
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
    "Run npm install and npm run build in the generated Next.js project under outputDir. Returns stdout, stderr, and success status. Respect skipBuild in the conversion context.",
  inputSchema: z.object({
    install: z
      .boolean()
      .optional()
      .describe("Run npm install before building (default: true)."),
  }),
  async execute({ install = true }) {
    const ctx = conversionState.get();
    if (!ctx) {
      throw new Error(
        "Conversion context is not set. Call set_conversion_context first.",
      );
    }

    if (ctx.skipBuild) {
      return {
        success: true,
        skipped: true,
        message: "Build skipped because skipBuild is true.",
      };
    }

    if (!existsSync(`${ctx.outputDir}/package.json`)) {
      return {
        success: false,
        phase: "check",
        message: `No Next.js project found at ${ctx.outputDir}. Scaffold one first.`,
      };
    }

    if (install) {
      if (ctx.verbose) {
        console.log(`[note2site] running npm install in ${ctx.outputDir}`);
      }
      const installResult = await runCommand("npm", ["install"], ctx.outputDir);
      if (installResult.exitCode !== 0) {
        return {
          success: false,
          phase: "install",
          exitCode: installResult.exitCode,
          stdout: installResult.stdout?.slice(-4000),
          stderr: installResult.stderr?.slice(-2000),
        };
      }
    }

    if (ctx.verbose) {
      console.log(`[note2site] running npm run build in ${ctx.outputDir}`);
    }

    const buildResult = await runCommand("npm", ["run", "build"], ctx.outputDir);

    return {
      success: buildResult.exitCode === 0,
      phase: "build",
      exitCode: buildResult.exitCode,
      stdout: buildResult.stdout?.slice(-4000),
      stderr: buildResult.stderr?.slice(-2000),
    };
  },
});

function runCommand(
  command: string,
  args: string[],
  cwd: string,
): Promise<{
  exitCode: number | null;
  stdout?: string;
  stderr?: string;
}> {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
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
