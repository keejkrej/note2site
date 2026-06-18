import { defineState } from "eve/context";
import { defineTool } from "eve/tools";
import { z } from "zod";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

interface ConversionState {
  inputDir: string;
  outputDir: string;
  skipBuild: boolean;
  verbose: boolean;
}

const conversionState = defineState<ConversionState | null>("note2site.context", () => null);

export default defineTool({
  description:
    "List pages, API routes, components, and the site structure in the generated Next.js project under outputDir.",
  inputSchema: z.object({}),
  async execute() {
    const ctx = conversionState.get();
    if (!ctx) {
      throw new Error(
        "Conversion context is not set. Call set_conversion_context first.",
      );
    }

    const pkgPath = `${ctx.outputDir}/package.json`;
    if (!existsSync(pkgPath)) {
      return {
        exists: false,
        message: `No Next.js project found at ${ctx.outputDir}. Scaffold one first.`,
      };
    }

    const appDir = `${ctx.outputDir}/src/app`;
    const rootAppDir = `${ctx.outputDir}/app`;
    const componentsDir = `${ctx.outputDir}/src/components`;
    const rootComponentsDir = `${ctx.outputDir}/components`;
    const structurePath = `${ctx.outputDir}/site-structure.json`;

    const [pages, apis, components, structureJson] = await Promise.all([
      findFiles(appDir, "page.tsx", "page.ts"),
      findApiRoutes(appDir),
      findFiles(componentsDir, ".tsx"),
      readJson(structurePath),
    ]);

    // If no src/ directory was used, also check root app/components.
    const [rootPages, rootApis, rootComponents] = await Promise.all([
      findFiles(rootAppDir, "page.tsx", "page.ts"),
      findApiRoutes(rootAppDir),
      findFiles(rootComponentsDir, ".tsx"),
    ]);

    return {
      exists: true,
      pages: [...pages, ...rootPages].sort(),
      apiRoutes: [...apis, ...rootApis].sort(),
      components: [...components, ...rootComponents].sort(),
      siteStructure: structureJson,
    };
  },
});

async function findFiles(
  dir: string,
  ...suffixes: string[]
): Promise<string[]> {
  const results: string[] = [];
  if (!existsSync(dir)) return results;

  async function walk(current: string): Promise<void> {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(entryPath);
        continue;
      }
      if (suffixes.some((suffix) => entry.name.endsWith(suffix))) {
        results.push(entryPath.replace(dir, ""));
      }
    }
  }

  await walk(dir);
  return results;
}

async function findApiRoutes(appDir: string): Promise<string[]> {
  const results: string[] = [];
  if (!existsSync(appDir)) return results;

  async function walk(current: string): Promise<void> {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(entryPath);
        continue;
      }
      if (entry.name === "route.ts") {
        results.push(entryPath.replace(appDir, ""));
      }
    }
  }

  await walk(`${appDir}/api`);
  return results;
}

async function readJson(path: string): Promise<unknown> {
  if (!existsSync(path)) return null;
  try {
    const content = await readFile(path, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}
