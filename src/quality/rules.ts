import type { DataQualityIssue, NormalizedData, RawDataset } from '../domain/types.js';
import type { GithubProcessingConfig } from '../config.js';

/** Évalue les réserves de qualité sans supprimer les données sources. */
export function evaluateDataQuality(raw: RawDataset, data: NormalizedData, rules: GithubProcessingConfig): DataQualityIssue[] {
  const detectedAt = raw.collectedAt;
  const issues: DataQualityIssue[] = [];
  /** Centralise la création des alertes afin de garantir un identifiant traçable. */
  const add = (ruleId: string, severity: DataQualityIssue['severity'], action: DataQualityIssue['action'], entityType: string, entityId: string, message: string) => {
    issues.push({ id: `${ruleId}:${entityId}`, ruleId, severity, action, entityType, entityId, message, detectedAt });
  };

  // Les données invalides restent dans le snapshot ; les règles décrivent seulement leur impact.
  for (const anomaly of data.anomalies) {
    const sourceIssue = raw.repositories
      .flatMap((repository) => repository.issues)
      .find((issue) => issue.id === anomaly.provenance.sourceId);
    if (anomaly.cancelled) {
      if (anomaly.pullRequestRefs.length > 0) add('DQ-008', 'ERROR', 'exclude', 'anomaly', anomaly.anomalyId, 'Cancelled issue is referenced by a pull request.');
      if (sourceIssue?.milestone) add('DQ-010', 'ERROR', 'exclude', 'anomaly', anomaly.anomalyId, 'Cancelled issue is attached to a milestone.');
      continue;
    }
    if (!anomaly.criticality) add('DQ-001', 'ERROR', 'exclude', 'anomaly', anomaly.anomalyId, 'Anomaly has no criticality.');
    if (anomaly.criticality && anomaly.parentRefs.length > 1) add('DQ-003', 'ERROR', 'exclude', 'anomaly', anomaly.anomalyId, 'Anomaly has incompatible multiple parents.');
    if (anomaly.status === 'done' && anomaly.pullRequestRefs.length === 0) add('DQ-004', 'WARNING', 'include', 'anomaly', anomaly.anomalyId, 'Done issue has no identifiable pull request.');
    if (sourceIssue?.labels.some((label) => label.toLowerCase().startsWith(rules.labels.criticalityPrefix.toLowerCase())) && sourceIssue.criticities.length > 1) add('DQ-002', 'ERROR', 'exclude', 'anomaly', anomaly.anomalyId, 'Anomaly has incompatible multiple criticalities.');
    if (sourceIssue?.labels.some((label) => label.toLowerCase() === rules.labels.unknown.toLowerCase())) add('DQ-007', 'WARNING', 'include', 'anomaly', anomaly.anomalyId, 'Issue contains an unknown label.');
  }

  for (const pullRequest of data.pullRequests) {
    for (const issueId of pullRequest.relatedIssueIds) {
      const issue = raw.repositories
        .flatMap((repository) => repository.issues)
        .find((candidate) => candidate.id === issueId);
      if (pullRequest.state === 'merged' && issue?.state === 'OPEN') add('DQ-005', 'WARNING', 'include', 'pull_request', pullRequest.pullRequestId, 'Merged pull request is linked to an open issue.');
    }
  }

  for (const component of data.components) {
    if (component.discoverySource === 'suggested') add('DQ-006', 'WARNING', 'include', 'component', component.componentId, 'Source component is absent from the catalogue.');
  }
  if (!raw.nexusAvailable) add('DQ-009', 'WARNING', 'include', 'dataset', 'nexus', 'Nexus is unavailable; release evidence is unknown.');
  return issues;
}

/** Agrège les alertes par niveau pour l'affichage et le statut du pipeline. */
export function summarizeQuality(issues: DataQualityIssue[]): Record<DataQualityIssue['severity'], number> {
  return {
    INFO: issues.filter((issue) => issue.severity === 'INFO').length,
    WARNING: issues.filter((issue) => issue.severity === 'WARNING').length,
    ERROR: issues.filter((issue) => issue.severity === 'ERROR').length
  };
}
