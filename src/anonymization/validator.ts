import type { RawDataset } from '../domain/types.js';
import { findSuspiciousStrings } from './sanitize.js';

export interface ValidationFinding {
  path: string;
  kind: string;
  value: string;
}

export interface ValidationResult {
  valid: boolean;
  findings: ValidationFinding[];
}

export interface IntegrityFinding {
  type: 'missing-issue' | 'missing-pull-request';
  scope: 'repository' | 'cross-repository';
  repository: string;
  sourceId: string;
  sourcePath: string;
  referenceId: string;
  source: unknown;
}

function walk(value: unknown, path: string, findings: ValidationResult['findings']): void {
  if (typeof value === 'string') {
    for (const kind of findSuspiciousStrings(value)) findings.push({ path, kind, value });
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => walk(v, `${path}[${i}]`, findings));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) walk(v, `${path}.${k}`, findings);
  }
}

export function validateAnonymizedDataset(dataset: RawDataset): ValidationResult {
  const findings: ValidationResult['findings'] = [];
  walk(dataset, '$', findings);
  return { valid: findings.length === 0, findings };
}

export function inspectRelationalIntegrity(dataset: RawDataset): IntegrityFinding[] {
  const errors: IntegrityFinding[] = [];
  const globalIssueIds = new Set(dataset.repositories.flatMap(repo => repo.issues.map(issue => issue.id)));
  const globalPrIds = new Set(dataset.repositories.flatMap(repo => repo.pullRequests.map(pr => pr.id)));

  for (let repoIndex = 0; repoIndex < dataset.repositories.length; repoIndex += 1) {
    const repo = dataset.repositories[repoIndex];
    const issueIds = new Set(repo.issues.map(i => i.id));
    const prIds = new Set(repo.pullRequests.map(p => p.id));

    for (let issueIndex = 0; issueIndex < repo.issues.length; issueIndex += 1) {
      const issue = repo.issues[issueIndex];
      for (let refIndex = 0; refIndex < issue.linkedPullRequestIds.length; refIndex += 1) {
        const id = issue.linkedPullRequestIds[refIndex];
        if (!prIds.has(id)) {
          errors.push({
            type: 'missing-pull-request',
            scope: globalPrIds.has(id) ? 'cross-repository' : 'repository',
            repository: repo.name,
            sourceId: issue.id,
            sourcePath: `$.repositories[${repoIndex}].issues[${issueIndex}].linkedPullRequestIds[${refIndex}]`,
            referenceId: id,
            source: issue
          });
        }
      }
    }

    for (let prIndex = 0; prIndex < repo.pullRequests.length; prIndex += 1) {
      const pr = repo.pullRequests[prIndex];
      for (let refIndex = 0; refIndex < pr.relatedIssueIds.length; refIndex += 1) {
        const id = pr.relatedIssueIds[refIndex];
        if (!issueIds.has(id)) {
          errors.push({
            type: 'missing-issue',
            scope: globalIssueIds.has(id) ? 'cross-repository' : 'repository',
            repository: repo.name,
            sourceId: pr.id,
            sourcePath: `$.repositories[${repoIndex}].pullRequests[${prIndex}].relatedIssueIds[${refIndex}]`,
            referenceId: id,
            source: pr
          });
        }
      }
    }
  }
  return errors;
}

export function assertRelationalIntegrity(dataset: RawDataset): string[] {
  return inspectRelationalIntegrity(dataset).map(error =>
    error.type === 'missing-issue'
      ? `${error.repository}:${error.sourceId} references missing issue ${error.referenceId}`
      : `${error.repository}:${error.sourceId} references missing PR ${error.referenceId}`
  );
}
