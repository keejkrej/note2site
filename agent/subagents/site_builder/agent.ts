import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Implement Next.js pages, components, API routes, and styles for a course site from an existing site-structure.json and note content.",
  model: "anthropic/claude-sonnet-4.6",
});
