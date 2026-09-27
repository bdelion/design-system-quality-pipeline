import { describe, expect, it } from 'vitest';
import { METRIC_CONTRACTS, getMetricContract } from '../src/analytics/catalog.js';

const generatedMetricIds = [
  'portfolio.repositories', 'portfolio.libraries', 'portfolio.components', 'portfolio.componentsAudited', 'portfolio.auditCoverage',
  'audit.completed', 'audit.conform', 'audit.conditional', 'audit.nonConform', 'audit.critical', 'audit.conformityRate',
  'anomaly.total', 'anomaly.open', 'anomaly.inProgress', 'anomaly.done', 'anomaly.byCriticality.blocking', 'anomaly.byCriticality.major', 'anomaly.byCriticality.minor',
  'anomaly.criticalityCoverage', 'anomaly.byCategory.*', 'anomaly.correctedEver', 'anomaly.reopened', 'anomaly.cancelled',
  'anomaly.correctionDelay.average', 'anomaly.correctionDelay.median', 'anomaly.correctionDelay.p90', 'anomaly.backlog.oldestAge'
];

describe('V2 metric contract', () => {
  it('has no duplicate contract ids', () => {
    const ids = METRIC_CONTRACTS.map((contract) => contract.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers every metric produced by the engine', () => {
    expect(generatedMetricIds.every((id) => getMetricContract(id))).toBe(true);
  });

  it('keeps flows out of the current snapshot contract', () => {
    expect(METRIC_CONTRACTS.filter((contract) => contract.kind === 'flow')).toHaveLength(0);
  });

  it('resolves concrete category metrics through the wildcard contract', () => {
    expect(getMetricContract('anomaly.byCategory.focus')?.id).toBe('anomaly.byCategory.*');
  });
});
