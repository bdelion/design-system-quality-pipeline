import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, mkdir, writeFile, readFile, access, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { expect, it } from 'vitest';
import { rootPath } from '../src/lib/paths.js';

/** Vérifie que nettoyer le build ne supprime ni un ancien historique ni une capture locale. */
it('nettoie dist et préserve toutes les données personnelles', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'dsq-clean-'));
  try {
    for (const name of ['dist', 'data/runs', 'data/local'])
      await mkdir(join(directory, name), { recursive: true });
    await writeFile(join(directory, 'dist', 'index.js'), 'build');
    await writeFile(join(directory, 'data/runs', 'snapshot.json'), 'history');
    await writeFile(join(directory, 'data/local', 'raw.json'), 'capture');
    await promisify(execFile)(process.execPath, [join(rootPath, 'scripts/clean.mjs')], { cwd: directory });
    await expect(access(join(directory, 'dist'))).rejects.toMatchObject({ code: 'ENOENT' });
    expect(await readFile(join(directory, 'data/runs', 'snapshot.json'), 'utf8')).toBe('history');
    expect(await readFile(join(directory, 'data/local', 'raw.json'), 'utf8')).toBe('capture');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
