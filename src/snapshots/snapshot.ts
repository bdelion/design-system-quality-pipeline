import { NormalizedData, DataQualityIssue } from '../domain/types.js';
import { AnalyticsV2 } from '../domain/metrics.js';

export interface Snapshot {
  id: string;
  timestamp: string;
  ruleVersion: string;
  modelVersion: string;
  data: NormalizedData;
  dqIssues: DataQualityIssue[];
  analytics: AnalyticsV2;
}

export function createSnapshot(
  data: NormalizedData,
  dqIssues: DataQualityIssue[],
  analytics: AnalyticsV2,
  ruleVersion = '1.0.0'
): Snapshot {
  return {
    id: `snapshot-${Date.now()}`,
    timestamp: new Date().toISOString(),
    ruleVersion,
    modelVersion: '2.0',
    data,
    dqIssues,
    analytics,
  };
}