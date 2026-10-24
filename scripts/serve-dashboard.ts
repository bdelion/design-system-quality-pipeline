import { createServer, type Server } from 'node:http';
import { readFile, access } from 'node:fs/promises';
import { resolve, relative, isAbsolute, extname } from 'node:path';
import { pathToFileURL } from 'node:url';

/** Sert les fichiers du dashboard sur une interface locale pour permettre le chargement des modules et des filtres. */
export async function startDashboardServer(directory: string, port = 4174): Promise<Server> {
  const root = resolve(directory);
  await access(resolve(root, 'index.html'));
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://127.0.0.1').pathname);
      const target = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
      const local = relative(root, target);
      if (local.startsWith('..') || isAbsolute(local)) {
        response.writeHead(403);
        response.end('Accès refusé');
        return;
      }
      const content = await readFile(target);
      const mime: Record<string, string> = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.svg': 'image/svg+xml'
      };
      response.writeHead(200, {
        'Content-Type': mime[extname(target)] ?? 'application/octet-stream',
        'Cache-Control': 'no-store'
      });
      response.end(content);
    } catch {
      response.writeHead(404);
      response.end('Introuvable');
    }
  });
  await new Promise<void>((done, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      server.removeListener('error', reject);
      done();
    });
  });
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await startDashboardServer(process.argv[2] ?? 'data/output/demo/dashboard');
  console.log('Dashboard : http://127.0.0.1:4174/ — arrêt avec Ctrl+C');
}
