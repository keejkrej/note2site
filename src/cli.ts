import { Client } from "eve/client";
import { createServer } from "node:net";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { lstat, mkdir } from "node:fs/promises";
import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";
import { z } from "zod";
import { collectNotes, buildUserMessage } from "./lib/notes.js";

const PACKAGE_NAME = "note2site";

const cliOptions = {
  "skip-build": { type: "boolean" as const, default: false },
  model: { type: "string" as const },
  port: { type: "string" as const },
  verbose: { type: "boolean" as const, default: false },
  help: { type: "boolean" as const, short: "h", default: false },
};

type CliOptions = {
  [K in keyof typeof cliOptions]: (typeof cliOptions)[K]["type"] extends "boolean"
    ? boolean
    : string | undefined;
};

export const summarySchema = z.object({
  title: z.string(),
  pages: z.array(z.string()),
  apiRoutes: z.array(z.string()).optional(),
  components: z.array(z.string()).optional(),
  transcripts: z.array(z.string()).optional(),
  buildSuccess: z.boolean(),
  warnings: z.array(z.string()).optional(),
});

export async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    options: cliOptions,
    allowPositionals: true,
    args: process.argv.slice(2),
  });

  const options = values as CliOptions;

  if (options.help) {
    printUsage();
    process.exit(0);
  }

  if (positionals.length < 2) {
    console.error("Error: missing required arguments.");
    printUsage();
    process.exit(1);
  }

  const [notesFolder, outputFolder] = positionals;
  const inputDir = resolve(notesFolder);
  const outputDir = resolve(outputFolder);
  const skipBuild = options["skip-build"];
  const verbose = options.verbose;
  const model = options.model;

  let requestedPort: number | undefined;
  if (options.port) {
    const parsed = Number(options.port);
    if (Number.isNaN(parsed) || parsed < 1 || parsed > 65535) {
      console.error(`Error: invalid port: ${options.port}`);
      process.exit(1);
    }
    requestedPort = parsed;
  }

  try {
    await validateInputDir(inputDir);
    await ensureOutputDir(outputDir);
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";
  const ollamaModel = model ?? process.env.OLLAMA_MODEL ?? "glm-5.2:cloud";
  const ollamaRootUrl = ollamaBaseUrl.replace(/\/v1\/?$/, "").replace(/\/$/, "");

  try {
    await checkOllamaHealth(ollamaRootUrl, ollamaModel);
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  console.log(`Preparing notes from ${inputDir}...`);
  const notes = await collectNotes(inputDir);
  if (notes.length === 0) {
    console.error("Error: no supported note files found in the input folder.");
    process.exit(1);
  }

  const textCount = notes.filter((n) => n.kind === "text").length;
  const visualCount = notes.filter((n) => n.kind !== "text").length;
  console.log(`Found ${textCount} text files and ${visualCount} images/PDF pages.`);

  const userMessage = buildUserMessage(notes, inputDir);

  const port = requestedPort ?? (await findAvailablePort());
  const host = "127.0.0.1";
  const origin = `http://${host}:${port}`;

  console.log(`Starting ${PACKAGE_NAME} agent server on ${origin}...`);

  const eveEnv: NodeJS.ProcessEnv = {
    ...process.env,
    ...(model ? { EVE_OVERRIDE_MODEL: model, OLLAMA_MODEL: model } : {}),
  };

  const eveProcess = spawn("npx", ["eve", "dev", "--no-ui", "--port", String(port)], {
    stdio: verbose ? "inherit" : ["ignore", "ignore", "ignore"],
    cwd: process.cwd(),
    env: eveEnv,
  });

  const cleanup = async (code: number) => {
    eveProcess.kill("SIGTERM");
    const forceKill = setTimeout(() => eveProcess.kill("SIGKILL"), 5000);
    forceKill.unref?.();
    process.exit(code);
  };

  process.on("SIGINT", () => void cleanup(130));
  process.on("SIGTERM", () => void cleanup(143));

  try {
    await waitForHealth(origin);
    console.log("Agent server ready.");

    const client = new Client({ host: origin });
    const session = client.session();

    const response = await session.send({
      message: userMessage,
      clientContext: {
        inputDir,
        outputDir,
        skipBuild,
        verbose,
        noteFiles: notes.map((n) => ({ kind: n.kind, path: n.relativePath })),
      },
      outputSchema: summarySchema,
    });

    const result = await response.result();

    if (result.status === "failed") {
      console.error("Conversion failed.");
      if (result.message) {
        console.error(result.message);
      }
      await cleanup(1);
      return;
    }

    const summary = result.data ? summarySchema.parse(result.data) : null;

    if (summary) {
      console.log("\n✓ Conversion complete");
      console.log(`  Title:    ${summary.title}`);
      console.log(`  Pages:    ${summary.pages.length}`);
      if (summary.transcripts?.length) {
        console.log(`  Transcripts: ${summary.transcripts.length}`);
      }
      if (summary.apiRoutes?.length) {
        console.log(`  API routes: ${summary.apiRoutes.length}`);
      }
      if (summary.warnings?.length) {
        console.log("\n  Warnings:");
        for (const warning of summary.warnings) {
          console.log(`    - ${warning}`);
        }
      }
      console.log(`\nOutput: ${outputDir}`);
      if (!skipBuild) {
        console.log(summary.buildSuccess ? "Build succeeded." : "Build failed; see output above.");
      }
    } else {
      console.log(result.message ?? "No summary returned.");
    }

    const exitCode = summary && !skipBuild && !summary.buildSuccess ? 1 : 0;
    await cleanup(exitCode);
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    await cleanup(1);
  }
}

function printUsage(): void {
  console.log(`Usage: note2site <notes-folder> <output-folder> [options]`);
  console.log("");
  console.log("Convert lecture notes (markdown, text, images, scanned PDFs) into a full-stack Next.js course website.");
  console.log("");
  console.log("Arguments:");
  console.log("  <notes-folder>   Folder containing lecture notes");
  console.log("  <output-folder>  Folder where the generated Next.js app will be written");
  console.log("");
  console.log("Options:");
  console.log("  --skip-build     Generate the site but skip npm install + npm run build");
  console.log("  --model <id>     Override the Ollama model (default: glm-5.2:cloud)");
  console.log("  --port <number>  Port for the internal Eve dev server (default: ephemeral)");
  console.log("  --verbose        Stream agent server logs to stdout");
  console.log("  -h, --help       Show this help message");
  console.log("");
  console.log("Environment:");
  console.log("  OLLAMA_BASE_URL  Ollama API base URL (default: http://127.0.0.1:11434)");
  console.log("  OLLAMA_MODEL     Default Ollama model (default: glm-5.2:cloud)");
  console.log("  OLLAMA_API_KEY   Optional bearer token for authenticated Ollama endpoints");
}

async function validateInputDir(inputDir: string): Promise<void> {
  if (!existsSync(inputDir)) {
    throw new Error(`Notes folder does not exist: ${inputDir}`);
  }
  const stats = await lstat(inputDir);
  if (!stats.isDirectory()) {
    throw new Error(`Notes path is not a directory: ${inputDir}`);
  }
}

async function ensureOutputDir(outputDir: string): Promise<void> {
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
  }
  const stats = await lstat(outputDir);
  if (!stats.isDirectory()) {
    throw new Error(`Output path is not a directory: ${outputDir}`);
  }
}

async function checkOllamaHealth(baseURL: string, modelId: string): Promise<void> {
  const tagsUrl = `${baseURL.replace(/\/$/, "")}/api/tags`;
  let response: Response;
  try {
    response = await fetch(tagsUrl, { signal: AbortSignal.timeout(5000) });
  } catch {
    throw new Error(`Cannot reach Ollama at ${baseURL}. Is Ollama running?`);
  }

  if (!response.ok) {
    throw new Error(`Ollama health check failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { models?: Array<{ name?: string }> };
  const available = data.models?.map((m) => m.name).filter(Boolean) ?? [];
  if (!available.includes(modelId)) {
    throw new Error(
      `Model "${modelId}" is not available in Ollama. ` +
        `Available models: ${available.length > 0 ? available.join(", ") : "none"}. ` +
        `Run: ollama pull ${modelId}`,
    );
  }
}

async function findAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address && typeof address === "object") {
        const port = address.port;
        server.close(() => resolve(port));
      } else {
        server.close(() => reject(new Error("Could not determine ephemeral port")));
      }
    });
    server.on("error", reject);
  });
}

async function waitForHealth(origin: string, timeoutMs = 60000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(`${origin}/eve/v1/health`);
      if (response.ok) {
        return;
      }
    } catch {
      // not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Timed out waiting for the agent server to become healthy.");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  void main();
}
