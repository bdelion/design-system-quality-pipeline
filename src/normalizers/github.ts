import { stableId } from '../lib/ids.js';
import type { GithubProcessingConfig } from '../config.js';
import type { Anomaly, Audit, Component, DataQualityStatus, Library, NormalizedData, PullRequest, RawDataset } from '../domain/types.js';

const collectedStatus: DataQualityStatus = 'reliable';

export function normalizeGithub(raw: RawDataset, rules: GithubProcessingConfig): NormalizedData {
  const libraries: Library[] = raw.repositories.map((repository) => ({
    libraryId: stableId('lib', repository.name),
    name: repository.name,
    repository: `${repository.owner}/${repository.name}`,
    defaultBranch: repository.defaultBranch,
    status: 'active',
    provenance: { source: 'github', sourceId: repository.id, collectedAt: raw.collectedAt },
    dataQualityStatus: collectedStatus
  }));

  const libraryByRepository = new Map(raw.repositories.map((repository, index) => [repository.name, libraries[index]!]));
  const componentsByName = new Map<string, Component>();
  const audits: Audit[] = [];
  const anomalies: Anomaly[] = [];
  const pullRequests: PullRequest[] = [];

  for (const repository of raw.repositories) {
    const library = libraryByRepository.get(repository.name)!;
    for (const issue of repository.issues) {
      const componentName = issue.component ?? 'unknown';
      const componentId = stableId('component', `${library.libraryId}:${componentName}`);
      if (!componentsByName.has(`${library.libraryId}:${componentName}`)) {
        const inCatalogue = raw.catalogueComponents.includes(componentName);
        componentsByName.set(`${library.libraryId}:${componentName}`, {
          componentId,
          name: componentName,
          libraryId: library.libraryId,
          status: 'active',
          aliases: [],
          discoverySource: inCatalogue ? 'catalogue' : 'suggested',
          provenance: { source: inCatalogue ? 'catalogue' : 'github', sourceId: issue.id, collectedAt: raw.collectedAt },
          dataQualityStatus: inCatalogue ? 'reliable' : 'partial'
        });
      }
      const auditId = stableId('audit', `${library.libraryId}:${componentName}:2026.09`);
      if (!audits.some((audit) => audit.auditId === auditId)) {
        audits.push({
          auditId,
          libraryId: library.libraryId,
          componentId,
          version: '2026.09',
          status: issue.auditStatus ?? 'in_progress',
          sourceIssueId: issue.parents[0] ?? issue.id,
          objectiveAuditResult: issue.auditResult ?? 'in_progress',
          provenance: { source: 'github', sourceId: issue.parents[0] ?? issue.id, collectedAt: raw.collectedAt },
          dataQualityStatus: 'partial'
        });
      }
      if (issue.issueType !== rules.issueTypes.anomaly) continue;
      anomalies.push({
        anomalyId: stableId('anomaly', issue.id),
        auditId,
        componentId,
        criticality: criticalityValue(issue.criticities[0], rules),
        categories: issue.labels.filter((label) => label.toLowerCase().startsWith(rules.labels.categoryPrefix.toLowerCase())).map((label) => label.slice(rules.labels.categoryPrefix.length)),
        status: issue.state === 'OPEN' ? 'open' : 'done',
        createdAt: issue.createdAt,
        firstDoneAt: issue.firstDoneAt,
        everCorrected: Boolean(issue.firstDoneAt),
        pullRequestRefs: issue.linkedPullRequestIds,
        parentRefs: issue.parents,
        provenance: { source: 'github', sourceId: issue.id, collectedAt: raw.collectedAt },
        dataQualityStatus: collectedStatus
      });
    }
    for (const pullRequest of repository.pullRequests) {
      pullRequests.push({
        pullRequestId: pullRequest.id,
        repository: repository.name,
        state: pullRequest.state.toLowerCase() as PullRequest['state'],
        mergedAt: pullRequest.mergedAt,
        relatedIssueIds: pullRequest.relatedIssueIds,
        provenance: { source: 'github', sourceId: pullRequest.id, collectedAt: raw.collectedAt },
        dataQualityStatus: collectedStatus
      });
    }
  }

  return { libraries, components: [...componentsByName.values()], audits, anomalies, pullRequests };
}

function criticalityValue(value: string | undefined, rules: GithubProcessingConfig): Anomaly['criticality'] {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  return rules.labels.criticalityValues[normalized] ?? (['blocking', 'major', 'minor'].includes(normalized) ? normalized as Anomaly['criticality'] : undefined);
}
