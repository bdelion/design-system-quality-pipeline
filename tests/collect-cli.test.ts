import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';

const execute = promisify(execFile);

/** Vérifie le contrat CLI sans lancer de collecte réseau. */
it('refuse toutes les collectes sans sortie avant de lire la configuration', async () => {
  for (const source of ['fixture', 'github']) {
    await expect(
      execute(process.execPath, ['--import', 'tsx', 'src/cli.ts', 'collect', '--source', source])
    ).rejects.toMatchObject({ stderr: expect.stringContaining("required option '--output <path>'") });
  }
}, 20_000);

/** Vérifie l'écriture effective du RAW dans un dossier imbriqué absent. */
it('crée le dossier de sortie et annonce le fichier RAW enregistré', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'dsq-collect-'));
  const output = join(directory, 'nested', 'raw', 'dataset.json');
  try {
    const result = await execute(process.execPath, [
      '--import',
      'tsx',
      'src/cli.ts',
      'collect',
      '--source',
      'fixture',
      '--output',
      output
    ]);
    const raw = JSON.parse(await readFile(output, 'utf8'));
    expect(raw.repositories.length).toBeGreaterThan(0);
    expect(result.stdout).toContain(`Fichier RAW : ${output}`);
    expect(result.stdout).toContain(`Collecte terminée : ${raw.repositories.length} repositories`);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}, 20_000);
