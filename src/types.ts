export interface ConversionContext {
  /** Absolute path to the folder containing lecture notes. */
  inputDir: string;

  /** Absolute path to the folder where the Next.js artifact will be written. */
  outputDir: string;

  /** When true, the agent should skip `npm install` and `npm run build`. */
  skipBuild: boolean;

  /** When true, the agent should log extra progress to stdout. */
  verbose: boolean;
}
