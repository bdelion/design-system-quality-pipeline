import { afterEach, describe, expect, it, vi } from 'vitest';
import { collectGithub } from '../src/collectors/github.js';
import { loadConfig } from '../src/config.js';

const originalFetch = globalThis.fetch;

// Chaque test remplace fetch et doit restaurer l'environnement global à sa sortie.
afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('collecteur GitHub', () => {
  // Vérifie pagination, séparation issue/PR et liens détectés par les mots-clés.
  it('pagine les issues, sépare les PR et conserve les relations', async () => {
    const requests: string[] = [];
    globalThis.fetch = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      requests.push(url);
      if (url.endsWith('/repos/acme/design-system')) {
        return new Response(
          JSON.stringify({
            id: 1,
            name: 'design-system',
            full_name: 'acme/design-system',
            owner: { login: 'acme' },
            default_branch: 'main'
          }),
          { status: 200 }
        );
      }
      if (url.includes('/git/matching-refs/tags/')) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      if (url.includes('/issues?') && url.includes('page=2')) {
        return new Response(
          JSON.stringify([
            {
              id: 13,
              number: 13,
              title: 'Button audit',
              state: 'closed',
              labels: [{ name: 'Component:Button' }],
              created_at: '2026-09-02T00:00:00Z',
              closed_at: '2026-09-03T00:00:00Z'
            }
          ]),
          { status: 200 }
        );
      }
      if (url.includes('/issues?')) {
        return new Response(
          JSON.stringify([
            {
              id: 12,
              number: 12,
              title: 'Fix focus',
              html_url: 'https://github.com/acme/design-system/issues/12',
              type: { name: 'Bug' },
              state: 'open',
              labels: [{ name: 'Component:Button' }, { name: 'criticite:major' }, { name: 'rgaa:focus' }],
              body: 'Fixes #42',
              created_at: '2026-09-01T00:00:00Z',
              pull_request: undefined
            },
            {
              id: 42,
              number: 42,
              title: 'A pull request',
              state: 'open',
              labels: [],
              created_at: '2026-09-01T00:00:00Z',
              pull_request: { url: 'https://api.github.com/repos/acme/design-system/pulls/42' }
            }
          ]),
          {
            status: 200,
            headers: {
              link: '<https://api.github.com/repos/acme/design-system/issues?state=all&per_page=100&page=2>; rel="next"'
            }
          }
        );
      }
      if (url.includes('/pulls?')) {
        return new Response(
          JSON.stringify([
            {
              id: 900,
              number: 42,
              title: 'Fixes #12',
              body: 'Fixes #12',
              state: 'closed',
              merged_at: '2026-09-02T12:00:00Z'
            }
          ]),
          { status: 200 }
        );
      }
      if (url.includes('/projects?')) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      if (url.includes('/issues/13/timeline?')) {
        return new Response(
          JSON.stringify([
            {
              event: 'connected',
              source: {
                issue: {
                  number: 42,
                  pull_request: { html_url: 'https://github.com/acme/design-system/pull/42' }
                }
              }
            }
          ]),
          { status: 200 }
        );
      }
      if (url.includes('/issues/') && url.includes('/timeline?')) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      throw new Error(`Unexpected GitHub request: ${url}`);
    }) as typeof fetch;

    const config = await loadConfig();
    const dataset = await collectGithub({
      token: 'test-token',
      owner: 'acme',
      repositories: ['design-system'],
      apiUrl: 'https://api.github.com',
      rules: config.github
    });
    expect(dataset.repositories).toHaveLength(1);
    expect(dataset.repositories[0]?.issues).toHaveLength(2);
    expect(dataset.repositories[0]?.pullRequests[0]?.state).toBe('MERGED');
    expect(dataset.repositories[0]?.issues[0]?.linkedPullRequestIds).toEqual(['acme/design-system:pr:900']);
    expect(dataset.repositories[0]?.issues[0]).toMatchObject({
      rawIssueType: 'Bug',
      url: 'https://github.com/acme/design-system/issues/12'
    });
    expect(dataset.repositories[0]?.issues[1]?.linkedPullRequestIds).toEqual(['acme/design-system:pr:900']);
    expect(dataset.repositories[0]?.pullRequests[0]?.relatedIssueIds).toEqual([
      'acme/design-system:issue:12'
    ]);
    expect(requests.some((url) => url.includes('page=2'))).toBe(true);
  });

  // Vérifie le chemin GraphQL utilisé par la relation Development de GitHub.
  it('récupère une PR liée manuellement via GraphQL sans mot-clé de fermeture', async () => {
    globalThis.fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url === 'https://api.github.com/graphql') {
        return new Response(
          JSON.stringify({
            data: {
              repository: {
                issue: {
                  closedByPullRequestsReferences: { nodes: [{ id: 900, number: 42 }] },
                  projectItems: {
                    nodes: [
                      {
                        project: { id: 'project-1', title: 'Quality' },
                        fieldValues: {
                          nodes: [
                            { name: 'Cancelled', field: { name: 'Status' } },
                            {
                              iterationId: 'iteration-7',
                              title: 'Sprint 7',
                              startDate: '2026-09-28',
                              duration: 14,
                              field: { name: 'Iteration' }
                            },
                            { number: 5, field: { name: 'Velocity' } },
                            { name: '2', field: { name: 'Scheduling' } }
                          ]
                        }
                      }
                    ]
                  },
                  timelineItems: {
                    nodes: [
                      {
                        createdAt: '2026-09-30T08:00:00Z',
                        previousStatus: 'In progress',
                        status: 'Cancelled',
                        project: { id: 'project-1', title: 'Quality' }
                      }
                    ],
                    pageInfo: { hasNextPage: false, endCursor: null }
                  }
                }
              }
            }
          }),
          { status: 200 }
        );
      }
      if (url.endsWith('/repos/acme/design-system')) {
        return new Response(
          JSON.stringify({
            id: 1,
            name: 'design-system',
            full_name: 'acme/design-system',
            owner: { login: 'acme' },
            default_branch: 'main'
          }),
          { status: 200 }
        );
      }
      if (url.includes('/git/matching-refs/tags/')) return new Response(JSON.stringify([]), { status: 200 });
      if (url.includes('/issues?')) {
        return new Response(
          JSON.stringify([
            {
              id: 13,
              number: 13,
              title: 'Button audit',
              state: 'closed',
              labels: [{ name: 'Component:Button' }],
              created_at: '2026-09-02T00:00:00Z',
              closed_at: '2026-09-03T00:00:00Z'
            }
          ]),
          { status: 200 }
        );
      }
      if (url.includes('/pulls?')) {
        return new Response(
          JSON.stringify([
            {
              id: 900,
              number: 42,
              title: 'Button fix',
              body: 'Technical details only',
              state: 'closed',
              merged_at: '2026-09-02T12:00:00Z'
            }
          ]),
          { status: 200 }
        );
      }
      if (url.includes('/projects?')) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      if (url.includes('/timeline?')) return new Response(JSON.stringify([]), { status: 200 });
      throw new Error(`Unexpected GitHub request: ${url} ${init?.method ?? 'GET'}`);
    }) as typeof fetch;

    const config = await loadConfig();
    const dataset = await collectGithub({
      token: 'test-token',
      owner: 'acme',
      repositories: ['design-system'],
      apiUrl: 'https://api.github.com',
      graphqlUrl: 'https://api.github.com/graphql',
      rules: config.github
    });
    expect(dataset.repositories[0]?.issues[0]?.linkedPullRequestIds).toEqual(['acme/design-system:pr:900']);
    expect(dataset.repositories[0]?.issues[0]?.projectStatuses).toEqual([
      {
        projectId: 'project-1',
        projectName: 'Quality',
        status: 'Cancelled',
        iteration: {
          iterationId: 'iteration-7',
          title: 'Sprint 7',
          startDate: '2026-09-28',
          durationDays: 14
        },
        rawVelocity: 5,
        rawScheduling: '2',
        statusHistory: [
          {
            projectId: 'project-1',
            projectName: 'Quality',
            previousStatus: 'In progress',
            status: 'Cancelled',
            transitionedAt: '2026-09-30T08:00:00Z'
          }
        ]
      }
    ]);
  });
});

describe('catalogue historique GitHub', () => {
  it('lit le catalogue au tag PROD exact et conserve les indisponibilités sans fallback', async () => {
    globalThis.fetch = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.endsWith('/repos/acme/design-system')) {
        return new Response(
          JSON.stringify({
            id: 1,
            name: 'design-system',
            full_name: 'acme/design-system',
            owner: { login: 'acme' },
            default_branch: 'main'
          }),
          { status: 200 }
        );
      }
      if (url.includes('/git/matching-refs/tags/')) {
        return new Response(
          JSON.stringify([
            { ref: 'refs/tags/1.0.0', object: { type: 'commit', sha: 'a' } },
            { ref: 'refs/tags/1.1.0', object: { type: 'commit', sha: 'b' } },
            { ref: 'refs/tags/1.2.0-rc.1', object: { type: 'commit', sha: 'c' } }
          ]),
          { status: 200 }
        );
      }
      if (url.includes('/contents/config/catalogue.yaml?ref=1.0.0')) {
        return new Response(
          'version: "1.0"\ncomponents:\n  - name: Button\n    stream: React\n    owner: Front\n    squad: DS\n    status: stable\n    rgaaLevel: AA\n    tags: [form]\n',
          { status: 200 }
        );
      }
      if (url.includes('/contents/config/catalogue.yaml?ref=1.1.0')) return new Response('', { status: 404 });
      if (url.includes('/issues?') || url.includes('/pulls?'))
        return new Response(JSON.stringify([]), { status: 200 });
      throw new Error(`Unexpected GitHub request: ${url}`);
    }) as typeof fetch;

    const config = await loadConfig();
    const dataset = await collectGithub({
      token: 'test-token',
      owner: 'acme',
      repositories: ['design-system'],
      apiUrl: 'https://api.github.com',
      rules: config.github
    });
    expect(dataset.repositories[0]?.historicalCatalogues).toEqual([
      { tagName: '1.0.0', status: 'available', componentNames: ['Button'] },
      { tagName: '1.1.0', status: 'missing', componentNames: [] }
    ]);
  });
});
