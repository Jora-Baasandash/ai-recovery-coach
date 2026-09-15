export const SAFETY_PROMPT_VERSION = "safety-v1";

export const CRISIS_RESOURCE_OUTPUT = {
  pattern:
    "This check-in may indicate serious distress. This app is not the right place for that.",
  suggestedAction:
    "If you may be in danger, contact local emergency services. In the US, call or text 988. International resources: https://www.iasp.info/suicidalthoughts/",
  encouragement:
    "You do not have to handle this alone. A trained human can help right now.",
};

const CRISIS_PHRASES = [
  "suicide",
  "suicidal",
  "kill myself",
  "killing myself",
  "want to die",
  "wanna die",
  "end my life",
  "ending my life",
  "self-harm",
  "self harm",
  "hurt myself",
  "hurting myself",
  "cut myself",
];

export function looksLikeCrisis(
  ...texts: Array<string | null | undefined>
): boolean {
  const haystack = texts
    .filter((text): text is string => Boolean(text))
    .join(" ")
    .toLowerCase();

  if (!haystack) {
    return false;
  }

  return CRISIS_PHRASES.some((phrase) => haystack.includes(phrase));
}
