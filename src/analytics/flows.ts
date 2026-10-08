/**
 * @module analytics.flows
 * Calcule les métriques de flux des anomalies et de leur correction.
 * @remarks Documentation des contrats et responsabilités du module.
 */

import type { DataQualityIssue, Metric } from '../domain/types.js';
import { matchesMetricPattern } from '../lib/metric-impacts.js';
import { getMetricContract } from './catalog.js';
import type { SnapshotDiff } from '../snapshots/diff.js';

/**
 * Construit une métrique de flux avec son périmètre et ses valeurs dans le pipeline de qualité.
 *
 * @param id - Valeur de « id » utilisée par ce traitement.
 * @param sourceEntityIds - Valeur de « sourceEntityIds » utilisée par ce traitement.
 * @param period - Valeur de « period » utilisée par ce traitement.
 * @param issues - Valeur de « issues » utilisée par ce traitement.
 * @returns Résultat du traitement.
 */
function flowMetric(
  id: string,
  sourceEntityIds: string[],
  period: { from: string; to: string },
  issues: DataQualityIssue[]
): Metric {
  const contract = getMetricContract(id);
  if (!contract) throw new Error(`Missing V2 metric contract: ${id}`);
  const relevant = issues.filter((issue) =>
    issue.impacts.some((impact) => matchesMetricPattern(impact.metricId, id))
  );
  const excluded = new Set(
    relevant.flatMap((issue) =>
      issue.impacts
        .filter((impact) => matchesMetricPattern(impact.metricId, id) && impact.action === 'exclude')
        .map(() => issue.entityId)
    )
  );
  const validEntityIds = sourceEntityIds.filter((entityId) => !excluded.has(entityId));
  const value = validEntityIds.length;
  return {
    id,
    value,
    unit: contract.unit,
    numerator: value,
    denominator: sourceEntityIds.length,
    scope: contract.scope,
    period,
    definition: contract.definition,
    sourceEntityIds,
    reliability: {
      status: relevant.some((issue) =>
        issue.impacts.some(
          (impact) => matchesMetricPattern(impact.metricId, id) && impact.action === 'unknown'
        )
      )
        ? 'unknown'
        : relevant.length
          ? 'partial'
          : 'reliable',
      issueIds: relevant.map((issue) => issue.id)
    },
    exclusions: relevant.flatMap((issue) =>
      issue.impacts
        .filter((impact) => matchesMetricPattern(impact.metricId, id) && impact.action === 'exclude')
        .map(() => ({ entityId: issue.entityId, ruleId: issue.ruleId }))
    )
  };
}

/** Transforme un delta de snapshots en vrais flux temporels observables. */
export function calculateFlowMetrics(
  diff: SnapshotDiff,
  dqIssues: DataQualityIssue[] = []
): Record<string, Metric> {
  return {
    'anomaly.flow.created': flowMetric('anomaly.flow.created', diff.anomaliesCreated, diff.period, dqIssues),
    'anomaly.flow.corrected': flowMetric(
      'anomaly.flow.corrected',
      diff.anomaliesCorrected,
      diff.period,
      dqIssues
    ),
    'anomaly.flow.reopened': flowMetric(
      'anomaly.flow.reopened',
      diff.anomaliesReopened,
      diff.period,
      dqIssues
    ),
    'anomaly.flow.cancelled': flowMetric(
      'anomaly.flow.cancelled',
      diff.anomaliesCancelled,
      diff.period,
      dqIssues
    )
  };
}
