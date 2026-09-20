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
  type?: { name?: string } | null;
}

interface GithubPullRequest {
  id: number;
  number: number;
  state: 'open' | 'closed';
  merged_at?: string | null;
  title: string;
  body?: string | null;
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
  maxRetries?: number | undefined;
  rules: GithubProcessingConfig;
}

const apiVersion = '2022-11-28';

export async function collectGithub(options: GithubCollectorOptions): Promise<RawDataset> {
  const apiUrl = options.apiUrl ?? 'https://api.github.com';
  const collectedAt = new Date().toISOString();
  const repositories = await Promise.all(options.repositories.map((repository) => collectRepository(repository, options, apiUrl)));
  return { collectedAt, repositories, catalogueComponents: [], nexusAvailable: false };
}

async function collectRepository(repositoryName: string, options: GithubCollectorOptions, apiUrl: string): Promise<RawRepository> {
  const repository = await githubGet<GithubRepository>(apiUrl, `/repos/${encodeURIComponent(options.owner)}/${encodeURIComponent(repositoryName)}`, options);
  const issues = await githubGetAll<GithubIssue>(apiUrl, `/repos/${repository.full_name}/issues?state=all&per_page=100`, options);
  const pullRequests = await githubGetAll<GithubPullRequest>(apiUrl, `/repos/${repository.full_name}/pulls?state=all&per_page=100`, options);
  const rawPullRequests = pullRequests.map((pullRequest) => toRawPullRequest(pullRequest, repository.full_name, options.rules));
  const pullRequestByNumber = new Map(pullRequests.map((pullRequest) => [pullRequest.number, pullRequest]));
  const rawIssues = await Promise.all(issues.filter((issue) => !issue.pull_request).map(async (issue) => {
    const timeline = await githubGetAll<GithubTimelineEvent>(apiUrl, `/repos/${repository.full_name}/issues/${issue.number}/timeline?per_page=100`, options);
    return toRawIssue(issue, repository.full_name, pullRequestByNumber, options.rules, timeline);
  }));
  return {
    id: String(repository.id),
    name: repository.name,
    owner: repository.owner.login,
    defaultBranch: repository.default_branch,
    issues: rawIssues,
    pullRequests: rawPullRequests
  };
}

function toRawIssue(issue: GithubIssue, repository: string, pullRequestByNumber: Map<number, GithubPullRequest>, rules: GithubProcessingConfig, timeline: GithubTimelineEvent[]): RawIssue {
  const labels = issue.labels.map((label) => label.name).filter((label): label is string => Boolean(label));
  const componentLabel = labels.find((label) => label.toLowerCase().startsWith(rules.labels.componentPrefix.toLowerCase()));
  const issueType = issue.type?.name?.toUpperCase() ?? inferIssueType(labels, issue.title, rules);
  const linkedPullRequestNumbers = [...new Set([
    ...extractClosingReferences(issue.body, rules.closingKeywords),
    ...extractClosingReferences(issue.title, rules.closingKeywords),
    ...extractTimelinePullRequestNumbers(timeline, pullRequestByNumber)
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
    linkedPullRequestIds
  };
}

function extractTimelinePullRequestNumbers(events: GithubTimelineEvent[], pullRequestByNumber: Map<number, GithubPullRequest>): number[] {
  return events
    .filter((event) => event.event === 'cross-referenced' || event.event === 'connected')
    .flatMap((event) => collectPullRequestNumbers(event, pullRequestByNumber));
}

function collectPullRequestNumbers(value: unknown, pullRequestByNumber: Map<number, GithubPullRequest>): number[] {
  if (typeof value === 'string') {
    return [...value.matchAll(/\/(?:pulls|pull)\/(\d+)(?:\D|$)/gi)]
      .map((match) => Number(match[1]))
      .filter((number) => pullRequestByNumber.has(number));
  }
  if (Array.isArray(value)) return value.flatMap((item) => collectPullRequestNumbers(item, pullRequestByNumber));
  if (value && typeof value === 'object') return Object.values(value).flatMap((item) => collectPullRequestNumbers(item, pullRequestByNumber));
  return [];
}

function toRawPullRequest(pullRequest: GithubPullRequest, repository: string, rules: GithubProcessingConfig): RawPullRequest {
  return {
    id: `${repository}:pr:${pullRequest.id}`,
    number: pullRequest.number,
    state: pullRequest.merged_at ? 'MERGED' : pullRequest.state.toUpperCase() as RawPullRequest['state'],
    ...(pullRequest.merged_at ? { mergedAt: pullRequest.merged_at } : {}),
    relatedIssueIds: [...new Set([...extractClosingReferences(pullRequest.body, rules.closingKeywords), ...extractClosingReferences(pullRequest.title, rules.closingKeywords)])].map((number) => `${repository}:issue:${number}`)
  };
}

function inferIssueType(labels: string[], title: string, rules: GithubProcessingConfig): RawIssue['issueType'] {
  const normalized = `${labels.join(' ')} ${title}`.toLowerCase();
  for (const [issueType, keywords] of Object.entries(rules.issueTypes.keywords)) {
    if (keywords.some((keyword) => normalized.includes(keyword.toLowerCase()))) return issueType as RawIssue['issueType'];
  }
  return 'UNKNOWN';
}

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

function escapeRegExp(value: string): string { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

async function githubGetAll<T>(apiUrl: string, path: string, options: GithubCollectorOptions): Promise<T[]> {
  const values: T[] = [];
  let nextUrl: string | undefined = `${apiUrl}${path}`;
  while (nextUrl) {
    const response = await githubRequest<T[]>(nextUrl, options);
    values.push(...response.data);
    nextUrl = nextLink(response.headers.get('link'));
  }
  return values;
}

async function githubGet<T>(apiUrl: string, path: string, options: GithubCollectorOptions): Promise<T> {
  return (await githubRequest<T>(`${apiUrl}${path}`, options)).data;
}

async function githubRequest<T>(url: string, options: GithubCollectorOptions): Promise<{ data: T; headers: Headers }> {
  const maxRetries = options.maxRetries ?? 3;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${options.token}`,
        'X-GitHub-Api-Version': apiVersion,
        'User-Agent': 'design-system-quality-pipeline'
      }
    });
    if (response.ok) return { data: await response.json() as T, headers: response.headers };
    const retryable = response.status === 429 || response.status === 502 || response.status === 503 || response.status === 504 || (response.status === 403 && response.headers.has('x-ratelimit-reset'));
    if (!retryable || attempt === maxRetries) throw new Error(`GitHub API request failed (${response.status}) for ${new URL(url).pathname}`);
    await delay(retryAfterMs(response.headers, attempt));
  }
  throw new Error('GitHub API request failed after retries.');
}

function nextLink(linkHeader: string | null): string | undefined {
  const next = linkHeader?.split(',').find((part) => part.includes('rel="next"'));
  return next?.match(/<([^>]+)>/)?.[1];
}

function retryAfterMs(headers: Headers, attempt: number): number {
  const retryAfter = Number(headers.get('retry-after'));
  if (Number.isFinite(retryAfter) && retryAfter > 0) return retryAfter * 1000;
  const reset = Number(headers.get('x-ratelimit-reset'));
  if (Number.isFinite(reset) && reset > 0) return Math.max(1000, reset * 1000 - Date.now());
  return 500 * 2 ** attempt;
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function githubTokenFromEnvironment(): string {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is required for GitHub collection.');
  return token;
}
