import { describe, expect, it } from 'vitest';
import { collectFixture } from '../src/collectors/fixture.js';
import { calculateKpis } from '../src/analytics/kpis.js';
import { normalizeGithub } from '../src/normalizers/github.js';
import { evaluateDataQuality } from '../src/quality/rules.js';
import { buildSnapshot } from '../src/snapshots/snapshot.js';
import { loadConfig } from '../src/config.js';

// Vérifie que le snapshot conserve ensemble les sources, résultats et versions.
 describe('snapshot contract', () => {
  it('preserves RAW, normalized data, DQ and rule versions together', async () => {
    const raw = await collectFixture();
    const config = await loadConfig();
    const normalized = normalizeGithub(raw, config.github);
    const issues = evaluateDataQuality(raw, normalized, config.github);
    const snapshot = buildSnapshot(raw, normalized, issues, calculateKpis(normalized, issues), '2.1', 'dq-test', 'test');
    expect(snapshot.rawData.repositories).toHaveLength(3);
    expect(snapshot.normalizedData.anomalies).toHaveLength(7);
    expect(snapshot.ruleVersion).toBe('dq-test');
    expect(snapshot.dataQuality.summary.WARNING).toBeGreaterThan(0);
  });
});
