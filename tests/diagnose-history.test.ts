import { describe, expect, it } from 'vitest';
import {
  classify,
  compareTransitions,
  classifyExtraTransitions,
  parseArgs
} from '../scripts/diagnose-history.mjs';

describe('local history diagnostic', () => {
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
