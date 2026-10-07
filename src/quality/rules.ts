import type { DataQualityIssue, NormalizedData, RawDataset } from '../domain/types.js';
import { applyMetricImpacts } from '../lib/metric-impacts.js';
import type { GithubProcessingConfig } from '../config.js';

/** Évalue les réserves de qualité sans supprimer les données sources. */
export function evaluateDataQuality(raw: RawDataset, data: NormalizedData, rules: GithubProcessingConfig): DataQualityIssue[] {
  const detectedAt = raw.collectedAt;
  const issues: DataQualityIssue[] = [];
  /** Centralise la création des alertes afin de garantir un identifiant traçable. */
  const add = (ruleId: string, severity: DataQualityIssue['severity'], action: DataQualityIssue['action'], entityType: string, entityId: string, message: string) => {
    issues.push({ id: `${ruleId}:${entityId}`, ruleId, severity, action, entityType, entityId, message, detectedAt, impacts: [] });
  };

  // Les données invalides restent dans le snapshot ; les règles décrivent seulement leur impact.
  for (const anomaly of data.legacyAnomalies) {
    const sourceIssue = raw.repositories
      .flatMap((repository) => repository.issues)
      .find((issue) => issue.id === anomaly.provenance.sourceId);
    if (anomaly.cancelled) {
      continue;
    }
    if (anomaly.parentRefs.length > 1) add('DQ-003', 'ERROR', 'exclude', 'anomaly', anomaly.anomalyId, 'Anomaly has incompatible multiple parents.');
    if (anomaly.status === 'done' && anomaly.pullRequestRefs.length === 0) add('DQ-004', 'WARNING', 'include', 'anomaly', anomaly.anomalyId, 'Done issue has no identifiable pull request.');
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

  for (const issue of data.issues) {
    if (issue.rawIssueType !== undefined && issue.issueType === undefined && issue.provenance.sourceId) {
      add('DQ-011', 'WARNING', 'include', 'issue', issue.provenance.sourceId, `Issue Type « ${issue.rawIssueType} » à déclarer dans github.issueTypes.keywords.`);
    }
    if (issue.rawIssueType === undefined && issue.provenance.sourceId) {
      add('DQ-012', 'WARNING', 'include', 'issue', issue.provenance.sourceId, 'Issue has no GitHub Issue Type.');
    }
  }

  const rawIssuesById = new Map(raw.repositories.flatMap((repository) =>
    repository.issues.map((issue) => [issue.id, issue] as const)
  ));
  const normalizedIssuesById = new Map(data.issues.map((issue) => [issue.issueId, issue]));
  const auditsByIssueId = new Map(data.audits.map((audit) => [audit.issueId, audit]));
  const isDone = (issue: NonNullable<ReturnType<typeof rawIssuesById.get>>) =>
    (issue.projectStatuses ?? []).some((project) => project.status.trim().toLowerCase() === 'done');
  const accessibilityPrefix = rules.labels.accessibilityCriticalityPrefix.toLowerCase();

  for (const issue of data.issues.filter((candidate) => candidate.issueType === 'AUDIT')) {
    const source = issue.provenance.sourceId ? rawIssuesById.get(issue.provenance.sourceId) : undefined;
    if (!source) continue;
    if (issue.componentIds.length !== 1) {
      add('DQ-013', 'WARNING', 'exclude', 'issue', issue.provenance.sourceId ?? issue.issueId, `Audit requires exactly one Component; found ${issue.componentIds.length}.`);
    }
    if (!issue.milestoneId || !auditsByIssueId.has(issue.issueId)) {
      add('DQ-014', 'WARNING', 'exclude', 'issue', issue.provenance.sourceId ?? issue.issueId, 'Audit target Version cannot be resolved from its Milestone.');
    }
    const done = isDone(source);
    if (done !== (issue.state === 'CLOSED')) {
      add('DQ-015', 'WARNING', 'include', 'issue', issue.provenance.sourceId ?? issue.issueId, 'Audit Done/Closed state is inconsistent.');
    }
    const audit = auditsByIssueId.get(issue.issueId);
    if (audit?.realized && audit.timing === 'PRE_PROD' && !audit.auditedReleaseCandidate) {
      add('DQ-016', 'WARNING', 'include', 'issue', issue.provenance.sourceId ?? issue.issueId, 'Pre-PROD Audit has no explicit audited Release Candidate.');
    }
  }

  for (const version of data.versions) {
    if (!version.published) {
      add('DQ-017', 'WARNING', 'include', 'version', version.versionId, `PROD tag for Version ${version.number} is unavailable.`);
    }
    if (version.catalogueStatus === 'unknown' && version.published) {
      add('DQ-018', 'WARNING', 'include', 'version', version.versionId, version.catalogueIssue ?? `Historical catalogue for Version ${version.number} is unavailable.`);
    }
  }

  for (const anomaly of data.anomalies) {
    const normalized = normalizedIssuesById.get(anomaly.issueId);
    const recognizedStatuses = new Set(normalized?.projectStatuses.flatMap((project) => {
      const value = (project.status.canonicalValue ?? project.status.rawValue).trim().toLowerCase();
      const canonical = ({ 'in progress': 'in_progress', 'in-progress': 'in_progress' } as Record<string, string>)[value] ?? value;
      return ['open', 'in_progress', 'done', 'reopened'].includes(canonical) ? [canonical] : [];
    }) ?? []);
    if (normalized && recognizedStatuses.size !== 1) {
      add('DQ-021', 'WARNING', 'include', 'issue', normalized.provenance.sourceId ?? anomaly.issueId, 'Anomaly has no usable current Project status.');
    }
    if (anomaly.origin === 'UNDETERMINED') {
      const sourceId = normalized?.provenance.sourceId ?? anomaly.issueId;
      add('DQ-019', 'WARNING', 'include', 'issue', sourceId, 'Anomaly origin cannot be determined from its parent Audit relation.');
      continue;
    }
    if (anomaly.origin === 'AUDIT') {
      const parent = data.audits.find((candidate) => candidate.auditId === anomaly.auditId);
      if (parent && !anomaly.componentIds.includes(parent.componentId)) {
        const sourceId = normalizedIssuesById.get(anomaly.issueId)?.provenance.sourceId ?? anomaly.issueId;
        add('DQ-020', 'WARNING', 'exclude', 'issue', sourceId, 'Audit Anomaly Component does not match its parent Audit Component.');
      }
      const source = normalized;
      const rawSource = source?.provenance.sourceId ? rawIssuesById.get(source.provenance.sourceId) : undefined;
      if (accessibilityPrefix && rawSource?.labels.some((label) => label.toLowerCase().startsWith(accessibilityPrefix))) {
        if (rawSource.criticities.length > 1) {
          add('DQ-002', 'ERROR', 'exclude', 'issue', source?.provenance.sourceId ?? anomaly.issueId, 'Accessibility Audit Anomaly has incompatible multiple criticalities.');
        } else if (!anomaly.criticality) {
          add('DQ-001', 'ERROR', 'exclude', 'issue', source?.provenance.sourceId ?? anomaly.issueId, 'Accessibility Audit Anomaly has no recognized RGAA criticality.');
        }
      }
    }
  }

  for (const component of data.components) {
    if (component.discoverySource === 'suggested') add('DQ-006', 'WARNING', 'include', 'component', component.componentId, 'Source component is absent from the catalogue.');
  }
  if (!raw.nexusAvailable) add('DQ-009', 'WARNING', 'include', 'dataset', 'nexus', 'Nexus is unavailable; release evidence is unknown.');
  return applyMetricImpacts(issues, [
    'portfolio.repositories', 'portfolio.libraries', 'portfolio.components', 'portfolio.componentsAudited', 'portfolio.auditCoverage',
    'audit.completed', 'audit.conform', 'audit.conditional', 'audit.nonConform', 'audit.critical', 'audit.conformityRate',
    'version.auditCoverage.*', 'version.conformityRate.*',
    'anomaly.total', 'anomaly.open', 'anomaly.inProgress', 'anomaly.done', 'anomaly.byCriticality.blocking', 'anomaly.byCriticality.major', 'anomaly.byCriticality.minor',
    'anomaly.byOrigin.*', 'anomaly.criticalityCoverage', 'anomaly.correctedEver', 'anomaly.reopened', 'anomaly.cancelled',
    'anomaly.correctionDelay.average', 'anomaly.correctionDelay.median', 'anomaly.correctionDelay.p90', 'anomaly.backlog.oldestAge',
    'anomaly.flow.created', 'anomaly.flow.corrected', 'anomaly.flow.reopened', 'anomaly.flow.cancelled'
  ]);
}

/** Agrège les alertes par niveau pour l'affichage et le statut du pipeline. */
export function summarizeQuality(issues: DataQualityIssue[]): Record<DataQualityIssue['severity'], number> {
  return {
    INFO: issues.filter((issue) => issue.severity === 'INFO').length,
    WARNING: issues.filter((issue) => issue.severity === 'WARNING').length,
    ERROR: issues.filter((issue) => issue.severity === 'ERROR').length
  };
}
