import { afterEach, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, rename, rm, writeFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import * as fs from 'node:fs/promises';
vi.mock('node:fs/promises', async (importOriginal) => {
  const original = await importOriginal<typeof import('node:fs/promises')>();
  return { ...original, rename: vi.fn(original.rename) };
});
import {
  collectRepositories,
  dsqConfig,
  loadDataset,
  prepareDataset,
  validateDataset
} from '../src/datasets.js';
import { runPipeline } from '../src/pipeline.js';
import type { RawDataset } from '../src/domain/types.js';

const execute = promisify(execFile);
const directories: string[] = [];
/** Réserve un espace de test indépendant des collectes et dashboards locaux. */
async function directory() {
  const path = await mkdtemp(join(tmpdir(), 'dsq-dataset-'));
  directories.push(path);
  return path;
}
afterEach(async () => {
  vi.mocked(fs.rename).mockReset();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  await Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});
/** Fabrique des faits complets sans métadonnées de catalogue ni référence externe. */
async function raw(): Promise<RawDataset> {
  const config = await dsqConfig(['example/ui']);
  return {
    collectedAt: '2026-10-12T12:00:00Z',
    catalogueComponents: [],
    nexusAvailable: false,
    repositories: [
      {
        id: 'repository-1',
        owner: 'example',
        name: 'ui',
        defaultBranch: 'main',
        issues: [
          {
            id: 'issue-1',
            number: 1,
            title: 'Texte privé à anonymiser',
            state: 'OPEN',
            issueType: 'UNKNOWN',
            labels: [config.github.labels.componentPrefix + ' Button'],
            criticities: [],
            parents: [],
            linkedPullRequestIds: [],
            createdAt: '2026-10-01T12:00:00Z',
            projectStatuses: []
          }
        ],
        pullRequests: []
      }
    ]
  };
}

it('collecte depuis la liste seule et conserve le profil appliqué sans écrire de secret', async () => {
  vi.stubEnv('GITHUB_TOKEN', 'private-token');
  vi.stubEnv('ANONYMIZATION_SEED', '');
  vi.stubEnv('GITHUB_API_URL', 'https://api.test');
  vi.stubEnv('GITHUB_GRAPHQL_URL', 'https://api.test/graphql');
  vi.stubEnv('GITHUB_URL', 'https://github.test');
  const root = await directory();
  const path = join(root, 'nested', 'raw.json');
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url) => {
      if (String(url).endsWith('/rate_limit'))
        return Response.json({
          resources: {
            core: { remaining: 5000, reset: 2000000000 },
            graphql: { remaining: 5000, reset: 2000000000 }
          }
        });
      if (String(url).endsWith('/repos/example/ui'))
        return Response.json({
          id: 1,
          name: 'ui',
          full_name: 'example/ui',
          owner: { login: 'example' },
          default_branch: 'main'
        });
      if (String(url).includes('/contents/')) return new Response('', { status: 404 });
      return Response.json([]);
    })
  );
  await collectRepositories(['example/ui'], path);
  const content = await readFile(path, 'utf8');
  expect(content).not.toContain('private-token');
  expect(JSON.parse(content).collectionContext.config.githubOwner).toBe('example');
  const context = JSON.parse(content).collectionContext;
  expect(typeof context.anonymizationSeed).toBe('string');
  const prepared = await prepareDataset(path, join(root, 'prepared-with-local-seed'));
  expect(JSON.stringify(prepared).includes(context.anonymizationSeed)).toBe(false);
  const snapshot = await runPipeline(
    join(root, 'prepared-with-local-seed'),
    join(root, 'empty-capture-output')
  );
  expect(snapshot.analytics.metrics['portfolio.components']?.value).toBe('unknown');
  expect(snapshot.analytics.metrics['issue.total']?.value).toBe(0);
  const localSnapshot = await runPipeline(path, join(root, 'local-output'));
  expect(localSnapshot.rawData.repositories[0]?.owner).toBe('example');
  expect(JSON.stringify(localSnapshot).includes(context.anonymizationSeed)).toBe(false);
  await expect(collectRepositories(['example/ui'], path)).rejects.toThrow('existant');
  expect(await readFile(path, 'utf8')).toBe(content);
});

it('prépare sans catalogue et rejoue après déplacement sans modifier les faits du dataset', async () => {
  const root = await directory();
  const input = join(root, 'raw.json');
  const original = JSON.stringify(await raw());
  await writeFile(input, original);
  const dataset = await prepareDataset(input, join(root, 'dataset'), 'test-seed');
  expect(dataset.catalogue).toBeNull();
  await rename(join(root, 'dataset'), join(root, 'renamed'));
  expect(await loadDataset(join(root, 'renamed'))).toEqual(dataset);
  const snapshot = await runPipeline(join(root, 'renamed'), join(root, 'output'));
  expect(snapshot.rawData).toEqual(dataset.rawData);
  expect(snapshot.normalizedData.components[0]?.status).toBe('unknown');
  expect(snapshot.normalizedData.components[0]?.owner).toBeUndefined();
  expect(snapshot.analytics.metrics['portfolio.components']?.value).toBe('unknown');
  expect(snapshot.analytics.metrics['portfolio.components']?.reliability.status).toBe('unknown');
  expect(await readFile(input, 'utf8')).toBe(original);
  expect(await readdir(join(root, 'output'))).toEqual(
    expect.arrayContaining(['current', 'runs', 'dashboard'])
  );
  expect(JSON.stringify(dataset)).not.toContain('Texte privé');
});

it('refuse les données incohérentes avant publication et les destinations existantes', async () => {
  const root = await directory();
  const input = join(root, 'raw.json');
  const value = await raw();
  value.repositories[0]!.issues[0]!.linkedPullRequestIds = ['missing'];
  await writeFile(input, JSON.stringify(value));
  await expect(prepareDataset(input, join(root, 'dataset'), 'test-seed')).rejects.toThrow('relations');
  expect(await readdir(root)).toEqual(['raw.json']);
  await writeFile(input, JSON.stringify(await raw()));
  await prepareDataset(input, join(root, 'dataset'), 'test-seed');
  await expect(prepareDataset(input, join(root, 'dataset'), 'test-seed')).rejects.toThrow(
    'Destination existante'
  );
  await expect(prepareDataset(input, join(root, 'other'), '')).rejects.toThrow('ANONYMIZATION_SEED');
});

it('vérifie le manifeste et refuse un profil ou périmètre corrompu sans repli implicite', async () => {
  const root = await directory();
  const input = join(root, 'raw.json');
  await writeFile(input, JSON.stringify(await raw()));
  const dataset = await prepareDataset(input, join(root, 'dataset'), 'test-seed');
  const wrong = structuredClone(dataset);
  wrong.config.repositories = ['unrelated'];
  expect(() => validateDataset(wrong)).toThrow('périmètre');
  const duplicate = structuredClone(dataset);
  duplicate.config.repositories = [duplicate.config.repositories[0]!, duplicate.config.repositories[0]!];
  expect(() => validateDataset(duplicate)).toThrow('repositories');
  await writeFile(join(root, 'dataset', 'dataset.json'), JSON.stringify(wrong));
  await expect(loadDataset(join(root, 'dataset'))).rejects.toThrow('empreinte');
  await expect(loadDataset(join(root, 'missing'))).rejects.toMatchObject({ code: 'ENOENT' });
  await expect(dsqConfig(['one/ui', 'two/ui'])).rejects.toThrow('owner unique');
});

it('enrichit depuis un catalogue approuvé sans modifier les faits ni inventer de métadonnées', async () => {
  const root = await directory();
  const input = join(root, 'raw.json');
  const catalogue = join(root, 'catalogue.yaml');
  await writeFile(input, JSON.stringify(await raw()));
  await writeFile(
    catalogue,
    JSON.stringify({
      version: '1.0',
      components: [
        {
          name: 'Button',
          repository: 'ui',
          stream: 'React',
          owner: 'Team',
          squad: 'DS',
          status: 'stable',
          rgaaLevel: 'AA',
          tags: []
        }
      ]
    })
  );
  const dataset = await prepareDataset(input, join(root, 'enriched'), 'test-seed', catalogue);
  expect(dataset.catalogue?.components[0]?.owner).not.toBe('Team');
  const snapshot = await runPipeline(join(root, 'enriched'), join(root, 'output'));
  expect(snapshot.normalizedData.components[0]?.status).toBe('active');
  expect(snapshot.analytics.metrics['portfolio.components']?.value).toBe(1);
  expect(snapshot.rawData.catalogueComponents).toEqual([]);
  const partial = await raw();
  partial.repositories[0]!.issues.push({
    ...partial.repositories[0]!.issues[0]!,
    id: 'issue-2',
    number: 2,
    labels: [dataset.config.github.labels.componentPrefix + ' Other']
  });
  await writeFile(input, JSON.stringify(partial));
  await prepareDataset(input, join(root, 'partial'), 'test-seed', catalogue);
  const partialSnapshot = await runPipeline(join(root, 'partial'), join(root, 'partial-output'));
  expect(partialSnapshot.normalizedData.components.map((component) => component.status).sort()).toEqual([
    'active',
    'unknown'
  ]);
  expect(partialSnapshot.analytics.metrics['portfolio.components']?.value).toBe('unknown');
});

it('conserve les labels métier par défaut et synchronise les alias de composants sur option', async () => {
  const root = await directory();
  const input = join(root, 'raw.json');
  const source = await raw();
  await writeFile(input, JSON.stringify(source));
  const plain = await prepareDataset(input, join(root, 'plain'), 'test-seed');
  expect(plain.rawData.repositories[0]?.issues[0]?.labels).toEqual(source.repositories[0]?.issues[0]?.labels);
  const anonymous = await prepareDataset(input, join(root, 'anonymous'), 'test-seed', undefined, true);
  expect(anonymous.rawData.repositories[0]?.issues[0]?.labels).not.toEqual(
    source.repositories[0]?.issues[0]?.labels
  );
  const snapshot = await runPipeline(join(root, 'anonymous'), join(root, 'anonymous-output'));
  expect(snapshot.normalizedData.components[0]?.name).toMatch(/^component-/);
  expect(await loadDataset(join(root, 'anonymous', 'dataset.json'))).toEqual(anonymous);
});

it('conserve les conventions capturées et transforme les règles par repository avec leurs alias', async () => {
  const root = await directory();
  const input = join(root, 'raw.json');
  const source = await raw();
  const config = await dsqConfig(['example/ui']);
  config.ruleVersion = 'captured-version';
  config.github.labels.componentPrefix = 'Widget:';
  config.github.accessibilityRecognition = { repositories: { ui: ['audit', 'rgaa'] } };
  source.repositories[0]!.issues[0]!.labels = ['Widget: Button'];
  await writeFile(input, JSON.stringify({ ...source, collectionContext: { profileId: 'dsq', config } }));
  const dataset = await prepareDataset(input, join(root, 'dataset'), 'test-seed');
  expect(dataset.config.ruleVersion).toBe('captured-version');
  expect(dataset.config.github.labels.componentPrefix).toBe('Widget:');
  const alias = dataset.rawData.repositories[0]!.name;
  expect(dataset.config.github.accessibilityRecognition?.repositories?.[alias]).toEqual(['audit', 'rgaa']);
  expect(config.github.accessibilityRecognition.repositories).toEqual({ ui: ['audit', 'rgaa'] });
});

it('annule une publication défaillante sans laisser de dossier partiel ni modifier le RAW', async () => {
  const root = await directory();
  const input = join(root, 'raw.json');
  const original = JSON.stringify(await raw());
  await writeFile(input, original);
  vi.mocked(fs.rename).mockRejectedValueOnce(new Error('Publication impossible'));
  await expect(prepareDataset(input, join(root, 'dataset'), 'test-seed')).rejects.toThrow(
    'Publication impossible'
  );
  expect(await readdir(root)).toEqual(['raw.json']);
  expect(await readFile(input, 'utf8')).toBe(original);
});

it('rejette une forme RAW invalide et une destination de pipeline dans le dataset', async () => {
  const root = await directory();
  const input = join(root, 'raw.json');
  const source = await raw();
  await writeFile(
    input,
    JSON.stringify({
      ...source,
      repositories: [
        {
          ...source.repositories[0],
          issues: [{ ...source.repositories[0]!.issues[0], projectStatuses: [null] }]
        }
      ]
    })
  );
  await expect(prepareDataset(input, join(root, 'invalid'), 'test-seed')).rejects.toThrow('Project');
  await writeFile(input, JSON.stringify(source));
  await prepareDataset(input, join(root, 'dataset'), 'test-seed');
  await expect(runPipeline(join(root, 'dataset'), join(root, 'dataset', 'outputs'))).rejects.toThrow(
    'distinct'
  );
});

it('effectue le parcours CLI complet hors réseau et sans autre fichier de configuration local', async () => {
  const root = await directory();
  const input = join(root, 'raw.json');
  const dataset = join(root, 'dataset');
  await writeFile(input, JSON.stringify(await raw()));
  await execute(process.execPath, [
    '--import',
    'tsx',
    'src/cli.ts',
    'fixture:prepare',
    '--input',
    input,
    '--output',
    dataset,
    '--seed',
    'test-seed'
  ]);
  const validation = await execute(process.execPath, [
    '--import',
    'tsx',
    'src/cli.ts',
    'fixture:validate',
    '--dataset',
    dataset
  ]);
  expect(validation.stdout).toContain('Dataset valide');
  const result = await execute(process.execPath, [
    '--import',
    'tsx',
    'src/cli.ts',
    'pipeline',
    '--dataset',
    dataset,
    '--output',
    join(root, 'output')
  ]);
  expect(result.stdout).toContain('Pipeline terminé');
  expect(result.stdout).toContain(join(root, 'output'));
}, 30000);
