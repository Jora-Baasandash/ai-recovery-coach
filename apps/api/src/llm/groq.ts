import OpenAI from "openai";
import { buildInsightUserPrompt, INSIGHT_SYSTEM_PROMPT } from "./prompt.js";
import {
  INSIGHT_OUTPUT_SCHEMA,
  INSIGHT_PROMPT_VERSION,
  type InsightGenerator,
  type InsightOutput,
} from "./types.js";

export function createGroqInsightGenerator(options: {
  apiKey: string;
  model: string;
}): InsightGenerator {
  const client = new OpenAI({
    apiKey: options.apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });

  return {
    async generate(checkIns) {
      const started = Date.now();
      const response = await client.chat.completions.create({
        model: options.model,
        messages: [
          { role: "system", content: INSIGHT_SYSTEM_PROMPT },
          { role: "user", content: buildInsightUserPrompt(checkIns) },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "insight",
            strict: true,
            schema: INSIGHT_OUTPUT_SCHEMA,
          },
        },
      });

      const content = response.choices[0]?.message.content;
      if (!content) {
        throw new Error("Groq returned an empty insight");
      }

      const parsed = JSON.parse(content) as InsightOutput;
      if (
        typeof parsed.pattern !== "string" ||
        typeof parsed.suggestedAction !== "string" ||
        typeof parsed.encouragement !== "string"
      ) {
        throw new Error("Groq returned insight JSON that did not match the schema");
      }

      return {
        output: parsed,
        model: options.model,
        promptVersion: INSIGHT_PROMPT_VERSION,
        inputTokens: response.usage?.prompt_tokens ?? null,
        outputTokens: response.usage?.completion_tokens ?? null,
        latencyMs: Date.now() - started,
      };
    },
  };
}
