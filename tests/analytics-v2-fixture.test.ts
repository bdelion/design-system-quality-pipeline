import { describe, expect, it } from 'vitest';
import { collectFixture } from '../src/collectors/fixture.js';
import { calculateKpis } from '../src/analytics/kpis.js';
import { normalizeGithub } from '../src/normalizers/github.js';
import { evaluateDataQuality } from '../src/quality/rules.js';
import { loadConfig } from '../src/config.js';

describe('V2 fixture analytical contract', () => {
  it('produces the expected self-explaining metrics', async () => {
    const raw = await collectFixture();
    const config = await loadConfig();
    const normalized = normalizeGithub(raw, config.github);
    const issues = evaluateDataQuality(raw, normalized, config.github);
    const metrics = calculateKpis(normalized, issues).metrics;

    expect(metrics['portfolio.components']?.value).toBe(8);
    expect(metrics['portfolio.componentsAudited']?.value).toBe(1);
    expect(metrics['portfolio.auditCoverage']?.value).toBe(12.5);
    expect(metrics['audit.completed']?.value).toBe(1);
    expect(metrics['audit.conformityRate']?.value).toBe(100);
    expect(metrics['anomaly.total']?.value).toBe(7);
    expect(metrics['anomaly.open']?.value).toBe(3);
    expect(metrics['anomaly.corrected']?.value).toBe(4);
    expect(metrics['anomaly.correctionDelay.average']?.value).toBe(7.1);
    expect(metrics['anomaly.correctionDelay.median']?.value).toBe(6.1);
    expect(metrics['anomaly.correctionDelay.p90']?.value).toBe(12.4);
    expect(metrics['anomaly.backlog.oldestAge']?.value).toBe(12.2);
    expect(metrics['anomaly.criticalityCoverage']?.value).toBe(85.7);
    expect(metrics['audit.conformityRate']?.reliability.status).toBe('reliable');
    expect(metrics['portfolio.auditCoverage']?.reliability.status).toBe('partial');
    expect(metrics['anomaly.byCategory.focus']?.value).toBe(2);
    expect(metrics['anomaly.byCategory.name']?.value).toBe(2);
    expect(metrics['anomaly.byCategory.structure']?.value).toBe(1);
  });
});
