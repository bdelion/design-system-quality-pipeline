import { describe, expect, it } from 'vitest';
import { createAnonymizationMapper } from '../src/anonymization/anonymizer.js';
import { anonymizePipelineConfig, anonymizeCatalogue } from '../src/anonymization/config.js';
import type { PipelineConfig } from '../src/config.js';
import type { Catalogue } from '../src/catalogue.js';
import type { RawDataset } from '../src/domain/types.js';

const config: PipelineConfig = {
  modelVersion: '2.1', ruleVersion: 'dq-2026.09', auditVersion: '2026.09',
  scope: 'configured-github-repositories', githubOwner: 'myorga',
  repositories: ['design-system-core', 'design-system-react', 'design-system-docs'],
  githubApiUrl: 'https://github.enterprise.io/api/v3',
  githubGraphqlUrl: 'https://github.enterprise.io/graphql',
  githubUrl: 'https://github.enterprise.io',
  github: {
    labels: { componentPrefix: 'Component:', accessibilityCriticalityPrefix: 'rgaa:', accessibilityCategoryPrefix: 'a11y:', unknown: 'label:unknown', criticalityValues: { bloquante: 'blocking', majeure: 'major', mineure: 'minor' } },
    issueTypes: { anomaly: 'BUG', keywords: { AUDIT: ['audit'] } },
    projectStatuses: { keywords: { DONE: ['Done'], CANCELLED: ['Cancelled'] } },
    closingKeywords: ['close'], cancelledProjectStatuses: ['Cancelled']
  }
};

const catalogue: Catalogue = {
  version: '1.0',
  components: [
    { name: 'Button', repository: 'design-system-core', stream: 'React', owner: 'Owner', squad: 'Squad', status: 'stable', rgaaLevel: 'AA', tags: [] },
    { name: 'Modal', repository: 'design-system-react', stream: 'React', owner: 'Owner', squad: 'Squad', status: 'stable', rgaaLevel: 'AA', tags: [] }
  ]
};

const source: RawDataset = {
  collectedAt: '2026-09-28T10:00:00Z', nexusAvailable: false,
  catalogueComponents: ['Button'],
  repositories: [
    { id: 'r1', name: 'source-core', owner: 'source-org', defaultBranch: 'main', issues: [], pullRequests: [] },
    { id: 'r2', name: 'source-react', owner: 'source-org', defaultBranch: 'main', issues: [], pullRequests: [] }
  ]
};

describe('anonymized configuration', () => {
  it('derives repository scope and owner from the source RAW dataset', () => {
    const map = createAnonymizationMapper('seed');
    const result = anonymizePipelineConfig(config, source, map);
    expect(result.githubOwner).toBe(map('owner', 'source-org', 'owner'));
    expect(result.repositories).toEqual(source.repositories.map((r) => map('repository', r.name, 'repo')));
    expect(result.repositories).not.toEqual(config.repositories.map((r) => map('repository', r, 'repo')));
    expect(result.github).toEqual(config.github);
    expect(result.githubUrl).toBeUndefined();
    expect(result.githubApiUrl).toBeUndefined();
    expect(result.githubGraphqlUrl).toBeUndefined();
  });

  it('creates a catalogue matching the components declared by the source RAW dataset', () => {
    const map = createAnonymizationMapper('seed');
    const result = anonymizeCatalogue(catalogue, source, { seed: 'seed', dateOffsetDays: -1, strictText: true, preserveComponentNames: true }, map);
    expect(result.components).toHaveLength(1);
    expect(result.components[0]?.name).toBe('Button');
    expect(result.components[0]?.repository).toBe(map('repository', 'design-system-core', 'repo'));
  });

  it('fails clearly when RAW declares an unknown catalogue component', () => {
    const map = createAnonymizationMapper('seed');
    expect(() => anonymizeCatalogue(catalogue, { ...source, catalogueComponents: ['Unknown'] }, { seed: 'seed', dateOffsetDays: -1, strictText: true, preserveComponentNames: true }, map))
      .toThrow(/missing from catalogue\.yaml/);
  });
});
