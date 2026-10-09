import { describe, expect, it } from 'vitest';
// @ts-expect-error JavaScript utility is intentionally standalone
import { classify, parseArgs } from '../scripts/diagnose-history.mjs';

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
    expect(() => parseArgs(['--sample', '101'])).toThrow();
    expect(() => parseArgs(['--token', 'secret'])).toThrow();
  });
});
