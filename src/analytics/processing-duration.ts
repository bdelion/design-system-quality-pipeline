import type { Issue } from '../domain/types.js';

/** Mesure premier In progress → dernier Done ; replie la paire entière sur création/clôture si une transition manque. */
export function processingDuration(issue: Issue): {
  value: number | null;
  source: 'project' | 'github';
  start: string;
  end: string;
} {
  const history = issue.projectContexts.flatMap((context) => context.statusHistory);
  const starts = history
    .filter((entry) => entry.status === 'IN_PROGRESS')
    .map((entry) => Date.parse(entry.transitionedAt))
    .filter(Number.isFinite);
  const ends = history
    .filter((entry) => entry.status === 'DONE')
    .map((entry) => Date.parse(entry.transitionedAt))
    .filter(Number.isFinite);
  const source = starts.length && ends.length ? 'project' : 'github';
  const start = source === 'project' ? Math.min(...starts) : Date.parse(issue.createdAt);
  const end = source === 'project' ? Math.max(...ends) : Date.parse(issue.closedAt ?? '');
  const value = (end - start) / 86400000;
  return {
    value: Number.isFinite(value) && value >= 0 ? value : null,
    source,
    start: source === 'project' ? new Date(start).toISOString() : issue.createdAt,
    end: source === 'project' ? new Date(end).toISOString() : (issue.closedAt ?? '')
  };
}
