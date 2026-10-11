import { createServer, type Server } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { consolidationSnapshot } from '../tests/support/consolidation.js';
import { generateDashboard } from '../src/dashboard/generate.js';
import { diffSnapshots } from '../src/snapshots/diff.js';
import { calculateFlowMetrics } from '../src/analytics/flows.js';

/** Génère les artefacts et démarre un serveur de tests local dont le worker maîtrise l’arrêt. */
export async function startDashboardTestServer(): Promise<Server> {
  const snapshot = consolidationSnapshot(),
    previous = structuredClone(snapshot);
  previous.snapshotId = 'previous';
  previous.capturedAt = '2026-10-10T10:00:00Z';
  const issue = previous.normalizedData.issues!.find((item) => item.issueId === 'audit-a')!;
  issue.projectContexts[0]!.status = 'READY';
  issue.projectContexts[0]!.statusHistory = [];
  const diff = diffSnapshots(previous, snapshot);
  snapshot.analytics.flows = calculateFlowMetrics(diff, snapshot.dataQuality.issues);
  snapshot.analytics.transitions = diff.businessTransitions;
  const output = resolve('data/browser-consolidation');
  await generateDashboard(snapshot, output, 'https://github.com', 'Component:');
  const root = resolve(output, 'dashboard');

  /** Sert uniquement les artefacts de test sur l'interface locale, sans accès hors du répertoire généré. */
  const server = createServer(async (request, response) => {
    try {
      const path = decodeURIComponent(new URL(request.url ?? '/', 'http://127.0.0.1').pathname);
      const target = resolve(root, '.' + (path === '/' ? '/index.html' : path));
      if (!target.startsWith(root + '\\') && !target.startsWith(root + '/')) {
        response.writeHead(403);
        response.end();
        return;
      }
      const body = await readFile(target);
      response.writeHead(200, {
        'Content-Type':
          (
            {
              '.html': 'text/html; charset=utf-8',
              '.js': 'text/javascript; charset=utf-8',
              '.css': 'text/css; charset=utf-8',
              '.svg': 'image/svg+xml'
            } as Record<string, string>
          )[extname(target)] ?? 'application/octet-stream'
      });
      response.end(body);
    } catch {
      response.writeHead(404);
      response.end('Introuvable');
    }
  });
  await new Promise<void>((resolve) => server.listen(4173, '127.0.0.1', resolve));
  return server;
}
