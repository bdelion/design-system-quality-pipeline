import type { DataQualityIssue, NormalizedData, RawDataset } from '../domain/types.js';
import { applyMetricImpacts } from '../lib/metric-impacts.js';
import type { GithubProcessingConfig } from '../config.js';

/** Évalue les réserves de qualité sans supprimer les données sources. */
export function evaluateDataQuality(raw: RawDataset, data: NormalizedData, rules: GithubProcessingConfig): DataQualityIssue[] {
  const detectedAt = raw.collectedAt;
  const issues: DataQualityIssue[] = [];
  const emittedIssueIds = new Set<string>();
  /** Centralise la création des alertes afin de garantir un identifiant traçable. */
  const add = (ruleId: string, severity: DataQualityIssue['severity'], action: DataQualityIssue['action'], entityType: string, entityId: string, message: string) => {
    const id = `${ruleId}:${entityId}`;
    if (emittedIssueIds.has(id)) return;
    emittedIssueIds.add(id);
    issues.push({ id, ruleId, severity, action, entityType, entityId, message, detectedAt, impacts: [] });
  };

  const normalizedIssueById = new Map((data.issues ?? []).map((issue) => [issue.issueId, issue]));
  const issueFor = (issueId: string | undefined, provenanceSourceId: string | undefined) =>
    normalizedIssueById.get(issueId ?? provenanceSourceId ?? '');
  const isCurrentlyDone = (issue: NonNullable<ReturnType<typeof issueFor>>) =>
    issue.projectContexts.some((context) => context.status === 'DONE');
  const rawIssueById = new Map(raw.repositories.flatMap((repository) => repository.issues).map((issue) => [issue.id, issue]));
  const auditById = new Map(data.audits.map((audit) => [audit.auditId, audit]));
  const auditByIssueId = new Map(data.audits.map((audit) => [audit.issueId, audit]));
  const versionIds = new Set((data.versions ?? []).map((version) => version.versionId));
  const repositoryHasNativeIssueTypes = new Map(
    raw.repositories.map((repository) => [repository.id, repository.issues.some((issue) => issue.rawIssueType !== undefined)])
  );

  // I5 Data Quality V2: surface ambiguities already preserved by normalization.
  // Legacy fixtures that predate native Issue Type collection are not retroactively
  // classified as missing; once a repository contains native Issue Types, absence on
  // one of its Issues is meaningful and must be reported (D-155).
  for (const issue of data.issues ?? []) {
    const rawIssue = rawIssueById.get(issue.issueId);
    const nativeIssueTypesAvailable = repositoryHasNativeIssueTypes.get(issue.repositoryId) ?? false;
    if (nativeIssueTypesAvailable && !issue.rawIssueType) {
      add('DQ-017', 'WARNING', 'include', 'issue', issue.issueId, 'GitHub Issue Type is missing.');
    } else if (issue.rawIssueType && !issue.issueType && (issue.candidateIssueTypes?.length ?? 0) === 0) {
      add('DQ-018', 'WARNING', 'include', 'issue', issue.issueId, `GitHub Issue Type '${issue.rawIssueType}' is not recognized by the current configuration.`);
    } else if ((issue.candidateIssueTypes?.length ?? 0) > 1) {
      add('DQ-019', 'WARNING', 'include', 'issue', issue.issueId, 'GitHub Issue Type matches several canonical types.');
    }

    for (const context of issue.projectContexts) {
      if (context.rawStatus && !context.status && (context.candidateStatuses?.length ?? 0) === 0) {
        add('DQ-020', 'WARNING', 'include', 'issue', issue.issueId, `Project status '${context.rawStatus}' is not recognized by the current configuration.`);
      } else if ((context.candidateStatuses?.length ?? 0) > 1) {
        add('DQ-021', 'WARNING', 'include', 'issue', issue.issueId, `Project status '${context.rawStatus ?? ''}' matches several canonical statuses.`);
      }
      if (context.rawVelocity !== undefined && context.velocity === undefined) {
        add('DQ-022', 'WARNING', 'include', 'issue', issue.issueId, `Project Velocity '${String(context.rawVelocity)}' is not numeric.`);
      }
    }

    if (issue.issueType === 'AUDIT') {
      if (issue.componentIds.length === 0) {
        add('DQ-023', 'WARNING', 'include', 'issue', issue.issueId, 'Audit Issue has no recognized Component.');
      } else if (issue.componentIds.length > 1) {
        add('DQ-024', 'WARNING', 'include', 'issue', issue.issueId, 'Audit Issue has several recognized Components.');
      }
      const milestoneTitle = rawIssue?.milestone?.title?.trim();
      const targetNumber = milestoneTitle && /^\d+\.\d+\.\d+$/.test(milestoneTitle) ? milestoneTitle : undefined;
      const hasTargetVersion = targetNumber
        ? (data.versions ?? []).some((version) => version.libraryId === issue.libraryId && version.number === targetNumber)
        : false;
      if (!hasTargetVersion) {
        add('DQ-025', 'WARNING', 'include', 'issue', issue.issueId, 'Audit Issue has no determinable target PROD Version.');
      }
    }
  }

  for (const anomaly of data.anomalies) {
    const issue = issueFor(anomaly.issueId, anomaly.provenance.sourceId);
    if (anomaly.origin === 'UNDETERMINED') {
      add('DQ-026', 'WARNING', 'include', 'anomaly', anomaly.anomalyId, 'Audit relation is expected but cannot be validated unambiguously.');
    }
    if (anomaly.origin === 'AUDIT' && anomaly.auditId && issue?.componentIds.length === 1) {
      const audit = auditById.get(anomaly.auditId);
      if (audit && issue.componentIds[0] !== audit.componentId) {
        add('DQ-027', 'WARNING', 'include', 'anomaly', anomaly.anomalyId, 'Anomaly Component differs from its Audit Component.');
      }
    }
  }

  for (const issue of data.issues ?? []) {
    if (issue.issueType !== 'FEATURE') continue;
    const rawIssue = rawIssueById.get(issue.issueId);
    const parentIds = rawIssue?.parents ?? [];
    if (parentIds.length === 0) continue;
    const validAuditParents = parentIds.filter((parentId) => auditByIssueId.has(parentId));
    if (parentIds.length !== 1 || validAuditParents.length !== 1) {
      add('DQ-028', 'WARNING', 'include', 'issue', issue.issueId, 'Feature expects one valid Audit parent but the relation is absent, invalid or ambiguous.');
    }
  }

  // Defensive integrity check: normalized references must never become orphans (D-241).
  for (const audit of data.audits) {
    if (!normalizedIssueById.has(audit.issueId) || (audit.versionId !== undefined && !versionIds.has(audit.versionId))) {
      add('DQ-029', 'ERROR', 'exclude', 'audit', audit.auditId, 'Audit contains an unresolved normalized reference.');
    }
  }
  for (const anomaly of data.anomalies) {
    if (!normalizedIssueById.has(anomaly.issueId) || (anomaly.auditId !== undefined && !auditById.has(anomaly.auditId))) {
      add('DQ-029', 'ERROR', 'exclude', 'anomaly', anomaly.anomalyId, 'Anomaly contains an unresolved normalized reference.');
    }
  }
  for (const improvement of data.auditImprovements ?? []) {
    if (!normalizedIssueById.has(improvement.issueId) || !auditById.has(improvement.auditId)) {
      add('DQ-029', 'ERROR', 'exclude', 'audit_improvement', improvement.auditImprovementId, 'AuditImprovement contains an unresolved normalized reference.');
    }
  }

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
    const normalizedIssue = issueFor(anomaly.issueId, anomaly.provenance.sourceId);
    if (normalizedIssue && isCurrentlyDone(normalizedIssue) && normalizedIssue.state === 'CLOSED' && !anomaly.correctedAt) {
      add('DQ-011', 'WARNING', 'include', 'anomaly', anomaly.anomalyId, 'Done and closed anomaly has no determinable correction date from Project status history.');
    }
    if (normalizedIssue && isCurrentlyDone(normalizedIssue) && normalizedIssue.state === 'OPEN') {
      add('DQ-013', 'WARNING', 'include', 'anomaly', anomaly.anomalyId, 'Project status is Done while the GitHub issue is still open.');
    }
    if (!anomaly.criticality) add('DQ-001', 'ERROR', 'exclude', 'anomaly', anomaly.anomalyId, 'Anomaly has no criticality.');
    if (anomaly.parentRefs.length > 1) add('DQ-003', 'ERROR', 'exclude', 'anomaly', anomaly.anomalyId, 'Anomaly has incompatible multiple parents.');
    if (anomaly.status === 'done' && anomaly.pullRequestRefs.length === 0) add('DQ-004', 'WARNING', 'include', 'anomaly', anomaly.anomalyId, 'Done issue has no identifiable pull request.');
    if (sourceIssue?.labels.some((label) => label.toLowerCase().startsWith(rules.labels.accessibilityCriticalityPrefix.toLowerCase())) && sourceIssue.criticities.length > 1) add('DQ-002', 'ERROR', 'exclude', 'anomaly', anomaly.anomalyId, 'Anomaly has incompatible multiple criticalities.');
    if (sourceIssue?.labels.some((label) => label.toLowerCase() === rules.labels.unknown.toLowerCase())) add('DQ-007', 'WARNING', 'include', 'anomaly', anomaly.anomalyId, 'Issue contains an unknown label.');
  }

  for (const audit of data.audits) {
    const normalizedIssue = issueFor(audit.issueId, audit.provenance.sourceId);
    if (!normalizedIssue) continue;
    if (isCurrentlyDone(normalizedIssue) && normalizedIssue.state === 'CLOSED' && !audit.completedAt) {
      add('DQ-012', 'WARNING', 'include', 'audit', audit.auditId, 'Done and closed audit has no determinable completion date from Project status history.');
    }
    if (isCurrentlyDone(normalizedIssue) && normalizedIssue.state === 'OPEN') {
      add('DQ-014', 'WARNING', 'include', 'audit', audit.auditId, 'Project status is Done while the GitHub issue is still open.');
    }
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

  // I4.3: a PROD tag is authoritative for the Version, but historical catalogue
  // evidence may still be unavailable. Never substitute the current catalogue.
  const libraryByRepository = new Map(data.libraries.map((library) => [library.repository, library]));
  const versionByLibraryAndNumber = new Map((data.versions ?? []).map((version) => [`${version.libraryId}:${version.number}`, version]));
  const reportedCatalogueEvidence = new Set<string>();
  for (const repository of raw.repositories) {
    const library = libraryByRepository.get(`${repository.owner}/${repository.name}`);
    if (!library) continue;
    for (const catalogue of repository.historicalCatalogues ?? []) {
      if (catalogue.status === 'available') continue;
      const version = versionByLibraryAndNumber.get(`${library.libraryId}:${catalogue.tagName}`);
      if (!version) continue;
      const key = `${catalogue.status}:${version.versionId}`;
      if (reportedCatalogueEvidence.has(key)) continue;
      reportedCatalogueEvidence.add(key);
      if (catalogue.status === 'missing') {
        add('DQ-015', 'WARNING', 'include', 'version', version.versionId, `Historical catalogue is missing at PROD tag ${catalogue.tagName}.`);
      } else {
        add('DQ-016', 'WARNING', 'include', 'version', version.versionId, `Historical catalogue is invalid at PROD tag ${catalogue.tagName}.`);
      }
    }
  }
  if (!raw.nexusAvailable) add('DQ-009', 'WARNING', 'include', 'dataset', 'nexus', 'Nexus is unavailable; release evidence is unknown.');
  return applyMetricImpacts(issues, [
    'portfolio.repositories', 'portfolio.libraries', 'portfolio.components', 'portfolio.componentsAudited', 'portfolio.auditCoverage',
    'audit.completed', 'audit.conform', 'audit.conditional', 'audit.nonConform', 'audit.critical', 'audit.conformityRate',
    'componentVersion.total', 'componentVersion.covered', 'componentVersion.auditCoverage', 'componentVersion.conform', 'componentVersion.nonConform', 'componentVersion.conformityRate',
    'anomaly.total', 'anomaly.open', 'anomaly.inProgress', 'anomaly.done', 'anomaly.byCriticality.blocking', 'anomaly.byCriticality.major', 'anomaly.byCriticality.minor',
    'anomaly.criticalityCoverage', 'anomaly.correctedEver', 'anomaly.reopened', 'anomaly.cancelled',
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
