import type { GithubProcessingConfig } from '../config.js';
import type { Catalogue } from '../catalogue.js';
import type { Issue, NormalizedData, RawDataset } from './types.js';
import { currentProjectStatus, lastDoneAt } from './business.js';
import { classifyLabels, defaultIssuePolicy, matchesLabels, resolutionReason } from './issue-policy.js';

/** Résultat versionné des décisions métier du 19 octobre 2026. */
export interface IssueReview {
  algorithm: 'issue-review-v1';
  kinds: ('accessibility' | 'functional')[];
  typeSource: 'github' | 'labels' | 'legacy' | 'unconfirmed';
  project: 'none' | 'missing-status' | 'with-status';
  advice: boolean;
  auditCandidate: boolean;
  resolution: ReturnType<typeof resolutionReason>;
  neutralized: boolean;
  correctionConfirmed: boolean;
  correctionVersion?: string;
  mergedPullRequestIds: string[];
  correctionLabel: string;
  verification: 'verified' | 'pending' | 'indeterminate';
  verifyingAuditIds: string[];
  warnings: string[];
}

/** Compare les versions numériques sans confondre 1.10.0 et 1.9.0. */
export function compareReviewVersions(left: string, right: string): number {
  const a = left.split('.').map(Number),
    b = right.split('.').map(Number);
  for (let index = 0; index < 3; index++) {
    const difference = a[index]! - b[index]!;
    if (difference) return difference;
  }
  return 0;
}

/** Enrichit les issues sans toucher au RAW, puis vérifie les corrections sur les audits ultérieurs. */
export function applyIssueReviews(
  data: NormalizedData,
  raw: RawDataset,
  rules: GithubProcessingConfig,
  catalogue?: Catalogue
): void {
  data.reviewPolicy = {
    algorithm: 'issue-review-v1',
    configuration: structuredClone({
      ...defaultIssuePolicy,
      ...rules.issuePolicy,
      classification: { ...defaultIssuePolicy.classification, ...rules.issuePolicy?.classification }
    })
  };
  const rawIssues = new Map(
    raw.repositories.flatMap((repo) => repo.issues).map((issue) => [issue.id, issue])
  );
  const prs = new Map(data.pullRequests.map((pr) => [pr.pullRequestId, pr]));
  for (const issue of data.issues ?? []) {
    const source = rawIssues.get(issue.issueId)!;
    const statuses = issue.projectContexts.map(currentProjectStatus);
    const cancelled = statuses.includes('CANCELLED');
    const resolution = resolutionReason(issue.labels, cancelled, rules.issuePolicy);
    const done = statuses.length > 0 && statuses.every((status) => status === 'DONE');
    const merged = issue.linkedPullRequestIds.filter((id) => prs.get(id)?.state === 'merged');
    const confirmed = done && merged.length > 0;
    const warnings: string[] = [];
    const auditCandidate =
      source.rawIssueType?.toLowerCase() === 'audit' ||
      Boolean(
        rules.auditDetection?.strategies.some(
          (strategy) =>
            strategy.issueTypes.some((type) => type.toLowerCase() === source.rawIssueType?.toLowerCase()) &&
            (strategy.requiredLabels ?? []).every((label) => issue.labels.includes(label))
        )
      );
    if (cancelled && resolution === 'missing' && issue.issueType === 'BUG')
      warnings.push('Annulée — motif non renseigné');
    if (resolution === 'conflict') warnings.push('Motifs d’annulation contradictoires');
    if (resolution === 'status-conflict') warnings.push('Label de résolution sans statut Project Cancelled');
    if (issue.issueType === 'FEATURE' && issue.criticalities.length)
      warnings.push('Type et labels contradictoires');
    if (issue.componentIds.length > 1)
      warnings.push(
        issue.issueType === 'AUDIT'
          ? 'Audit lié à plusieurs composants — rattachement à corriger'
          : 'Issue liée à plusieurs composants — à séparer en issues distinctes'
      );
    if (!issue.componentIds.length && (auditCandidate || issue.issueType === 'BUG'))
      warnings.push('Label composant manquant');
    for (const label of issue.labels)
      if (rules.issuePolicy?.componentLabels?.[label]) warnings.push('Label composant à corriger : ' + label);
    const project = !issue.projectContexts.length
      ? 'none'
      : issue.projectContexts.some((context) => !(context.rawStatus ?? context.status ?? '').trim())
        ? 'missing-status'
        : 'with-status';
    const correctionLabel = cancelled
      ? resolution === 'accepted'
        ? 'Annulée — anomalie acceptée'
        : resolution === 'invalid'
          ? 'Annulée — anomalie non justifiée'
          : resolution === 'conflict'
            ? 'Annulée — motifs contradictoires'
            : 'Annulée — motif non renseigné'
      : confirmed
        ? 'Corrigée — en attente de vérification par audit'
        : done
          ? 'Correction non confirmée — PR fusionnée manquante'
          : merged.length
            ? 'Correction non confirmée — statut Project à vérifier'
            : issue.state === 'CLOSED'
              ? 'Fermée — résolution non déterminée'
              : 'Restant à corriger';
    issue.review = {
      algorithm: 'issue-review-v1',
      kinds: classifyLabels(issue.labels, rules.issuePolicy),
      typeSource: source.rawIssueType
        ? 'github'
        : issue.issueType === 'BUG' &&
            matchesLabels(issue.labels, rules.issuePolicy?.bugInference ?? defaultIssuePolicy.bugInference)
          ? 'labels'
          : source.issueType === 'AUDIT'
            ? 'unconfirmed'
            : 'legacy',
      project,
      auditCandidate,
      advice: matchesLabels(
        issue.labels,
        rules.issuePolicy?.auditorAdvice ?? defaultIssuePolicy.auditorAdvice
      ),
      resolution,
      neutralized: cancelled && ['accepted', 'invalid'].includes(resolution),
      correctionConfirmed: confirmed,
      ...(source.milestone ? { correctionVersion: source.milestone.title } : {}),
      mergedPullRequestIds: merged,
      correctionLabel,
      verification: 'pending',
      verifyingAuditIds: [],
      warnings
    };
    if (source.issueType === 'AUDIT' && !data.audits.some((audit) => audit.issueId === issue.issueId))
      warnings.push('Type audit non confirmé ou rattachement incomplet');
    const componentNames = issue.componentIds.map(
      (id) => data.components.find((component) => component.componentId === id)?.name
    );
    for (const name of componentNames) {
      const capturedCatalogueListed = raw.catalogueComponents.includes(name ?? '');
      const normalized = data.components.find(
        (component) => component.name === name && component.libraryId === issue.libraryId
      );
      const library = data.libraries.find((item) => item.libraryId === issue.libraryId);
      const declared = catalogue?.components.some(
        (item) => item.repository === library?.name && item.name === name
      );
      if (
        (catalogue !== undefined || raw.catalogueComponents.length > 0) &&
        !declared &&
        !capturedCatalogueListed &&
        normalized?.discoverySource !== 'catalogue' &&
        normalized?.provenance.source !== 'catalogue'
      )
        warnings.push('Composant absent du catalogue : ' + name);
    }
  }
  for (const anomaly of data.anomalies) {
    const issue = data.issues?.find((item) => item.issueId === anomaly.issueId);
    if (!issue?.review) continue;
    anomaly.accessibility =
      issue.review.kinds.includes('accessibility') ||
      (anomaly.origin === 'AUDIT' && issue.review.kinds.length === 0);
    if (anomaly.accessibility && !issue.review.kinds.includes('accessibility'))
      issue.review.kinds.push('accessibility');
    anomaly.neutralized = issue.review.neutralized;
    if (issue.review.correctionConfirmed) anomaly.status = 'done';
    else if (anomaly.status === 'done') anomaly.status = 'open';
    const audit = data.audits.find((item) => item.auditId === anomaly.auditId);
    if (audit && !issue.componentIds.includes(audit.componentId))
      issue.review.warnings.push('Composant de l’anomalie différent de celui de l’audit');
  }
  const blockedAudits = new Set(
    data.anomalies
      .filter((item) => item.accessibility && !item.neutralized)
      .flatMap(
        (item) =>
          data.issues
            ?.find((source) => source.issueId === item.issueId)
            ?.componentIds.map((id) => `${item.auditId}:${id}`) ?? []
      )
  );
  for (const anomaly of data.anomalies) {
    const issue = data.issues?.find((item) => item.issueId === anomaly.issueId);
    if (!issue?.review) continue;
    const review = issue.review;
    if (!review.correctionConfirmed) continue;
    if (!review.kinds.includes('accessibility')) {
      review.verification = 'indeterminate';
      review.correctionLabel = 'Correction confirmée';
      continue;
    }
    const version = review.correctionVersion;
    if (!version || !/^\d+\.\d+\.\d+$/.test(version) || !issue.componentIds.length) {
      review.verification = 'indeterminate';
      continue;
    }
    const correctionDate = Math.max(
      ...review.mergedPullRequestIds.map((id) => Date.parse(prs.get(id)?.mergedAt ?? '')),
      Date.parse(lastDoneAt(issue) ?? issue.closedAt ?? '')
    );
    const candidates = data.audits.filter(
      (candidate) =>
        candidate.lifecycle === 'completed' &&
        issue.componentIds.includes(candidate.componentId) &&
        /^\d+\.\d+\.\d+$/.test(candidate.version) &&
        compareReviewVersions(candidate.version, version) >= 0 &&
        Number.isFinite(correctionDate) &&
        Date.parse(candidate.completedAt ?? '') >= correctionDate
    );
    const verifiedComponents = new Set<string>();
    for (const candidate of candidates) {
      const blockers = blockedAudits.has(`${candidate.auditId}:${candidate.componentId}`);
      if (!blockers) {
        verifiedComponents.add(candidate.componentId);
        review.verifyingAuditIds.push(candidate.auditId);
      }
    }
    review.verification = issue.componentIds.every((id) => verifiedComponents.has(id))
      ? 'verified'
      : candidates.length
        ? 'indeterminate'
        : 'pending';
    review.correctionLabel =
      review.verification === 'verified'
        ? 'Corrigée — vérifiée par audit ultérieur'
        : review.verification === 'indeterminate'
          ? 'Corrigée — vérification individuelle indéterminée'
          : review.correctionLabel;
  }
}

/** Expose l’état d’une anomalie sans inférer une correction depuis Closed. */
export function issueCorrectionLabel(issue: Issue): string {
  return issue.review?.correctionLabel ?? 'Évaluation indisponible — relancer le pipeline';
}
