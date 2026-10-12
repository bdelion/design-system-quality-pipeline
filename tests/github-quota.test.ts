import { afterEach, expect, it, vi } from 'vitest';
import { GithubRequests } from '../src/collectors/github-requests.js';
import { CollectionProgress } from '../src/lib/collection-progress.js';
import { runPipeline } from '../src/pipeline.js';
import { writeJson } from '../src/lib/files.js';
import { generateDashboard } from '../src/dashboard/generate.js';
vi.mock('../src/lib/files.js', () => ({ readJson: vi.fn(), writeJson: vi.fn() }));
vi.mock('../src/dashboard/generate.js', () => ({ generateDashboard: vi.fn() }));

const output = { write: vi.fn(() => true) };
/** Fabrique une réserve REST et GraphQL déterministe à la date simulée. */
function quotas(rest = 5000, graphql = 5000): Response {
  return Response.json({
    resources: {
      core: { remaining: rest, reset: Math.floor(Date.now() / 1000) + 2 },
      graphql: { remaining: graphql, reset: Math.floor(Date.now() / 1000) + 2 }
    }
  });
}
/** Crée le contrôleur sans terminal ni token réel. */
function requests(options = {}): GithubRequests {
  return new GithubRequests('test-token', 'https://api.test', new CollectionProgress(1, output), options);
}
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  output.write.mockClear();
  vi.clearAllMocks();
});

it('ne produit ni snapshot ni dashboard lorsque le pré-check interrompt le pipeline', async () => {
  vi.stubEnv('GITHUB_TOKEN', 'test-token');
  vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => quotas(0))
  );
  await expect(runPipeline('github')).rejects.toThrow(/quota REST/i);
  expect(writeJson).not.toHaveBeenCalled();
  expect(generateDashboard).not.toHaveBeenCalled();
});

it('arrête au pré-check et affiche le reset sans exposer le token', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => quotas(100))
  );
  const client = requests();
  await expect(client.initialize()).rejects.toThrow(/quota REST/i);
  expect(fetch).toHaveBeenCalledTimes(1);
  await expect(client.request('https://api.test/issues', {}, 'rest')).rejects.toThrow(/quota REST/i);
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(output.write.mock.calls.join('')).not.toContain('test-token');
});

it('utilise les en-têtes REST autoritaires et préserve une réserve GraphQL indépendante', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            resources: {
              core: { remaining: 5000, reset: 1999999999 },
              graphql: { remaining: 5000, reset: 1999999999 }
            }
          }),
          { headers: { 'x-ratelimit-remaining': '100', 'x-ratelimit-reset': '1999999999' } }
        )
    )
  );
  await expect(requests().initialize()).rejects.toThrow(/quota REST/i);
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => quotas(5000, 100))
  );
  await expect(requests().initialize()).rejects.toThrow(/quota GraphQL/i);
});

it('borne l’attente et refuse un pré-check aux quotas absents plutôt que les convertir en zéro', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => quotas(0))
  );
  await expect(requests({ waitForQuota: true, quotaMaxWait: 1 }).initialize()).rejects.toThrow(
    /maximale d’attente/
  );
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json({ resources: {} }))
  );
  await expect(requests().initialize()).rejects.toThrow(/quotas REST\/GraphQL indisponibles/);
});

it('réessaie une erreur réseau avec jitter sans afficher son message potentiellement sensible', async () => {
  vi.useFakeTimers();
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
  let calls = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url) => {
      if (String(url).endsWith('/rate_limit')) return quotas();
      if (++calls === 1) throw new TypeError('secret-token-in-network-message');
      return Response.json({ ok: true });
    })
  );
  const client = requests();
  await client.initialize();
  const result = client.request('https://api.test/a', {}, 'rest');
  await vi.advanceTimersByTimeAsync(1499);
  expect(calls).toBe(1);
  await vi.advanceTimersByTimeAsync(1);
  expect((await result).status).toBe(200);
  expect(output.write.mock.calls.join('')).not.toContain('secret-token');
});

it('rejette une erreur de quota GraphQL HTTP 200 sans renvoyer de relations vides', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url) =>
      String(url).endsWith('/rate_limit')
        ? quotas()
        : Response.json(
            { errors: [{ type: 'RATE_LIMITED', message: 'API rate limit exceeded' }] },
            { headers: { 'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 60) } }
          )
    )
  );
  const client = requests();
  await client.initialize();
  await expect(client.request('https://api.test/graphql', { method: 'POST' }, 'graphql')).rejects.toThrow(
    /quota GraphQL/i
  );
});

it('attend Retry-After, revérifie le quota et reprend la requête avec un décompte', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-12T10:00:00Z'));
  let calls = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url) => {
      if (String(url).endsWith('/rate_limit')) return quotas();
      return ++calls === 1
        ? Response.json(
            { message: 'secondary rate limit' },
            {
              status: 429,
              headers: {
                'retry-after': '2',
                'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 3600)
              }
            }
          )
        : Response.json({ ok: true });
    })
  );
  const client = requests({ waitForQuota: true });
  await client.initialize();
  const result = client.request('https://api.test/issues', {}, 'rest');
  await vi.advanceTimersByTimeAsync(4000);
  expect((await result).status).toBe(200);
  expect(calls).toBe(2);
  expect(output.write.mock.calls.join('')).toMatch(/restant|reprise/i);
});

it('ne confond pas un 403 de permission avec une limite et réessaie les erreurs transitoires', async () => {
  vi.useFakeTimers();
  vi.spyOn(Math, 'random').mockReturnValue(0);
  let calls = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url) =>
      String(url).endsWith('/rate_limit')
        ? quotas()
        : ++calls === 1
          ? new Response('', { status: 503 })
          : new Response('', {
              status: 403,
              headers: { 'x-ratelimit-remaining': '4990', 'x-ratelimit-reset': '1999999999' }
            })
    )
  );
  const client = requests();
  await client.initialize();
  const result = client.request('https://api.test/issues', {}, 'rest');
  await vi.advanceTimersByTimeAsync(2000);
  expect((await result).status).toBe(403);
  expect(calls).toBe(2);
});

it('stoppe toutes les requêtes en file au premier quota épuisé', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url) =>
      String(url).endsWith('/rate_limit')
        ? quotas()
        : Response.json(
            { message: 'rate limit exceeded' },
            { status: 403, headers: { 'x-ratelimit-remaining': '0' } }
          )
    )
  );
  const client = requests();
  await client.initialize();
  const results = await Promise.allSettled([
    client.request('https://api.test/a', {}, 'rest'),
    client.request('https://api.test/b', {}, 'rest')
  ]);
  expect(results.every((result) => result.status === 'rejected')).toBe(true);
  expect(fetch).toHaveBeenCalledTimes(2);
});
