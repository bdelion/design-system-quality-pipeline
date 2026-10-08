import { describe, expect, it } from 'vitest';
import { calculateMetrics } from '../src/analytics/metrics.js';
import type { ComponentVersion, NormalizedData } from '../src/domain/types.js';

const provenance = { source: 'github' as const, sourceId: 'test', collectedAt: '2026-10-07T20:00:00Z' };
const relation = (id: string, verdict: ComponentVersion['verdict']): ComponentVersion => ({
  componentVersionId: id,
  componentId: `component-${id}`,
  versionId: 'version-1',
  ...(verdict !== undefined ? { verdict } : {}),
  applicableAuditIds: verdict === 'NON_COUVERT' ? [] : [`audit-${id}`],
  provenance,
  dataQualityStatus: 'reliable'
});

describe('I6 ComponentVersion metrics', () => {
  it('separates audit coverage from conformity denominator', () => {
    const componentVersions = [
      ...Array.from({ length: 5 }, (_, i) => relation(`c${i}`, 'CONFORME')),
      ...Array.from({ length: 2 }, (_, i) => relation(`nc${i}`, 'NON_CONFORME')),
      ...Array.from({ length: 3 }, (_, i) => relation(`u${i}`, 'NON_COUVERT'))
    ];
    const data: NormalizedData = {
      libraries: [],
      components: [],
      issues: [],
      versions: [],
      componentVersions,
      audits: [],
      anomalies: [],
      auditImprovements: [],
      pullRequests: []
    };
    const metrics = calculateMetrics(data, []);
    expect(metrics['componentVersion.auditCoverage']).toMatchObject({
      value: 70,
      numerator: 7,
      denominator: 10
    });
    expect(metrics['componentVersion.conformityRate']).toMatchObject({
      value: 71.4,
      numerator: 5,
      denominator: 7
    });
  });
});
