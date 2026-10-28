import { expect, it } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prepareDataset } from '../src/datasets.js';
import { runPipeline } from '../src/pipeline.js';
import { descriptionIssueReferences } from '../src/domain/description-references.js';
import { epicActivity } from '../src/analytics/epic-activity.js';
import { dsqConfig, validateRaw } from '../src/datasets.js';
import { normalizeGithub } from '../src/normalizers/github.js';
import { anonymizeDataset } from '../src/anonymization/anonymizer.js';
import type { RawDataset, RawIssue, RawProjectStatusTransition } from '../src/domain/types.js';

/** Construit une collecte avec références explicites, un faux parent et une version future. */
async function sample(): Promise<{
  raw: RawDataset;
  prefix: string;
  rules: Awaited<ReturnType<typeof dsqConfig>>['github'];
}> {
  const config = await dsqConfig(['example/ui']);
  const issue: RawIssue = {
    id: 'example/ui:issue:1',
    number: 1,
    title: 'Epic',
    state: 'OPEN',
    rawIssueType: 'Epic',
    issueType: 'EPIC',
    labels: [],
    criticities: [],
    parents: [],
    descriptionIssueIds: [],
    linkedPullRequestIds: [],
    createdAt: '2026-01-01T00:00:00Z',
    projectStatuses: []
  };
  const history: RawProjectStatusTransition[] = [
    { status: 'Done', transitionedAt: '2026-01-04T00:00:00Z' },
    { status: 'In progress', transitionedAt: '2026-01-03T00:00:00Z' },
    { status: 'In progress', transitionedAt: '2026-01-02T01:00:00+01:00' },
    { status: 'Done', transitionedAt: '2026-01-05T00:00:00Z' }
  ];
  const raw: RawDataset = {
    collectedAt: '2026-01-10T00:00:00Z',
    catalogueComponents: [],
    nexusAvailable: false,
    repositories: [
      {
        id: 'repo',
        name: 'ui',
        owner: 'example',
        defaultBranch: 'develop',
        packageManifest: { version: '1.8.0', status: 'available' },
        pullRequests: [],
        issues: [
          issue,
          {
            ...issue,
            id: 'example/ui:issue:2',
            number: 2,
            issueType: 'FEATURE',
            rawIssueType: 'Task',
            descriptionIssueIds: [issue.id],
            labels: [
              config.github.labels.componentPrefix + ' Tag',
              config.github.labels.componentPrefix + ' Button'
            ],
            projectStatuses: [
              {
                projectId: 'p',
                projectName: 'Board',
                status: 'In progress',
                rawVelocity: 0,
                statusHistory: history
              }
            ],
            milestone: { id: 1, number: 1, title: '1.9.0' }
          },
          {
            ...issue,
            id: 'example/ui:issue:3',
            number: 3,
            rawIssueType: 'Task',
            issueType: 'FEATURE',
            parents: [issue.id]
          }
        ]
      }
    ]
  };
  return { raw, prefix: config.github.labels.componentPrefix, rules: config.github };
}

it('capture mentions simples, qualifiées et URL sans conserver le texte ni exiger Fix', () => {
  expect(
    descriptionIssueReferences(
      'Epic #12 ; #12 ; acme/other#7 ; https://github.com/acme/other/issues/8 ; #0 ; #123abc',
      'acme/ui'
    )
  ).toEqual(['acme/ui:issue:12', 'acme/other:issue:7', 'acme/other:issue:8']);
  expect(descriptionIssueReferences(null, 'acme/ui')).toEqual([]);
});

it('embarque le suivi dans le snapshot et génère la page après préparation de fixture', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'dsq-epic-'));
  try {
    const { raw } = await sample();
    const input = join(directory, 'raw.json');
    await writeFile(input, JSON.stringify(raw));
    await prepareDataset(input, join(directory, 'fixture'), 'test-seed');
    const snapshot = await runPipeline(join(directory, 'fixture'), join(directory, 'output'));
    expect(snapshot.analytics.epicActivity?.epics[0]?.rows[0]?.elapsedHours).toBe(72);
    const html = await readFile(join(directory, 'output/dashboard/classic/epics.html'), 'utf8');
    expect(html).toContain('dashboard-page-data');
    expect(html).toContain('data-epic-export');
    expect(html).not.toContain('example/ui:issue:1');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

it('inclut les versions futures, garde zéro et utilise premier In progress et dernier Done sans parent implicite', async () => {
  const { raw, prefix, rules } = await sample();
  const data = normalizeGithub(raw, rules);
  const model = epicActivity(data, prefix);
  expect(model.epics).toHaveLength(1);
  expect(model.epics[0]!.rows.map((row) => row.component)).toEqual(['Button', 'Tag']);
  expect(model.epics[0]!.rows[0]).toMatchObject({
    number: 2,
    velocity: 0,
    elapsedHours: 72,
    startedAt: '2026-01-02T01:00:00+01:00',
    finishedAt: '2026-01-05T00:00:00Z'
  });
  expect(data.issues!.find((issue) => issue.number === 2)?.futureVersion).toBe(true);
});

it('explique les transitions absentes, invalides, incohérentes et les Projects ambigus', async () => {
  const { raw, prefix, rules } = await sample();
  const child = raw.repositories[0]!.issues[1]!;
  const project = child.projectStatuses[0]!;
  project.statusHistory = [];
  delete project.rawVelocity;
  let row = epicActivity(normalizeGithub(raw, rules), prefix).epics[0]!.rows[0]!;
  expect(row).toMatchObject({
    elapsedHours: null,
    reason: 'Historique Project absent',
    velocity: null,
    velocityReason: 'Vélocité absente'
  });
  project.statusHistory = [{ status: 'In progress', transitionedAt: '2026-01-03T00:00:00Z' }];
  expect(epicActivity(normalizeGithub(raw, rules), prefix).epics[0]!.rows[0]?.reason).toContain(
    'Done absent'
  );
  project.statusHistory.push({ status: 'Done', transitionedAt: '2026-01-02T00:00:00Z' });
  expect(epicActivity(normalizeGithub(raw, rules), prefix).epics[0]!.rows[0]?.reason).toContain('antérieur');
  project.statusHistory[0]!.transitionedAt = 'invalid';
  expect(epicActivity(normalizeGithub(raw, rules), prefix).epics[0]!.rows[0]?.reason).toContain('invalide');
  child.projectStatuses.push({ ...project, projectId: 'p2' });
  row = epicActivity(normalizeGithub(raw, rules), prefix).epics[0]!.rows[0]!;
  expect(row.reason).toContain('Plusieurs Projects');
  child.projectStatuses = [
    {
      ...project,
      statusHistory: [
        { previousStatus: 'In progress', status: 'Backlog', transitionedAt: '2026-01-01T00:00:00Z' },
        { status: 'In progress', transitionedAt: '2026-01-02T00:00:00Z' },
        { status: 'Done', transitionedAt: '2026-01-03T00:00:00Z' }
      ]
    }
  ];
  row = epicActivity(normalizeGithub(raw, rules), prefix).epics[0]!.rows[0]!;
  expect(row.elapsedHours).toBeNull();
  expect(row.reason).toContain('historique déjà commencé');
});

it('anonymise les mentions entre dépôts et distingue les anciennes collectes des listes vides', async () => {
  const { raw, prefix, rules } = await sample();
  const other = structuredClone(raw.repositories[0]!);
  other.id = 'repo2';
  other.name = 'other';
  other.issues = [{ ...other.issues[1]!, id: 'example/other:issue:4', number: 4 }];
  raw.repositories.push(other);
  const result = anonymizeDataset(raw, {
    seed: 'test',
    strictText: true,
    dateOffsetDays: -365,
    preserveComponentNames: true
  });
  const epic = result.dataset.repositories[0]!.issues[0]!;
  expect(result.dataset.repositories[1]!.issues[0]!.descriptionIssueIds).toEqual([epic.id]);
  expect(JSON.stringify(result.dataset)).not.toContain('example/ui:issue:1');
  expect(epicActivity(normalizeGithub(result.dataset, rules), prefix).epics[0]!.rows).toHaveLength(4);
  delete raw.repositories[0]!.issues[1]!.descriptionIssueIds;
  expect(epicActivity(normalizeGithub(raw, rules), prefix).epics[0]!.referencesCaptured).toBe(false);
  (raw.repositories[0]!.issues[1] as unknown as Record<string, unknown>).descriptionIssueIds = 'invalid';
  expect(() => validateRaw(raw)).toThrow('mentions');
});
