import { readFile, readdir } from 'node:fs/promises';
import { resolve, relative, dirname, extname } from 'node:path';
import { createHash } from 'node:crypto';

/** Résout une ressource locale sans permettre une lecture hors du dashboard généré. */
function localResource(root: string, path: string): string {
  const target = resolve(root, '.' + (path.startsWith('/') ? path : '/' + path));
  const local = relative(root, target);
  if (!local || local.startsWith('..')) throw new Error('Ressource hors du dashboard');
  return target;
}
/** Mesure des fichiers non compressés, identifiés par chemin public et empreinte. */
export async function resourceFiles(directory: string, paths: readonly string[]) {
  const root = resolve(directory);
  return Promise.all(
    [...new Set(paths)].sort().map(async (path) => {
      const buffer = await readFile(localResource(root, path));
      return { path, bytes: buffer.byteLength, sha256: createHash('sha256').update(buffer).digest('hex') };
    })
  );
}
/** Recense les dépendances statiques HTML/JS/CSS pour pouvoir mesurer une référence ancienne sans la réécrire. */
export async function directoryResources(directory: string) {
  const root = resolve(directory);
  const pages: {
    page: string;
    htmlBytes: number;
    resources: Awaited<ReturnType<typeof resourceFiles>>;
    assetBytes: number;
    totalBytes: number;
  }[] = [];
  for (const page of (await readdir(root)).filter((file) => file.endsWith('.html')).sort()) {
    const html = await readFile(resolve(root, page), 'utf8');
    const pending = [...html.matchAll(/(?:src|href)="(assets\/[^"?#]+)"/g)].map((match) => '/' + match[1]!);
    const seen = new Set<string>();
    while (pending.length) {
      const path = pending.pop()!;
      if (seen.has(path)) continue;
      seen.add(path);
      const target = localResource(root, path);
      if (!['.js', '.css'].includes(extname(target))) continue;
      const text = await readFile(target, 'utf8');
      const references = [
        ...text.matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]|url\(['"]?([^'"\s)]+)['"]?\)/g)
      ];
      for (const reference of references) {
        const value = reference[1] ?? reference[2]!;
        if (value.startsWith('data:') || value.includes('://')) continue;
        const child = relative(root, resolve(dirname(target), value)).replaceAll('\\', '/');
        if (child.startsWith('..')) throw new Error('Import hors du dashboard');
        pending.push('/' + child);
      }
    }
    const resources = await resourceFiles(root, [...seen]);
    pages.push({
      page,
      htmlBytes: Buffer.byteLength(html),
      resources,
      assetBytes: resources.reduce((sum, resource) => sum + resource.bytes, 0),
      totalBytes: Buffer.byteLength(html) + resources.reduce((sum, resource) => sum + resource.bytes, 0)
    });
  }
  const paths = pages.flatMap((page) => page.resources.map((resource) => resource.path));
  const files = await resourceFiles(root, paths);
  const assetEntries = await readdir(resolve(root, 'assets'), { recursive: true, withFileTypes: true });
  const distributedFiles = await resourceFiles(
    root,
    assetEntries
      .filter((entry) => entry.isFile())
      .map((entry) => '/' + relative(root, resolve(entry.parentPath, entry.name)).replaceAll('\\', '/'))
  );
  const shared = files.filter(
    (file) =>
      pages.filter((page) => page.resources.some((resource) => resource.path === file.path)).length > 1
  );
  return {
    protocol: 'dashboard-resources-v1',
    method: 'dépendances statiques HTML/JS/CSS ; aucune hypothèse de cache entre pages',
    files,
    distributedFiles,
    sharedAssetBytes: shared.reduce((sum, file) => sum + file.bytes, 0),
    referencedAssetBytes: files.reduce((sum, file) => sum + file.bytes, 0),
    distributionBytes:
      pages.reduce((sum, page) => sum + page.htmlBytes, 0) +
      distributedFiles.reduce((sum, file) => sum + file.bytes, 0),
    pages
  };
}
