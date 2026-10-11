import { afterEach, expect, it } from 'vitest';
import type { Server } from 'node:http';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startDashboardServer } from '../scripts/serve-dashboard.js';
let server: Server | undefined;
afterEach(async () => {
  if (server) {
    server.closeAllConnections();
    await new Promise<void>((done) => server!.close(() => done()));
  }
});
/** Vérifie les ressources nécessaires aux filtres et le confinement du serveur local. */
it('sert HTML et modules sans cache et refuse de sortir du dashboard', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsq-server-'));
  await writeFile(join(root, 'index.html'), '<h1>Dashboard</h1>');
  await writeFile(join(root, 'app.js'), 'export const ready = true;');
  server = await startDashboardServer(root, 0);
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Adresse locale absente');
  const base = 'http://127.0.0.1:' + address.port;
  expect(await (await fetch(base)).text()).toContain('Dashboard');
  const module = await fetch(base + '/app.js');
  expect(module.headers.get('content-type')).toContain('text/javascript');
  expect(module.headers.get('cache-control')).toBe('no-store');
  expect((await fetch(base + '/%2e%2e%2foutside')).status).toBe(403);
});
