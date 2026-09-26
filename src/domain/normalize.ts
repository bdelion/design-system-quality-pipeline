// src/domain/normalize.ts
import { NormalizedData, Anomaly, Component, Audit } from './types.js';

export function normalizeDataset(raw: any): NormalizedData {
  const repositories = raw.repositories || [];

  // 1. Composants
  const rawComponents: string[] = raw.catalogueComponents || [];
  const components: Component[] = rawComponents.map((name) => ({
    id: name.toLowerCase(),
    componentId: name.toLowerCase(),
    name,
    status: 'active',
    discoverySource: 'catalogue',
  }));

  // 2. Anomalies et Audits
  const anomalies: Anomaly[] = [];
  const audits: Audit[] = [];
  const pullRequests: any[] = [];

  repositories.forEach((repo: any) => {
    const repoName = repo.name || repo.id;
    const issues = repo.issues || [];
    const prs = repo.pullRequests || [];

    prs.forEach((pr: any) => {
      pullRequests.push({
        pullRequestId: pr.id,
        number: pr.number,
        state: pr.state?.toLowerCase(),
        relatedIssueIds: pr.relatedIssueIds || [],
      });
    });

    issues.forEach((issue: any) => {
      if (issue.issueType === 'AUDIT') {
        audits.push({
          id: issue.id,
          componentId: (issue.component || 'unknown').toLowerCase(),
          status: issue.auditStatus === 'conform' ? 'completed' : 'in_progress',
          result: issue.auditResult === 'conform' ? 'compliant' : 'non_compliant',
          isConformal: issue.auditResult === 'conform',
          auditedAt: issue.closedAt || issue.createdAt,
        });
      } else {
        const criticality = issue.criticities?.[0] || undefined;
        const isClosed = issue.state === 'CLOSED';

        anomalies.push({
          id: issue.id,
          anomalyId: issue.id,
          title: issue.title || '',
          status: isClosed ? 'closed' : 'open',
          severity: criticality as any,
          criticality: criticality as any,
          repository: repoName,
          category: issue.labels?.find((l: string) => l.startsWith('a11y:')) || 'general',
          createdAt: issue.createdAt,
          closedAt: issue.closedAt,
          firstDoneAt: issue.firstDoneAt,
          resolvedAt: issue.firstDoneAt || issue.closedAt,
          cancelled: issue.state === 'CANCELLED',
          parentRefs: issue.parents || [],
          pullRequestRefs: issue.linkedPullRequestIds || [],
          // Clé indispensable attendue par rules.ts :
          provenance: {
            sourceId: issue.id,
            repository: repoName,
          },
        } as any);
      }
    });
  });

  return {
    components,
    audits,
    anomalies,
    pullRequests,
  } as NormalizedData;
}