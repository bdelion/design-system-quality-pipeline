import type { GithubProcessingConfig } from '../config.js';
import type { NormalizedData, RawDataset } from './types.js';

/** Matérialise les enfants de type BUG explicite et label RGAA, sans modifier leur composant ni le verdict métier. */
export function applyAuditDeclarations(
  data: NormalizedData,
  raw: RawDataset,
  rules: GithubProcessingConfig
): void {
  if (!data.issues) return;
  const types = new Set(
    (rules.issueTypes.keywords.BUG ?? [rules.issueTypes.anomaly]).map((type) => type.toLowerCase())
  );
  const prefix = rules.labels.accessibilityCriticalityPrefix;
  const issues = new Map((data.issues ?? []).map((issue) => [issue.issueId, issue]));
  const byParent = new Map<string, string[]>();
  const sourceIds = new Set(
    raw.repositories.flatMap((repository) => repository.issues.map((issue) => issue.id))
  );
  for (const repository of raw.repositories)
    for (const issue of repository.issues) {
      if (
        !issue.rawIssueType ||
        !types.has(issue.rawIssueType.toLowerCase()) ||
        !prefix ||
        !issue.labels.some((label) => label.startsWith(prefix))
      )
        continue;
      for (const parent of issue.parents) {
        const parentIssue = issues.get(parent);
        const childIssue = issues.get(issue.id);
        if (!parentIssue || !childIssue || parentIssue.libraryId !== childIssue.libraryId) continue;
        const children = byParent.get(parent) ?? [];
        children.push(issue.id);
        byParent.set(parent, children);
      }
    }
  for (const audit of data.audits) {
    if (!sourceIds.has(audit.issueId) || !issues.has(audit.issueId)) {
      delete audit.declaredRgaaBugIssueIds;
      continue;
    }
    audit.declaredRgaaBugIssueIds = [...new Set(byParent.get(audit.issueId) ?? [])].sort();
  }
}
