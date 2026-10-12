import { expect, it } from 'vitest';
import { buildCatalogueDraft, generateCatalogueDraft } from '../src/catalogue-draft.js';
import { validateCatalogue } from '../src/catalogue.js';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse } from 'yaml';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execute = promisify(execFile);
/** Construit uniquement les champs RAW utiles à la découverte de composants. */
function raw() {
  return {
    collectedAt: '2026-10-12T12:00:00Z',
    catalogueComponents: ['Declared', 'Button'],
    repositories: [
      {
        owner: 'example',
        name: 'ui',
        issues: [
          {
            number: 1,
            component: 'Button',
            labels: [
              'component: Button',
              'Component: LabelOnly',
              'Component: LabelOnly',
              'text Component: Ignored',
              'Component: '
            ],
            title: 'PRIVATE_TITLE'
          }
        ],
        historicalCatalogues: [
          { tagName: '1.0.0', status: 'available', componentNames: ['Removed'] },
          { tagName: '2.0.0', status: 'invalid', componentNames: ['Invalid'] }
        ]
      },
      { owner: 'example', name: 'web', issues: [{ number: 2, labels: ['Component: Button'] }] }
    ]
  };
}

it('déduplique les noms et conserve les preuves, l’historique et les associations ambiguës', () => {
  const draft = buildCatalogueDraft(raw());
  expect(draft.components.map((c) => c.name)).toEqual(['Button', 'Declared', 'LabelOnly', 'Removed']);
  const button = draft.components[0]!;
  expect(button.repository).toBeNull();
  expect(button.repositories).toEqual(['example/ui', 'example/web']);
  expect(button.evidence).toHaveLength(4);
  expect(draft.components.find((c) => c.name === 'Declared')?.repository).toBeNull();
  expect(draft.components.find((c) => c.name === 'LabelOnly')?.evidence).toHaveLength(1);
  expect(draft.components.find((c) => c.name === 'Removed')?.evidence).toEqual([
    { source: 'historicalCatalogue', repository: 'example/ui', tagName: '1.0.0' }
  ]);
  expect(JSON.stringify(draft)).not.toContain('PRIVATE_TITLE');
});

it('laisse les métadonnées inconnues à null et impose une complétion avant usage dans le pipeline', () => {
  const draft = buildCatalogueDraft(raw());
  expect(draft.components.find((c) => c.name === 'LabelOnly')).toMatchObject({
    repository: 'ui',
    stream: null,
    owner: null,
    squad: null,
    status: null,
    rgaaLevel: null,
    tags: null
  });
  expect(() => validateCatalogue(draft)).toThrow(/brouillon/);
  expect(() => validateCatalogue({ version: draft.version, components: draft.components })).toThrow(
    /Invalid catalogue component/
  );
  expect(() => validateCatalogue({ ...draft, components: [] })).toThrow(/brouillon/);
  const completed = {
    version: draft.version,
    components: draft.components.map((c) => ({
      ...c,
      stream: 'React',
      owner: 'Team',
      squad: 'DS',
      status: 'stable',
      rgaaLevel: 'AA',
      tags: []
    }))
  };
  expect(validateCatalogue(completed).components).toHaveLength(4);
});

it('accepte les historiques absents et un préfixe personnalisé sans analyser les autres labels', () => {
  const draft = buildCatalogueDraft(
    {
      collectedAt: raw().collectedAt,
      catalogueComponents: [],
      repositories: [
        {
          name: 'ui',
          owner: 'example',
          issues: [{ number: 1, labels: ['widget: Card', 'Component: Ignored'] }]
        }
      ]
    },
    'Widget:'
  );
  expect(draft.components.map((c) => c.name)).toEqual(['Card']);
  expect(buildCatalogueDraft({ ...raw(), catalogueComponents: [], repositories: [] }).components).toEqual([]);
});

it('refuse une forme RAW invalide, un snapshot et un préfixe vide sans inventer de composants', () => {
  for (const value of [
    null,
    { rawData: raw() },
    { ...raw(), collectedAt: 'invalid' },
    { ...raw(), catalogueComponents: [null] },
    { ...raw(), repositories: [{ name: 'ui', owner: 'example', issues: [{ number: 1, labels: null }] }] }
  ])
    expect(() => buildCatalogueDraft(value)).toThrow(/RAW invalide/);
  expect(() => buildCatalogueDraft(raw(), '')).toThrow(/préfixe/);
});

it('génère hors réseau un nouveau YAML sans écraser le RAW ou une sortie existante', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'dsq-catalogue-'));
  const input = join(directory, 'raw.json');
  const output = join(directory, 'nested', 'catalogue.yaml');
  const original = JSON.stringify(raw());
  try {
    await writeFile(input, original);
    const draft = await generateCatalogueDraft(input, output);
    expect(parse(await readFile(output, 'utf8'))).toEqual(draft);
    await expect(generateCatalogueDraft(input, output)).rejects.toMatchObject({ code: 'EEXIST' });
    await expect(generateCatalogueDraft(input, input)).rejects.toMatchObject({ code: 'EEXIST' });
    expect(await readFile(input, 'utf8')).toBe(original);
    await writeFile(input, '{ "private": "PRIVATE_SECRET"');
    await expect(generateCatalogueDraft(input, output)).rejects.toThrow('Fichier RAW : JSON invalide.');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

it('la CLI exige les chemins et annonce un brouillon sans exposer les noms ni charger de catalogue source', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'dsq-catalogue-cli-'));
  const input = join(directory, 'raw.json');
  const output = join(directory, 'draft.yaml');
  try {
    await expect(
      execute(process.execPath, ['--import', 'tsx', 'src/cli.ts', 'catalogue:generate', '--input', input])
    ).rejects.toMatchObject({ stderr: expect.stringContaining("required option '--output <path>'") });
    await writeFile(input, JSON.stringify(raw()));
    const result = await execute(process.execPath, [
      '--import',
      'tsx',
      'src/cli.ts',
      'catalogue:generate',
      '--input',
      input,
      '--output',
      output
    ]);
    expect(result.stdout).toContain('4 composants détectés');
    expect(result.stdout).toContain(`Catalogue : ${output}`);
    expect(result.stdout).not.toContain('Button');
    expect(result.stdout).not.toContain('PRIVATE_TITLE');
    expect(parse(await readFile(output, 'utf8')).draft).toBe(true);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}, 20000);
