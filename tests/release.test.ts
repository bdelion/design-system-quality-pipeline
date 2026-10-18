import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';
import {
  ApiError,
  nextVersion,
  publishRelease,
  releaseNotes,
  runRelease,
  type ReleaseApi,
  type ReleasePullRequest
} from '../scripts/release.js';
const sha = 'a'.repeat(40);
const pr: ReleasePullRequest = {
  number: 42,
  title: 'feat(dashboard): 📊 graphiques',
  body: '<!-- release-notes:start -->Les répartitions suivent les filtres.<!-- release-notes:end -->',
  html_url: 'https://github.com/acme/dsq/pull/42',
  merged_at: '2026-10-11',
  merge_commit_sha: sha,
  base: { ref: 'main' }
};
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
/** Simule les lectures REST habituelles et délègue les publications au test. */
function apiFor(
  post: (body: unknown) => unknown,
  tags: { name: string; commit: { sha: string } }[] = [],
  pulls = [pr],
  reserve: (body: unknown) => unknown = () => ({})
): ReleaseApi {
  return (async (path: string, body?: unknown) => {
    if (path.startsWith('/commits/')) return pulls;
    if (path.startsWith('/pulls/')) return [{ commit: { message: 'feat: graphiques' } }];
    if (path.startsWith('/tags?')) return tags;
    if (path.startsWith('/releases/tags/')) throw new ApiError(404);
    if (path === '/git/refs') return reserve(body);
    if (path === '/releases') return post(body);
    throw new Error('Requête inattendue : ' + path);
  }) as ReleaseApi;
}
describe('versions et notes de release', () => {
  it.each([
    ['fix: erreur', 'v1.2.4'],
    ['docs: guide', 'v1.2.4'],
    ['chore: nettoyage', 'v1.2.4'],
    ['texte libre', 'v1.2.4'],
    ['feat(ui): cartes', 'v1.3.0'],
    ['feat: ✨ cartes', 'v1.3.0'],
    ['fix!: migration', 'v2.0.0'],
    ['feat: changement\n\nBREAKING CHANGE: format', 'v2.0.0'],
    ['chore: changement\nBREAKING-CHANGE: format', 'v2.0.0']
  ])('versionne %s', (message, expected) => expect(nextVersion('v1.2.3', [message])).toBe(expected));
  it('retient la rupture et compare correctement les versions numériques', async () => {
    const post = vi.fn();
    await publishRelease(
      apiFor(post, [
        { name: 'v1.9.0', commit: { sha: 'b' } },
        { name: 'v1.10.0', commit: { sha: 'c' } }
      ]),
      sha,
      'acme/dsq',
      '10',
      '0.1.0'
    );
    expect(post.mock.calls[0]?.[0]).toMatchObject({
      tag_name: 'v1.11.0',
      target_commitish: sha,
      draft: false
    });
    expect(nextVersion('0.1.0', ['feat: a', 'fix!: b'])).toBe('v1.0.0');
    expect(() => nextVersion('V11', [])).toThrow();
  });
  it('conserve les textes auteurs, les ruptures et les liens sans interprétation inventée', () => {
    const notes = releaseNotes(
      pr,
      ['feat: graphiques', 'fix: filtre', 'docs: guide', 'fix!: migration\nBREAKING CHANGE: nouveau format'],
      sha,
      'acme/dsq',
      '10'
    );
    for (const text of [
      'Les répartitions suivent les filtres.',
      'Nouveautés',
      'Corrections',
      'Documentation et maintenance',
      'Changements incompatibles',
      '/actions/runs/10',
      '/pull/42',
      sha
    ])
      expect(notes).toContain(text);
    expect(notes).not.toContain('release-notes:start');
  });
});
describe('publication après merge', () => {
  it('ne publie pas un push direct ni un merge vers develop', async () => {
    const post = vi.fn();
    expect(await publishRelease(apiFor(post, [], []), sha, 'acme/dsq', '10', '0.1.0')).toBeNull();
    expect(
      await publishRelease(
        apiFor(post, [], [{ ...pr, base: { ref: 'develop' } }]),
        sha,
        'acme/dsq',
        '10',
        '0.1.0'
      )
    ).toBeNull();
    expect(
      await publishRelease(apiFor(post, [], [{ ...pr, merged_at: null }]), sha, 'acme/dsq', '10', '0.1.0')
    ).toBeNull();
    expect(post).not.toHaveBeenCalled();
  });
  it('répare un tag sans release et réutilise le même tag', async () => {
    const post = vi.fn();
    expect(
      await publishRelease(
        apiFor(post, [{ name: 'v0.2.0', commit: { sha } }]),
        sha,
        'acme/dsq',
        '10',
        '0.1.0'
      )
    ).toBe('v0.2.0');
    expect(post.mock.calls[0]?.[0]).toMatchObject({ tag_name: 'v0.2.0', target_commitish: sha });
  });
  it('une relance ne crée pas de deuxième release', async () => {
    const post = vi.fn();
    const base = apiFor(post, [{ name: 'v0.2.0', commit: { sha } }]);
    const api = (async (path: string, body?: unknown) =>
      path.startsWith('/releases/tags/') ? { draft: false } : base(path, body)) as ReleaseApi;
    expect(await publishRelease(api, sha, 'acme/dsq', '10', '0.1.0')).toBe('v0.2.0');
    expect(post).not.toHaveBeenCalled();
  });
  it('une collision prend une nouvelle version sans modifier le tag existant', async () => {
    const tags: { name: string; commit: { sha: string } }[] = [];
    const post = vi.fn();
    const reserve = vi.fn((body: unknown) => {
      if (reserve.mock.calls.length === 1) {
        tags.push({ name: 'v0.2.0', commit: { sha: 'b' } });
        throw new ApiError(422);
      }
      return body;
    });
    expect(await publishRelease(apiFor(post, tags, [pr], reserve), sha, 'acme/dsq', '10', '0.1.0')).toBe(
      'v0.3.0'
    );
    expect(reserve).toHaveBeenCalledTimes(2);
    expect(post).toHaveBeenCalledTimes(1);
    expect(post.mock.calls[0]?.[0]).toMatchObject({ tag_name: 'v0.3.0' });
  });
  it('propage une permission refusée et une erreur 422 sans collision', async () => {
    for (const status of [403, 422])
      await expect(
        publishRelease(
          apiFor(() => {
            throw new ApiError(status);
          }),
          sha,
          'acme/dsq',
          '10',
          '0.1.0'
        )
      ).rejects.toMatchObject({ status });
  });
  it('refuse la publication hors push main', async () => {
    vi.stubEnv('GITHUB_EVENT_NAME', 'pull_request');
    vi.stubEnv('GITHUB_REF', 'refs/heads/main');
    await expect(runRelease()).rejects.toThrow('Publication réservée');
  });
  it('transporte les lectures et publications via Octokit sans relance HTTP implicite', async () => {
    vi.stubEnv('GITHUB_EVENT_NAME', 'push');
    vi.stubEnv('GITHUB_REF', 'refs/heads/main');
    vi.stubEnv('GITHUB_TOKEN', 'fake-release-token');
    vi.stubEnv('GITHUB_REPOSITORY', 'acme/dsq');
    vi.stubEnv('GITHUB_SHA', sha);
    vi.stubEnv('GITHUB_RUN_ID', '10');
    vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    const api = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      expect(new Headers(init?.headers).get('authorization')).toBe('Bearer fake-release-token');
      if (url.includes('/commits/' + sha + '/pulls')) return Response.json([pr]);
      if (url.includes('/pulls/42/commits')) return Response.json([]);
      if (url.includes('/tags?')) return Response.json([]);
      expect(init?.method).toBe('POST');
      const body = JSON.parse(String(init?.body));
      if (url.endsWith('/git/refs')) {
        expect(body.sha).toBe(sha);
        return Response.json({}, { status: 201 });
      }
      expect(url).toBe('https://api.github.com/repos/acme/dsq/releases');
      expect(body).toMatchObject({ target_commitish: sha, draft: false });
      return Response.json({}, { status: 403 });
    });
    vi.stubGlobal('fetch', api);
    await expect(runRelease()).rejects.toMatchObject({ status: 403 });
    expect(api).toHaveBeenCalledTimes(5);
  });
});
it('le workflow attend tous les contrôles et réserve les écritures au job main', async () => {
  const workflow = parse(await readFile('.github/workflows/ci.yml', 'utf8'));
  expect(workflow.permissions).toEqual({ contents: 'read' });
  expect(workflow.jobs.release.needs).toEqual(['quality']);
  expect(workflow.jobs.release.if).toContain("github.ref == 'refs/heads/main'");
  expect(workflow.jobs.release.if).toContain("needs.quality.result == 'success'");
  const steps = workflow.jobs.quality.steps;
  expect(steps.filter((step: { run?: string }) => step.run).map((step: { run: string }) => step.run)).toEqual(
    [
      'npm ci',
      'npm run format:check',
      'npm run check:ai',
      'npm run typecheck',
      'npm run lint',
      'npm run check:tsdoc',
      'npm test',
      'npm run build',
      'npm run docs:api',
      'npx playwright install --with-deps chromium',
      'npm run test:browser'
    ]
  );
  const artifacts = steps.at(-1);
  expect(artifacts.uses).toBe('actions/upload-artifact@v4');
  expect(artifacts.if).toBe('always()');
  for (const command of [
    'check:ai',
    'typecheck',
    'lint',
    'check:tsdoc',
    'test:browser',
    'format:check',
    'docs:api',
    'build'
  ])
    expect(steps.some((step: { run?: string }) => step.run === 'npm run ' + command)).toBe(true);
  expect(steps.some((step: { run?: string }) => step.run === 'npm test')).toBe(true);
  expect(steps.every((step: Record<string, unknown>) => !step['continue-on-error'])).toBe(true);
  expect(workflow.jobs.release.permissions).toEqual({ contents: 'write', 'pull-requests': 'read' });
});

it('pagine les tags au-delà de cent entrées', async () => {
  const post = vi.fn();
  const base = apiFor(post);
  const api = (async (path: string, body?: unknown) => {
    if (path === '/tags?per_page=100&page=1')
      return Array.from({ length: 100 }, (_, index) => ({ name: 'archive-' + index, commit: { sha: 'b' } }));
    if (path === '/tags?per_page=100&page=2') return [{ name: 'v2.0.0', commit: { sha: 'b' } }];
    return base(path, body);
  }) as ReleaseApi;
  expect(await publishRelease(api, sha, 'acme/dsq', '10', '0.1.0')).toBe('v2.1.0');
});
it('ne publie pas un brouillon existant', async () => {
  const post = vi.fn();
  const base = apiFor(post, [{ name: 'v0.2.0', commit: { sha } }]);
  const api = (async (path: string, body?: unknown) =>
    path.startsWith('/releases/tags/') ? { draft: true } : base(path, body)) as ReleaseApi;
  await expect(publishRelease(api, sha, 'acme/dsq', '10', '0.1.0')).rejects.toThrow('brouillon');
  expect(post).not.toHaveBeenCalled();
});
it('réserve le tag sur le commit exact avant la publication', async () => {
  const order: string[] = [];
  const post = vi.fn(() => {
    order.push('release');
  });
  const reserve = vi.fn((body: unknown) => {
    order.push('tag');
    return body;
  });
  await publishRelease(apiFor(post, [], [pr], reserve), sha, 'acme/dsq', '10', '0.1.0');
  expect(reserve.mock.calls[0]?.[0]).toEqual({ ref: 'refs/tags/v0.2.0', sha });
  expect(order).toEqual(['tag', 'release']);
});
