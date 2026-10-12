import { expect, it } from 'vitest';
import { buildSystemDraft, generateSystemDraft } from '../src/system-draft.js';
import { loadConfig } from '../src/config.js';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse } from 'yaml';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execute = promisify(execFile);
/** Construit un RAW minimal pour vérifier les faits et les champs legacy absents. */
function raw() {
  return {
    collectedAt: '2026-10-12T12:00:00Z',
    repositories: [
      {
        owner: 'example',
        name: 'ui',
        issues: [
          {
            number: 2,
            labels: ['Component: Button', 'audit', 'audit'],
            rawIssueType: 'Audit',
            issueType: 'AUDIT',
            projectStatuses: [{ status: 'Done' }, { status: 'Done' }],
            milestone: { title: 'release 1.0.0' },
            title: 'PRIVATE_TITLE'
          },
          { number: 1, labels: ['audit'], issueType: 'UNKNOWN', projectStatuses: [] },
          { number: 3, labels: [] }
        ]
      }
    ]
  };
}

it('extrait le périmètre et les observations dédupliquées sans inférer les règles', () => {
  const draft = buildSystemDraft(raw());
  expect(draft.githubOwner).toBe('example');
  expect(draft.repositories).toEqual(['ui']);
  expect(draft.github.labels.componentPrefix).toBeNull();
  expect(draft.github.issueTypes.anomaly).toBeNull();
  expect(draft.github.projectStatuses.keywords).toBeNull();
  expect(draft.modelVersion).toBeNull();
  expect(draft.inventory[0]).toMatchObject({
    issueCount: 3,
    issuesWithoutRawIssueType: 2,
    issuesWithoutProjectStatuses: 1,
    rawIssueTypes: [{ value: 'Audit', issueNumbers: [2] }],
    projectStatuses: [{ value: 'Done', issueNumbers: [2] }],
    milestones: [{ value: 'release 1.0.0', issueNumbers: [2] }]
  });
  expect(draft.inventory[0]?.labels.find((item) => item.value === 'audit')?.issueNumbers).toEqual([1, 2]);
  expect(draft.inventory[0]?.canonicalIssueTypes).toEqual([
    { value: 'AUDIT', issueNumbers: [2] },
    { value: 'UNKNOWN', issueNumbers: [1] }
  ]);
  expect(JSON.stringify(draft)).not.toContain('PRIVATE_TITLE');
});

it('préserve les owners multiples sans choisir arbitrairement celui du système', () => {
  const draft = buildSystemDraft({
    ...raw(),
    repositories: [...raw().repositories, { name: 'ui', owner: 'another', issues: [] }]
  });
  expect(draft.githubOwner).toBeNull();
  expect(draft.owners).toEqual(['another', 'example']);
  expect(draft.inventory.map((entry) => entry.repository)).toEqual(['another/ui', 'example/ui']);
  expect(buildSystemDraft({ ...raw(), repositories: [] }).githubOwner).toBeNull();
});

it('refuse les formes invalides et les repositories dupliqués', () => {
  for (const input of [
    null,
    { rawData: raw() },
    { ...raw(), repositories: [null] },
    { ...raw(), repositories: [...raw().repositories, ...raw().repositories] },
    {
      ...raw(),
      repositories: [
        { owner: 'example', name: 'ui', issues: [{ number: 1, labels: [], projectStatuses: null }] }
      ]
    }
  ])
    expect(() => buildSystemDraft(input)).toThrow(/RAW invalide/);
});

it('écrit un nouveau YAML et refuse son utilisation ou l’écrasement du RAW', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'dsq-system-'));
  const input = join(directory, 'raw.json');
  const output = join(directory, 'nested', 'system.yaml');
  const original = JSON.stringify(raw());
  try {
    await writeFile(input, original);
    const draft = await generateSystemDraft(input, output);
    expect(parse(await readFile(output, 'utf8'))).toEqual(draft);
    await expect(
      loadConfig('github', undefined, { systemConfig: output, catalogueConfig: 'unused.yaml' })
    ).rejects.toThrow(/brouillon/);
    await expect(generateSystemDraft(input, output)).rejects.toMatchObject({ code: 'EEXIST' });
    await expect(generateSystemDraft(input, input)).rejects.toMatchObject({ code: 'EEXIST' });
    expect(await readFile(input, 'utf8')).toBe(original);
    await writeFile(input, '{ "private": "SECRET"');
    await expect(generateSystemDraft(input, output)).rejects.toThrow('Fichier RAW : JSON invalide.');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

it('la CLI exige une sortie et annonce les compteurs sans les valeurs nominatives', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'dsq-system-cli-'));
  const input = join(directory, 'raw.json');
  const output = join(directory, 'system.yaml');
  try {
    await expect(
      execute(process.execPath, ['--import', 'tsx', 'src/cli.ts', 'system:generate', '--input', input])
    ).rejects.toMatchObject({ stderr: expect.stringContaining("required option '--output <path>'") });
    await writeFile(input, JSON.stringify(raw()));
    const result = await execute(process.execPath, [
      '--import',
      'tsx',
      'src/cli.ts',
      'system:generate',
      '--input',
      input,
      '--output',
      output
    ]);
    expect(result.stdout).toContain('1 repositories observés');
    expect(result.stdout).toContain(`Configuration : ${output}`);
    expect(result.stdout).not.toContain('Component: Button');
    expect(result.stdout).not.toContain('PRIVATE_TITLE');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}, 20000);
