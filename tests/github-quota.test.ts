import { afterEach, expect, it, vi } from 'vitest';
import { GithubRequests } from '../src/collectors/github-requests.js';
import { CollectionProgress } from '../src/lib/collection-progress.js';
import { collectRepositories } from '../src/datasets.js';
import { writeJson } from '../src/lib/files.js';
import { generateDashboard } from '../src/dashboard/generate.js';
import { setTimeout as sleep } from 'node:timers/promises';
vi.mock('node:timers/promises', async (importOriginal) => {
  const original = await importOriginal<typeof import('node:timers/promises')>();
  return { ...original, setTimeout: vi.fn(original.setTimeout) };
});
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
  vi.mocked(sleep).mockReset();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  output.write.mockClear();
  vi.clearAllMocks();
});

it('attend un reset lointain sans requête pendant la pause puis reprend avec le même token', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-12T10:00:00Z'));
  const started = Date.now();
  let checks = 0;
  const api = vi.fn(async (url) => {
    if (!String(url).endsWith('/rate_limit')) return Response.json({ ok: true });
    if (++checks > 1) return quotas();
    return Response.json({
      resources: {
        core: { remaining: 0, reset: started / 1000 + 2348 },
        graphql: { remaining: 5000, reset: started / 1000 + 2348 }
      }
    });
  });
  vi.stubGlobal('fetch', api);
  vi.mocked(sleep).mockImplementation(async (delay) => {
    expect(api).toHaveBeenCalledTimes(1);
    vi.setSystemTime(Date.now() + Number(delay));
  });
  const client = requests({ waitForQuota: true, quotaMaxWait: 14400 });
  await client.initialize();
  expect(Date.now() - started).toBe(2349000);
  expect(checks).toBe(2);
  expect((await client.request('https://api.test/issues', {}, 'rest')).status).toBe(200);
  for (const call of api.mock.calls) {
    const init = (call as unknown as [string, RequestInit])[1];
    expect(new Headers(init.headers).get('authorization')).toBe('Bearer test-token');
  }
});

it('envoie une seule authentification même lorsque l’appelant fournit des en-têtes de casse différente', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => quotas())
  );
  const client = requests();
  await client.initialize();
  for (const name of ['Authorization', 'authorization', 'AUTHORIZATION']) {
    await client.request(
      'https://api.test/graphql',
      {
        method: 'POST',
        headers: {
          [name]: 'Bearer test-token',
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      },
      'graphql'
    );
    const init = vi.mocked(fetch).mock.calls.at(-1)?.[1];
    expect(new Headers(init?.headers).get('authorization')).toBe('Bearer test-token');
    expect(new Headers(init?.headers).get('accept')).toBe('application/json');
    expect(new Headers(init?.headers).get('content-type')).toBe('application/json');
  }
});

it('explique un 401 après le reset et arrête la file sans retry ni fuite du token', async () => {
  vi.useFakeTimers();
  let checks = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => (++checks === 1 ? quotas(0) : new Response('', { status: 401 })))
  );
  vi.mocked(sleep).mockImplementation(async (delay) => {
    vi.setSystemTime(Date.now() + Number(delay));
  });
  const client = requests({ waitForQuota: true });
  await expect(client.initialize()).rejects.toThrow(/authentification refusée \(HTTP 401\)/);
  await expect(client.request('https://api.test/issues', {}, 'rest')).rejects.toThrow(/authentification/);
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(output.write.mock.calls.join('')).not.toContain('test-token');
});

it('ne produit ni snapshot ni dashboard lorsque le pré-check interrompt le pipeline', async () => {
  vi.stubEnv('GITHUB_TOKEN', 'test-token');
  vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  const api = vi.fn(async () => quotas(0));
  vi.stubGlobal('fetch', api);
  await expect(collectRepositories(['example/ui'], 'data/local/never-quota-output.json')).rejects.toThrow(
    /Quota REST : réserve de sécurité atteinte/
  );
  expect(api).toHaveBeenCalledTimes(1);
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
  const calls = vi.mocked(fetch).mock.calls.length;
  expect(calls).toBeLessThanOrEqual(3);
  await expect(client.request('https://api.test/c', {}, 'rest')).rejects.toThrow(/quota/i);
  expect(fetch).toHaveBeenCalledTimes(calls);
});

it('borne la concurrence REST à cinq sans sérialiser les appels réseau', async () => {
  const releases: Array<() => void> = [];
  let active = 0;
  let maximum = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url) => {
      if (String(url).endsWith('/rate_limit')) return quotas();
      active++;
      maximum = Math.max(maximum, active);
      await new Promise<void>((resolve) => releases.push(resolve));
      active--;
      return Response.json({});
    })
  );
  const client = requests();
  await client.initialize();
  const tasks = Array.from({ length: 8 }, (_, i) => client.request(`https://api.test/${i}`, {}, 'rest'));
  await vi.waitFor(() => expect(releases).toHaveLength(5));
  for (const release of releases.splice(0)) release();
  await vi.waitFor(() => expect(releases).toHaveLength(3));
  for (const release of releases) release();
  await Promise.all(tasks);
  expect(maximum).toBe(5);
});

it('réserve atomiquement les points et ne réutilise pas un compteur ancien reçu hors ordre', async () => {
  const releases: Array<(remaining: number) => void> = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url) => {
      if (String(url).endsWith('/rate_limit')) return quotas(102);
      return new Promise<Response>((resolve) =>
        releases.push((remaining) =>
          resolve(
            Response.json(
              {},
              {
                headers: { 'x-ratelimit-remaining': String(remaining) }
              }
            )
          )
        )
      );
    })
  );
  const client = requests();
  await client.initialize();
  const first = client.request('https://api.test/a', {}, 'rest');
  const second = client.request('https://api.test/b', {}, 'rest');
  await vi.waitFor(() => expect(releases).toHaveLength(2));
  releases[1]!(100);
  await second;
  releases[0]!(101);
  await first;
  await expect(client.request('https://api.test/c', {}, 'rest')).rejects.toThrow(/quota REST/i);
  expect(releases).toHaveLength(2);
});

it('mutualise une pause REST et laisse GraphQL avancer pendant Retry-After', async () => {
  let rest = 0;
  let resumed = false;
  let releasePause: (() => void) | undefined;
  vi.mocked(sleep).mockImplementation(async () => {
    await new Promise<void>((resolve) => {
      releasePause = resolve;
    });
  });
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url) => {
      if (String(url).endsWith('/rate_limit')) return quotas();
      if (String(url).endsWith('/graphql')) return Response.json({ data: {} });
      rest++;
      return resumed
        ? Response.json({})
        : Response.json(
            { message: 'secondary rate limit' },
            { status: 429, headers: { 'retry-after': '1' } }
          );
    })
  );
  const client = requests({ waitForQuota: true });
  await client.initialize();
  const tasks = [
    client.request('https://api.test/a', {}, 'rest'),
    client.request('https://api.test/b', {}, 'rest')
  ];
  await vi.waitFor(() => expect(releasePause).toBeDefined());
  expect((await client.request('https://api.test/graphql', {}, 'graphql')).ok).toBe(true);
  expect(vi.mocked(sleep)).toHaveBeenCalledTimes(1);
  resumed = true;
  vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 3000);
  releasePause!();
  await Promise.all(tasks);
  expect(rest).toBe(4);
  expect(vi.mocked(sleep)).toHaveBeenCalledTimes(1);
});
