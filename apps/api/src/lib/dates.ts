export function parseOccurredOn(value: string | undefined): Date {
  const raw = value ?? new Date().toISOString().slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw new Error("occurredOn must be YYYY-MM-DD");
  }

  return new Date(`${raw}T00:00:00.000Z`);
}

export function formatOccurredOn(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function utcToday(): string {
  return formatOccurredOn(new Date());
}

export function shiftUtcDate(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return formatOccurredOn(date);
}
