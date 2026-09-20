import type { DataQualityIssue, NormalizedData, RawDataset } from '../domain/types.js';
import type { GithubProcessingConfig } from '../config.js';

export function evaluateDataQuality(raw: RawDataset, data: NormalizedData, rules: GithubProcessingConfig): DataQualityIssue[] {
  const detectedAt = raw.collectedAt;
  const issues: DataQualityIssue[] = [];
  const add = (ruleId: string, severity: DataQualityIssue['severity'], action: DataQualityIssue['action'], entityType: string, entityId: string, message: string) => {
    issues.push({ id: `${ruleId}:${entityId}`, ruleId, severity, action, entityType, entityId, message, detectedAt });
  };

  for (const anomaly of data.anomalies) {
    if (!anomaly.criticality) add('DQ-001', 'ERROR', 'exclude', 'anomaly', anomaly.anomalyId, 'Anomaly has no criticality.');
    if (anomaly.criticality && anomaly.parentRefs.length > 1) add('DQ-003', 'ERROR', 'exclude', 'anomaly', anomaly.anomalyId, 'Anomaly has incompatible multiple parents.');
    const sourceIssue = raw.repositories.flatMap((repository) => repository.issues).find((issue) => issue.id === anomaly.provenance.sourceId);
    if (anomaly.status === 'done' && anomaly.pullRequestRefs.length === 0) add('DQ-004', 'WARNING', 'include', 'anomaly', anomaly.anomalyId, 'Done issue has no identifiable pull request.');
    if (sourceIssue?.labels.some((label) => label.toLowerCase().startsWith(rules.labels.criticalityPrefix.toLowerCase())) && sourceIssue.criticities.length > 1) add('DQ-002', 'ERROR', 'exclude', 'anomaly', anomaly.anomalyId, 'Anomaly has incompatible multiple criticalities.');
    if (sourceIssue?.labels.some((label) => label.toLowerCase() === rules.labels.unknown.toLowerCase())) add('DQ-007', 'WARNING', 'include', 'anomaly', anomaly.anomalyId, 'Issue contains an unknown label.');
  }

  for (const pullRequest of data.pullRequests) {
    for (const issueId of pullRequest.relatedIssueIds) {
      const issue = raw.repositories.flatMap((repository) => repository.issues).find((candidate) => candidate.id === issueId);
      if (pullRequest.state === 'merged' && issue?.state === 'OPEN') add('DQ-005', 'WARNING', 'include', 'pull_request', pullRequest.pullRequestId, 'Merged pull request is linked to an open issue.');
    }
  }

  for (const component of data.components) {
    if (component.discoverySource === 'suggested') add('DQ-006', 'WARNING', 'include', 'component', component.componentId, 'Source component is absent from the catalogue.');
  }
  if (!raw.nexusAvailable) add('DQ-009', 'WARNING', 'include', 'dataset', 'nexus', 'Nexus is unavailable; release evidence is unknown.');
  return issues;
}

export function summarizeQuality(issues: DataQualityIssue[]): Record<DataQualityIssue['severity'], number> {
  return {
    INFO: issues.filter((issue) => issue.severity === 'INFO').length,
    WARNING: issues.filter((issue) => issue.severity === 'WARNING').length,
    ERROR: issues.filter((issue) => issue.severity === 'ERROR').length
  };
}
