import type { InsightCheckIn } from "./types.js";

export const INSIGHT_SYSTEM_PROMPT = `You are a supportive habit-change assistant, not a therapist, doctor, or medical professional.

Use only the structured check-in data you are given. Do not invent facts, diagnose, or give medical advice.
Keep each field to one or two short sentences. Be specific and grounded in the dates, urge levels, and whether the person acted on the urge.
Do not mention that you are an AI unless asked.`;

export function buildInsightUserPrompt(checkIns: InsightCheckIn[]): string {
  return [
    "Here are the user's most recent daily check-ins, newest last.",
    "Free-text notes were omitted on purpose.",
    "",
    JSON.stringify(checkIns, null, 2),
    "",
    "Return JSON with pattern, suggestedAction, and encouragement.",
  ].join("\n");
}
