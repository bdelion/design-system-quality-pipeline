import { afterEach, expect, it, vi } from 'vitest';
import { githubRequest } from '../src/lib/github-transport.js';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it('préserve URL Enterprise, corps GraphQL, en-têtes et annulation sans appel supplémentaire', async () => {
  const response = Response.json(
    { data: { rateLimit: { remaining: 4000 } } },
    {
      headers: {
        link: '<https://git.test/api/v3/issues?page=2>; rel="next"',
        'x-ratelimit-remaining': '4000'
      }
    }
  );
  const api = vi.fn(async () => response);
  vi.stubGlobal('fetch', api);
  const controller = new AbortController();
  const body = JSON.stringify({ query: 'query { viewer { login } }', variables: { after: null } });
  const result = await githubRequest('https://git.test/api/graphql', {
    method: 'POST',
    body,
    signal: controller.signal,
    headers: new Headers({
      Authorization: 'Bearer fake-token',
      Accept: 'application/json',
      'Content-Type': 'application/json'
    })
  });
  expect(api).toHaveBeenCalledTimes(1);
  const [url, init] = vi.mocked(fetch).mock.calls[0]!;
  expect(url).toBe('https://git.test/api/graphql');
  expect(init?.method).toBe('POST');
  expect(init?.body).toBe(body);
  expect(init?.signal).toBe(controller.signal);
  expect(new Headers(init?.headers).get('authorization')).toBe('Bearer fake-token');
  expect(new Headers(init?.headers).get('accept')).toBe('application/json');
  expect(result).toBe(response);
  expect(result.bodyUsed).toBe(false);
  expect(result.headers.get('link')).toContain('page=2');
  expect(await result.json()).toEqual({ data: { rateLimit: { remaining: 4000 } } });
});

it.each([200, 204, 304, 401, 403, 404, 429, 502, 503, 504])(
  'rend le statut HTTP %s au contrôleur sans retry et conserve le corps brut',
  async (status) => {
    const body = [204, 304].includes(status) ? null : ' {"message":"rate limit", "errors":[]} ';
    const response = new Response(body, {
      status,
      headers: { 'content-type': 'application/json', 'retry-after': '5' }
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => response)
    );
    const result = await githubRequest('https://api.test/issues?page=2&per_page=100', {});
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toBe('https://api.test/issues?page=2&per_page=100');
    expect(result.status).toBe(status);
    expect(result.headers.get('retry-after')).toBe('5');
    expect(await result.text()).toBe(body ?? '');
  }
);

it('laisse les erreurs GraphQL HTTP 200 au contrôleur', async () => {
  const payload = { errors: [{ type: 'RATE_LIMITED', message: 'quota atteint' }] };
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json(payload))
  );
  expect(
    await (await githubRequest('https://api.test/graphql', { method: 'POST', body: '{}' })).json()
  ).toEqual(payload);
  expect(fetch).toHaveBeenCalledTimes(1);
});

it('préserve une erreur HTTP non JSON sans afficher les données de dépréciation du serveur', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response('private-invalid-json', {
          status: 403,
          headers: { 'content-type': 'application/json', deprecation: 'true', sunset: 'private-server-value' }
        })
    )
  );
  const result = await githubRequest('https://api.test/private-path');
  expect(result.status).toBe(403);
  expect(await result.text()).toBe('private-invalid-json');
  expect(warn).toHaveBeenCalledExactlyOnceWith('GitHub : endpoint déprécié signalé par le serveur.');
});

it('annule une requête en vol sans relance automatique', async () => {
  const controller = new AbortController();
  vi.stubGlobal(
    'fetch',
    vi.fn(
      (_input: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('annulé', 'AbortError')), {
            once: true
          });
        })
    )
  );
  const pending = githubRequest('https://api.test/issues', { signal: controller.signal });
  controller.abort();
  await expect(pending).rejects.toThrow('GitHub : échec du transport HTTP.');
  expect(fetch).toHaveBeenCalledTimes(1);
});

it('ne divulgue ni token ni corps lors d’une erreur réseau et ne réessaie pas', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      throw new Error('secret-token private-query');
    })
  );
  await expect(
    githubRequest('https://api.test/graphql', {
      method: 'POST',
      headers: { Authorization: 'Bearer secret-token' },
      body: 'private-query'
    })
  ).rejects.toThrow(/^GitHub : échec du transport HTTP\.$/);
  expect(fetch).toHaveBeenCalledTimes(1);
});
