import { stableId } from '../lib/ids.js';
import type { GithubProcessingConfig } from '../config.js';
import type {
  Anomaly,
  Audit,
  AuditImprovement,
  Issue,
  Milestone,
  NormalizedData,
  RawDataset,
  Version
} from '../domain/types.js';

const prodMilestonePattern = /^(\d+\.\d+\.\d+)(?:-audit)?$/i;
const releaseCandidatePattern = /^\d+\.\d+\.\d+-rc\.\d+$/i;

/** Builds V1 specializations from explicit Issue, Project, Milestone and tag facts. */
export function normalizeSpecializations(
  raw: RawDataset,
  issues: Issue[],
  milestones: Milestone[],
  versions: Version[],
  rules: GithubProcessingConfig
): Pick<NormalizedData, 'audits' | 'anomalies' | 'auditImprovements'> {
  const issueBySourceKey = new Map(
    issues
      .filter((issue) => issue.provenance.sourceId)
      .map((issue) => [`${issue.repositoryId}:${issue.provenance.sourceId}`, issue])
  );
  const rawIssueByNormalizedId = new Map<string, RawDataset['repositories'][number]['issues'][number]>();
  const rawRepositoryByNormalizedId = new Map<string, RawDataset['repositories'][number]>();

  for (const repository of raw.repositories) {
    for (const sourceIssue of repository.issues) {
      const issue = issueBySourceKey.get(`${repository.id}:${sourceIssue.id}`);
      if (!issue) continue;
      rawIssueByNormalizedId.set(issue.issueId, sourceIssue);
      rawRepositoryByNormalizedId.set(issue.issueId, repository);
    }
  }

  const auditBySourceKey = new Map<string, Audit>();
  const audits: Audit[] = [];

  for (const issue of issues) {
    if (issue.issueType !== 'AUDIT') continue;
    const sourceIssue = rawIssueByNormalizedId.get(issue.issueId);
    const repository = rawRepositoryByNormalizedId.get(issue.issueId);
    const componentId = issue.componentIds.length === 1 ? issue.componentIds[0] : undefined;
    const version = targetVersion(issue, milestones, versions);
    if (!sourceIssue || !repository || !componentId || !version) continue;

    const completedAt = firstDoneAt(sourceIssue);
    const realized = hasCurrentDoneStatus(issue) && issue.state === 'CLOSED';
    const auditedReleaseCandidate = releaseCandidateValue(issue, rules);
    const candidateTag = auditedReleaseCandidate
      ? repository.tags?.find((tag) => tag.name.toLowerCase() === auditedReleaseCandidate.toLowerCase())
      : undefined;
    const audit: Audit = {
      auditId: stableId('audit', issue.issueId),
      issueId: issue.issueId,
      componentId,
      versionId: version.versionId,
      ...(auditedReleaseCandidate ? { auditedReleaseCandidate } : {}),
      ...(candidateTag
        ? {
            auditedReleaseCandidateTag: {
              name: candidateTag.name,
              ...(candidateTag.createdAt ? { taggedAt: candidateTag.createdAt } : {})
            }
          }
        : {}),
      ...(completedAt ? { completedAt } : {}),
      realized,
      verdict: 'UNKNOWN',
      timing: auditTiming(completedAt, version.releasedAt)
    };
    audits.push(audit);
    auditBySourceKey.set(`${issue.repositoryId}:${sourceIssue.id}`, audit);
  }

  const anomalies: Anomaly[] = [];
  for (const issue of issues) {
    const sourceIssue = rawIssueByNormalizedId.get(issue.issueId);
    const repository = rawRepositoryByNormalizedId.get(issue.issueId);
    if (!sourceIssue || !repository || !isAnomaly(issue, sourceIssue, rules)) continue;

    const validAuditParents = sourceIssue.parents.flatMap((parentId) => {
      const parentIssue = issueBySourceKey.get(`${repository.id}:${parentId}`);
      const audit = auditBySourceKey.get(`${repository.id}:${parentId}`);
      return parentIssue?.issueType === 'AUDIT' && audit ? [{ audit }] : [];
    });
    const hasUnresolvedAuditRelation = sourceIssue.parents.some((parentId) => {
      const parentIssue = issueBySourceKey.get(`${repository.id}:${parentId}`);
      return !parentIssue || (
        parentIssue.issueType === 'AUDIT'
        && !auditBySourceKey.has(`${repository.id}:${parentId}`)
      );
    });
    const origin: Anomaly['origin'] = sourceIssue.parents.length === 0
      ? 'HORS_AUDIT'
      : sourceIssue.parents.length === 1 && validAuditParents.length === 1
        ? 'AUDIT'
        : validAuditParents.length > 0 || hasUnresolvedAuditRelation
          ? 'UNDETERMINED'
          : 'HORS_AUDIT';

    const normalizedCriticality = criticality(issue.criticities, rules);
    const correctedAt = firstDoneAt(sourceIssue);
    const base = {
      anomalyId: stableId('anomaly', issue.issueId),
      issueId: issue.issueId,
      componentIds: issue.componentIds,
      ...(normalizedCriticality ? { criticality: normalizedCriticality } : {}),
      categories: issue.accessibilityCategories,
      detectedAt: issue.createdAt,
      ...(correctedAt ? { correctedAt } : {})
    };
    const audit = origin === 'AUDIT' ? validAuditParents[0]?.audit : undefined;
    if (audit) {
      anomalies.push({
        ...base,
        origin: 'AUDIT',
        auditId: audit.auditId,
        componentId: audit.componentId
      });
    } else if (origin === 'HORS_AUDIT') {
      anomalies.push({ ...base, origin: 'HORS_AUDIT' });
    } else {
      anomalies.push({ ...base, origin: 'UNDETERMINED' });
    }
  }

  for (const audit of audits) {
    if (!audit.realized) continue;
    const relatedAnomalies = anomalies.filter((anomaly) =>
      anomaly.origin === 'AUDIT' && anomaly.auditId === audit.auditId
    );
    const unresolvedRelation = anomalies.some((anomaly) => {
      if (anomaly.origin !== 'UNDETERMINED') return false;
      const source = rawIssueByNormalizedId.get(anomaly.issueId);
      const repository = rawRepositoryByNormalizedId.get(audit.issueId);
      return source?.parents.some((parentId) =>
        repository ? auditBySourceKey.has(`${repository.id}:${parentId}`) : false
      ) ?? false;
    });
    const unresolvedForOtherAudit = anomalies.some((anomaly) => {
      if (anomaly.origin !== 'UNDETERMINED') return false;
      const source = rawIssueByNormalizedId.get(anomaly.issueId);
      const repository = rawRepositoryByNormalizedId.get(audit.issueId);
      return Boolean(repository && source?.parents.some((parentId) =>
        auditBySourceKey.has(`${repository.id}:${parentId}`)
      ));
    });
    const componentMismatch = relatedAnomalies.some((anomaly) =>
      !anomaly.componentIds.includes(audit.componentId)
    );
    audit.verdict = componentMismatch
      ? 'UNKNOWN'
      : relatedAnomalies.length > 0 ? 'NON_CONFORM' : unresolvedRelation || unresolvedForOtherAudit ? 'UNKNOWN' : 'CONFORM';
  }

  const auditImprovements: AuditImprovement[] = [];
  for (const issue of issues) {
    if (issue.issueType !== 'FEATURE') continue;
    const sourceIssue = rawIssueByNormalizedId.get(issue.issueId);
    if (!sourceIssue || sourceIssue.parents.length !== 1) continue;
    const parentId = sourceIssue.parents[0];
    const audit = parentId
      ? auditBySourceKey.get(`${issue.repositoryId}:${parentId}`)
      : undefined;
    if (!audit) continue;
    auditImprovements.push({
      auditImprovementId: stableId('audit-improvement', issue.issueId),
      issueId: issue.issueId,
      auditId: audit.auditId
    });
  }

  return {
    audits: audits.sort((left, right) => left.auditId.localeCompare(right.auditId)),
    anomalies: anomalies.sort((left, right) => left.anomalyId.localeCompare(right.anomalyId)),
    auditImprovements: auditImprovements.sort((left, right) =>
      left.auditImprovementId.localeCompare(right.auditImprovementId)
    )
  };
}

function targetVersion(issue: Issue, milestones: Milestone[], versions: Version[]): Version | undefined {
  if (!issue.milestoneId) return undefined;
  const milestone = milestones.find((candidate) => candidate.milestoneId === issue.milestoneId);
  if (!milestone) return undefined;
  const match = prodMilestonePattern.exec(milestone.title);
  if (!match?.[1]) return undefined;
  return versions.find((version) =>
    version.libraryId === issue.libraryId && version.number === match[1]
  );
}

function firstDoneAt(sourceIssue: RawDataset['repositories'][number]['issues'][number]): string | undefined {
  const transitions = (sourceIssue.projectStatuses ?? [])
    .flatMap((project) => project.transitions ?? [])
    .flatMap((transition) => {
      const changedAt = transition.changedAt;
      return transition.newStatus.trim().toLowerCase() === 'done'
        && changedAt !== undefined
        && Number.isFinite(Date.parse(changedAt))
        ? [changedAt]
        : [];
    })
    .sort((left, right) => Date.parse(left) - Date.parse(right));
  return transitions[0] ?? sourceIssue.firstDoneAt;
}

function hasCurrentDoneStatus(issue: Issue): boolean {
  return issue.projectStatuses.some((project) =>
    project.status.rawValue.trim().toLowerCase() === 'done'
  );
}

function releaseCandidateValue(issue: Issue, rules: GithubProcessingConfig): string | undefined {
  const fieldName = rules.projects.auditedReleaseCandidateField.trim();
  if (!fieldName) return undefined;
  const values = [...new Set(issue.projectStatuses
    .flatMap((project) => project.fields)
    .flatMap((field) => {
      if (field.fieldName !== fieldName || typeof field.value !== 'string') return [];
      const value = field.value.trim();
      return releaseCandidatePattern.test(value) ? [value] : [];
    }))];
  return values.length === 1 ? values[0] : undefined;
}

function auditTiming(completedAt: string | undefined, releasedAt: string | undefined): Audit['timing'] {
  if (!completedAt || !releasedAt) return 'UNKNOWN';
  const completedTimestamp = Date.parse(completedAt);
  const releaseTimestamp = Date.parse(releasedAt);
  if (!Number.isFinite(completedTimestamp) || !Number.isFinite(releaseTimestamp)) return 'UNKNOWN';
  return completedTimestamp <= releaseTimestamp ? 'PRE_PROD' : 'CATCH_UP';
}

function isAnomaly(
  issue: Issue,
  sourceIssue: RawDataset['repositories'][number]['issues'][number],
  rules: GithubProcessingConfig
): boolean {
  return issue.issueType === rules.issueTypes.anomaly
    || sourceIssue.issueType?.trim().toLowerCase() === rules.issueTypes.anomaly.trim().toLowerCase();
}

function criticality(
  values: string[],
  rules: GithubProcessingConfig
): 'blocking' | 'major' | 'minor' | undefined {
  const normalized = values
    .map((value) => value.trim().toLowerCase())
    .map((value) => rules.labels.criticalityValues[value] ?? value)
    .filter((value): value is 'blocking' | 'major' | 'minor' =>
      ['blocking', 'major', 'minor'].includes(value)
    );
  return normalized.length === 1 ? normalized[0] : undefined;
}
