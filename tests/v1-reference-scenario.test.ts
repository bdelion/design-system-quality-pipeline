import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { collectFixture } from '../src/collectors/fixture.js';
import { loadConfig } from '../src/config.js';
import { loadCatalogue } from '../src/catalogue.js';
import { normalizeGithub } from '../src/normalizers/github.js';
import { applyComponentVersionVerdicts } from '../src/analytics/component-versions.js';
import { evaluateDataQuality } from '../src/quality/rules.js';
import { calculateKpis } from '../src/analytics/kpis.js';
import { buildVersionHistoricalStates } from '../src/snapshots/history.js';
import { buildSnapshot } from '../src/snapshots/snapshot.js';
import { generateDashboard } from '../src/dashboard/generate.js';

const fixture = 'fixtures/v1-reference.json';

describe('I9 V1 reference scenario', () => {
  it('covers the V1 contract end to end without network access', async () => {
    const raw = await collectFixture(fixture);
    const config = await loadConfig('fixture', fixture);
    const catalogue = await loadCatalogue('fixture', fixture);
    raw.catalogueComponents = catalogue.components.map((component) => component.name);
    const normalized = normalizeGithub(raw, config.github, catalogue, config.auditVersion);
    expect(normalized.issues).toBeDefined();
    expect(normalized.versions).toBeDefined();

    const issues = normalized.issues!;
    const versions = normalized.versions!;
    applyComponentVersionVerdicts(normalized);
    const quality = evaluateDataQuality(raw, normalized, config.github);
    const analytics = calculateKpis(normalized, quality);

    expect(normalized.libraries).toHaveLength(3);
    expect(issues).toHaveLength(10);
    expect(versions).toHaveLength(4);
    expect(normalized.componentVersions).toHaveLength(3);
    expect(normalized.audits).toHaveLength(4);
    expect(normalized.anomalies).toHaveLength(4);
    expect(normalized.pullRequests).toHaveLength(1);

    const multi = issues.find((issue) => issue.issueId === 'feature-multi');
    const transverse = issues.find((issue) => issue.issueId === 'epic-transverse');
    expect(multi?.componentIds).toHaveLength(2);
    expect(transverse?.componentIds).toEqual([]);
    expect(normalized.components.some((component) => component.name === 'Tabs' && component.discoverySource === 'catalogue')).toBe(true);

    const corrected = normalized.anomalies.find((anomaly) => anomaly.issueId === 'bug-button-focus');
    const outside = normalized.anomalies.find((anomaly) => anomaly.issueId === 'bug-outside');
    expect(corrected).toMatchObject({ origin: 'AUDIT', correctedAt: '2026-09-06T11:00:00Z', everCorrected: true });
    expect(outside?.origin).toBe('HORS_AUDIT');
    expect(normalized.pullRequests[0]).toMatchObject({ state: 'merged', relatedIssueIds: ['bug-button-focus'] });

    const preProdAudit = normalized.audits.find((audit) => audit.issueId === 'audit-modal-v11-preprod');
    const preProdVersion = versions.find((version) => version.versionId === preProdAudit?.versionId);
    expect(preProdAudit).toMatchObject({
      status: 'non_conform',
      objectiveAuditResult: 'non_conform',
      auditedReleaseCandidate: '1.1.0-rc.2',
      auditedReleaseCandidateTag: { name: '1.1.0-rc.2', createdAt: '2026-09-18T08:00:00Z' }
    });
    expect(preProdAudit?.completedAt).toBe('2026-09-19T09:00:00Z');
    expect(preProdVersion?.releasedAt).toBe('2026-09-20T10:00:00Z');
    expect(Date.parse(preProdAudit!.completedAt!)).toBeLessThan(Date.parse(preProdVersion!.releasedAt!));
    expect(normalized.anomalies.some((anomaly) => anomaly.auditId === preProdAudit?.auditId)).toBe(true);

    expect(analytics.metrics['componentVersion.auditCoverage']).toMatchObject({ value: 100, numerator: 3, denominator: 3 });
    expect(analytics.metrics['componentVersion.conformityRate']).toMatchObject({ value: 66.7, numerator: 2, denominator: 3 });
    expect(quality.some((item) => item.ruleId === 'DQ-001')).toBe(true);
    expect(quality.some((item) => item.ruleId === 'DQ-013' && item.entityId === outside?.anomalyId)).toBe(true);

    const history = buildVersionHistoricalStates(normalized);
    const v11Version = versions.find((version) => version.number === '1.1.0' && version.libraryId === normalized.audits.find((audit) => audit.issueId === 'audit-modal-v11')?.libraryId);
    const v11 = history.find((state) => state.versionId === v11Version?.versionId);
    expect(v11?.atRelease.audits.some((audit) => audit.issueId === 'audit-modal-v11-preprod')).toBe(true);
    expect(v11?.atRelease.audits.some((audit) => audit.issueId === 'audit-modal-v11')).toBe(false);
    expect(v11?.currentKnowledge.audits.some((audit) => audit.issueId === 'audit-modal-v11')).toBe(true);
    expect(v11?.atRelease.componentVersions.find((item) => item.componentId === normalized.audits.find((audit) => audit.issueId === 'audit-modal-v11')?.componentId)?.verdict).toBe('NON_CONFORME');
    expect(v11?.currentKnowledge.componentVersions.find((item) => item.componentId === normalized.audits.find((audit) => audit.issueId === 'audit-modal-v11')?.componentId)?.verdict).toBe('NON_CONFORME');

    const snapshot = buildSnapshot(raw, normalized, quality, analytics, config.modelVersion, config.ruleVersion, config.scope, raw.collectedAt);
    const output = await mkdtemp(join(tmpdir(), 'dsqp-i9-'));
    try {
      await generateDashboard(snapshot, output, 'https://github.test');
      const html = await readFile(resolve(output, 'dashboard/index.html'), 'utf8');
      expect(html).toContain('Couverture Component × Version');
      expect(html).toContain('Fiabilité par métrique');
      expect(await readFile(resolve(output, 'dashboard/assets/graph.js'), 'utf8')).toContain('data-map-node');
    } finally {
      await rm(output, { recursive: true, force: true });
    }
  });
});
