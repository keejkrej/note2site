import { defineTool } from "eve/tools";
import { z } from "zod";

const SITE_DIR = "site";

export default defineTool({
  description:
    "List pages, API routes, and components in the generated Next.js site under /workspace/site.",
  inputSchema: z.object({}),
  async execute(_input, ctx) {
    const sandbox = await ctx.getSandbox();

    const pkgExists = await sandbox.run({
      command: `test -f ${SITE_DIR}/package.json && echo yes || echo no`,
    });

    if (pkgExists.stdout?.trim() !== "yes") {
      return {
        exists: false,
        message: "No Next.js project found at /workspace/site. Scaffold one first.",
      };
    }

    const [pages, apis, components, structure] = await Promise.all([
      sandbox.run({
        command: `find ${SITE_DIR}/src/app ${SITE_DIR}/app -name 'page.tsx' -o -name 'page.ts' 2>/dev/null | sort || true`,
      }),
      sandbox.run({
        command: `find ${SITE_DIR}/src/app ${SITE_DIR}/app -path '*/api/*/route.ts' 2>/dev/null | sort || true`,
      }),
      sandbox.run({
        command: `find ${SITE_DIR}/src/components ${SITE_DIR}/components -name '*.tsx' 2>/dev/null | sort || true`,
      }),
      sandbox.run({
        command: `test -f site-structure.json && cat site-structure.json || echo '{}'`,
      }),
    ]);

    const parseLines = (stdout: string | undefined) =>
      stdout?.trim().split("\n").filter(Boolean) ?? [];

    let siteStructure: unknown = null;
    try {
      siteStructure = JSON.parse(structure.stdout?.trim() || "{}");
    } catch {
      siteStructure = null;
    }

    return {
      exists: true,
      pages: parseLines(pages.stdout),
      apiRoutes: parseLines(apis.stdout),
      components: parseLines(components.stdout),
      siteStructure,
    };
  },
});
