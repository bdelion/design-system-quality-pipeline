import { afterEach, expect, it } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { stringify } from 'yaml';
import { dsqConfig, loadDataset, prepareDataset } from '../src/datasets.js';
import { normalizeGithub } from '../src/normalizers/github.js';
import {
  applyComponentVersionVerdicts,
  latestComponentVersion
} from '../src/analytics/component-versions.js';
import {
  validateHistoricalComponents,
  type HistoricalComponentCatalogue,
  type HistoricalComponentObservation
} from '../src/historical-components.js';
import type { RawDataset, RawIssue } from '../src/domain/types.js';
import { runPipeline } from '../src/pipeline.js';
import { workspaceAnalytics } from '../src/analytics/workspaces.js';
import { evaluateDataQuality } from '../src/quality/rules.js';

const directories: string[] = [];
afterEach(async () => {
  await Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

/** Construit une observation avec une cellule probante, y compris l'absence explicite. */
function observation(
  version: string,
  identity: string | null,
  name: string,
  change: HistoricalComponentObservation['change'],
  development = false
): HistoricalComponentObservation {
  const present = !['removed', 'absent'].includes(change);
  return {
    version,
    channel: development ? 'development' : 'release',
    present,
    identity,
    historicalName: name,
    change,
    evidence: [
      {
        cell: 'G2',
        symbol: name,
        value: present ? (change === 'added' ? '+' : '~') : change === 'removed' ? '-' : ''
      }
    ]
  };
}

/** Décrit un renommage et un nouveau composant homonyme avec une version non publiée. */
function history(): HistoricalComponentCatalogue {
  return {
    schemaVersion: 1,
    repository: 'ui',
    versions: ['1.6.3', '1.7.0', '1.7.1', '1.8.0'].map((version) => ({
      version,
      channel: version === '1.8.0' ? 'development' : 'release',
      sourceLabel: version
    })),
    components: [
      {
        name: 'RMCTable',
        history: [
          observation('1.6.3', 'old-table', 'Table', 'added'),
          observation('1.7.0', 'old-table', 'RMCTable', 'renamed'),
          observation('1.7.1', 'old-table', 'RMCTable', 'unchanged'),
          observation('1.8.0', 'old-table', 'RMCTable', 'modified', true)
        ]
      },
      {
        name: 'Table',
        history: [
          observation('1.6.3', null, 'Table', 'absent'),
          observation('1.7.0', 'new-table', 'Table', 'added'),
          observation('1.7.1', 'new-table', 'Table', 'unchanged'),
          observation('1.8.0', 'new-table', 'Table', 'modified', true)
        ]
      },
      {
        name: 'Tag',
        history: [
          observation('1.6.3', 'tag', 'Tag', 'added'),
          observation('1.7.0', 'tag', 'Tag', 'unchanged'),
          observation('1.7.1', 'tag', 'Tag', 'unchanged'),
          observation('1.8.0', 'tag', 'Tag', 'modified', true)
        ]
      }
    ]
  };
}

/** Fabrique une collecte DSQ avec un audit ancien et un audit de Tag terminé. */
async function capture(): Promise<{ raw: RawDataset; config: Awaited<ReturnType<typeof dsqConfig>> }> {
  const config = await dsqConfig(['example/ui']);
  const issues: RawIssue[] = [
    ['Table', '1.6.3'],
    ['Tag', '1.7.1']
  ].map(([name, version], index) => ({
    id: `issue-${index}`,
    number: index + 1,
    title: 'Audit',
    state: 'CLOSED',
    issueType: 'AUDIT',
    rawIssueType: 'Audit',
    labels: [config.github.labels.componentPrefix + ' ' + name],
    criticities: [],
    parents: [],
    linkedPullRequestIds: [],
    createdAt: '2026-10-01T00:00:00Z',
    closedAt: '2026-10-03T00:00:00Z',
    milestone: { id: index + 1, number: index + 1, title: version! },
    projectStatuses: [
      {
        projectId: 'p',
        projectName: 'Quality',
        status: 'Done',
        statusHistory: [{ status: 'Done', transitionedAt: '2026-10-02T00:00:00Z' }]
      }
    ]
  }));
  const raw: RawDataset = {
    collectedAt: '2026-10-12T00:00:00Z',
    catalogueComponents: [],
    nexusAvailable: true,
    repositories: [
      {
        id: 'repo',
        owner: 'example',
        name: 'ui',
        defaultBranch: 'develop',
        issues,
        pullRequests: [],
        packageManifest: { version: '1.8.0', status: 'available' },
        gitTags: ['1.6.3', '1.7.0', '1.7.1'].map((name) => ({ name })),
        historicalCatalogues: [{ tagName: '1.7.1', status: 'missing', componentNames: [] }]
      }
    ]
  };
  return { raw, config };
}

it('attribue ancien Table à RMCTable, sans transfert vers le nouveau Table ; Tag hérite en develop', async () => {
  const { raw, config } = await capture();
  const normalized = normalizeGithub(raw, config.github, undefined, undefined, undefined, [history()]);
  applyComponentVersionVerdicts(normalized);
  const old = normalized.components.find((c) => c.name === 'RMCTable')!;
  const current = normalized.components.find((c) => c.name === 'Table')!;
  expect(normalized.audits.find((a) => a.version === '1.6.3')?.componentId).toBe(old.componentId);
  expect(old.aliases).toContain('Table');
  expect(
    normalized.componentVersions
      ?.filter((c) => c.componentId === old.componentId)
      .every((c) => c.verdict === 'CONFORME')
  ).toBe(true);
  expect(
    normalized.componentVersions
      ?.filter((c) => c.componentId === current.componentId)
      .every((c) => c.verdict === 'NON_COUVERT')
  ).toBe(true);
  const development = normalized.versions!.find((v) => v.number === '1.8.0')!;
  expect(development).toMatchObject({ channel: 'development' });
  expect(development.prodTag).toBeUndefined();
  const tag = normalized.components.find((c) => c.name === 'Tag')!;
  expect(
    evaluateDataQuality(raw, normalized, config.github).find((q) => q.ruleId === 'DQ-015')?.message
  ).toContain('3 composant(s)');
  expect(
    normalized.componentVersions!.find(
      (c) => c.componentId === tag.componentId && c.versionId === development.versionId
    )?.verdict
  ).toBe('CONFORME');
  expect(latestComponentVersion(normalized, tag.componentId)?.versionId).not.toBe(development.versionId);
});

it('ne choisit pas une identité Table sans version et ne ressuscite pas une identité supprimée', async () => {
  const { raw, config } = await capture();
  delete raw.repositories[0]!.issues[0]!.milestone;
  const normalized = normalizeGithub(raw, config.github, undefined, undefined, undefined, [history()]);
  expect(normalized.issues![0]!.componentIds).toEqual([]);
  const reference = history();
  reference.components[2]!.history = [
    observation('1.6.3', 'tag', 'Tag', 'added'),
    observation('1.7.0', 'tag', 'Tag', 'removed'),
    observation('1.7.1', null, 'Tag', 'absent'),
    observation('1.8.0', 'tag-new', 'Tag', 'added', true)
  ];
  const split = normalizeGithub(raw, config.github, undefined, undefined, undefined, [reference]);
  expect(
    split.components
      .filter((c) => c.name === 'Tag')
      .map((c) => c.status)
      .sort()
  ).toEqual(['active', 'removed']);
  applyComponentVersionVerdicts(split);
  expect(
    workspaceAnalytics(split).scopes.find(
      (s) => s.repository === 'example/ui' && s.component === 'Tag' && s.version === '1.6.3'
    )?.summary.components
  ).toBe(1);
  reference.components[2]!.history[3]!.identity = 'tag';
  expect(() => validateHistoricalComponents(reference)).toThrow('invalide');
});

it('refuse une matrice incomplète, une présence sans preuve et une identité partagée', () => {
  const incomplete = history();
  incomplete.components[0]!.history.pop();
  expect(() => validateHistoricalComponents(incomplete)).toThrow('invalide');
  const noProof = history();
  noProof.components[0]!.history[0]!.evidence = [];
  expect(() => validateHistoricalComponents(noProof)).toThrow('invalide');
  const collision = history();
  collision.components[1]!.history.filter((h) => h.present).forEach((h) => {
    h.identity = 'old-table';
  });
  expect(() => validateHistoricalComponents(collision)).toThrow('invalide');
  const unknown = history();
  unknown.components[0]!.history[0]!.evidence[0]!.value = '?';
  expect(() => validateHistoricalComponents(unknown)).toThrow('invalide');
});

it('fusionne les preuves Checkbox et garde les composants GitHub hors sélection', async () => {
  const { raw, config } = await capture();
  const reference = history();
  const checkbox = reference.components[2]!;
  checkbox.name = 'Checkbox';
  checkbox.history.forEach((h, index) => {
    h.historicalName = 'Checkbox';
    h.evidence = [
      { cell: 'G95', symbol: 'Checkbox', value: index ? '-' : '+' },
      { cell: 'G96', symbol: 'CheckBox', value: index ? '+' : '' }
    ];
  });
  raw.repositories[0]!.historicalCatalogues = [
    { tagName: '1.7.1', status: 'available', componentNames: ['Table', 'Checkbox', 'Other'] }
  ];
  const normalized = normalizeGithub(raw, config.github, undefined, undefined, undefined, [reference]);
  const checkboxes = normalized.components.filter((c) => c.name === 'Checkbox');
  expect(checkboxes).toHaveLength(1);
  expect(
    normalized.componentVersions!.filter((c) => c.componentId === checkboxes[0]!.componentId)
  ).toHaveLength(4);
  expect(normalized.components.some((c) => c.name === 'Other')).toBe(true);
  expect(
    normalized.componentVersions!.filter(
      (c) => normalized.versions!.find((v) => v.versionId === c.versionId)?.number === '1.7.1'
    )
  ).toHaveLength(4);
});

it('respecte le plafond package et refuse de transformer une preuve develop en preuve PROD', async () => {
  const { raw, config } = await capture();
  raw.repositories[0]!.packageManifest!.version = '1.7.1';
  const bounded = normalizeGithub(raw, config.github, undefined, undefined, undefined, [history()]);
  expect(bounded.versions!.some((v) => v.number === '1.8.0')).toBe(false);
  raw.repositories[0]!.packageManifest!.version = '1.8.0';
  raw.repositories[0]!.gitTags!.push({ name: '1.8.0' });
  expect(() => normalizeGithub(raw, config.github, undefined, undefined, undefined, [history()])).toThrow(
    'actualiser ses preuves'
  );
});

it('embarque, anonymise et rejoue le référentiel sans fichier externe ni modification du RAW', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsq-history-'));
  directories.push(root);
  const { raw } = await capture();
  const input = join(root, 'raw.json'),
    historical = join(root, 'history.yaml'),
    destination = join(root, 'fixture');
  await writeFile(input, JSON.stringify(raw));
  await writeFile(historical, stringify({ ...history(), source: { workbook: 'private-workbook.xlsx' } }));
  await prepareDataset(input, destination, 'test-seed', undefined, true, [historical]);
  await rm(historical);
  const loaded = await loadDataset(destination);
  expect(loaded.historicalComponents).toHaveLength(1);
  const content = await readFile(join(destination, 'dataset.json'), 'utf8');
  expect(content).not.toContain('private-workbook');
  expect(content).not.toContain('RMCTable');
  const snapshot = await runPipeline(destination, join(root, 'output'));
  expect(snapshot.normalizedData.componentVersions).toHaveLength(11);
  expect(snapshot.normalizedData.audits).toHaveLength(2);
  expect(JSON.parse(await readFile(input, 'utf8'))).toEqual(raw);
  const update = join(root, 'updated.yaml');
  await writeFile(update, stringify(loaded.historicalComponents![0]));
  const sourceBytes = await readFile(join(destination, 'dataset.json'), 'utf8');
  const enriched = join(root, 'enriched');
  await prepareDataset(join(destination, 'dataset.json'), enriched, '', undefined, false, [update]);
  const replay = await loadDataset(enriched);
  expect(replay.rawData).toEqual(loaded.rawData);
  expect(replay.config).toEqual(loaded.config);
  expect(replay.catalogue).toEqual(loaded.catalogue);
  expect(replay.historicalComponents).toEqual(loaded.historicalComponents);
  expect(await readFile(join(destination, 'dataset.json'), 'utf8')).toBe(sourceBytes);
  await expect(
    prepareDataset(join(destination, 'dataset.json'), enriched, '', undefined, false, [update])
  ).rejects.toThrow('existante');
  await expect(
    prepareDataset(join(destination, 'dataset.json'), join(root, 'invalid-options'), '', undefined, true, [
      update
    ])
  ).rejects.toThrow('Fixture existante');
  loaded.historicalComponents![0]!.repository = 'wrong';
  const wrong = join(root, 'wrong.yaml');
  await writeFile(wrong, stringify(loaded.historicalComponents![0]));
  await expect(
    prepareDataset(input, join(root, 'rejected'), 'test-seed', undefined, false, [wrong])
  ).rejects.toThrow('repository');
});
