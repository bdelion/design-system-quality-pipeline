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
      if (url.includes('/git/matching-refs/tags/')) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      if (url.endsWith('/issues/12/parent')) {
        return new Response(JSON.stringify({ number: 13 }), { status: 200 });
      }
      if (url.includes('/parent')) return new Response('{}', { status: 404 });
      if (url.endsWith('/repos/acme/design-system')) {
        return new Response(JSON.stringify({ id: 1, name: 'design-system', full_name: 'acme/design-system', owner: { login: 'acme' }, default_branch: 'main' }), { status: 200 });
      }
      if (url.includes('/issues?') && url.includes('page=2')) {
        return new Response(JSON.stringify([{ id: 13, number: 13, title: 'Button audit', state: 'closed', labels: [{ name: 'Component:Button' }], created_at: '2026-09-02T00:00:00Z', closed_at: '2026-09-03T00:00:00Z' }]), { status: 200 });
      }
      if (url.includes('/issues?')) {
        return new Response(JSON.stringify([
          { id: 12, number: 12, title: 'Fix focus', html_url: 'https://github.com/acme/design-system/issues/12', state: 'open', type: { name: 'Bug' }, labels: [{ name: '🧩 Component:Button' }, { name: '🧩 Component:Modal' }, { name: 'criticite:major' }, { name: 'rgaa:focus' }], body: 'Fixes #42', created_at: '2026-09-01T00:00:00Z', pull_request: undefined },
          { id: 42, number: 42, title: 'A pull request', state: 'open', labels: [], created_at: '2026-09-01T00:00:00Z', pull_request: { url: 'https://api.github.com/repos/acme/design-system/pulls/42' } }
        ]), { status: 200, headers: { link: '<https://api.github.com/repos/acme/design-system/issues?state=all&per_page=100&page=2>; rel="next"' } });
      }
      if (url.includes('/pulls?')) {
        return new Response(JSON.stringify([{ id: 900, number: 42, title: 'Fixes #12', body: 'Fixes #12', state: 'closed', merged_at: '2026-09-02T12:00:00Z' }]), { status: 200 });
      }
      if (url.includes('/projects?')) {
        if (url.includes('/issues/12/projects?')) {
          return new Response(JSON.stringify([{
            project: { id: 77, name: 'Quality' },
            column: { name: 'Cancelled' }
          }]), { status: 200 });
        }
        return new Response(JSON.stringify([]), { status: 200 });
      }
      if (url.includes('/issues/13/timeline?')) {
        return new Response(JSON.stringify([{ event: 'connected', source: { issue: { number: 42, pull_request: { html_url: 'https://github.com/acme/design-system/pull/42' } } } }]), { status: 200 });
      }
      if (url.includes('/issues/') && url.includes('/timeline?')) {
        const issueNumber = Number(url.match(/issues\/(\d+)\/timeline/)?.[1]);
        return new Response(JSON.stringify(issueNumber === 12 ? [{
          event: 'moved_columns_in_project',
          created_at: '2026-09-02T10:00:00Z',
          project_card: { project_id: 77, previous_column_name: 'In progress', column_name: 'Done' }
        }] : []), { status: 200 });
      }
      throw new Error(`Unexpected GitHub request: ${url}`);
    }) as typeof fetch;

    const config = await loadConfig();
    const dataset = await collectGithub({ token: 'test-token', owner: 'acme', repositories: ['design-system'], apiUrl: 'https://api.github.com', rules: config.github });
    expect(dataset.repositories).toHaveLength(1);
    expect(dataset.repositories[0]?.issues).toHaveLength(2);
    expect(dataset.repositories[0]?.pullRequests[0]?.state).toBe('MERGED');
    expect(dataset.repositories[0]?.issues[0]?.linkedPullRequestIds).toEqual(['acme/design-system:pr:900']);
    expect(dataset.repositories[0]?.issues[1]?.linkedPullRequestIds).toEqual(['acme/design-system:pr:900']);
    expect(dataset.repositories[0]?.pullRequests[0]?.relatedIssueIds).toEqual(['acme/design-system:issue:12']);
    expect(dataset.repositories[0]?.issues[0]?.issueType).toBe('Bug');
    expect(dataset.repositories[0]?.issues[0]?.components).toEqual(['Button', 'Modal']);
    expect(dataset.repositories[0]?.issues[0]?.component).toBeUndefined();
    expect(dataset.repositories[0]?.issues[0]?.url).toBe('https://github.com/acme/design-system/issues/12');
    expect(dataset.repositories[0]?.issues[0]?.parents).toEqual(['acme/design-system:issue:13']);
    expect(dataset.repositories[0]?.issues[0]?.projectStatuses).toEqual([{
      projectId: '77',
      projectName: 'Quality',
      status: 'Cancelled',
      transitions: [{
        previousStatus: 'In progress',
        newStatus: 'Done',
        changedAt: '2026-09-02T10:00:00Z'
      }]
    }]);
    expect(dataset.repositories[0]?.issues[1]?.issueType).toBeUndefined();
    expect(requests.some((url) => url.includes('page=2'))).toBe(true);
  });

  // Vérifie le chemin GraphQL utilisé par la relation Development de GitHub.
  it('récupère une PR liée manuellement via GraphQL sans mot-clé de fermeture', async () => {
    globalThis.fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/parent')) return new Response('{}', { status: 404 });
      if (url === 'https://api.github.com/graphql') {
        const requestBody = JSON.parse(String(init?.body)) as {
          query: string;
          variables: { after?: string | null };
        };
        const isSecondTimelinePage = requestBody.variables.after === 'timeline-cursor-1';
        return new Response(JSON.stringify({
          data: {
            repository: {
              issue: {
                closedByPullRequestsReferences: { nodes: [{ id: 900, number: 42 }] },
                projectItems: {
                  nodes: [{
                    project: { id: 'project-1', title: 'Quality' },
                    fieldValues: {
                      nodes: [
                        { name: 'Cancelled', field: { name: 'Status' } },
                        { text: '1.8.0-rc.3', field: { name: 'RC audited' } },
                        {
                          iterationId: 'iteration-1',
                          title: 'Sprint 1',
                          startDate: '2026-09-01',
                          duration: 14,
                          field: { name: 'Iteration' }
                        },
                        { number: 5, field: { name: 'Velocity' } },
                        { name: 'Must', field: { name: 'Scheduling' } }
                      ]
                    }
                  }]
                },
                timelineItems: {
                  nodes: [{
                    project: { id: 'project-1' },
                    previousStatus: isSecondTimelinePage ? 'Done' : 'In progress',
                    status: isSecondTimelinePage ? 'Todo' : 'Done',
                    createdAt: isSecondTimelinePage
                      ? '2026-09-04T10:00:00Z'
                      : '2026-09-03T10:00:00Z'
                  }],
                  pageInfo: isSecondTimelinePage
                    ? { hasNextPage: false, endCursor: 'timeline-cursor-2' }
                    : { hasNextPage: true, endCursor: 'timeline-cursor-1' }
                }
              }
            }
          }
        }), { status: 200 });
      }
      if (url.includes('/git/matching-refs/tags/')) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      if (url.endsWith('/repos/acme/design-system')) {
        return new Response(JSON.stringify({ id: 1, name: 'design-system', full_name: 'acme/design-system', owner: { login: 'acme' }, default_branch: 'main' }), { status: 200 });
      }
      if (url.includes('/issues?')) {
        return new Response(JSON.stringify([{ id: 13, number: 13, title: 'Button audit', state: 'closed', labels: [{ name: 'Component:Button' }], created_at: '2026-09-02T00:00:00Z', closed_at: '2026-09-03T00:00:00Z' }]), { status: 200 });
      }
      if (url.includes('/pulls?')) {
        return new Response(JSON.stringify([{ id: 900, number: 42, title: 'Button fix', body: 'Technical details only', state: 'closed', merged_at: '2026-09-02T12:00:00Z' }]), { status: 200 });
      }
      if (url.includes('/projects?')) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      if (url.includes('/timeline?')) return new Response(JSON.stringify([]), { status: 200 });
      throw new Error(`Unexpected GitHub request: ${url} ${init?.method ?? 'GET'}`);
    }) as typeof fetch;

    const config = await loadConfig();
    config.github.projects.auditedReleaseCandidateField = 'RC audited';
    const dataset = await collectGithub({ token: 'test-token', owner: 'acme', repositories: ['design-system'], apiUrl: 'https://api.github.com', graphqlUrl: 'https://api.github.com/graphql', rules: config.github });
    expect(dataset.repositories[0]?.issues[0]?.linkedPullRequestIds).toEqual(['acme/design-system:pr:900']);
    expect(dataset.repositories[0]?.issues[0]?.projectStatuses).toEqual([{
      projectId: 'project-1',
      projectName: 'Quality',
      status: 'Cancelled',
      iteration: {
        id: 'iteration-1',
        title: 'Sprint 1',
        startDate: '2026-09-01',
        duration: 14
      },
      velocity: 5,
      scheduling: 'Must',
      transitions: [
        {
          previousStatus: 'In progress',
          newStatus: 'Done',
          changedAt: '2026-09-03T10:00:00Z'
        },
        {
          previousStatus: 'Done',
          newStatus: 'Todo',
          changedAt: '2026-09-04T10:00:00Z'
        }
      ]
    }]);
    expect(dataset.repositories[0]?.issues[0]?.projectFields).toEqual([{
      projectId: 'project-1',
      projectName: 'Quality',
      fieldName: 'RC audited',
      value: '1.8.0-rc.3'
    }]);
  });

  it('collects lightweight and annotated PROD/RC tag facts without inventing lightweight dates', async () => {
    globalThis.fetch = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.endsWith('/repos/acme/design-system')) {
        return new Response(JSON.stringify({
          id: 1,
          name: 'design-system',
          full_name: 'acme/design-system',
          owner: { login: 'acme' },
          default_branch: 'main'
        }), { status: 200 });
      }
      if (url.includes('/git/matching-refs/tags/')) {
        return new Response(JSON.stringify([
          { ref: 'refs/tags/1.8.0', object: { sha: 'commit-light', type: 'commit' } },
          { ref: 'refs/tags/1.9.0-rc.3', object: { sha: 'tag-object', type: 'tag' } },
          { ref: 'refs/tags/1.10.0', object: { sha: 'outer-tag-object', type: 'tag' } },
          { ref: 'refs/tags/not-a-version', object: { sha: 'ignored', type: 'commit' } }
        ]), { status: 200 });
      }
      if (url.endsWith('/git/tags/tag-object')) {
        return new Response(JSON.stringify({
          tag: '1.9.0-rc.3',
          tagger: { date: '2026-09-20T10:00:00Z' },
          object: { sha: 'commit-annotated', type: 'commit' }
        }), { status: 200 });
      }
      if (url.endsWith('/git/tags/outer-tag-object')) {
        return new Response(JSON.stringify({
          tag: '1.10.0',
          tagger: { date: '2026-10-01T10:00:00Z' },
          object: { sha: 'inner-tag-object', type: 'tag' }
        }), { status: 200 });
      }
      if (url.endsWith('/git/tags/inner-tag-object')) {
        return new Response(JSON.stringify({
          tag: '1.10.0',
          tagger: { date: '2026-10-02T10:00:00Z' },
          object: { sha: 'commit-nested', type: 'commit' }
        }), { status: 200 });
      }
      if (url.includes('/issues?') || url.includes('/pulls?')) {
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

    expect(dataset.repositories[0]?.tags).toEqual([
      {
        name: '1.8.0',
        ref: 'refs/tags/1.8.0',
        referenceSha: 'commit-light',
        referenceObjectType: 'commit',
        targetSha: 'commit-light',
        targetType: 'commit'
      },
      {
        name: '1.9.0-rc.3',
        ref: 'refs/tags/1.9.0-rc.3',
        referenceSha: 'tag-object',
        referenceObjectType: 'tag',
        targetSha: 'commit-annotated',
        targetType: 'commit',
        createdAt: '2026-09-20T10:00:00Z'
      },
      {
        name: '1.10.0',
        ref: 'refs/tags/1.10.0',
        referenceSha: 'outer-tag-object',
        referenceObjectType: 'tag',
        targetSha: 'commit-nested',
        targetType: 'commit',
        createdAt: '2026-10-01T10:00:00Z'
      }
    ]);
  });
});
