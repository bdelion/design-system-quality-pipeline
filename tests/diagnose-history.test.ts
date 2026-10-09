import { describe, expect, it } from 'vitest';
// @ts-expect-error JavaScript utility is intentionally standalone
import { classify, compareTransitions, parseArgs } from '../scripts/diagnose-history.mjs';

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
    expect(parseArgs(['--sample', '1']).sample).toBe(1);
    expect(parseArgs(['--sample', '1000']).sample).toBe(1000);
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
