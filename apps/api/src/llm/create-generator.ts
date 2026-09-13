import { createFakeInsightGenerator } from "./fake.js";
import { createGroqInsightGenerator } from "./groq.js";
import type { InsightGenerator } from "./types.js";

export function createInsightGenerator(): InsightGenerator {
  const provider = process.env.LLM_PROVIDER ?? "groq";

  if (process.env.NODE_ENV === "test" || provider === "fake") {
    return createFakeInsightGenerator();
  }

  if (provider === "groq") {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return {
        async generate() {
          throw new Error("GROQ_API_KEY is missing. Add it to .env to generate insights.");
        },
      };
    }

    return createGroqInsightGenerator({
      apiKey,
      model: process.env.LLM_MODEL ?? "openai/gpt-oss-20b",
    });
  }

  throw new Error(`Unsupported LLM_PROVIDER: ${provider}`);
}
