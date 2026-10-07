import { afterEach, describe, expect, it, vi } from 'vitest';
import { attachHistoricalCatalogues, loadCatalogueAtTag } from '../src/catalogue.js';
import type { NormalizedData, RawDataset, Version } from '../src/domain/types.js';

const yaml = `version: "1"
components:
  - name: Button
    repository: ui
    stream: foundations
    owner: design-system
    squad: components
    status: stable
    rgaaLevel: AA
    tags: [interactive]
`;
const encodedCatalogue = Buffer.from(yaml).toString('base64');

function historicalVersion(tag?: string): Version {
  return {
    versionId: 'version-ui-1',
    libraryId: 'library-ui',
    number: '1.0.0',
    ...(tag ? { tag } : {}),
    published: true,
    catalogueStatus: 'unknown'
  };
}

function historicalData(version = historicalVersion('1.0.0')): NormalizedData {
  return {
    libraries: [{
      libraryId: 'library-ui',
      name: 'ui',
      repository: 'ui',
      status: 'active',
      provenance: { source: 'github', collectedAt: '2026-10-07T00:00:00Z' },
      dataQualityStatus: 'reliable'
    }],
    components: [],
    issues: [],
    milestones: [],
    versions: [version],
    componentVersions: [],
    audits: [],
    anomalies: [],
    auditImprovements: [],
    legacyAudits: [],
    legacyAnomalies: [],
    pullRequests: []
  };
}

function rawData(): RawDataset {
  return {
    collectedAt: '2026-10-07T00:00:00Z',
    repositories: [{
      id: 'repository-ui',
      name: 'ui',
      owner: 'design-system',
      defaultBranch: 'main',
      issues: [],
      pullRequests: [],
      tags: []
    }],
    catalogueComponents: [],
    nexusAvailable: true
  };
}

afterEach(() => vi.unstubAllGlobals());

describe('historical catalogue', () => {
  it('loads the catalogue at the exact requested tag and attaches its provenance and membership', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({
      path: 'config/catalogue.yaml',
      encoding: 'base64',
      content: encodedCatalogue
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const data = historicalData();

    await attachHistoricalCatalogues(rawData(), data, {
      source: 'github',
      token: 'test-token',
      apiUrl: 'https://github.test/api/v3'
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('ref=1.0.0');
    const auth = new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get('Authorization');
    expect(auth).toBe('Bearer test-token');
    expect(data.versions[0]?.catalogueStatus).toBe('known');
    expect(data.versions[0]?.catalogueComponents).toEqual(['Button']);
    expect(data.versions[0]?.catalogueSource).toMatchObject({
      repository: 'design-system/ui',
      ref: '1.0.0',
      path: 'config/catalogue.yaml'
    });
    expect(data.componentVersions).toHaveLength(1);
    expect(data.components[0]).toMatchObject({ name: 'Button', status: 'removed' });
  });

  it('reports an absent catalogue without substituting the current one', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 404 })));

    await expect(loadCatalogueAtTag('design-system/ui', '1.0.0', { token: 'test-token' }))
      .resolves.toEqual({ reason: 'Catalogue config/catalogue.yaml absent au tag 1.0.0.' });
  });

  it('reports an invalid historical catalogue as unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>(async () => new Response(JSON.stringify({
      path: 'config/catalogue.yaml',
      encoding: 'base64',
      content: Buffer.from('components: []').toString('base64')
    }), { status: 200 })));

    const result = await loadCatalogueAtTag('design-system/ui', '1.0.0', { token: 'test-token' });

    expect(result.catalogue).toBeUndefined();
    expect(result.reason).toContain('Catalogue invalide au tag 1.0.0');
  });

  it('does not call GitHub when the exact PROD tag is unavailable', async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchMock);
    const data = historicalData(historicalVersion(undefined));

    await attachHistoricalCatalogues(rawData(), data, { source: 'github', token: 'test-token' });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(data.versions[0]?.catalogueStatus).toBe('unknown');
    expect(data.versions[0]?.catalogueIssue).toContain('no current-catalogue fallback');
  });
});
