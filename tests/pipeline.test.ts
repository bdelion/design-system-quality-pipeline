import { describe, expect, it } from 'vitest';
import { collectFixture } from '../src/collectors/fixture.js';
import { calculateKpis } from '../src/analytics/kpis.js';
import { normalizeGithub } from '../src/normalizers/github.js';
import { evaluateDataQuality } from '../src/quality/rules.js';
import { loadConfig } from '../src/config.js';

const raw = await collectFixture();
const config = await loadConfig();
const normalized = normalizeGithub(raw, config.github);
const issues = evaluateDataQuality(raw, normalized, config.github);

 describe('quality pipeline', () => {
  it('normalizes all configured repositories without coupling KPI code to GitHub shape', () => {
    expect(normalized.libraries).toHaveLength(3);
    expect(normalized.anomalies).toHaveLength(7);
    expect(normalized.anomalies.filter((anomaly) => anomaly.provenance.sourceId?.startsWith('issue-2')).length).toBe(2);
    expect(normalized.anomalies.filter((anomaly) => anomaly.provenance.sourceId?.startsWith('issue-3')).length).toBe(2);
    expect(normalized.anomalies.every((anomaly) => anomaly.provenance.source === 'github')).toBe(true);
    expect(normalized.audits.some((audit) => audit.objectiveAuditResult === 'conform')).toBe(true);
    expect(normalized.components.some((component) => component.name === 'Toast')).toBe(true);
    expect(normalized.anomalies.find((anomaly) => anomaly.provenance.sourceId === 'issue-101')?.criticality).toBe('major');
    expect(normalized.anomalies.find((anomaly) => anomaly.provenance.sourceId === 'issue-101')?.categories).toEqual(['focus']);
    expect(issues.some((issue) => issue.ruleId === 'DQ-004' && issue.entityId === normalized.anomalies.find((anomaly) => anomaly.provenance.sourceId === 'issue-101')?.anomalyId)).toBe(false);
  });

  it('keeps invalid source data and excludes only the affected KPI object', () => {
    expect(normalized.anomalies).toHaveLength(7);
    expect(issues.some((issue) => issue.ruleId === 'DQ-001')).toBe(true);
    expect(calculateKpis(normalized, issues).anomaliesDeclared.value).toBe(6);
  });

  it('reports a partial reliability when DQ warnings or errors exist', () => {
    const analytics = calculateKpis(normalized, issues);
    expect(analytics.anomaliesCorrected.reliability).toBe('partial');
    expect(analytics.openAnomalies.value).toBe(3);
    expect(analytics.averageCorrectionDelayDays.value).toBeGreaterThan(0);
    expect(analytics.medianCorrectionDelayDays.value).toBeGreaterThan(0);
    expect(analytics.conformityRate.value).toBe(1);
  });
});
