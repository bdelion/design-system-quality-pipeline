import type { NormalizedData } from '../domain/types.js';
import { compareReviewVersions } from '../domain/issue-review.js';

/** Synthèse traçable des audits et des corrections ; les nombres sont des occurrences par composant. */
export function businessReview(data: NormalizedData) {
  const issues = data.issues ?? [];
  const audits = data.audits.map((audit) => {
    const anomalies = data.anomalies.filter(
      (item) => item.auditId === audit.auditId && item.accessibility !== false
    );
    const componentAnomalies = anomalies.filter((item) =>
      issues.find((issue) => issue.issueId === item.issueId)?.componentIds.includes(audit.componentId)
    );
    const confirmed = componentAnomalies.filter(
      (item) => issues.find((issue) => issue.issueId === item.issueId)?.review?.correctionConfirmed
    );
    return {
      auditId: audit.auditId,
      componentId: audit.componentId,
      libraryId: audit.libraryId,
      version: audit.version,
      detected: componentAnomalies.length,
      corrected: confirmed.length,
      verified: confirmed.filter(
        (item) => issues.find((issue) => issue.issueId === item.issueId)?.review?.verification === 'verified'
      ).length,
      improvements: (data.auditImprovements ?? []).filter((item) => item.auditId === audit.auditId).length
    };
  });
  const components = data.components.map((component) => {
    const bugs = data.anomalies.filter((item) =>
      issues.find((issue) => issue.issueId === item.issueId)?.componentIds.includes(component.componentId)
    );
    const completed = data.audits
      .filter((audit) => audit.componentId === component.componentId && audit.lifecycle === 'completed')
      .sort((a, b) => compareReviewVersions(b.version, a.version));
    return {
      componentId: component.componentId,
      name: component.name,
      libraryId: component.libraryId,
      latestAuditId: completed[0]?.auditId,
      bugs: bugs.length,
      accessibility: bugs.filter((item) => item.accessibility && !item.neutralized).length,
      pendingAccessibility: bugs.filter(
        (item) =>
          item.accessibility &&
          !item.neutralized &&
          issues.find((issue) => issue.issueId === item.issueId)?.review?.verification !== 'verified'
      ).length,
      withoutAudit: bugs.filter((item) => !item.auditId).length,
      corrected: bugs.filter(
        (item) => issues.find((issue) => issue.issueId === item.issueId)?.review?.correctionConfirmed
      ).length
    };
  });
  return {
    algorithm: 'business-review-v1' as const,
    audits,
    components,
    withoutComponent: data.anomalies.filter(
      (item) => !issues.find((issue) => issue.issueId === item.issueId)?.componentIds.length
    ).length,
    occurrences: components.reduce((sum, item) => sum + item.bugs, 0),
    distinctBugs: data.anomalies.length
  };
}
