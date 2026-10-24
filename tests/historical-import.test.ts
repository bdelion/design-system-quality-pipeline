import { expect, it } from 'vitest';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { stringify } from 'yaml';
import { dsqConfig } from '../src/datasets.js';
import { runPipeline } from '../src/pipeline.js';
import { loadHistoricalImport } from '../src/historical-import.js';
import type { HistoricalComponentCatalogue } from '../src/historical-components.js';
import type { RawDataset } from '../src/domain/types.js';

/** Construit les preuves de renommage indépendamment des noms de dépôts réels. */
function history(): HistoricalComponentCatalogue {
  const versions = ['1.6.3', '1.7.0'];
  return {
    schemaVersion: 1,
    repository: 'demo-react',
    versions: versions.map((version) => ({ version, channel: 'release', sourceLabel: version })),
    components: [
      {
        name: 'RMCTable',
        history: versions.map((version, index) => ({
          version,
          channel: 'release',
          present: true,
          change: index ? 'renamed' : 'added',
          identity: 'old',
          historicalName: index ? 'RMCTable' : 'Table',
          evidence: [{ cell: 'G2', symbol: 'Table', value: '+' }]
        }))
      },
      {
        name: 'Table',
        history: versions.map((version, index) => ({
          version,
          channel: 'release',
          present: !!index,
          change: index ? 'added' : 'absent',
          identity: index ? 'new' : null,
          historicalName: 'Table',
          evidence: [{ cell: 'G3', symbol: 'Table', value: index ? '+' : '' }]
        }))
      }
    ]
  };
}

/** Produit une capture contextualisée et un fichier d'identités dont la référence est relative. */
async function setup(directory: string) {
  const config = await dsqConfig(['example/real-ui']);
  const raw: RawDataset = {
    collectedAt: '2026-10-13T00:00:00Z',
    catalogueComponents: [],
    nexusAvailable: true,
    repositories: [
      {
        id: 'repo',
        owner: 'example',
        name: 'real-ui',
        defaultBranch: 'develop',
        issues: [
          {
            id: 'example/real-ui:issue:1',
            number: 1,
            title: 'Titre réel non anonymisé',
            state: 'CLOSED',
            issueType: 'AUDIT',
            rawIssueType: 'Audit',
            labels: [config.github.labels.componentPrefix + ' Table'],
            criticities: [],
            parents: [],
            linkedPullRequestIds: [],
            createdAt: '2026-10-01T00:00:00Z',
            closedAt: '2026-10-03T00:00:00Z',
            milestone: { id: 1, number: 1, title: '1.6.3' },
            projectStatuses: [
              {
                projectId: 'p',
                projectName: 'Projet réel',
                status: 'Done',
                statusHistory: [{ status: 'Done', transitionedAt: '2026-10-02T00:00:00Z' }]
              }
            ]
          }
        ],
        pullRequests: [],
        gitTags: [{ name: '1.6.3' }, { name: '1.7.0' }],
        packageManifest: { version: '1.7.0', status: 'available' as const }
      }
    ]
  };
  await mkdir(join(directory, 'config'), { recursive: true });
  await mkdir(join(directory, 'input'));
  const reference = join(directory, 'config/components.yaml'),
    descriptor = join(directory, 'config/identities.yaml'),
    input = join(directory, 'input/raw.json');
  const rules = {
    draft: true,
    repository: 'demo-react',
    historicalCatalogue: './components.yaml',
    identities: [
      {
        id: 'rmc',
        currentName: 'RMCTable',
        names: [
          { name: 'Table', throughVersion: '1.6.3' },
          { name: 'RMCTable', fromVersion: '1.7.0' }
        ]
      },
      { id: 'new', currentName: 'Table', names: [{ name: 'Table', fromVersion: '1.7.0' }] }
    ],
    auditAttribution: { rule: 'target-version-and-historical-name', unknownVersion: 'unresolved' }
  };
  await writeFile(reference, stringify(history()));
  await writeFile(descriptor, stringify(rules));
  await writeFile(
    input,
    JSON.stringify({
      ...raw,
      collectionContext: { profileId: 'dsq', config, anonymizationSeed: 'private-seed-not-for-snapshot' }
    })
  );
  return { raw, input, reference, descriptor, rules };
}

it('rejoue le RAW réel via le fichier d’identités et conserve noms, dates et audit historique', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsq-local-history-'));
  try {
    const { input, descriptor } = await setup(root);
    const original = await readFile(input, 'utf8');
    const snapshot = await runPipeline(input, join(root, 'output'), [descriptor], 'example/real-ui');
    expect(snapshot.rawData.repositories[0]?.issues[0]?.title).toBe('Titre réel non anonymisé');
    expect(snapshot.rawData.repositories[0]?.issues[0]?.createdAt).toBe('2026-10-01T00:00:00Z');
    const rmc = snapshot.normalizedData.components.find((c) => c.name === 'RMCTable')!;
    expect(snapshot.normalizedData.audits[0]?.componentId).toBe(rmc.componentId);
    expect(
      snapshot.normalizedData.componentVersions
        ?.filter((c) => c.componentId === rmc.componentId)
        .every((c) => c.verdict === 'CONFORME')
    ).toBe(true);
    expect(JSON.stringify(snapshot)).not.toContain('private-seed-not-for-snapshot');
    expect(await readFile(input, 'utf8')).toBe(original);
    const command = await promisify(execFile)(process.execPath, [
      '--import',
      'tsx',
      'src/cli.ts',
      'pipeline',
      '--dataset',
      input,
      '--output',
      join(root, 'cli-output'),
      '--historical-catalogue',
      descriptor,
      '--historical-repository',
      'example/real-ui'
    ]);
    expect(command.stdout).toContain('Pipeline terminé');
    expect(command.stdout).not.toContain('private-seed-not-for-snapshot');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

it('vérifie réellement les deux lignes source de Checkbox et la présence fusionnée', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsq-local-history-'));
  try {
    const { raw, reference, descriptor, rules } = await setup(root);
    const content = history();
    content.components.push({
      name: 'Checkbox',
      history: content.versions.map((version, index) => ({
        version: version.version,
        channel: 'release',
        present: true,
        change: index ? 'modified' : 'added',
        identity: 'checkbox',
        historicalName: 'Checkbox',
        evidence: [
          { cell: 'G95', symbol: 'Checkbox', value: index ? '-' : '+' },
          { cell: 'G96', symbol: 'CheckBox', value: index ? '+' : '' }
        ]
      }))
    });
    await writeFile(reference, stringify(content));
    const merge = {
      component: 'Checkbox',
      sourceSymbols: ['Checkbox', 'CheckBox'],
      presence: 'any-source-present'
    };
    await writeFile(descriptor, stringify({ ...rules, technicalRowMerges: [merge] }));
    expect((await loadHistoricalImport(descriptor, raw, 'real-ui')).components).toHaveLength(3);
    merge.sourceSymbols = ['Checkbox'];
    await writeFile(descriptor, stringify({ ...rules, technicalRowMerges: [merge] }));
    await expect(loadHistoricalImport(descriptor, raw, 'real-ui')).rejects.toThrow('fusion');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

it('refuse alias implicite, règles contradictoires, absence de preuves et affectation ambiguë', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsq-local-history-'));
  try {
    const { raw, input, reference, descriptor, rules } = await setup(root);
    await expect(loadHistoricalImport(descriptor, raw)).rejects.toThrow('repository');
    await expect(
      runPipeline(input, join(root, 'output'), [descriptor, reference], 'example/real-ui')
    ).rejects.toThrow('exactement un');
    rules.identities[0]!.names[0]!.name = 'Wrong';
    await writeFile(descriptor, stringify(rules));
    await expect(loadHistoricalImport(descriptor, raw, 'example/real-ui')).rejects.toThrow('contredisent');
    await writeFile(descriptor, stringify({ draft: true, identities: rules.identities }));
    await expect(loadHistoricalImport(descriptor, raw, 'example/real-ui')).rejects.toThrow(
      'historicalCatalogue'
    );
    const direct = await loadHistoricalImport(reference, raw, 'real-ui');
    expect(direct.repository).toBe('real-ui');
    await expect(runPipeline(input, join(root, 'duplicate'), [reference, reference])).rejects.toThrow();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
