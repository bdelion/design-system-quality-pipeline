import pLimit from 'p-limit';
import type { RawDataset, RawIssue, RawPullRequest, RawRepository } from '../domain/types.js';
import type { GithubProcessingConfig } from '../config.js';

interface GithubIssue {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  labels: Array<{ name?: string }>;
  body?: string | null;
  created_at: string;
  closed_at?: string | null;
  pull_request?: { url?: string };
  milestone?: { id: number; number: number; title: string } | null;
  type?: { name?: string } | null;
}

interface GithubGraphqlIssueData {
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

interface GithubProjectStatus {
  projectId: string;
  projectName: string;
  status: string;
}

interface GithubProjectCard {
  project?: { id?: number; name?: string };
  column?: { name?: string };
}

type GithubTimelineEvent = Record<string, unknown>;

interface GithubRepository {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
  default_branch: string;
}

interface GithubCollectorOptions {
  token: string;
  owner: string;
  repositories: string[];
  apiUrl?: string | undefined;
  graphqlUrl?: string | undefined;
  maxRetries?: number | undefined;
  rules: GithubProcessingConfig;
}

const apiVersion = '2022-11-28';

/** Collecte les repositories configurés sans modifier les données GitHub. */
export async function collectGithub(options: GithubCollectorOptions): Promise<RawDataset> {
  const apiUrl = options.apiUrl ?? 'https://api.github.com';
  const collectedAt = new Date().toISOString();
  const repositories = await Promise.all(options.repositories.map((repository) => collectRepository(repository, options, apiUrl)));
  return { collectedAt, repositories, catalogueComponents: [], nexusAvailable: false };
}

/** Collecte un repository et transforme ses issues et PR en données RAW. */
async function collectRepository(repositoryName: string, options: GithubCollectorOptions, apiUrl: string): Promise<RawRepository> {
  const repository = await githubGet<GithubRepository>(apiUrl, `/repos/${encodeURIComponent(options.owner)}/${encodeURIComponent(repositoryName)}`, options);
  const issues = await githubGetAll<GithubIssue>(apiUrl, `/repos/${repository.full_name}/issues?state=all&per_page=100`, options);
  const pullRequests = await githubGetAll<GithubPullRequest>(apiUrl, `/repos/${repository.full_name}/pulls?state=all&per_page=100`, options);
  const rawPullRequests = pullRequests.map((pullRequest) => toRawPullRequest(pullRequest, repository.full_name, options.rules));
  const pullRequestByNumber = new Map(pullRequests.map((pullRequest) => [pullRequest.number, pullRequest]));
  // Les pull requests apparaissent aussi dans l'endpoint des issues : elles sont écartées ici.
  const limit = pLimit(5);

  const rawIssues = await Promise.all(
    issues
      .filter((issue) => !issue.pull_request)
      .map(issue =>
        limit(async () => {

          const timeline =
            await githubGetAll<GithubTimelineEvent>(
              apiUrl,
              `/repos/${repository.full_name}/issues/${issue.number}/timeline?per_page=100`,
              options
            );

          const graphqlData =
            options.graphqlUrl
              ? await issueDataFromGraphql(
                options.graphqlUrl,
                options,
                repository.owner.login,
                repository.name,
                issue.number
              )
              : {
                pullRequests: [],
                projectStatuses: []
              };

          const restProjectStatuses =
            await projectStatusesFromRest(
              apiUrl,
              repository.full_name,
              issue.number,
              options
            );

          return toRawIssue(
            issue,
            repository.full_name,
            pullRequestByNumber,
            options.rules,
            timeline,
            graphqlData.pullRequests,
            [
              ...restProjectStatuses,
              ...graphqlData.projectStatuses
            ]
          );
        })
      )
  );
  ;
  return {
    id: String(repository.id),
    name: repository.name,
    owner: repository.owner.login,
    defaultBranch: repository.default_branch,
    issues: rawIssues,
    pullRequests: rawPullRequests
  };
}

/** Convertit une issue GitHub en conservant ses labels et relations explicites. */
function toRawIssue(issue: GithubIssue, repository: string, pullRequestByNumber: Map<number, GithubPullRequest>, rules: GithubProcessingConfig, timeline: GithubTimelineEvent[], graphqlPullRequests: GithubGraphqlPullRequest[], projectStatuses: GithubProjectStatus[]): RawIssue {
  const labels = issue.labels.map((label) => label.name).filter((label): label is string => Boolean(label));
  const componentLabel = labels.find((label) => label.toLowerCase().startsWith(rules.labels.componentPrefix.toLowerCase()));
  const issueType = issue.type?.name?.toUpperCase() ?? inferIssueType(labels, issue.title, rules);
  const linkedPullRequestNumbers = [...new Set([
    ...extractClosingReferences(issue.body, rules.closingKeywords),
    ...extractClosingReferences(issue.title, rules.closingKeywords),
    ...extractTimelinePullRequestNumbers(timeline, pullRequestByNumber),
    ...graphqlPullRequests.map((pullRequest) => pullRequest.number)
  ])];
  const linkedPullRequestIds = linkedPullRequestNumbers
    .map((number) => pullRequestByNumber.get(number))
    .filter((pullRequest): pullRequest is GithubPullRequest => Boolean(pullRequest))
    .map((pullRequest) => `${repository}:pr:${pullRequest.id}`);
  return {
    id: `${repository}:issue:${issue.number}`,
    number: issue.number,
    title: issue.title,
    state: issue.state.toUpperCase() as RawIssue['state'],
    issueType: issueType as RawIssue['issueType'],
    labels,
    ...(componentLabel ? { component: componentLabel.slice(rules.labels.componentPrefix.length) } : {}),
    criticities: labels.filter((label) => label.toLowerCase().startsWith(rules.labels.criticalityPrefix.toLowerCase())).map((label) => label.slice(rules.labels.criticalityPrefix.length).toLowerCase()),
    parents: [],
    createdAt: issue.created_at,
    ...(issue.closed_at ? { closedAt: issue.closed_at } : {}),
    linkedPullRequestIds,
    projectStatuses,
    ...(issue.milestone ? { milestone: issue.milestone } : {})
  };
}

/** Récupère en une seule requête GraphQL les PR liées et les statuts Projects v2. */
async function issueDataFromGraphql(
  graphqlUrl: string,
  options: GithubCollectorOptions,
  owner: string,
  repository: string,
  issueNumber: number
): Promise<GithubGraphqlIssueData> {

  const response = await fetch(graphqlUrl, {
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
                    }
                  }
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
  });

  if (!response.ok) {
    throw new Error(
      `GitHub GraphQL request failed (${response.status}).`
    );
  }

  const payload = await response.json() as {
    data?: {
      rateLimit?: {
        cost: number;
        remaining: number;
        resetAt: string;
      };
      repository?: {
        issue?: {
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
                  field?: {
                    name?: string;
                  };
                }>;
              };
            } | null>;
          };
        } | null;
      } | null;
    };

    errors?: Array<{
      message?: string;
    }>;
  };

  const rateLimitExceeded = payload.errors?.some(
    error =>
      error.message?.toLowerCase().includes('rate limit')
  );

  if (rateLimitExceeded) {
    console.warn(`GraphQL rate limit exceeded for issue #${issueNumber}`);

    return {
      pullRequests: [],
      projectStatuses: []
    };
  }

  if (payload.errors?.length) {
    throw new Error(
      `GitHub GraphQL query failed: ${payload.errors
        .map(error => error.message ?? 'unknown error')
        .join('; ')
      }`
    );
  }

  const issue = payload.data?.repository?.issue;

  const pullRequests =
    issue?.closedByPullRequestsReferences?.nodes
      ?.filter(
        (pr): pr is GithubGraphqlPullRequest =>
          Boolean(pr)
      ) ?? [];

  const projectStatuses =
    issue?.projectItems?.nodes?.flatMap(item => {

      const project = item?.project;

      const status =
        item?.fieldValues?.nodes?.find(
          field =>
            field.field?.name?.toLowerCase() === 'status'
            && field.name
        );

      return (
        project?.id &&
        project.title &&
        status?.name
      )
        ? [{
          projectId: project.id,
          projectName: project.title,
          status: status.name
        }]
        : [];

    }) ?? [];

  if (payload.data?.rateLimit) {
    console.debug(`GraphQL rate limit: remaining=${payload.data.rateLimit.remaining}, cost=${payload.data.rateLimit.cost}`);
  }

  return {
    pullRequests,
    projectStatuses
  };
}

/** Récupère les statuts des Projects classiques exposés par l'API REST. */
async function projectStatusesFromRest(apiUrl: string, repository: string, issueNumber: number, options: GithubCollectorOptions): Promise<GithubProjectStatus[]> {
  try {
    const cards = await githubGetAll<GithubProjectCard>(apiUrl, `/repos/${repository}/issues/${issueNumber}/projects?per_page=100`, options);
    return cards.flatMap((card) => card.project?.id && card.project.name && card.column?.name
      ? [{ projectId: String(card.project.id), projectName: card.project.name, status: card.column.name }]
      : []);
  } catch (error) {
    if (error instanceof Error && /\(404\)|\(410\)/.test(error.message)) return [];
    throw error;
  }
}

/** Extrait uniquement les références PR présentes dans les événements pertinents. */
function extractTimelinePullRequestNumbers(events: GithubTimelineEvent[], pullRequestByNumber: Map<number, GithubPullRequest>): number[] {
  return events
    .filter((event) => event.event === 'cross-referenced' || event.event === 'connected')
    .flatMap((event) => collectPullRequestNumbers(event, pullRequestByNumber));
}

/** Parcourt récursivement un événement Timeline pour retrouver des URLs de PR. */
function collectPullRequestNumbers(value: unknown, pullRequestByNumber: Map<number, GithubPullRequest>): number[] {
  // Les événements Timeline sont récursifs et leur forme varie selon le type d'événement.
  if (typeof value === 'string') {
    return [...value.matchAll(/\/(?:pulls|pull)\/(\d+)(?:\D|$)/gi)]
      .map((match) => Number(match[1]))
      .filter((number) => pullRequestByNumber.has(number));
  }
  if (Array.isArray(value)) return value.flatMap((item) => collectPullRequestNumbers(item, pullRequestByNumber));
  if (value && typeof value === 'object') return Object.values(value).flatMap((item) => collectPullRequestNumbers(item, pullRequestByNumber));
  return [];
}

/** Convertit une PR GitHub et ses références de clôture en modèle RAW. */
function toRawPullRequest(pullRequest: GithubPullRequest, repository: string, rules: GithubProcessingConfig): RawPullRequest {
  return {
    id: `${repository}:pr:${pullRequest.id}`,
    number: pullRequest.number,
    state: pullRequest.merged_at ? 'MERGED' : pullRequest.state.toUpperCase() as RawPullRequest['state'],
    ...(pullRequest.merged_at ? { mergedAt: pullRequest.merged_at } : {}),
    relatedIssueIds: [...new Set([...extractClosingReferences(pullRequest.body, rules.closingKeywords), ...extractClosingReferences(pullRequest.title, rules.closingKeywords)])].map((number) => `${repository}:issue:${number}`)
  };
}

/** Déduit le type métier lorsque l'API GitHub ne le fournit pas. */
function inferIssueType(labels: string[], title: string, rules: GithubProcessingConfig): RawIssue['issueType'] {
  const normalized = `${labels.join(' ')} ${title}`.toLowerCase();
  for (const [issueType, keywords] of Object.entries(rules.issueTypes.keywords)) {
    if (keywords.some((keyword) => normalized.includes(keyword.toLowerCase()))) return issueType as RawIssue['issueType'];
  }
  return 'UNKNOWN';
}

/** Extrait les références `Closes`, `Fixes` et `Resolves` d'un texte GitHub. */
function extractClosingReferences(value: string | null | undefined, closingKeywords: string[]): number[] {
  if (!value) return [];
  const references: number[] = [];
  const expression = new RegExp(`(?:${closingKeywords.map((keyword) => escapeRegExp(keyword)).join('|')})\\s+(?:(?:[\\w.-]+\\/[\\w.-]+)|(?:https?:\\/\\/[^\\s]+\\/issues))?#(\\d+)`, 'gi');
  for (const match of value.matchAll(expression)) {
    const number = Number(match[1]);
    if (Number.isInteger(number)) references.push(number);
  }
  return references;
}

/** Protège les mots-clés avant leur insertion dans une expression régulière. */
function escapeRegExp(value: string): string { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

/** Récupère toutes les pages d'un endpoint GitHub. */
async function githubGetAll<T>(apiUrl: string, path: string, options: GithubCollectorOptions): Promise<T[]> {
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
async function githubGet<T>(apiUrl: string, path: string, options: GithubCollectorOptions): Promise<T> {
  return (await githubRequest<T>(`${apiUrl}${path}`, options)).data;
}

/** Effectue une requête HTTP GitHub avec retries limités et contrôlés. */
async function githubRequest<T>(url: string, options: GithubCollectorOptions): Promise<{ data: T; headers: Headers }> {
  const maxRetries = options.maxRetries ?? 3;

  // Les erreurs API et réseau transitoires sont réessayées ; les erreurs permanentes échouent immédiatement.
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${options.token}`,
          'X-GitHub-Api-Version': apiVersion,
          'User-Agent': 'plume-ds-quality-board'
        }
      });

      if (response.ok) {
        return {
          data: await response.json() as T,
          headers: response.headers
        };
      }

      const retryable =
        response.status === 429 ||
        response.status === 502 ||
        response.status === 503 ||
        response.status === 504 ||
        (
          response.status === 403 &&
          response.headers.has('x-ratelimit-reset')
        );

      if (!retryable || attempt === maxRetries) {
        throw new Error(
          `GitHub API request failed (${response.status})`
        );
      }

      await delay(retryAfterMs(response.headers, attempt));

    } catch (error) {
      const retryable =
        error instanceof Error &&
        (
          error.message.includes('fetch failed') ||
          error.message.includes('timeout')
        );

      if (!retryable || attempt === maxRetries) {
        throw error;
      }

      console.warn(`Retry ${attempt + 1}/${maxRetries} after network error`);

      await delay(1000 * Math.pow(2, attempt));
    }
  }

  throw new Error('GitHub API request failed after retries.');
}

/** Extrait le lien de page suivante depuis l'en-tête Link. */
function nextLink(linkHeader: string | null): string | undefined {
  /** Récupère l'URL `next` dans l'en-tête de pagination GitHub. */
  const next = linkHeader?.split(',').find((part) => part.includes('rel="next"'));
  return next?.match(/<([^>]+)>/)?.[1];
}

/** Calcule l'attente selon les indications GitHub ou un backoff exponentiel. */
function retryAfterMs(headers: Headers, attempt: number): number {
  const retryAfter = Number(headers.get('retry-after'));
  if (Number.isFinite(retryAfter) && retryAfter > 0) return retryAfter * 1000;
  const reset = Number(headers.get('x-ratelimit-reset'));
  if (Number.isFinite(reset) && reset > 0) return Math.max(1000, reset * 1000 - Date.now());
  return 500 * 2 ** attempt;
}

/** Attend sans bloquer la boucle d'événements pendant un retry. */
function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/** Récupère le token uniquement depuis l'environnement local d'exécution. */
export function githubTokenFromEnvironment(): string {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is required for GitHub collection.');
  return token;
}
