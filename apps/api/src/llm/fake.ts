import { INSIGHT_PROMPT_VERSION, type InsightGenerator } from "./types.js";

export function createFakeInsightGenerator(): InsightGenerator {
  return {
    async generate(checkIns) {
      const latest = checkIns[checkIns.length - 1];

      return {
        output: {
          pattern: latest
            ? `Recent check-ins show urge ${latest.urgeIntensity}/10.`
            : "Not enough check-ins to see a pattern yet.",
          suggestedAction:
            "Keep logging tomorrow, including the trigger if one shows up.",
          encouragement: "The useful part is that you recorded the day.",
        },
        model: "fake-insight",
        promptVersion: INSIGHT_PROMPT_VERSION,
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: 1,
      };
    },
  };
}
