import type { RawIssue } from '../domain/types.js';

export function componentNamesFromLabels(labels: string[], prefix: string): string[] {
  const normalizedPrefix = prefix.toLowerCase();
  return labels
    .filter((label) => label.toLowerCase().startsWith(normalizedPrefix))
    .map((label) => label.slice(prefix.length));
}

/** Supports older RAW fixtures that kept Component labels but not parsed fields. */
export function rawComponentNames(issue: RawIssue, prefix: string): string[] {
  if (issue.components !== undefined) return issue.components;
  // Legacy singular fields may have truncated the original multi-Component labels.
  const componentNames = componentNamesFromLabels(issue.labels, prefix);
  if (componentNames.length > 0) return componentNames;
  if (issue.component !== undefined) return [issue.component];
  return [];
}
