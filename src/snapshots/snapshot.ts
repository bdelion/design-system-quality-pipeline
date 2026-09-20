import { randomUUID } from 'node:crypto';
import type { Analytics, DataQualityIssue, NormalizedData, RawDataset, Snapshot } from '../domain/types.js';

export function buildSnapshot(rawData: RawDataset, normalizedData: NormalizedData, dqIssues: DataQualityIssue[], analytics: Analytics, modelVersion: string, ruleVersion: string, scope: string): Snapshot {
  const capturedAt = new Date().toISOString();
  const reliability = dqIssues.some((issue) => issue.severity === 'ERROR') ? 'partial' : dqIssues.length > 0 ? 'partial' : 'reliable';
  return {
    snapshotId: `snapshot-${capturedAt.replace(/[-:.TZ]/g, '')}-${randomUUID().slice(0, 8)}`,
    capturedAt,
    scope,
    rawData: structuredClone(rawData),
    normalizedData: structuredClone(normalizedData),
    dataQuality: {
      issues: structuredClone(dqIssues),
      summary: {
        INFO: dqIssues.filter((issue) => issue.severity === 'INFO').length,
        WARNING: dqIssues.filter((issue) => issue.severity === 'WARNING').length,
        ERROR: dqIssues.filter((issue) => issue.severity === 'ERROR').length
      }
    },
    analytics: structuredClone(analytics),
    ruleVersion,
    modelVersion,
    reliability
  };
}
