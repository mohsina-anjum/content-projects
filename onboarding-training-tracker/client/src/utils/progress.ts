export function progressTier(percent: number): 'not-started' | 'behind' | 'progressing' | 'on-track' | 'complete' {
  if (percent <= 0) return 'not-started';
  if (percent < 40) return 'behind';
  if (percent < 80) return 'progressing';
  if (percent < 100) return 'on-track';
  return 'complete';
}
