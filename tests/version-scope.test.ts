import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { latestComparableSnapshot } from '../src/snapshots/history.js';
import { diffSnapshots } from '../src/snapshots/diff.js';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { nominalVersion, isFutureVersion } from '../src/domain/version-scope.js';
import { collectGithub } from '../src/collectors/github.js';
import { loadConfig } from './support/fixtures.js';
import { normalizeGithub } from '../src/normalizers/github.js';
import { evaluateDataQuality } from '../src/quality/rules.js';
import { calculateKpis } from '../src/analytics/kpis.js';
import { applyComponentVersionVerdicts } from '../src/analytics/component-versions.js';
import { buildSnapshot } from '../src/snapshots/snapshot.js';
import { generateDashboard } from '../src/dashboard/generate.js';
import { projectIssueFacts } from '../src/analytics/issues.js';
import { anonymizeDataset } from '../src/anonymization/anonymizer.js';
import type { RawDataset, RawIssue, RawPackageManifest } from '../src/domain/types.js';

const config = await loadConfig('fixture');
const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

/** Produit une issue déterministe avec une milestone explicite et une preuve Done + Closed. */
function issue(
  id: number,
  version: string | undefined,
  type: 'AUDIT' | 'BUG' = 'BUG',
  component = 'Button'
): RawIssue {
  return {
    id: 'issue-' + id,
    number: id,
    title: 'Issue ' + id,
    state: 'CLOSED',
    issueType: type,
    rawIssueType: type,
    labels: [
      config.github.labels.componentPrefix + component,
      'Audit RGAA',
      config.github.labels.accessibilityCategoryPrefix + 'keyboard'
    ],
    criticities: [],
    parents: [],
    createdAt: '2026-01-01T00:00:00Z',
    closedAt: '2026-01-03T00:00:00Z',
    linkedPullRequestIds: [],
    projectStatuses: [
      {
        projectId: 'project',
        projectName: 'Squad',
        status: 'Done',
        statusHistory: [{ status: 'Done', transitionedAt: '2026-01-02T00:00:00Z' }]
      }
    ],
    ...(type === 'AUDIT' ? { auditResult: 'conform' as const } : {}),
    ...(version ? { milestone: { id, number: id, title: version } } : {})
  };
}

/** Assemble un repository où la publication future et ses catalogues ne doivent pas déplacer la version courante. */
function dataset(
  manifest: RawPackageManifest | undefined = { status: 'available', version: '1.8.0' }
): RawDataset {
  const current = issue(1, '1.8.0', 'AUDIT');
  const future = issue(2, '1.9.0', 'AUDIT');
  const child = issue(5, undefined, 'BUG', 'FutureChildOnly');
  child.parents = [future.id];
  return {
    collectedAt: '2026-02-01T00:00:00Z',
    nexusAvailable: true,
    catalogueComponents: ['Button'],
    repositories: [
      {
        id: 'repo',
        name: 'demo',
        owner: 'acme',
        defaultBranch: 'main',
        ...(manifest ? { packageManifest: manifest } : {}),
        issues: [current, future, issue(3, '1.9.0', 'BUG', 'FutureOnly'), issue(4, undefined), child],
        pullRequests: [{ id: 'pr', number: 1, state: 'MERGED', relatedIssueIds: [future.id] }],
        gitTags: ['1.7.0', '1.8.0', '1.9.0'].map((name) => ({ name, createdAt: '2026-01-04T00:00:00Z' })),
        historicalCatalogues: ['1.7.0', '1.8.0', '1.9.0'].map((tagName) => ({
          tagName,
          status: 'available',
          componentNames: tagName === '1.9.0' ? ['Button', 'FutureOnly'] : ['Button']
        }))
      }
    ]
  };
}

/** Exécute les couches métier communes à tous les modes CLI sans modifier les artefacts locaux. */
function analyze(raw: RawDataset) {
  const data = normalizeGithub(raw, config.github, undefined, '1.8.0');
  applyComponentVersionVerdicts(data);
  const quality = evaluateDataQuality(raw, data, config.github);
  return { data, quality, analytics: calculateKpis(data, quality) };
}

describe('issue #39 : borne package et activité des équipes', () => {
  it.each([
    ['1.8.0', false],
    ['1.7.9', false],
    ['1.9.0', true],
    ['1.10.0', true],
    ['2.0.0', true],
    ['1.8.0-rc.1', false],
    ['1.8.0-SNAPSHOT', false]
  ])('compare numériquement %s à la version nominale 1.8.0', (value, future) => {
    expect(isFutureVersion(value, { status: 'available', version: '1.8.0' })).toBe(future);
  });
  it('ne confond pas 1.9 et 1.10 et ne fabrique pas une borne inconnue', () => {
    expect(isFutureVersion('1.9.0', { status: 'available', version: '1.10.0' })).toBe(false);
    expect(isFutureVersion('9.0.0', undefined)).toBeUndefined();
    expect(nominalVersion('version inconnue')).toBeUndefined();
    expect(nominalVersion('01.8.0')).toBeUndefined();
    expect(nominalVersion('1.8.0-SNAPSHOT')).toBe('1.8.0');
  });
  it('borne versions, catalogues, audits et anomalies en conservant toutes les issues et PR', () => {
    const raw = dataset(),
      original = structuredClone(raw);
    const { data, quality, analytics } = analyze(raw);
    expect(raw).toEqual(original);
    expect(data.versions?.map((version) => version.number)).toEqual(['1.7.0', '1.8.0']);
    expect(data.issues).toHaveLength(5);
    expect(data.pullRequests).toHaveLength(1);
    expect(data.issues?.filter((item) => item.futureVersion).map((item) => item.issueId)).toEqual([
      'issue-2',
      'issue-3',
      'issue-5'
    ]);
    expect(data.audits.map((audit) => audit.issueId)).toEqual(['issue-1']);
    expect(data.anomalies.map((anomaly) => anomaly.issueId)).toEqual(['issue-4']);
    expect(data.anomalies[0]?.auditId).toBeUndefined();
    expect(data.components.map((component) => component.name)).toEqual(['Button']);
    expect(data.componentVersions).toHaveLength(2);
    expect(analytics.metrics['issue.total']?.value).toBe(5);
    expect(analytics.workspaces?.rows.map((row) => row.id)).toEqual(['issue-4']);
    const global = analytics.workspaces?.scopes.find(
      (scope) => !scope.repository && !scope.component && !scope.version
    );
    expect(global?.summary).toMatchObject({
      components: 1,
      covered: 1,
      conform: 1,
      coverage: 100,
      conformity: 100
    });
    expect(analytics.workspaces?.scopes.some((scope) => scope.version === '1.9.0')).toBe(false);
    expect(quality).toContainEqual(expect.objectContaining({ ruleId: 'DQ-034', severity: 'INFO' }));
    expect(quality.some((item) => item.ruleId === 'DQ-029')).toBe(false);
    expect(quality.some((item) => item.ruleId === 'DQ-025' && item.entityId === 'issue-2')).toBe(false);
    expect(projectIssueFacts(data).find((item) => item.id === 'issue-2')?.familyLabel).toContain(
      'Version future'
    );
  });
  it.each([
    undefined,
    { status: 'missing' },
    { status: 'invalid' },
    { status: 'available', version: 'invalid' }
  ] as const)('conserve les anciennes données sans borne exploitable : %j', (manifest) => {
    const raw = dataset();
    if (manifest) raw.repositories[0]!.packageManifest = manifest;
    else delete raw.repositories[0]!.packageManifest;
    const { data, quality } = analyze(raw);
    expect(data.versions?.some((version) => version.number === '1.9.0')).toBe(true);
    expect(quality).toContainEqual(
      expect.objectContaining({ ruleId: 'DQ-033', severity: 'WARNING', action: 'include' })
    );
    expect(quality.find((item) => item.ruleId === 'DQ-033')?.impacts.length).toBeGreaterThan(0);
    expect(
      quality
        .find((item) => item.ruleId === 'DQ-033')
        ?.impacts.some(
          (impact) => impact.metricId === 'portfolio.repositories' || impact.metricId.startsWith('issue.')
        )
    ).toBe(false);
  });
  it('applique une borne indépendante à chaque repository et respecte les milestones configurées', () => {
    const raw = dataset();
    const other = structuredClone(raw.repositories[0]!);
    other.id = 'repo-other';
    other.name = 'other';
    other.packageManifest = { status: 'available', version: '2.0.0' };
    other.issues = [issue(10, '1.9.0', 'AUDIT')];
    raw.repositories.push(other);
    raw.repositories[0]!.issues[1]!.milestone!.title = 'Release 1.9.0';
    const rules = {
      ...config.github,
      milestoneDetection: {
        patterns: [
          { id: 'release', kind: 'release' as const, regex: '^(?:Release )?(?<version>\\d+\\.\\d+\\.\\d+)$' }
        ]
      }
    };
    const data = normalizeGithub(raw, rules);
    expect(data.issues?.find((item) => item.issueId === 'issue-2')?.futureVersion).toBe(true);
    expect(data.issues?.find((item) => item.issueId === 'issue-10')?.futureVersion).toBeUndefined();
    expect(data.audits.map((item) => item.issueId)).toEqual(['issue-1', 'issue-10']);
  });
  it('borne aussi le pont auditVersion des anciennes issues sans leur attribuer une autre version', () => {
    const raw = dataset();
    const audit = raw.repositories[0]!.issues[0]!;
    delete audit.rawIssueType;
    const child = raw.repositories[0]!.issues[3]!;
    child.parents = [audit.id];
    const data = normalizeGithub(raw, config.github, undefined, '1.9.0');
    expect(data.issues?.find((item) => item.issueId === audit.id)?.futureVersion).toBe(true);
    expect(data.issues?.find((item) => item.issueId === child.id)?.futureVersion).toBe(true);
    expect(data.audits).toHaveLength(0);
    expect(data.anomalies).toHaveLength(0);
  });
  it('reconnaît un audit Task configuré et garde ses enfants futurs hors accessibilité', () => {
    const raw = dataset();
    raw.repositories[0]!.issues[1]!.rawIssueType = 'Task';
    const { data } = analyze(raw);
    expect(data.issues?.find((item) => item.issueId === 'issue-5')?.futureVersion).toBe(true);
    expect(data.anomalies.some((item) => item.issueId === 'issue-5')).toBe(false);
    expect(data.components.some((item) => item.name === 'FutureChildOnly')).toBe(false);
  });
  it('préserve Done/Closed et les annulations dans l’activité des issues futures', () => {
    const raw = dataset();
    const future = raw.repositories[0]!.issues[1]!;
    future.projectStatuses[0]!.status = 'Cancelled';
    future.projectStatuses[0]!.statusHistory = [
      { status: 'Cancelled', transitionedAt: '2026-01-02T00:00:00Z' }
    ];
    const { data, analytics } = analyze(raw);
    expect(analytics.metrics['issue.cancelled']?.value).toBe(1);
    expect(projectIssueFacts(data).find((item) => item.id === future.id)?.status).toBe('cancelled');
    expect(data.audits.some((item) => item.issueId === future.id)).toBe(false);
  });
  it('compte les réserves de bibliothèque uniquement dans le repository concerné', () => {
    const raw = dataset();
    const other = structuredClone(raw.repositories[0]!);
    other.name = 'other';
    other.id = 'other';
    other.packageManifest = { status: 'missing' };
    other.issues = [];
    other.pullRequests = [];
    raw.repositories.push(other);
    const { quality, analytics } = analyze(raw);
    const scope = analytics.workspaces?.scopes.find(
      (item) => item.repository === 'acme/other' && !item.component && !item.version
    );
    expect(scope?.summary.qualityIssues).toBe(1);
    expect(quality.filter((item) => item.ruleId === 'DQ-033')).toHaveLength(1);
  });
  it('ne reporte pas la réserve d’une autre bibliothèque dans un filtre composant', () => {
    const raw = dataset();
    raw.repositories[0]!.issues = [];
    const other = structuredClone(raw.repositories[0]!);
    other.name = 'other';
    other.id = 'other';
    other.packageManifest = { status: 'missing' };
    other.historicalCatalogues!.forEach((catalogue) => {
      catalogue.componentNames = ['OtherOnly'];
    });
    raw.repositories.push(other);
    const { analytics } = analyze(raw);
    const scope = analytics.workspaces?.scopes.find(
      (item) => !item.repository && item.component === 'Button' && !item.version
    );
    expect(scope?.summary.qualityIssues).toBe(1);
  });
  it('préserve la borne pendant l’anonymisation, sans reprendre le package complet', () => {
    const source = dataset();
    const result = anonymizeDataset(source, {
      seed: 'scope',
      dateOffsetDays: 0,
      strictText: true,
      preserveComponentNames: true
    });
    expect(result.dataset.repositories[0]?.packageManifest).toEqual({
      status: 'available',
      version: '1.8.0'
    });
    expect(result.dataset.repositories[0]?.name).not.toBe('demo');
    expect(analyze(result.dataset).data.versions?.map((item) => item.number)).toEqual(['1.7.0', '1.8.0']);
  });
  it('versionne les profils et empêche de comparer les populations avant et après la nouvelle règle', async () => {
    const profile = JSON.parse(await readFile('config/profiles/dsq.json', 'utf8')) as {
      ruleVersion: string;
    };
    expect(profile.ruleVersion).toBe('dq-2026.10-audit-relations');
    const raw = dataset();
    const { data, quality, analytics } = analyze(raw);
    const previous = buildSnapshot(
      raw,
      data,
      quality,
      analytics,
      'test',
      'dq-2026.10-consolidation',
      'scope',
      '2026-01-01T00:00:00Z'
    );
    const current = buildSnapshot(
      raw,
      data,
      quality,
      analytics,
      'test',
      config.ruleVersion,
      'scope',
      '2026-02-01T00:00:00Z'
    );
    expect(
      latestComparableSnapshot([previous], {
        scope: 'scope',
        modelVersion: 'test',
        ruleVersion: config.ruleVersion
      })
    ).toBeUndefined();
    expect(() => diffSnapshots(previous, current)).toThrow('incompatibles');
  });
  it('produit un snapshot traçable et des filtres sans version future, avec activité conservée', async () => {
    const raw = dataset();
    const { data, quality, analytics } = analyze(raw);
    const snapshot = buildSnapshot(raw, data, quality, analytics, 'test', 'test', 'scope');
    expect(snapshot.rawData.repositories[0]?.gitTags).toHaveLength(3);
    expect(snapshot.historicalStates?.map((item) => item.versionId).sort()).toEqual(
      data.versions?.map((item) => item.versionId).sort()
    );
    const directory = await mkdtemp(join(tmpdir(), 'dsq-version-scope-'));
    try {
      await generateDashboard(snapshot, directory);
      const accessibility = await readFile(join(directory, 'dashboard/accessibility.html'), 'utf8');
      expect(accessibility).not.toContain('<option value="1.9.0"');
      const issues = await readFile(join(directory, 'dashboard/issues.html'), 'utf8');
      expect(issues).toContain('Version future');
      const qualityPage = await readFile(join(directory, 'dashboard/quality.html'), 'utf8');
      expect(qualityPage).toContain('DQ-034');
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});

describe('collecte du package déclaré', () => {
  it.each([
    ['{"version":"1.8.0","secret":"non conservé"}', 200, { status: 'available', version: '1.8.0' }],
    ['{"version":"1.8.0-SNAPSHOT"}', 200, { status: 'available', version: '1.8.0-SNAPSHOT' }],
    ['{}', 200, { status: 'invalid' }],
    ['{"version":4}', 200, { status: 'invalid' }],
    ['invalid json', 200, { status: 'invalid' }],
    ['', 404, { status: 'missing' }]
  ])('collecte %s avec statut HTTP %s', async (body, status, expected) => {
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const requests: string[] = [];
    globalThis.fetch = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.endsWith('/rate_limit'))
        return Response.json({
          resources: {
            core: { remaining: 5000, reset: Math.floor(Date.now() / 1000) + 3600 },
            graphql: { remaining: 5000, reset: Math.floor(Date.now() / 1000) + 3600 }
          }
        });
      requests.push(url);
      if (url.endsWith('/repos/acme/demo'))
        return Response.json({
          id: 1,
          name: 'demo',
          full_name: 'acme/demo',
          owner: { login: 'acme' },
          default_branch: 'feature/current'
        });
      if (url.includes('/contents/package.json'))
        return status === 404
          ? new Response('', { status })
          : Response.json({
              type: 'file',
              encoding: 'base64',
              content: Buffer.from(body).toString('base64')
            });
      return Response.json([]);
    }) as typeof fetch;
    const raw = await collectGithub({
      token: 'test',
      owner: 'acme',
      repositories: ['demo'],
      rules: config.github
    });
    expect(raw.repositories[0]?.packageManifest).toEqual(expected);
    expect(requests.some((url) => url.endsWith('/contents/package.json?ref=feature%2Fcurrent'))).toBe(true);
  });
  it('ne masque pas un refus API comme un package absent', async () => {
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    globalThis.fetch = vi.fn(async (input: string | URL | Request) =>
      String(input).endsWith('/rate_limit')
        ? Response.json({
            resources: {
              core: { remaining: 5000, reset: Math.floor(Date.now() / 1000) + 3600 },
              graphql: { remaining: 5000, reset: Math.floor(Date.now() / 1000) + 3600 }
            }
          })
        : String(input).includes('/contents/package.json')
          ? new Response('', { status: 403 })
          : Response.json({
              id: 1,
              name: 'demo',
              full_name: 'acme/demo',
              owner: { login: 'acme' },
              default_branch: 'main'
            })
    ) as typeof fetch;
    await expect(
      collectGithub({ token: 'test', owner: 'acme', repositories: ['demo'], rules: config.github })
    ).rejects.toThrow('(403)');
  });
});
