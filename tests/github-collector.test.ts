import { afterEach, describe, expect, it, vi } from 'vitest';
import { collectGithub } from '../src/collectors/github.js';
import { loadConfig } from '../src/config.js';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('collecteur GitHub', () => {
  it('pagine les issues, sépare les PR et conserve les relations', async () => {
    const requests: string[] = [];
    globalThis.fetch = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      requests.push(url);
      if (url.endsWith('/repos/acme/design-system')) {
        return new Response(JSON.stringify({ id: 1, name: 'design-system', full_name: 'acme/design-system', owner: { login: 'acme' }, default_branch: 'main' }), { status: 200 });
      }
      if (url.includes('/issues?') && url.includes('page=2')) {
        return new Response(JSON.stringify([{ id: 13, number: 13, title: 'Button audit', state: 'closed', labels: [{ name: 'Component:Button' }], created_at: '2026-09-02T00:00:00Z', closed_at: '2026-09-03T00:00:00Z' }]), { status: 200 });
      }
      if (url.includes('/issues?')) {
        return new Response(JSON.stringify([
          { id: 12, number: 12, title: 'Fix focus', state: 'open', labels: [{ name: 'Component:Button' }, { name: 'criticite:major' }, { name: 'rgaa:focus' }], body: 'Fixes #42', created_at: '2026-09-01T00:00:00Z', pull_request: undefined },
          { id: 42, number: 42, title: 'A pull request', state: 'open', labels: [], created_at: '2026-09-01T00:00:00Z', pull_request: { url: 'https://api.github.com/repos/acme/design-system/pulls/42' } }
        ]), { status: 200, headers: { link: '<https://api.github.com/repos/acme/design-system/issues?state=all&per_page=100&page=2>; rel="next"' } });
      }
      if (url.includes('/pulls?')) {
        return new Response(JSON.stringify([{ id: 900, number: 42, title: 'Fixes #12', body: 'Fixes #12', state: 'closed', merged_at: '2026-09-02T12:00:00Z' }]), { status: 200 });
      }
      if (url.includes('/issues/13/timeline?')) {
        return new Response(JSON.stringify([{ event: 'connected', subject: { url: 'https://api.github.com/repos/acme/design-system/pulls/42' } }]), { status: 200 });
      }
      if (url.includes('/issues/') && url.includes('/timeline?')) {
        return new Response(JSON.stringify([]), { status: 200 });
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
    expect(requests.some((url) => url.includes('page=2'))).toBe(true);
  });
});
