import { defineState } from "eve/context";
import { defineTool } from "eve/tools";
import { z } from "zod";

export interface ConversionState {
  inputDir: string;
  outputDir: string;
  skipBuild: boolean;
  verbose: boolean;
}

export const conversionState = defineState<ConversionState | null>("note2site.context", () => null);

export default defineTool({
  description:
    "Store the conversion context (inputDir, outputDir, skipBuild, verbose) for the current session. Call this once at the start of every conversion job, using the values provided in clientContext.",
  inputSchema: z.object({
    inputDir: z.string().describe("Absolute path to the folder containing lecture notes."),
    outputDir: z.string().describe("Absolute path to the folder where the Next.js app will be written."),
    skipBuild: z.boolean().optional().describe("Whether to skip npm install + npm run build."),
    verbose: z.boolean().optional().describe("Whether to log extra progress."),
  }),
  async execute({ inputDir, outputDir, skipBuild = false, verbose = false }) {
    conversionState.update(() => ({
      inputDir,
      outputDir,
      skipBuild,
      verbose,
    }));

    if (verbose) {
      console.log(`[note2site] inputDir=${inputDir} outputDir=${outputDir} skipBuild=${skipBuild}`);
    }

    return {
      inputDir,
      outputDir,
      skipBuild,
      verbose,
    };
  },
});
