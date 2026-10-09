import { describe, expect, it } from 'vitest';
import { calculateHistoryCoverage, correctionDateReason } from '../src/dashboard/history-coverage.js';
import type { Anomaly, Issue } from '../src/domain/types.js';

const issue = (transitions: string[]): Issue =>
  ({
    issueId: 'issue-1',
    projectContexts: [
      {
        projectId: 'p',
        projectName: 'P',
        statusHistory: transitions.map((status) => ({
          rawStatus: status,
          status: status as 'DONE',
          transitionedAt: '2026-01-01T00:00:00Z'
        }))
      }
    ]
  }) as Issue;
const anomaly = (correctedAt?: string): Anomaly => ({ issueId: 'issue-1', correctedAt }) as Anomaly;

describe('historical data coverage (not business KPIs)', () => {
  it('preserves I3 ambiguity for multiple Done transitions', () => {
    expect(correctionDateReason(anomaly(), issue(['DONE', 'DONE']))).toBe('multiple_done');
  });
  it('does not infer a correction from a project history without Done', () => {
    const sample = issue(['READY']);
    sample.projectContexts[0]!.statusHistory[0]!.status = 'READY';
    expect(correctionDateReason(anomaly(), sample)).toBe('no_done_transition');
  });
  it('distinguishes missing history from a reliable date', () => {
    expect(correctionDateReason(anomaly(), issue([]))).toBe('no_project_history');
    expect(correctionDateReason(anomaly('2026-01-02'), issue([]))).toBe('available');
    const coverage = calculateHistoryCoverage([issue([])], [anomaly()]);
    expect(coverage.issuesWithoutHistory).toBe(1);
    expect(coverage.reasons.no_project_history).toBe(1);
  });
});
