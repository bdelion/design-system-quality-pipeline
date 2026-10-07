import { describe, expect, it } from 'vitest';
import { calculateKpis } from '../src/analytics/kpis.js';
import { attachHistoricalCatalogues } from '../src/catalogue.js';
import { collectFixture } from '../src/collectors/fixture.js';
import { loadConfig } from '../src/config.js';
import { normalizeGithub } from '../src/normalizers/github.js';
import { evaluateDataQuality } from '../src/quality/rules.js';
import { buildSnapshot } from '../src/snapshots/snapshot.js';
import { generateDashboard } from '../src/dashboard/generate.js';
import { readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

describe('V1 reference scenario', () => {
  it('exercises historical catalogs, normalization, analytics, DQ and all dashboard pages end-to-end', async () => {
    const fixture = resolve(process.cwd(), 'fixtures/v1-reference.json');
    const raw = await collectFixture(fixture);
    const config = await loadConfig();
    const normalized = normalizeGithub(raw, config.github, undefined, config.auditVersion);
    await attachHistoricalCatalogues(raw, normalized, { source: 'fixture' });
    const qualityIssues = evaluateDataQuality(raw, normalized, config.github);
    const analytics = calculateKpis(normalized, qualityIssues, raw.collectedAt);
    const snapshot = buildSnapshot(raw, normalized, qualityIssues, analytics, config.modelVersion, config.ruleVersion, 'v1-reference');

    expect(normalized.versions).toHaveLength(2);
    expect(normalized.versions.map((version) => new Set(version.catalogueComponents))).toEqual([
      new Set(['Button', 'Dialog']),
      new Set(['Button', 'Dialog', 'Toast'])
    ]);
    expect(normalized.componentVersions).toHaveLength(5);
    expect(normalized.anomalies.map((anomaly) => anomaly.origin).sort()).toEqual(['AUDIT', 'HORS_AUDIT']);
    expect(analytics.metrics['portfolio.auditCoverage']?.value).toBe(40);
    expect(analytics.versionStates?.[0]?.atRelease).toBeDefined();
    expect(qualityIssues.some((issue) => issue.ruleId === 'DQ-021')).toBe(false);

    const output = resolve(process.cwd(), 'data/test-v1-reference');
    try {
      await generateDashboard(snapshot, output);
      for (const page of ['index.html', 'audits.html', 'anomalies.html', 'graph.html', 'history.html']) {
        expect(await readFile(resolve(output, 'dashboard', page), 'utf8')).toContain('window.__SNAPSHOT__');
      }
      const history = await readFile(resolve(output, 'dashboard/history.html'), 'utf8');
      expect(history).toContain('À la Release vs connaissance actuelle');
      const anomalies = await readFile(resolve(output, 'dashboard/anomalies.html'), 'utf8');
      expect(anomalies).toContain('Audit');
      expect(anomalies).toContain('Hors Audit');
    } finally {
      await rm(output, { recursive: true, force: true });
    }
  });
});
