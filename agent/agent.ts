import { defineAgent } from "eve";
import { createOpenAI } from "@ai-sdk/openai";

const baseURL = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434/v1";
const modelId = process.env.OLLAMA_MODEL ?? process.env.EVE_OVERRIDE_MODEL ?? "glm-5.2:cloud";

const parsedContextWindow = Number.parseInt(
  process.env.MODEL_CONTEXT_WINDOW_TOKENS ?? "128000",
  10,
);
const contextWindowTokens = Number.isNaN(parsedContextWindow) ? 128000 : parsedContextWindow;

const ollama = createOpenAI({
  baseURL: baseURL.endsWith("/v1") ? baseURL : `${baseURL}/v1`,
  apiKey: process.env.OLLAMA_API_KEY ?? "ollama",
});

export default defineAgent({
  model: ollama.chat(modelId),
  modelContextWindowTokens: contextWindowTokens,
  compaction: {
    thresholdPercent: 0.8,
    modelContextWindowTokens: contextWindowTokens,
  },
});
