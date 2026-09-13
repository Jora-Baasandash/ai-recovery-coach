import type { InsightOutput } from "../llm/types.js";

export function parseStoredInsightOutput(value: unknown): InsightOutput {
  if (
    value &&
    typeof value === "object" &&
    "pattern" in value &&
    "suggestedAction" in value &&
    "encouragement" in value &&
    typeof value.pattern === "string" &&
    typeof value.suggestedAction === "string" &&
    typeof value.encouragement === "string"
  ) {
    return {
      pattern: value.pattern,
      suggestedAction: value.suggestedAction,
      encouragement: value.encouragement,
    };
  }

  throw new Error("Stored insight output was invalid");
}
