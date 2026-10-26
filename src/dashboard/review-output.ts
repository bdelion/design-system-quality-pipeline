import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import type { Snapshot } from '../domain/types.js';

/** Établit l’espace d’identité et les preuves de génération sans exporter les sources métier. */
export async function reviewContext(snapshot: Snapshot, settings: Record<string, string | undefined> = {}) {
  const source = new URL('./', import.meta.url);
  const files = (await readdir(source, { recursive: true })).filter((name) => /\.(ts|js)$/.test(name)).sort();
  const digest = createHash('sha256');
  for (const file of files)
    digest.update(file).update(await readFile(new URL(file.replaceAll('\\', '/'), source)));
  const packageFile = new URL(
    import.meta.url.includes('/dist/') ? '../../../package.json' : '../../package.json',
    import.meta.url
  );
  const { version } = JSON.parse(await readFile(packageFile, 'utf8')) as { version: string };
  const generator = version + '+' + digest.digest('hex');
  const site = createHash('sha256')
    .update(
      JSON.stringify([
        snapshot.scope,
        snapshot.rawData.repositories.map((repository) => repository.id).sort()
      ])
    )
    .digest('hex');
  const generation = createHash('sha256')
    .update(JSON.stringify([snapshot, generator, settings]))
    .digest('hex');
  return { site, generation, generator, snapshot: snapshot.snapshotId, capturedAt: snapshot.capturedAt };
}
