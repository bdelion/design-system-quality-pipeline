import { describe, expect, it } from 'vitest';
import { normalizeGithub } from '../src/normalizers/github.js';
import type { GithubProcessingConfig } from '../src/config.js';
import type { RawDataset, RawHistoricalCatalogue } from '../src/domain/types.js';

const rules: GithubProcessingConfig = {
  labels: {
    componentPrefix: 'Component:',
    accessibilityCriticalityPrefix: 'rgaa:',
    accessibilityCategoryPrefix: 'a11y:',
    unknown: 'label:unknown',
    criticalityValues: { majeure: 'major' }
  },
  issueTypes: {
    anomaly: 'BUG',
    keywords: {
      AUDIT: ['audit'],
      BUG: ['bug'],
      FEATURE: ['feature'],
      EPIC: ['epic'],
      NEW_COMPONENT: ['new component']
    }
  },
  projectStatuses: {
    keywords: {
      BACKLOG: ['Backlog'],
      READY: ['Ready'],
      IN_PROGRESS: ['In progress'],
      IN_REVIEW: ['In review'],
      DONE: ['Done'],
      BLOCKED: ['Blocked'],
      CANCELLED: ['Cancelled']
    }
  },
  closingKeywords: ['fixes'],
  cancelledProjectStatuses: ['Cancelled']
};

function dataset(historicalCatalogues: RawHistoricalCatalogue[]): RawDataset {
  return {
    collectedAt: '2026-10-07T20:00:00Z',
    catalogueComponents: [],
    nexusAvailable: false,
    repositories: [
      {
        id: 'repo-1',
        name: 'ds-react',
        owner: 'acme',
        defaultBranch: 'main',
        issues: [],
        pullRequests: [],
        gitTags: historicalCatalogues.map(({ tagName }) => ({
          name: tagName,
          createdAt: `${tagName.startsWith('1.') ? '2026-01' : '2026-02'}-01T00:00:00Z`
        })),
        historicalCatalogues
      }
    ]
  };
}

function relationFor(
  normalized: ReturnType<typeof normalizeGithub>,
  versionNumber: string,
  componentName: string
) {
  const version = normalized.versions?.find((candidate) => candidate.number === versionNumber);
  const relation = normalized.componentVersions?.find(
    (candidate) =>
      candidate.versionId === version?.versionId &&
      normalized.components.find((component) => component.componentId === candidate.componentId)?.name ===
        componentName
  );
  return relation;
}

describe('I4.2 historical Component x Version normalization', () => {
  it('keeps one component identity across consecutive known PROD catalogues', () => {
    const normalized = normalizeGithub(
      dataset([
        { tagName: '1.0.0', status: 'available', componentNames: ['Button'] },
        { tagName: '1.1.0', status: 'available', componentNames: ['Button'] }
      ]),
      rules
    );

    const first = relationFor(normalized, '1.0.0', 'Button');
    const second = relationFor(normalized, '1.1.0', 'Button');
    expect(first).toBeDefined();
    expect(second?.componentId).toBe(first?.componentId);
    expect(first?.verdict).toBeUndefined();
    expect(first?.applicableAuditIds).toBeUndefined();
  });

  it('creates a new identity after a proven disappearance and reappearance', () => {
    const normalized = normalizeGithub(
      dataset([
        { tagName: '1.0.0', status: 'available', componentNames: ['Button'] },
        { tagName: '1.1.0', status: 'available', componentNames: [] },
        { tagName: '1.2.0', status: 'available', componentNames: ['Button'] }
      ]),
      rules
    );

    const first = relationFor(normalized, '1.0.0', 'Button');
    const reappeared = relationFor(normalized, '1.2.0', 'Button');
    expect(relationFor(normalized, '1.1.0', 'Button')).toBeUndefined();
    expect(reappeared?.componentId).not.toBe(first?.componentId);
    expect(normalized.components.filter((component) => component.name === 'Button')).toHaveLength(2);
  });

  it('does not infer disappearance from missing or invalid catalogue evidence', () => {
    const normalized = normalizeGithub(
      dataset([
        { tagName: '1.0.0', status: 'available', componentNames: ['Button'] },
        { tagName: '1.1.0', status: 'missing', componentNames: [] },
        { tagName: '1.2.0', status: 'invalid', componentNames: [] },
        { tagName: '1.3.0', status: 'available', componentNames: ['Button'] }
      ]),
      rules
    );

    expect(relationFor(normalized, '1.3.0', 'Button')?.componentId).toBe(
      relationFor(normalized, '1.0.0', 'Button')?.componentId
    );
    expect(relationFor(normalized, '1.1.0', 'Button')).toBeUndefined();
    expect(relationFor(normalized, '1.2.0', 'Button')).toBeUndefined();
  });

  it('is deterministic regardless of historical catalogue collection order', () => {
    const snapshots: RawHistoricalCatalogue[] = [
      { tagName: '1.10.0', status: 'available', componentNames: ['Button', 'Modal'] },
      { tagName: '1.9.0', status: 'available', componentNames: ['Button'] },
      { tagName: '2.0.0', status: 'available', componentNames: ['Modal'] }
    ];
    const a = normalizeGithub(dataset(snapshots), rules);
    const b = normalizeGithub(dataset([...snapshots].reverse()), rules);

    expect(b.componentVersions).toEqual(a.componentVersions);
    expect(b.components).toEqual(a.components);
  });

  it('keeps every ComponentVersion reference resolvable', () => {
    const normalized = normalizeGithub(
      dataset([{ tagName: '1.0.0', status: 'available', componentNames: ['Button', 'Modal'] }]),
      rules
    );
    const componentIds = new Set(normalized.components.map((component) => component.componentId));
    const versionIds = new Set(normalized.versions?.map((version) => version.versionId));

    for (const relation of normalized.componentVersions ?? []) {
      expect(componentIds.has(relation.componentId)).toBe(true);
      expect(versionIds.has(relation.versionId)).toBe(true);
    }
  });
});
