export function formatScheduleDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
