export function calculateMean(values: number[]): number | 'unknown' {
  if (values.length === 0) return 'unknown';
  const sum = values.reduce((acc, v) => acc + v, 0);
  return Number((sum / values.length).toFixed(1));
}

export function calculateMedian(values: number[]): number | 'unknown' {
  if (values.length === 0) return 'unknown';
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(1));
  }
  return Number(sorted[mid].toFixed(1));
}

export function calculatePercentile90(values: number[]): number | 'unknown' {
  if (values.length === 0) return 'unknown';
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil(0.9 * sorted.length) - 1;
  const safeIndex = Math.max(0, Math.min(index, sorted.length - 1));
  return Number(sorted[safeIndex].toFixed(1));
}

export function calculateDaysDifference(startDateIso: string, endDateIso: string): number {
  const start = new Date(startDateIso).getTime();
  const end = new Date(endDateIso).getTime();
  const diffTime = Math.abs(end - start);
  return Number((diffTime / (1000 * 60 * 60 * 24)).toFixed(1));
}