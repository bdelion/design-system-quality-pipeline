import type { RawDataset, RawIssue, RawMilestone, RawProjectStatus, RawPullRequest, RawRepository } from '../domain/types.js';
import { createStableMapper } from './mapping.js';
import type { AnonymizationOptions, AnonymizationReport, AnonymizationResult } from './types.js';
import { sanitizeText } from './sanitize.js';

const MS_PER_DAY = 86_400_000;

export type StableMapper = ReturnType<typeof createStableMapper>;


export function createAnonymizationMapper(seed: string): StableMapper {
  return createStableMapper(seed);
}

function shiftDate(value: string | undefined, offsetDays: number, report: AnonymizationReport): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  report.datesShifted++;
  return new Date(date.getTime() + offsetDays * MS_PER_DAY).toISOString();
}

function mappedNumber(map: StableMapper, namespace: string, repository: string, number: number, prefix: string): number {
  return Number.parseInt(map(namespace, `${repository}:${number}`, prefix).slice(2), 16) % 900000 + 100000;
}

function mapComponent(name: string, options: AnonymizationOptions, map: StableMapper): string {
  return options.preserveComponentNames ? name : map('component', name, 'component');
}

function anonymizeIssueUrl(
  value: string,
  owner: string,
  repository: string,
  issueNumber: number,
  map: StableMapper
): string {
  const url = new URL(value);
  const path = url.pathname.split('/').filter(Boolean);
  const issuePathIndex = path.lastIndexOf('issues');
  if (issuePathIndex < 2 || !path[issuePathIndex + 1]) {
    throw new Error(`Issue URL does not contain a GitHub issue path: ${value}`);
  }

  url.protocol = 'https:';
  url.hostname = 'github.invalid';
  url.port = '';
  url.username = '';
  url.password = '';
  url.pathname = `/${map('owner', owner, 'owner')}/${map('repository', repository, 'repo')}/issues/${mappedNumber(map, 'issue-number', repository, issueNumber, 'n')}`;
  url.search = '';
  url.hash = '';
  return url.toString();
}

/** Labels are analytical business data and must remain byte-for-byte unchanged. */
function preserveLabels(labels: string[]): string[] {
  return [...labels];
}

function anonymizeProjectStatus(status: RawProjectStatus, map: StableMapper, options: AnonymizationOptions, report: AnonymizationReport): RawProjectStatus {
  return {
    projectId: map('project', status.projectId, 'project'),
    projectName: options.strictText
      ? `project-${map('project-name', status.projectName, 'anon')}`
      : sanitizeText(status.projectName, options).value,
    // Project status is analytical business data and must remain unchanged.
    status: status.status,
    ...(status.iteration ? {
      iteration: {
        ...status.iteration,
        id: map('iteration', status.iteration.id, 'iteration'),
        title: options.strictText
          ? `iteration-${map('iteration-title', status.iteration.title, 'anon')}`
          : sanitizeText(status.iteration.title, options).value,
        ...(status.iteration.startDate
          ? { startDate: shiftDateOnly(status.iteration.startDate, options.dateOffsetDays, report) }
          : {}),
        ...(status.iteration.endDate
          ? { endDate: shiftDateOnly(status.iteration.endDate, options.dateOffsetDays, report) }
          : {})
      }
    } : {}),
    ...(status.velocity !== undefined ? { velocity: status.velocity } : {}),
    ...(status.scheduling !== undefined ? { scheduling: status.scheduling } : {}),
    ...(status.transitions ? {
      transitions: status.transitions.map((transition) => ({
        ...(transition.previousStatus !== undefined ? { previousStatus: transition.previousStatus } : {}),
        newStatus: transition.newStatus,
        ...(transition.changedAt
          ? { changedAt: shiftDate(transition.changedAt, options.dateOffsetDays, report)! }
          : {})
      }))
    } : {})
  };
}

function shiftDateOnly(value: string, offsetDays: number, report: AnonymizationReport): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Expected an ISO date for a GitHub Project iteration, received ${value}.`);
  }
  return shiftDate(`${value}T00:00:00.000Z`, offsetDays, report)!.slice(0, 10);
}

function anonymizeMilestone(
  milestone: RawMilestone,
  repository: string,
  map: StableMapper
): RawMilestone {
  return {
    id: mappedNumber(map, 'milestone', repository, milestone.id, 'm'),
    number: milestone.number,
    // Milestone title/state are analytical business data and must remain unchanged.
    title: milestone.title,
    ...(milestone.state ? { state: milestone.state } : {})
  };
}

function anonymizeIssue(
  issue: RawIssue,
  repo: string,
  owner: string,
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
    ...(issue.issueType !== undefined ? { issueType: issue.issueType } : {}),
    labels: preserveLabels(issue.labels),
    ...(issue.components ? {
      components: issue.components.map((component) => mapComponent(component, options, map))
    } : {}),
    ...(issue.component ? { component: mapComponent(issue.component, options, map) } : {}),
    criticities: [...issue.criticities],
    parents: issue.parents.map((parent) => map('issue', `${repo}:${parent}`, 'issue')),
    createdAt: shiftDate(issue.createdAt, options.dateOffsetDays, report)!,
    ...(issue.closedAt ? { closedAt: shiftDate(issue.closedAt, options.dateOffsetDays, report)! } : {}),
    ...(issue.url ? { url: anonymizeIssueUrl(issue.url, owner, repo, issue.number, map) } : {}),
    ...(issue.firstDoneAt ? { firstDoneAt: shiftDate(issue.firstDoneAt, options.dateOffsetDays, report)! } : {}),
    ...(issue.auditStatus ? { auditStatus: issue.auditStatus } : {}),
    ...(issue.auditResult ? { auditResult: issue.auditResult } : {}),
    linkedPullRequestIds: issue.linkedPullRequestIds.map((id) => map('pr', `${repo}:${id}`, 'pr')),
    projectStatuses: issue.projectStatuses.map((status) => anonymizeProjectStatus(status, map, options, report)),
    ...(issue.projectFields ? {
      projectFields: issue.projectFields.map((field) => ({
        ...field,
        projectId: map('project', field.projectId, 'project'),
        ...(typeof field.value === 'string' && !/^\d+\.\d+\.\d+(?:-rc\.\d+)?$/i.test(field.value)
          ? { value: options.strictText ? '[anonymized project value]' : sanitizeText(field.value, options).value }
          : {})
      }))
    } : {}),
    ...(issue.milestone ? { milestone: anonymizeMilestone(issue.milestone, repo, map) } : {})
  };
}

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
    issues: repository.issues.map((issue) => anonymizeIssue(issue, repository.name, repository.owner, options, map, report)),
    pullRequests: repository.pullRequests.map((pr) => anonymizePullRequest(pr, repository.name, options, map, report)),
    ...(repository.tags ? {
      tags: repository.tags.map((tag) => ({
        ...tag,
        ...(tag.createdAt ? { createdAt: shiftDate(tag.createdAt, options.dateOffsetDays, report)! } : {})
      }))
    } : {})
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
