export const INSIGHT_PROMPT_VERSION = "insight-v1";
export const INSIGHT_CONTEXT_LIMIT = 14;

export const INSIGHT_OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["pattern", "suggestedAction", "encouragement"],
  properties: {
    pattern: { type: "string" },
    suggestedAction: { type: "string" },
    encouragement: { type: "string" },
  },
} as const;

export type InsightCheckIn = {
  id: string;
  occurredOn: string;
  urgeIntensity: number;
  actedOnUrge: boolean;
  trigger: string | null;
};

export type InsightOutput = {
  pattern: string;
  suggestedAction: string;
  encouragement: string;
};

export type InsightGeneration = {
  output: InsightOutput;
  model: string;
  promptVersion: string;
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs: number;
};

export type InsightGenerator = {
  generate: (checkIns: InsightCheckIn[]) => Promise<InsightGeneration>;
};
