import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  classify,
  compareTransitions,
  classifyExtraTransitions,
  parseArgs,
  formatDiagnosticSummary,
  diagnose
} from '../scripts/diagnose-history.mjs';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it('diagnostique via Octokit les pages GraphQL Enterprise sans requête supplémentaire', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'dsq-octokit-'));
  try {
    const raw = join(directory, 'raw.json');
    await writeFile(
      raw,
      JSON.stringify({
        repositories: [{ id: 'r', owner: 'acme', name: 'dsq', issues: [{ id: 'i', number: 1 }] }]
      })
    );
    vi.stubEnv('GITHUB_TOKEN', 'fake-diagnostic-token');
    vi.stubEnv('GITHUB_GRAPHQL_URL', 'https://git.test/api/graphql');
    const api = vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
      expect(new Headers(init?.headers).get('authorization')).toBe('Bearer fake-diagnostic-token');
      const body = JSON.parse(String(init?.body));
      const first = body.variables.after === null;
      return Response.json({
        data: {
          repository: {
            issue: {
              projectItems: { nodes: [], pageInfo: { hasNextPage: false } },
              timelineItems: { nodes: [], pageInfo: { hasNextPage: first, endCursor: first ? 'next' : null } }
            }
          }
        }
      });
    });
    vi.stubGlobal('fetch', api);
    const summary = await diagnose({ raw, output: join(directory, 'output'), live: true, sample: 1 });
    expect(summary).toMatchObject({ live: { checked: 1, outcomes: { OK: 1 } } });
    expect(api).toHaveBeenCalledTimes(2);
    expect(api.mock.calls.map(([url]) => url)).toEqual([
      'https://git.test/api/graphql',
      'https://git.test/api/graphql'
    ]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

describe('local history diagnostic', () => {
  it('présente une synthèse française sans exporter le JSON sur stdout', () => {
    const summary = formatDiagnosticSummary(
      { mode: 'offline', raw: { issues: 12 }, live: { checked: 0 } },
      'data/diagnostics'
    );
    expect(summary).toContain('hors réseau');
    expect(summary).toContain('12 issues');
    expect(summary).toContain('history-summary.json');
    expect(summary).not.toContain('{');
  });
  it('distinguishes absent history, repeated Done and PR without Done', () => {
    expect(
      classify({
        state: 'CLOSED',
        linkedPullRequestIds: ['pr-1'],
        projectStatuses: [{ status: 'Done', statusHistory: [] }]
      })
    ).toMatchObject({ case: 'NO_HISTORY', doneTransitions: 0, hasPr: true });
    expect(
      classify({
        state: 'CLOSED',
        projectStatuses: [
          {
            status: 'Done',
            statusHistory: [
              { status: 'Done', transitionedAt: '2026-01-01' },
              { status: 'Done', transitionedAt: '2026-01-02' }
            ]
          }
        ]
      })
    ).toMatchObject({ case: 'MULTIPLE_DONE', doneTransitions: 2 });
    expect(classify({ state: 'CLOSED', projectStatuses: [] })).toMatchObject({ case: 'NO_PROJECT_STATUS' });
  });
  it('rejects unsafe sampling and unknown flags', () => {
    expect(() => parseArgs(['--sample', '0'])).toThrow();
    expect(() => parseArgs(['--sample', '1001'])).toThrow();
    expect(() => parseArgs(['--token', 'secret'])).toThrow();
  });
});

describe('exact transition comparison', () => {
  const key = Buffer.alloc(32, 7);
  const event = { projectId: 'p1', status: 'Done', at: '2026-01-01T10:00:00Z' };
  it('matches the same events independently of ordering', () => {
    expect(compareTransitions([event], [event], key)).toEqual({ apiOnly: 0, rawOnly: 0, exactMatch: true });
  });
  it('detects changed timestamps even when event counts match', () => {
    expect(compareTransitions([event], [{ ...event, at: '2026-01-02T10:00:00Z' }], key)).toEqual({
      apiOnly: 1,
      rawOnly: 1,
      exactMatch: false
    });
  });
  it('preserves multiplicity of identical events', () => {
    expect(compareTransitions([event], [event, event], key)).toMatchObject({ apiOnly: 1, rawOnly: 0 });
  });
});

describe('collection-time attribution', () => {
  const key = Buffer.alloc(32, 3);
  const collection = '2026-10-09T08:00:00+02:00';
  it('distinguishes older missing events from new GitHub updates', () => {
    const original = { projectId: 'p', status: 'Backlog', at: '2026-10-01T00:00:00Z' };
    const older = { projectId: 'p', status: 'Done', at: '2026-10-08T12:00:00Z' };
    const newer = { projectId: 'p', status: 'Done', at: '2026-10-09T12:00:00Z' };
    expect(classifyExtraTransitions([original], [original, older, newer], key, collection)).toEqual({
      beforeOrAtCollection: 1,
      afterCollection: 1,
      unknownTime: 0,
      done: 2,
      other: 0
    });
  });
  it('requires an explicit timezone for the collection timestamp', () => {
    expect(() => parseArgs(['--collected-at', '2026-10-09T08:00:00'])).toThrow();
    expect(parseArgs(['--collected-at', collection]).collectedAt).toBe(collection);
  });
});
