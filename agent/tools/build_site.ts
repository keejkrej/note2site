import { defineTool } from "eve/tools";
import { z } from "zod";

const SITE_DIR = "site";

export default defineTool({
  description:
    "Run `npm run build` in /workspace/site to verify the Next.js project compiles. Returns stdout, stderr, and success status.",
  inputSchema: z.object({
    install: z
      .boolean()
      .optional()
      .describe("Run npm install before building (default: false)"),
  }),
  async execute({ install }, ctx) {
    const sandbox = await ctx.getSandbox();

    if (install) {
      const installResult = await sandbox.run({
        command: `cd ${SITE_DIR} && npm install`,
      });
      if (installResult.exitCode !== 0) {
        return {
          success: false,
          phase: "install",
          exitCode: installResult.exitCode,
          stdout: installResult.stdout,
          stderr: installResult.stderr,
        };
      }
    }

    const buildResult = await sandbox.run({
      command: `cd ${SITE_DIR} && npm run build`,
    });

    return {
      success: buildResult.exitCode === 0,
      phase: "build",
      exitCode: buildResult.exitCode,
      stdout: buildResult.stdout?.slice(-4000),
      stderr: buildResult.stderr?.slice(-2000),
    };
  },
});
