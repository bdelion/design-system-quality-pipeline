/**
 * @module anonymization.anonymizer
 * Anonymise un jeu de données RAW en préservant les relations nécessaires aux tests.
 * @remarks Documentation des contrats et responsabilités du module.
 */

import type {
  RawDataset,
  RawIssue,
  RawMilestone,
  RawProjectStatus,
  RawPullRequest,
  RawRepository
} from '../domain/types.js';
import { createStableMapper } from './mapping.js';
import type { AnonymizationOptions, AnonymizationReport, AnonymizationResult } from './types.js';
import { sanitizeText } from './sanitize.js';

const MS_PER_DAY = 86_400_000;

/**
 * Définit le type « StableMapper » utilisé dans les contrats du pipeline.
 */
export type StableMapper = ReturnType<typeof createStableMapper>;

/**
 * Crée le service de correspondance déterministe utilisé pour l’anonymisation.
 */
export function createAnonymizationMapper(seed: string): StableMapper {
  return createStableMapper(seed);
}

/**
 * Décale date dans le contexte du pipeline de qualité.
 *
 * @param value - Valeur de « value » utilisée par ce traitement.
 * @param offsetDays - Valeur de « offsetDays » utilisée par ce traitement.
 * @param report - Valeur de « report » utilisée par ce traitement.
 * @returns Résultat du traitement.
 */
function shiftDate(
  value: string | undefined,
  offsetDays: number,
  report: AnonymizationReport
): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  report.datesShifted++;
  return new Date(date.getTime() + offsetDays * MS_PER_DAY).toISOString();
}

/**
 * Réalise le traitement « mapped number » dans le pipeline de qualité.
 *
 * @param map - Valeur de « map » utilisée par ce traitement.
 * @param namespace - Valeur de « namespace » utilisée par ce traitement.
 * @param repository - Valeur de « repository » utilisée par ce traitement.
 * @param number - Valeur de « number » utilisée par ce traitement.
 * @param prefix - Valeur de « prefix » utilisée par ce traitement.
 * @returns Résultat du traitement.
 */
function mappedNumber(
  map: StableMapper,
  namespace: string,
  repository: string,
  number: number,
  prefix: string
): number {
  return (Number.parseInt(map(namespace, `${repository}:${number}`, prefix).slice(2), 16) % 900000) + 100000;
}

/**
 * Associe component dans le contexte du pipeline de qualité.
 *
 * @param name - Valeur de « name » utilisée par ce traitement.
 * @param options - Valeur de « options » utilisée par ce traitement.
 * @param map - Valeur de « map » utilisée par ce traitement.
 * @returns Valeur textuelle produite.
 */
function mapComponent(name: string, options: AnonymizationOptions, map: StableMapper): string {
  return options.preserveComponentNames ? name : map('component', name, 'component');
}

/** Labels are analytical business data and must remain byte-for-byte unchanged. */
function preserveLabels(labels: string[]): string[] {
  return [...labels];
}

/**
 * Anonymise project status dans le contexte du pipeline de qualité.
 *
 * @param status - Valeur de « status » utilisée par ce traitement.
 * @param map - Valeur de « map » utilisée par ce traitement.
 * @param options - Valeur de « options » utilisée par ce traitement.
 * @param report - Valeur de « report » utilisée par ce traitement.
 * @returns Résultat du traitement.
 */
function anonymizeProjectStatus(
  status: RawProjectStatus,
  map: StableMapper,
  options: AnonymizationOptions,
  report: AnonymizationReport
): RawProjectStatus {
  return {
    projectId: map('project', status.projectId, 'project'),
    projectName: options.strictText
      ? `project-${map('project-name', status.projectName, 'anon')}`
      : sanitizeText(status.projectName, options).value,
    // Project workflow values are analytical business data and must remain unchanged.
    status: status.status,
    ...(status.iteration ? { iteration: { ...status.iteration } } : {}),
    ...(status.rawVelocity !== undefined ? { rawVelocity: status.rawVelocity } : {}),
    ...(status.rawScheduling !== undefined ? { rawScheduling: status.rawScheduling } : {}),
    ...(status.statusHistory
      ? {
          statusHistory: status.statusHistory.map((transition) => ({
            ...(transition.previousStatus !== undefined ? { previousStatus: transition.previousStatus } : {}),
            status: transition.status,
            transitionedAt: shiftDate(transition.transitionedAt, options.dateOffsetDays, report)!
          }))
        }
      : {})
  };
}

/**
 * Anonymise milestone dans le contexte du pipeline de qualité.
 *
 * @param milestone - Valeur de « milestone » utilisée par ce traitement.
 * @param repository - Valeur de « repository » utilisée par ce traitement.
 * @param map - Valeur de « map » utilisée par ce traitement.
 * @returns Résultat du traitement.
 */
function anonymizeMilestone(milestone: RawMilestone, repository: string, map: StableMapper): RawMilestone {
  return {
    id: mappedNumber(map, 'milestone', repository, milestone.id, 'm'),
    number: milestone.number,
    // Milestone title/state are analytical business data and must remain unchanged.
    title: milestone.title,
    ...(milestone.state ? { state: milestone.state } : {})
  };
}

/**
 * Anonymise issue dans le contexte du pipeline de qualité.
 *
 * @param issue - Valeur de « issue » utilisée par ce traitement.
 * @param repo - Valeur de « repo » utilisée par ce traitement.
 * @param options - Valeur de « options » utilisée par ce traitement.
 * @param map - Valeur de « map » utilisée par ce traitement.
 * @param report - Valeur de « report » utilisée par ce traitement.
 * @returns Résultat du traitement.
 */
function anonymizeIssue(
  issue: RawIssue,
  repo: string,
  options: AnonymizationOptions,
  map: StableMapper,
  report: AnonymizationReport
): RawIssue {
  const title = options.strictText ? '[anonymized issue]' : sanitizeText(issue.title, options).value;
  if (title !== issue.title) report.textsSanitized++;

  return {
    id: map('issue', `${repo}:${issue.id}`, 'issue'),
    number: mappedNumber(map, 'issue-number', repo, issue.number, 'n'),
    title,
    // These are analytical business fields and are deliberately preserved.
    state: issue.state,
    issueType: issue.issueType,
    // rawIssueType is a business classification fact. Preserve it so the
    // anonymized fixture follows the same V1 specialization path as GitHub data.
    ...(issue.rawIssueType ? { rawIssueType: issue.rawIssueType } : {}),
    ...(issue.auditedReleaseCandidate ? { auditedReleaseCandidate: issue.auditedReleaseCandidate } : {}),
    labels: preserveLabels(issue.labels),
    ...(issue.component ? { component: mapComponent(issue.component, options, map) } : {}),
    criticities: [...issue.criticities],
    parents: issue.parents.map((parent) => map('issue', `${repo}:${parent}`, 'issue')),
    createdAt: shiftDate(issue.createdAt, options.dateOffsetDays, report)!,
    ...(issue.closedAt ? { closedAt: shiftDate(issue.closedAt, options.dateOffsetDays, report)! } : {}),
    ...(issue.firstDoneAt
      ? { firstDoneAt: shiftDate(issue.firstDoneAt, options.dateOffsetDays, report)! }
      : {}),
    ...(issue.auditStatus ? { auditStatus: issue.auditStatus } : {}),
    ...(issue.auditResult ? { auditResult: issue.auditResult } : {}),
    linkedPullRequestIds: issue.linkedPullRequestIds.map((id) => map('pr', `${repo}:${id}`, 'pr')),
    projectStatuses: issue.projectStatuses.map((status) =>
      anonymizeProjectStatus(status, map, options, report)
    ),
    ...(issue.milestone ? { milestone: anonymizeMilestone(issue.milestone, repo, map) } : {})
  };
}

/**
 * Anonymise pull request dans le contexte du pipeline de qualité.
 *
 * @param pr - Valeur de « pr » utilisée par ce traitement.
 * @param repo - Valeur de « repo » utilisée par ce traitement.
 * @param options - Valeur de « options » utilisée par ce traitement.
 * @param map - Valeur de « map » utilisée par ce traitement.
 * @param report - Valeur de « report » utilisée par ce traitement.
 * @returns Résultat du traitement.
 */
function anonymizePullRequest(
  pr: RawPullRequest,
  repo: string,
  options: AnonymizationOptions,
  map: StableMapper,
  report: AnonymizationReport
): RawPullRequest {
  return {
    id: map('pr', `${repo}:${pr.id}`, 'pr'),
    number: mappedNumber(map, 'pr-number', repo, pr.number, 'n'),
    state: pr.state,
    mergedAt: shiftDate(pr.mergedAt, options.dateOffsetDays, report),
    relatedIssueIds: pr.relatedIssueIds.map((id) => map('issue', `${repo}:${id}`, 'issue'))
  };
}

/**
 * Pseudonymise les données RAW tout en conservant leurs relations.
 */
export function anonymizeDataset(input: RawDataset, options: AnonymizationOptions): AnonymizationResult {
  const map = createAnonymizationMapper(options.seed);
  const report: AnonymizationReport = {
    repositories: input.repositories.length,
    issues: input.repositories.reduce((count, repository) => count + repository.issues.length, 0),
    pullRequests: input.repositories.reduce((count, repository) => count + repository.pullRequests.length, 0),
    components: input.catalogueComponents.length,
    ownersAnonymized: input.repositories.length,
    repositoryNamesAnonymized: input.repositories.length,
    idsAnonymized: 0,
    datesShifted: 0,
    textsSanitized: 0,
    suspiciousStrings: 0,
    warnings: []
  };

  const repositories: RawRepository[] = input.repositories.map((repository) => ({
    id: map('repository-id', repository.id, 'repo'),
    name: map('repository', repository.name, 'repo'),
    owner: map('owner', repository.owner, 'owner'),
    defaultBranch: repository.defaultBranch,
    issues: repository.issues.map((issue) => anonymizeIssue(issue, repository.name, options, map, report)),
    pullRequests: repository.pullRequests.map((pr) =>
      anonymizePullRequest(pr, repository.name, options, map, report)
    ),
    ...(repository.gitTags
      ? {
          gitTags: repository.gitTags.map((tag) => ({
            name: tag.name,
            ...(tag.createdAt ? { createdAt: shiftDate(tag.createdAt, options.dateOffsetDays, report)! } : {})
          }))
        }
      : {}),
    ...(repository.historicalCatalogues
      ? {
          historicalCatalogues: repository.historicalCatalogues.map((catalogue) => ({
            tagName: catalogue.tagName,
            status: catalogue.status,
            componentNames: catalogue.componentNames.map((component) => mapComponent(component, options, map))
          }))
        }
      : {})
  }));

  const dataset: RawDataset = {
    collectedAt: shiftDate(input.collectedAt, options.dateOffsetDays, report)!,
    repositories,
    catalogueComponents: input.catalogueComponents.map((component) => mapComponent(component, options, map)),
    nexusAvailable: input.nexusAvailable
  };

  report.idsAnonymized = report.issues + report.pullRequests + report.repositories;
  return { dataset, report };
}
