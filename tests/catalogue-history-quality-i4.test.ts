import { describe, expect, it } from 'vitest';
import { normalizeGithub } from '../src/normalizers/github.js';
import { evaluateDataQuality } from '../src/quality/rules.js';
import type { GithubProcessingConfig } from '../src/config.js';
import type { RawDataset, RawHistoricalCatalogue } from '../src/domain/types.js';

const rules: GithubProcessingConfig = {
  labels: {
    componentPrefix: 'Component:', accessibilityCriticalityPrefix: 'rgaa:', accessibilityCategoryPrefix: 'a11y:',
    unknown: 'label:unknown', criticalityValues: { majeure: 'major' }
  },
  issueTypes: {
    anomaly: 'BUG',
    keywords: { AUDIT: ['audit'], BUG: ['bug'], FEATURE: ['feature'], EPIC: ['epic'], NEW_COMPONENT: ['new component'] }
  },
  projectStatuses: {
    keywords: {
      BACKLOG: ['Backlog'], READY: ['Ready'], IN_PROGRESS: ['In progress'], IN_REVIEW: ['In review'],
      DONE: ['Done'], BLOCKED: ['Blocked'], CANCELLED: ['Cancelled']
    }
  },
  closingKeywords: ['fixes'], cancelledProjectStatuses: ['Cancelled']
};

function dataset(historicalCatalogues: RawHistoricalCatalogue[]): RawDataset {
  return {
    collectedAt: '2026-10-07T20:00:00Z', catalogueComponents: [], nexusAvailable: true,
    repositories: [{
      id: 'repo-1', name: 'ds-react', owner: 'acme', defaultBranch: 'main', issues: [], pullRequests: [],
      gitTags: historicalCatalogues.map(({ tagName }) => ({ name: tagName, createdAt: '2026-10-01T00:00:00Z' })),
      historicalCatalogues
    }]
  };
}

describe('I4.3 historical catalogue data quality', () => {
  it('reports DQ-015 on the Version when the catalogue is missing at its exact PROD tag', () => {
    const raw = dataset([{ tagName: '1.0.0', status: 'missing', componentNames: [] }]);
    const normalized = normalizeGithub(raw, rules);
    const quality = evaluateDataQuality(raw, normalized, rules);
    const version = normalized.versions?.find((candidate) => candidate.number === '1.0.0');

    expect(quality).toContainEqual(expect.objectContaining({ ruleId: 'DQ-015', entityType: 'version', entityId: version?.versionId }));
    expect(normalized.componentVersions).toEqual([]);
  });

  it('reports DQ-016 on the Version when the catalogue at its exact PROD tag is invalid', () => {
    const raw = dataset([{ tagName: '2.0.0', status: 'invalid', componentNames: [] }]);
    const normalized = normalizeGithub(raw, rules);
    const quality = evaluateDataQuality(raw, normalized, rules);
    const version = normalized.versions?.find((candidate) => candidate.number === '2.0.0');

    expect(quality).toContainEqual(expect.objectContaining({ ruleId: 'DQ-016', entityType: 'version', entityId: version?.versionId }));
    expect(normalized.componentVersions).toEqual([]);
  });

  it('does not report catalogue DQ when exact-tag evidence is available', () => {
    const raw = dataset([{ tagName: '1.0.0', status: 'available', componentNames: ['Button'] }]);
    const normalized = normalizeGithub(raw, rules);
    const quality = evaluateDataQuality(raw, normalized, rules);

    expect(quality.some((item) => item.ruleId === 'DQ-015' || item.ruleId === 'DQ-016')).toBe(false);
    expect(normalized.componentVersions).toHaveLength(1);
  });

  it('does not duplicate a DQ when duplicate raw evidence is present for one Version', () => {
    const raw = dataset([
      { tagName: '1.0.0', status: 'missing', componentNames: [] },
      { tagName: '1.0.0', status: 'missing', componentNames: [] }
    ]);
    const normalized = normalizeGithub(raw, rules);
    const quality = evaluateDataQuality(raw, normalized, rules);

    expect(quality.filter((item) => item.ruleId === 'DQ-015')).toHaveLength(1);
  });
});
