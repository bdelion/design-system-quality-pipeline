import type { RawDataset } from '../domain/types.js';

export interface TraceEntity {
  type: 'repository' | 'issue' | 'pull-request';
  sourcePath: string;
  sourceId: string;
  anonymizedId: string;
  repositorySourceId?: string;
  repositoryAnonymizedId?: string;
}

export interface TraceRelation {
  type: 'issue-linked-pull-request' | 'pull-request-related-issue';
  sourcePath: string;
  sourceEntityId: string;
  anonymizedSourceId: string;
  sourceReferenceId: string;
  anonymizedReferenceId: string;
  targetSourceId?: string;
  targetAnonymizedId?: string;
  targetStatus: 'present-in-source' | 'missing-in-source';
}

export interface TraceManifest {
  version: 1;
  source: { file: string };
  entities: TraceEntity[];
  relations: TraceRelation[];
}

export function buildTraceManifest(input: RawDataset, anonymized: RawDataset, sourceFile: string): TraceManifest {
  const entities: TraceEntity[] = [];
  const relations: TraceRelation[] = [];
  const sourceIssues = new Map<string, { repoId: string; anonymizedId: string }>();
  const sourcePullRequests = new Map<string, { repoId: string; anonymizedId: string }>();

  input.repositories.forEach((sourceRepo, repoIndex) => {
    const anonRepo = anonymized.repositories[repoIndex];
    if (!anonRepo) throw new Error(`Anonymized repository missing at index ${repoIndex}.`);
    entities.push({
      type: 'repository', sourcePath: `$.repositories[${repoIndex}]`, sourceId: sourceRepo.id,
      anonymizedId: anonRepo.id
    });

    sourceRepo.issues.forEach((issue, issueIndex) => {
      const anonIssue = anonRepo.issues[issueIndex];
      if (!anonIssue) throw new Error(`Anonymized issue missing at repository ${repoIndex}, index ${issueIndex}.`);
      entities.push({
        type: 'issue', sourcePath: `$.repositories[${repoIndex}].issues[${issueIndex}]`, sourceId: issue.id,
        anonymizedId: anonIssue.id, repositorySourceId: sourceRepo.id, repositoryAnonymizedId: anonRepo.id
      });
      sourceIssues.set(issue.id, { repoId: sourceRepo.id, anonymizedId: anonIssue.id });
    });

    sourceRepo.pullRequests.forEach((pr, prIndex) => {
      const anonPr = anonRepo.pullRequests[prIndex];
      if (!anonPr) throw new Error(`Anonymized pull request missing at repository ${repoIndex}, index ${prIndex}.`);
      entities.push({
        type: 'pull-request', sourcePath: `$.repositories[${repoIndex}].pullRequests[${prIndex}]`, sourceId: pr.id,
        anonymizedId: anonPr.id, repositorySourceId: sourceRepo.id, repositoryAnonymizedId: anonRepo.id
      });
      sourcePullRequests.set(pr.id, { repoId: sourceRepo.id, anonymizedId: anonPr.id });
    });
  });

  input.repositories.forEach((sourceRepo, repoIndex) => {
    const anonRepo = anonymized.repositories[repoIndex];
    if (!anonRepo) throw new Error(`Anonymized repository missing at index ${repoIndex}.`);
    sourceRepo.issues.forEach((issue, issueIndex) => {
      const anonIssue = anonRepo.issues[issueIndex];
      if (!anonIssue) throw new Error(`Anonymized issue missing at repository ${repoIndex}, index ${issueIndex}.`);
      issue.linkedPullRequestIds.forEach((targetSourceId, refIndex) => {
        const target = sourcePullRequests.get(targetSourceId);
        relations.push({
          type: 'issue-linked-pull-request',
          sourcePath: `$.repositories[${repoIndex}].issues[${issueIndex}].linkedPullRequestIds[${refIndex}]`,
          sourceEntityId: issue.id, anonymizedSourceId: anonIssue.id,
          sourceReferenceId: targetSourceId,
          anonymizedReferenceId: anonIssue.linkedPullRequestIds[refIndex] ?? (() => { throw new Error(`Anonymized PR reference missing at repository ${repoIndex}, issue ${issueIndex}, index ${refIndex}.`); })(),
          ...(target ? { targetSourceId, targetAnonymizedId: target.anonymizedId, targetStatus: 'present-in-source' as const } : { targetStatus: 'missing-in-source' as const })
        });
      });
    });
    sourceRepo.pullRequests.forEach((pr, prIndex) => {
      const anonPr = anonRepo.pullRequests[prIndex];
      if (!anonPr) throw new Error(`Anonymized pull request missing at repository ${repoIndex}, index ${prIndex}.`);
      pr.relatedIssueIds.forEach((targetSourceId, refIndex) => {
        const target = sourceIssues.get(targetSourceId);
        relations.push({
          type: 'pull-request-related-issue',
          sourcePath: `$.repositories[${repoIndex}].pullRequests[${prIndex}].relatedIssueIds[${refIndex}]`,
          sourceEntityId: pr.id, anonymizedSourceId: anonPr.id,
          sourceReferenceId: targetSourceId,
          anonymizedReferenceId: anonPr.relatedIssueIds[refIndex] ?? (() => { throw new Error(`Anonymized issue reference missing at repository ${repoIndex}, pull request ${prIndex}, index ${refIndex}.`); })(),
          ...(target ? { targetSourceId, targetAnonymizedId: target.anonymizedId, targetStatus: 'present-in-source' as const } : { targetStatus: 'missing-in-source' as const })
        });
      });
    });
  });

  return { version: 1, source: { file: sourceFile }, entities, relations };
}
