import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Analyze raw lecture notes and produce a structured site map with chapters, sections, slugs, and content summaries.",
  model: "anthropic/claude-sonnet-4.6",
});
