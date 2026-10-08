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
    expect(normalized.componentVersions).toBeDefined();
    const componentVersions = normalized.componentVersions!;
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
    const tabs = normalized.components.find((component) => component.name === 'Tabs');
    expect(tabs?.discoverySource).toBe('catalogue');
    expect(issues.some((issue) => issue.componentIds.includes(tabs!.componentId))).toBe(false);

    const corrected = normalized.anomalies.find((anomaly) => anomaly.issueId === 'bug-button-focus');
    const outside = normalized.anomalies.find((anomaly) => anomaly.issueId === 'bug-outside');
    expect(corrected).toMatchObject({ origin: 'AUDIT', correctedAt: '2026-09-06T11:00:00Z', everCorrected: true });
    expect(outside?.origin).toBe('HORS_AUDIT');
    const openAnomaly = normalized.anomalies.find((anomaly) => anomaly.issueId === 'bug-modal-a11y');
    expect(openAnomaly).toMatchObject({ status: 'open', everCorrected: false });
    expect(openAnomaly?.correctedAt).toBeUndefined();
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
    expect(quality.some((item) => item.ruleId === 'DQ-001' && item.entityId === openAnomaly?.anomalyId)).toBe(true);
    expect(quality.some((item) => item.ruleId === 'DQ-013' && item.entityId === outside?.anomalyId)).toBe(true);

    const conformAudit = normalized.audits.find((audit) => audit.issueId === 'audit-button-v1');
    const conformVersion = versions.find((version) => version.versionId === conformAudit?.versionId);
    expect(conformAudit?.status).toBe('conform');
    expect(conformAudit?.completedAt).toBeDefined();
    expect(conformVersion?.releasedAt).toBeDefined();
    expect(Date.parse(conformAudit!.completedAt!)).toBeLessThan(Date.parse(conformVersion!.releasedAt!));

    const catchUp = normalized.audits.find((audit) => audit.issueId === 'audit-modal-v11');
    const catchUpVersion = versions.find((version) => version.versionId === catchUp?.versionId);
    expect(catchUp?.completedAt).toBeDefined();
    expect(catchUpVersion?.releasedAt).toBeDefined();
    expect(Date.parse(catchUp!.completedAt!)).toBeGreaterThan(Date.parse(catchUpVersion!.releasedAt!));

    const incomplete = normalized.audits.find((audit) => audit.issueId === 'audit-button-v11-incomplete');
    expect(incomplete?.completedAt).toBeUndefined();
    expect(incomplete?.status).not.toBe('conform');

    const core = normalized.libraries.find((library) => library.repository === 'fixture-org/lib-core');
    expect(core).toBeDefined();
    const coreV1 = versions.find((version) => version.libraryId === core?.libraryId && version.number === '1.0.0');
    const coreV11 = versions.find((version) => version.libraryId === core?.libraryId && version.number === '1.1.0');
    expect(coreV1).toBeDefined();
    expect(coreV11).toBeDefined();
    const componentNames = (versionId: string) => componentVersions
      .filter((entry) => entry.versionId === versionId)
      .map((entry) => normalized.components.find((component) => component.componentId === entry.componentId)?.name)
      .sort();
    expect(componentNames(coreV1!.versionId)).toEqual(['Button']);
    expect(componentNames(coreV11!.versionId)).toEqual(['Button', 'Modal']);

    const react = normalized.libraries.find((library) => library.repository === 'fixture-org/lib-react');
    expect(react).toBeDefined();
    const docs = normalized.libraries.find((library) => library.repository === 'fixture-org/lib-docs');
    expect(docs).toBeDefined();
    const reactVersion = versions.find((version) => version.libraryId === react?.libraryId);
    expect(reactVersion).toBeDefined();
    const docsVersion = versions.find((version) => version.libraryId === docs?.libraryId);
    expect(quality.some((item) => item.ruleId === 'DQ-015' && item.entityId === reactVersion?.versionId)).toBe(true);
    expect(quality.some((item) => item.ruleId === 'DQ-016' && item.entityId === docsVersion?.versionId)).toBe(true);

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
