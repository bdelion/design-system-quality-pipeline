import type { DataQualityIssue, Metric } from '../domain/types.js';
import { getMetricContract } from './catalog.js';
import type { SnapshotDiff } from '../snapshots/diff.js';

function flowMetric(id: string, value: number, sourceEntityIds: string[], period: { from: string; to: string }, issues: DataQualityIssue[]): Metric {
  const contract = getMetricContract(id);
  if (!contract) throw new Error(`Missing V2 metric contract: ${id}`);
  const relevant = issues.filter((issue) => issue.impacts.some((impact) => impact.metricId === id));
  return {
    id,
    value,
    unit: contract.unit,
    numerator: value,
    denominator: value,
    scope: contract.scope,
    period,
    definition: contract.definition,
    sourceEntityIds,
    reliability: {
      status: relevant.some((issue) => issue.impacts.some((impact) => impact.metricId === id && impact.action === 'unknown')) ? 'unknown' : relevant.length ? 'partial' : 'reliable',
      issueIds: relevant.map((issue) => issue.id)
    },
    exclusions: []
  };
}

/** Transforme un delta de snapshots en vrais flux temporels observables. */
export function calculateFlowMetrics(diff: SnapshotDiff, dqIssues: DataQualityIssue[] = []): Record<string, Metric> {
  return {
    'anomaly.flow.created': flowMetric('anomaly.flow.created', diff.anomaliesCreated.length, diff.anomaliesCreated, diff.period, dqIssues),
    'anomaly.flow.corrected': flowMetric('anomaly.flow.corrected', diff.anomaliesCorrected.length, diff.anomaliesCorrected, diff.period, dqIssues),
    'anomaly.flow.reopened': flowMetric('anomaly.flow.reopened', diff.anomaliesReopened.length, diff.anomaliesReopened, diff.period, dqIssues),
    'anomaly.flow.cancelled': flowMetric('anomaly.flow.cancelled', diff.anomaliesCancelled.length, diff.anomaliesCancelled, diff.period, dqIssues)
  };
}
