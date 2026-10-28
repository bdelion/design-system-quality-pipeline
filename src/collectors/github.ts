/**
 * @module collectors.github
 * Collecte les faits GitHub nécessaires au modèle V1 sans inférer les règles métier.
 * @remarks Documentation des contrats et responsabilités du module.
 */

import { nominalVersion } from '../domain/version-scope.js';
import { defaultIssuePolicy, matchesLabels } from '../domain/issue-policy.js';
import { descriptionIssueReferences } from '../domain/description-references.js';
import pLimit from 'p-limit';
import { CollectionProgress } from '../lib/collection-progress.js';
import { GithubRequests, type GithubQuotaOptions } from './github-requests.js';
import type {
  RawDataset,
  RawPackageManifest,
  RawGitTag,
  RawHistoricalCatalogue,
  RawIssue,
  RawPullRequest,
  RawRepository
} from '../domain/types.js';
import { parse } from 'yaml';
import { validateCatalogue } from '../catalogue.js';
import type { GithubProcessingConfig } from '../config.js';

interface GithubIssue {
  id: number;
  number: number;
  title: string;
  html_url: string;
  state: 'open' | 'closed';
  labels: Array<{ name?: string }>;
  body?: string | null;
  created_at: string;
  closed_at?: string | null;
  pull_request?: { url?: string };
  milestone?: { id: number; number: number; title: string; state?: 'open' | 'closed' } | null;
  type?: { name?: string } | null;
}

interface GithubGraphqlIssueData {
  parents: string[];
  pullRequests: GithubGraphqlPullRequest[];
  projectStatuses: GithubProjectStatus[];
}

interface GithubPullRequest {
  id: number;
  number: number;
  state: 'open' | 'closed';
  merged_at?: string | null;
  title: string;
  body?: string | null;
}

interface GithubGraphqlPullRequest {
  id: number;
  number: number;
}

interface GithubProjectStatusTransition {
  projectId: string;
  projectName: string;
  previousStatus?: string;
  status: string;
  transitionedAt: string;
}

interface GithubProjectStatus {
  projectId: string;
  projectName: string;
  status: string;
  iteration?: {
    iterationId: string;
    title: string;
    startDate?: string;
    durationDays?: number;
    endDate?: string;
  };
  rawVelocity?: string | number;
  rawScheduling?: string | number;
  statusHistory?: GithubProjectStatusTransition[];
}

interface GithubProjectCard {
  project?: { id?: number; name?: string };
  column?: { name?: string };
}

type GithubTimelineEvent = Record<string, unknown>;

interface GithubGitRef {
  ref: string;
  object: { type: 'tag' | 'commit'; sha: string };
}

interface GithubAnnotatedTag {
  tag: string;
  tagger?: { date?: string };
}

interface GithubRepository {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
  default_branch: string;
}

/**
 * Paramètres de connexion et périmètre de la collecte GitHub.
 *
 * @inline
 */
export interface GithubCollectorOptions extends GithubQuotaOptions {
  token: string;
  owner: string;
  repositories: string[];
  apiUrl?: string | undefined;
  graphqlUrl?: string | undefined;
  maxRetries?: number | undefined;
  rules: GithubProcessingConfig;
}

type CollectionOptions = GithubCollectorOptions & { progress: CollectionProgress; requests: GithubRequests };

const apiVersion = '2022-11-28';

/** Collecte les repositories configurés sans modifier les données GitHub. */
export async function collectGithub(options: GithubCollectorOptions): Promise<RawDataset> {
  const apiUrl = options.apiUrl ?? 'https://api.github.com';
  const collectedAt = new Date().toISOString();
  const progress = new CollectionProgress(options.repositories.length);
  const requests = new GithubRequests(options.token, apiUrl, progress, options);
  let success = false;
  try {
    if (options.repositories.length) await requests.initialize();
    const repositories = await Promise.all(
      options.repositories.map(async (repository) => {
        const result = await collectRepository(repository, { ...options, progress, requests }, apiUrl);
        progress.repositoryCompleted();
        return result;
      })
    );
    success = true;
    return { collectedAt, repositories, catalogueComponents: [], nexusAvailable: false };
  } catch (error) {
    requests.abort(error);
    throw error;
  } finally {
    progress.finish(success);
  }
}

/** Collecte un repository et transforme ses issues et PR en données RAW. */
async function collectRepository(
  repositoryName: string,
  options: CollectionOptions,
  apiUrl: string
): Promise<RawRepository> {
  const repository = await githubGet<GithubRepository>(
    apiUrl,
    `/repos/${encodeURIComponent(options.owner)}/${encodeURIComponent(repositoryName)}`,
    options
  );
  const packageManifest = await collectPackageManifest(apiUrl, repository, options);
  const issues = await githubGetAll<GithubIssue>(
    apiUrl,
    `/repos/${repository.full_name}/issues?state=all&per_page=100`,
    options
  );
  const pullRequests = await githubGetAll<GithubPullRequest>(
    apiUrl,
    `/repos/${repository.full_name}/pulls?state=all&per_page=100`,
    options
  );
  const gitTags = await collectGitTags(apiUrl, repository.full_name, options);
  const historicalCatalogues = await collectHistoricalCatalogues(
    apiUrl,
    repository.full_name,
    gitTags,
    options
  );
  const pullRequestByNumber = new Map(pullRequests.map((pullRequest) => [pullRequest.number, pullRequest]));
  const rawPullRequests = pullRequests.map((pullRequest) =>
    toRawPullRequest(pullRequest, repository.full_name, options.rules, pullRequestByNumber)
  );
  // Les pull requests apparaissent aussi dans l'endpoint des issues : elles sont écartées ici.
  const limit = pLimit(5);

  options.progress.addIssues(issues.filter((issue) => !issue.pull_request).length);
  const rawIssues = await Promise.all(
    issues
      .filter((issue) => !issue.pull_request)
      .map((issue) =>
        limit(async () => {
          const timeline = await githubGetAll<GithubTimelineEvent>(
            apiUrl,
            `/repos/${repository.full_name}/issues/${issue.number}/timeline?per_page=100`,
            options
          );

          const graphqlData = options.graphqlUrl
            ? await issueDataFromGraphql(
                options.graphqlUrl,
                options,
                repository.owner.login,
                repository.name,
                issue.number
              )
            : {
                parents: [],
                pullRequests: [],
                projectStatuses: []
              };

          const restProjectStatuses = await projectStatusesFromRest(
            apiUrl,
            repository.full_name,
            issue.number,
            options
          );

          const result = toRawIssue(
            issue,
            repository.full_name,
            pullRequestByNumber,
            options.rules,
            timeline,
            graphqlData.pullRequests,
            [...restProjectStatuses, ...graphqlData.projectStatuses]
          );
          result.parents = graphqlData.parents;
          options.progress.issueCompleted();
          return result;
        })
      )
  );
  return {
    id: String(repository.id),
    name: repository.name,
    owner: repository.owner.login,
    defaultBranch: repository.default_branch,
    packageManifest,
    issues: rawIssues,
    pullRequests: rawPullRequests,
    gitTags,
    historicalCatalogues
  };
}

/** Lit uniquement la version du package racine sur la branche par défaut ; les erreurs API restent bloquantes. */
async function collectPackageManifest(
  apiUrl: string,
  repository: GithubRepository,
  options: CollectionOptions
): Promise<RawPackageManifest> {
  let content: { type?: string; encoding?: string; content?: string };
  try {
    content = await githubGet(
      apiUrl,
      `/repos/${repository.full_name}/contents/package.json?ref=${encodeURIComponent(repository.default_branch)}`,
      options
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'GitHub API request failed (404)')
      return { status: 'missing' };
    throw error;
  }
  try {
    if (content.type !== 'file' || content.encoding !== 'base64' || typeof content.content !== 'string')
      return { status: 'invalid' };
    const manifest: unknown = JSON.parse(Buffer.from(content.content, 'base64').toString('utf8'));
    const version =
      manifest && typeof manifest === 'object' && 'version' in manifest ? manifest.version : undefined;
    return typeof version === 'string' && nominalVersion(version)
      ? { status: 'available', version: version.trim() }
      : { status: 'invalid' };
  } catch {
    return { status: 'invalid' };
  }
}

/** Collecte les tags Git sans inventer de date pour les lightweight tags. */
async function collectGitTags(
  apiUrl: string,
  repository: string,
  options: CollectionOptions
): Promise<RawGitTag[]> {
  const refs = await githubGetAll<GithubGitRef>(
    apiUrl,
    `/repos/${repository}/git/matching-refs/tags/?per_page=100`,
    options
  );
  return Promise.all(
    refs.map(async (ref) => {
      const name = ref.ref.replace(/^refs\/tags\//, '');
      if (ref.object.type !== 'tag') return { name };
      const tag = await githubGet<GithubAnnotatedTag>(
        apiUrl,
        `/repos/${repository}/git/tags/${ref.object.sha}`,
        options
      );
      return tag.tagger?.date ? { name, createdAt: tag.tagger.date } : { name };
    })
  );
}

/** Collecte le catalogue versionné depuis l'arbre Git du tag PROD exact (D-143/D-210). */
async function collectHistoricalCatalogues(
  apiUrl: string,
  repository: string,
  gitTags: RawGitTag[],
  options: CollectionOptions
): Promise<RawHistoricalCatalogue[]> {
  const prodTags = gitTags
    .map((tag) => tag.name)
    .filter((name) => /^\d+\.\d+\.\d+$/.test(name))
    .sort();
  return Promise.all(
    prodTags.map(async (tagName) => {
      const url = `${apiUrl}/repos/${repository}/contents/config/catalogue.yaml?ref=${encodeURIComponent(tagName)}`;
      const response = await options.requests.request(
        url,
        {
          headers: {
            Accept: 'application/vnd.github.raw+json',
            Authorization: `Bearer ${options.token}`,
            'X-GitHub-Api-Version': apiVersion,
            'User-Agent': 'eventail-ds-quality-board'
          }
        },
        'rest'
      );
      if (response.status === 404) return { tagName, status: 'missing', componentNames: [] };
      if (!response.ok) throw new Error(`GitHub API request failed (${response.status})`);
      try {
        const catalogue = validateCatalogue(parse(await response.text()));
        return {
          tagName,
          status: 'available',
          componentNames: catalogue.components.map((component) => component.name)
        };
      } catch {
        return { tagName, status: 'invalid', componentNames: [] };
      }
    })
  );
}

/** Convertit une issue GitHub en conservant ses labels et relations explicites. */
function toRawIssue(
  issue: GithubIssue,
  repository: string,
  pullRequestByNumber: Map<number, GithubPullRequest>,
  rules: GithubProcessingConfig,
  timeline: GithubTimelineEvent[],
  graphqlPullRequests: GithubGraphqlPullRequest[],
  projectStatuses: GithubProjectStatus[]
): RawIssue {
  const labels = issue.labels.map((label) => label.name).filter((label): label is string => Boolean(label));
  const componentLabel = labels.find((label) =>
    label.toLowerCase().startsWith(rules.labels.componentPrefix.toLowerCase())
  );
  const issueType = issue.type?.name?.toUpperCase() ?? inferIssueType(labels, issue.title, rules);
  const linkedPullRequestNumbers = [
    ...new Set([
      ...extractClosingReferences(issue.body, rules.closingKeywords, repository)
        .filter((reference) => reference.repository === repository)
        .map((reference) => reference.number),
      ...extractClosingReferences(issue.title, rules.closingKeywords, repository)
        .filter((reference) => reference.repository === repository)
        .map((reference) => reference.number),
      ...extractTimelinePullRequestNumbers(timeline, pullRequestByNumber),
      ...graphqlPullRequests.map((pullRequest) => pullRequest.number)
    ])
  ];
  const linkedPullRequestIds = linkedPullRequestNumbers
    .map((number) => pullRequestByNumber.get(number))
    .filter((pullRequest): pullRequest is GithubPullRequest => Boolean(pullRequest))
    .map((pullRequest) => `${repository}:pr:${pullRequest.id}`);
  return {
    id: `${repository}:issue:${issue.number}`,
    number: issue.number,
    title: issue.title,
    url: issue.html_url,
    ...(issue.type?.name ? { rawIssueType: issue.type.name } : {}),
    state: issue.state.toUpperCase() as RawIssue['state'],
    issueType: issueType as RawIssue['issueType'],
    labels,
    ...(componentLabel ? { component: componentLabel.slice(rules.labels.componentPrefix.length) } : {}),
    criticities: labels
      .filter((label) =>
        label.toLowerCase().startsWith(rules.labels.accessibilityCriticalityPrefix.toLowerCase())
      )
      .map((label) => label.slice(rules.labels.accessibilityCriticalityPrefix.length).toLowerCase()),
    parents: [],
    descriptionIssueIds: descriptionIssueReferences(issue.body, repository),
    createdAt: issue.created_at,
    ...(issue.closed_at ? { closedAt: issue.closed_at } : {}),
    linkedPullRequestIds,
    projectStatuses,
    ...(issue.milestone
      ? {
          milestone: {
            id: issue.milestone.id,
            number: issue.milestone.number,
            title: issue.milestone.title,
            ...(issue.milestone.state ? { state: issue.milestone.state } : {})
          }
        }
      : {})
  };
}

/** Récupère en une requête les parents explicites, PR liées et statuts Projects v2, sans inférer de parent par label. */
async function issueDataFromGraphql(
  graphqlUrl: string,
  options: CollectionOptions,
  owner: string,
  repository: string,
  issueNumber: number
): Promise<GithubGraphqlIssueData> {
  const response = await options.requests.request(
    graphqlUrl,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${options.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: `
        query(
          $owner: String!,
          $repository: String!,
          $issueNumber: Int!
        ) {
          rateLimit {
            cost
            remaining
            resetAt
          }

          repository(
            owner: $owner,
            name: $repository
          ) {
            issue(number: $issueNumber) {

              parent {
                number
                repository { nameWithOwner }
              }

              closedByPullRequestsReferences(first: 100) {
                nodes {
                  id
                  number
                }
              }

              projectItems(first: 100) {
                nodes {
                  project {
                    id
                    title
                  }

                  fieldValues(first: 50) {
                    nodes {
                      ... on ProjectV2ItemFieldSingleSelectValue {
                        name
                        field {
                          ... on ProjectV2SingleSelectField {
                            name
                          }
                        }
                      }
                      ... on ProjectV2ItemFieldIterationValue {
                        iterationId
                        title
                        startDate
                        duration
                        field {
                          ... on ProjectV2IterationField {
                            name
                          }
                        }
                      }
                      ... on ProjectV2ItemFieldNumberValue {
                        number
                        field {
                          ... on ProjectV2Field {
                            name
                          }
                        }
                      }
                      ... on ProjectV2ItemFieldTextValue {
                        text
                        field {
                          ... on ProjectV2Field {
                            name
                          }
                        }
                      }
                    }
                  }
                }
              }

              timelineItems(first: 100, itemTypes: [PROJECT_V2_ITEM_STATUS_CHANGED_EVENT]) {
                nodes {
                  ... on ProjectV2ItemStatusChangedEvent {
                    createdAt
                    previousStatus
                    status
                    project {
                      id
                      title
                    }
                  }
                }
                pageInfo {
                  hasNextPage
                  endCursor
                }
              }
            }
          }
        }
      `,
        variables: {
          owner,
          repository,
          issueNumber
        }
      })
    },
    'graphql'
  );

  if (!response.ok) {
    throw new Error(`GitHub GraphQL request failed (${response.status}).`);
  }

  const payload = (await response.json()) as {
    data?: {
      rateLimit?: {
        cost: number;
        remaining: number;
        resetAt: string;
      };
      repository?: {
        issue?: {
          parent?: { number: number; repository: { nameWithOwner: string } } | null;
          closedByPullRequestsReferences?: {
            nodes?: Array<GithubGraphqlPullRequest | null>;
          };
          projectItems?: {
            nodes?: Array<{
              project?: {
                id?: string;
                title?: string;
              };
              fieldValues?: {
                nodes?: Array<{
                  name?: string;
                  number?: number;
                  text?: string;
                  iterationId?: string;
                  title?: string;
                  startDate?: string;
                  duration?: number;
                  field?: {
                    name?: string;
                  };
                }>;
              };
            } | null>;
          };
          timelineItems?: {
            nodes?: Array<{
              createdAt?: string;
              previousStatus?: string;
              status?: string;
              project?: { id?: string; title?: string } | null;
            } | null>;
            pageInfo?: { hasNextPage?: boolean; endCursor?: string | null };
          };
        } | null;
      } | null;
    };

    errors?: Array<{
      message?: string;
    }>;
  };

  if (payload.errors?.length) {
    throw new Error(
      `GitHub GraphQL query failed: ${payload.errors
        .map((error) => error.message ?? 'unknown error')
        .join('; ')}`
    );
  }

  const issue = payload.data?.repository?.issue;

  const pullRequests =
    issue?.closedByPullRequestsReferences?.nodes?.filter((pr): pr is GithubGraphqlPullRequest =>
      Boolean(pr)
    ) ?? [];

  const initialStatusHistory = statusHistoryFromTimelineNodes(issue?.timelineItems?.nodes ?? []);
  const additionalStatusHistory =
    issue?.timelineItems?.pageInfo?.hasNextPage && issue.timelineItems.pageInfo.endCursor
      ? await collectRemainingProjectStatusHistory(
          graphqlUrl,
          options,
          owner,
          repository,
          issueNumber,
          issue.timelineItems.pageInfo.endCursor
        )
      : [];
  const statusHistory = [...initialStatusHistory, ...additionalStatusHistory].sort((left, right) =>
    left.transitionedAt.localeCompare(right.transitionedAt)
  );

  const projectStatuses =
    issue?.projectItems?.nodes?.flatMap((item) => {
      const project = item?.project;

      const fields = item?.fieldValues?.nodes ?? [];
      const status = fields.find(
        (field) => field.field?.name?.trim().toLowerCase() === 'status' && field.name
      );
      const iteration = fields.find(
        (field) => field.field?.name?.trim().toLowerCase() === 'iteration' && field.iterationId && field.title
      );
      const velocity = fields.find((field) => field.field?.name?.trim().toLowerCase() === 'velocity');
      const scheduling = fields.find((field) => field.field?.name?.trim().toLowerCase() === 'scheduling');

      return project?.id && project.title && status?.name
        ? [
            {
              projectId: project.id,
              projectName: project.title,
              status: status.name,
              ...(iteration?.iterationId && iteration.title
                ? {
                    iteration: {
                      iterationId: iteration.iterationId,
                      title: iteration.title,
                      ...(iteration.startDate ? { startDate: iteration.startDate } : {}),
                      ...(iteration.duration !== undefined ? { durationDays: iteration.duration } : {})
                    }
                  }
                : {}),
              ...(velocity?.number !== undefined
                ? { rawVelocity: velocity.number }
                : velocity?.text !== undefined
                  ? { rawVelocity: velocity.text }
                  : {}),
              ...(scheduling?.name !== undefined
                ? { rawScheduling: scheduling.name }
                : scheduling?.number !== undefined
                  ? { rawScheduling: scheduling.number }
                  : scheduling?.text !== undefined
                    ? { rawScheduling: scheduling.text }
                    : {}),
              statusHistory: statusHistory
                .filter((transition) => transition.projectId === project.id)
                .map(({ projectId, projectName, previousStatus, status, transitionedAt }) => ({
                  projectId,
                  projectName,
                  ...(previousStatus !== undefined ? { previousStatus } : {}),
                  status,
                  transitionedAt
                }))
            }
          ]
        : [];
    }) ?? [];

  if (payload.data?.rateLimit) {
    options.progress.updateQuota(payload.data.rateLimit.remaining, payload.data.rateLimit.cost);
  }

  return {
    parents: issue?.parent ? [`${issue.parent.repository.nameWithOwner}:issue:${issue.parent.number}`] : [],
    pullRequests,
    projectStatuses
  };
}

/**
 * Réalise le traitement « status history from timeline nodes » dans le pipeline de qualité.
 *
 * @param nodes - Valeur de « nodes » utilisée par ce traitement.
 * @returns Résultat du traitement.
 */
function statusHistoryFromTimelineNodes(
  nodes: Array<{
    createdAt?: string;
    previousStatus?: string;
    status?: string;
    project?: { id?: string; title?: string } | null;
  } | null>
): GithubProjectStatusTransition[] {
  return nodes.flatMap((event) =>
    event?.createdAt && event.status && event.project?.id && event.project.title
      ? [
          {
            projectId: event.project.id,
            projectName: event.project.title,
            ...(event.previousStatus !== undefined ? { previousStatus: event.previousStatus } : {}),
            status: event.status,
            transitionedAt: event.createdAt
          }
        ]
      : []
  );
}

/** Pagine la timeline Project V2 afin de ne perdre aucune transition de statut. */
async function collectRemainingProjectStatusHistory(
  graphqlUrl: string,
  options: CollectionOptions,
  owner: string,
  repository: string,
  issueNumber: number,
  initialCursor: string
): Promise<GithubProjectStatusTransition[]> {
  const history: GithubProjectStatusTransition[] = [];
  let cursor: string | null = initialCursor;

  while (cursor) {
    const response = await options.requests.request(
      graphqlUrl,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${options.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: `
          query($owner: String!, $repository: String!, $issueNumber: Int!, $after: String!) {
            rateLimit { cost remaining resetAt }
            repository(owner: $owner, name: $repository) {
              issue(number: $issueNumber) {
                timelineItems(first: 100, after: $after, itemTypes: [PROJECT_V2_ITEM_STATUS_CHANGED_EVENT]) {
                  nodes {
                    ... on ProjectV2ItemStatusChangedEvent {
                      createdAt
                      previousStatus
                      status
                      project { id title }
                    }
                  }
                  pageInfo { hasNextPage endCursor }
                }
              }
            }
          }
        `,
          variables: { owner, repository, issueNumber, after: cursor }
        })
      },
      'graphql'
    );
    if (!response.ok) throw new Error(`GitHub GraphQL request failed (${response.status}).`);
    const payload = (await response.json()) as {
      data?: {
        repository?: {
          issue?: {
            timelineItems?: {
              nodes?: Array<{
                createdAt?: string;
                previousStatus?: string;
                status?: string;
                project?: { id?: string; title?: string } | null;
              } | null>;
              pageInfo?: { hasNextPage?: boolean; endCursor?: string | null };
            };
          } | null;
        } | null;
      };
      errors?: Array<{ message?: string }>;
    };
    if (payload.errors?.length) {
      throw new Error(
        `GitHub GraphQL query failed: ${payload.errors.map((error) => error.message ?? 'unknown error').join('; ')}`
      );
    }
    const timeline = payload.data?.repository?.issue?.timelineItems;
    history.push(...statusHistoryFromTimelineNodes(timeline?.nodes ?? []));
    cursor = timeline?.pageInfo?.hasNextPage ? (timeline.pageInfo.endCursor ?? null) : null;
  }
  return history;
}

/** Récupère les statuts des Projects classiques exposés par l'API REST. */
async function projectStatusesFromRest(
  apiUrl: string,
  repository: string,
  issueNumber: number,
  options: CollectionOptions
): Promise<GithubProjectStatus[]> {
  try {
    const cards = await githubGetAll<GithubProjectCard>(
      apiUrl,
      `/repos/${repository}/issues/${issueNumber}/projects?per_page=100`,
      options
    );
    return cards.flatMap((card) =>
      card.project?.id && card.project.name && card.column?.name
        ? [{ projectId: String(card.project.id), projectName: card.project.name, status: card.column.name }]
        : []
    );
  } catch (error) {
    if (error instanceof Error && /\(404\)|\(410\)/.test(error.message)) return [];
    throw error;
  }
}

/** Extrait uniquement les références PR présentes dans les événements pertinents. */
function extractTimelinePullRequestNumbers(
  events: GithubTimelineEvent[],
  pullRequestByNumber: Map<number, GithubPullRequest>
): number[] {
  return events
    .filter((event) => event.event === 'cross-referenced' || event.event === 'connected')
    .flatMap((event) => collectPullRequestNumbers(event, pullRequestByNumber));
}

/** Parcourt récursivement un événement Timeline pour retrouver des URLs de PR. */
function collectPullRequestNumbers(
  value: unknown,
  pullRequestByNumber: Map<number, GithubPullRequest>
): number[] {
  // Les événements Timeline sont récursifs et leur forme varie selon le type d'événement.
  if (typeof value === 'string') {
    return [...value.matchAll(/\/(?:pulls|pull)\/(\d+)(?:\D|$)/gi)]
      .map((match) => Number(match[1]))
      .filter((number) => pullRequestByNumber.has(number));
  }
  if (Array.isArray(value))
    return value.flatMap((item) => collectPullRequestNumbers(item, pullRequestByNumber));
  if (value && typeof value === 'object')
    return Object.values(value).flatMap((item) => collectPullRequestNumbers(item, pullRequestByNumber));
  return [];
}

/** Convertit une PR et conserve les références d’issues sans confondre les PR connues avec des issues. */
function toRawPullRequest(
  pullRequest: GithubPullRequest,
  repository: string,
  rules: GithubProcessingConfig,
  pullRequestByNumber: Map<number, GithubPullRequest>
): RawPullRequest {
  return {
    id: `${repository}:pr:${pullRequest.id}`,
    number: pullRequest.number,
    state: pullRequest.merged_at ? 'MERGED' : (pullRequest.state.toUpperCase() as RawPullRequest['state']),
    ...(pullRequest.merged_at ? { mergedAt: pullRequest.merged_at } : {}),
    relatedIssueIds: [
      ...new Set(
        [
          ...extractClosingReferences(pullRequest.body, rules.closingKeywords, repository),
          ...extractClosingReferences(pullRequest.title, rules.closingKeywords, repository)
        ]
          .filter(
            (reference) => reference.repository !== repository || !pullRequestByNumber.has(reference.number)
          )
          .map((reference) => `${reference.repository}:issue:${reference.number}`)
      )
    ]
  };
}

/** Déduit le type métier lorsque l'API GitHub ne le fournit pas. */
function inferIssueType(
  labels: string[],
  title: string,
  rules: GithubProcessingConfig
): RawIssue['issueType'] {
  // Le titre ne prouve aucun type métier ; « auditeur » ne signifie pas « audit ».
  void title;
  if (matchesLabels(labels, rules.issuePolicy?.bugInference ?? defaultIssuePolicy.bugInference)) return 'BUG';
  return 'UNKNOWN';
}

/** Extrait les références de clôture en conservant leur dépôt explicite ou celui du texte source. */
function extractClosingReferences(
  value: string | null | undefined,
  closingKeywords: string[],
  repository: string
): { repository: string; number: number }[] {
  if (!value) return [];
  const references: { repository: string; number: number }[] = [];
  const expression = new RegExp(
    `\\b(?:${closingKeywords.map((keyword) => escapeRegExp(keyword)).join('|')})\\s+(?:https?:\\/\\/[^\\s/]+\\/([\\w.-]+\\/[\\w.-]+)\\/issues\\/(\\d+)|(?:([\\w.-]+\\/[\\w.-]+))?#(\\d+))`,
    'gi'
  );
  for (const match of value.matchAll(expression)) {
    const number = Number(match[2] ?? match[4]);
    if (Number.isSafeInteger(number) && number > 0)
      references.push({ repository: match[1] ?? match[3] ?? repository, number });
  }
  return references;
}

/** Protège les mots-clés avant leur insertion dans une expression régulière. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Récupère toutes les pages d'un endpoint GitHub. */
async function githubGetAll<T>(apiUrl: string, path: string, options: CollectionOptions): Promise<T[]> {
  // Suit les liens de pagination fournis par GitHub jusqu'à la dernière page.
  const values: T[] = [];
  let nextUrl: string | undefined = `${apiUrl}${path}`;
  while (nextUrl) {
    const response = await githubRequest<T[]>(nextUrl, options);
    values.push(...response.data);
    nextUrl = nextLink(response.headers.get('link'));
  }
  return values;
}

/** Exécute une requête simple et retourne uniquement sa charge utile. */
async function githubGet<T>(apiUrl: string, path: string, options: CollectionOptions): Promise<T> {
  return (await githubRequest<T>(`${apiUrl}${path}`, options)).data;
}

/** Effectue une requête HTTP GitHub avec retries limités et contrôlés. */
async function githubRequest<T>(
  url: string,
  options: CollectionOptions
): Promise<{ data: T; headers: Headers }> {
  const response = await options.requests.request(url, {}, 'rest');
  if (!response.ok) throw new Error(`GitHub API request failed (${response.status})`);
  return { data: (await response.json()) as T, headers: response.headers };
}

/** Extrait le lien de page suivante depuis l'en-tête Link. */
function nextLink(linkHeader: string | null): string | undefined {
  /** Récupère l'URL `next` dans l'en-tête de pagination GitHub. */
  const next = linkHeader?.split(',').find((part) => part.includes('rel="next"'));
  return next?.match(/<([^>]+)>/)?.[1];
}

/** Récupère le token uniquement depuis l'environnement local d'exécution. */
export function githubTokenFromEnvironment(): string {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is required for GitHub collection.');
  return token;
}
