import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, writeFile, rm, readdir, rename } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse } from 'yaml';
import { prepareReferences } from '../src/anonymization/prepare.js';
import { loadConfig } from '../src/config.js';
import { loadCatalogue } from '../src/catalogue.js';
import { rootPath } from '../src/lib/paths.js';
import { normalizeGithub } from '../src/normalizers/github.js';
import type { RawDataset } from '../src/domain/types.js';

vi.mock('node:fs/promises', async (original) => {
  const actual = await original<typeof import('node:fs/promises')>();
  return { ...actual, rename: vi.fn(actual.rename) };
});
const directories: string[] = [];
/** Crée une racine temporaire indépendante des données et profils versionnés. */
async function directory(): Promise<string> {
  const path = await mkdtemp(join(tmpdir(), 'dsq-reference-'));
  directories.push(path);
  const sample = JSON.parse(await readFile(join(rootPath, 'fixtures/github.json'), 'utf8')) as RawDataset;
  sample.catalogueComponents = ['Button'];
  sample.repositories = [sample.repositories[0]!];
  sample.repositories[0]!.issues = [sample.repositories[0]!.issues[0]!];
  sample.repositories[0]!.issues[0]!.parents = [];
  sample.repositories[0]!.issues[0]!.labels = ['🧩 Component: Button'];
  sample.repositories[0]!.issues[0]!.rawIssueType = 'BUG';
  sample.repositories[0]!.pullRequests = sample.repositories[0]!.pullRequests.filter(
    (pr) => pr.id === 'pr-201'
  );
  sample.repositories[0]!.pullRequests[0]!.relatedIssueIds = ['issue-101'];
  await writeFile(join(path, 'source.json'), JSON.stringify(sample));
  return path;
}
afterEach(async () => {
  vi.mocked(rename).mockReset();
  const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises');
  vi.mocked(rename).mockImplementation(actual.rename);
  for (const path of directories.splice(0)) await rm(path, { recursive: true, force: true });
});
/** Utilise exclusivement les règles synthétiques de démonstration pour préparer une référence. */
function options(outputRoot: string) {
  return {
    input: join(outputRoot, 'source.json'),
    name: 'demo',
    seed: 'private-test-seed',
    outputRoot,
    anonymizeComponents: true,
    selection: {
      systemConfig: join(rootPath, 'config/system.fixture.yaml'),
      catalogueConfig: join(rootPath, 'config/catalogue.fixture.yaml')
    }
  };
}

describe('préparation des références', () => {
  it('produit des profils GitHub réels et une référence anonyme cohérente, utilisables explicitement', async () => {
    const root = await directory();
    const files = await prepareReferences(options(root));
    expect(files).toHaveLength(8);
    const selection = {
      systemConfig: join(root, 'config/system.demo-reference.yaml'),
      catalogueConfig: join(root, 'config/catalogue.demo-reference.yaml')
    };
    const system = await loadConfig('fixture', undefined, selection);
    const catalogue = await loadCatalogue('fixture', undefined, selection);
    const raw = JSON.parse(await readFile(join(root, 'fixtures/demo-reference.json'), 'utf8')) as RawDataset;
    expect(raw.repositories.map((repo) => repo.name)).toEqual(system.repositories);
    expect(catalogue.components.every((component) => component.name.startsWith('component-'))).toBe(true);
    const normalized = normalizeGithub(raw, system.github, catalogue, system.auditVersion);
    expect(
      normalized.components.every((component) =>
        catalogue.components.some((entry) => entry.name === component.name)
      )
    ).toBe(true);
    const real = parse(await readFile(join(root, 'config/local/system.demo-github-reference.yaml'), 'utf8'));
    expect(real.repositories).toContain('design-system-core');
    const shared = await readFile(selection.catalogueConfig, 'utf8');
    expect(shared).not.toContain('figma.example.com');
    expect(shared).not.toContain('eventail');
    expect(await readFile(join(root, 'fixtures/demo-reference.json.manifest.json'), 'utf8')).not.toContain(
      'private-test-seed'
    );
    expect(await readdir(join(root, 'data/raw'))).toEqual(['demo.trace.json']);
  });
  it('refuse les écrasements puis régénère exactement les mêmes contenus avec force', async () => {
    const root = await directory();
    const files = await prepareReferences(options(root));
    const before = await Promise.all(files.map((path) => readFile(join(root, path), 'utf8')));
    await expect(prepareReferences(options(root))).rejects.toThrow('Fichier existant');
    await prepareReferences({ ...options(root), force: true });
    expect(await Promise.all(files.map((path) => readFile(join(root, path), 'utf8')))).toEqual(before);
  });
  it('refuse v1 même avec force et ne modifie jamais la référence synthétique', async () => {
    const path = join(rootPath, 'fixtures/v1-reference.json');
    const before = await readFile(path, 'utf8');
    await expect(
      prepareReferences({ ...options(await directory()), name: 'v1', force: true })
    ).rejects.toThrow('réservé');
    expect(await readFile(path, 'utf8')).toBe(before);
  });
  it('refuse les noms traversants, les graines absentes, offsets invalides et profils partiels', async () => {
    const opt = options(await directory());
    await expect(prepareReferences({ ...opt, name: '../escape' })).rejects.toThrow('Nom invalide');
    await expect(prepareReferences({ ...opt, seed: '' })).rejects.toThrow('graine');
    await expect(prepareReferences({ ...opt, dateOffsetDays: NaN })).rejects.toThrow('entier');
    await expect(
      prepareReferences({ ...opt, selection: { systemConfig: opt.selection.systemConfig } })
    ).rejects.toThrow('ensemble');
  });
  it('refuse une relation manquante avant de publier des sorties', async () => {
    const root = await directory();
    const raw = JSON.parse(await readFile(options(root).input, 'utf8')) as RawDataset;
    raw.repositories[0]!.issues[0]!.linkedPullRequestIds = ['missing-pr'];
    const input = join(root, 'input.json');
    await writeFile(input, JSON.stringify(raw));
    await expect(prepareReferences({ ...options(root), input })).rejects.toThrow('relations manquantes');
    expect(await readdir(root)).toEqual(['input.json', 'source.json']);
  });
  it('restaure les fichiers remplacés lorsqu’une publication échoue', async () => {
    const root = await directory();
    const files = await prepareReferences(options(root));
    const before = await Promise.all(files.map((path) => readFile(join(root, path), 'utf8')));
    const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises');
    vi.mocked(rename)
      .mockImplementationOnce(actual.rename)
      .mockImplementationOnce(actual.rename)
      .mockImplementationOnce(actual.rename)
      .mockImplementationOnce(async () => {
        throw new Error('publication interrompue');
      });
    await expect(prepareReferences({ ...options(root), seed: 'changed-seed', force: true })).rejects.toThrow(
      'publication interrompue'
    );
    expect(await Promise.all(files.map((path) => readFile(join(root, path), 'utf8')))).toEqual(before);
    expect(await readdir(join(root, 'data/raw'))).toEqual(['demo.trace.json']);
  });
});
