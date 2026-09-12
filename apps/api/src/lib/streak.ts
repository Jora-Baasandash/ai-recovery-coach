import { shiftUtcDate } from "./dates.js";

export function computeCheckInStreak(
  occurredOnDates: string[],
  today: string,
): number {
  const logged = new Set(occurredOnDates);
  let cursor = logged.has(today) ? today : shiftUtcDate(today, -1);

  if (!logged.has(cursor)) {
    return 0;
  }

  let streak = 0;
  while (logged.has(cursor)) {
    streak += 1;
    cursor = shiftUtcDate(cursor, -1);
  }

  return streak;
}
