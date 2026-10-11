import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveFixtureConfigPaths } from '../src/lib/paths.js';

/** Exécute un scénario dans un dossier temporaire indépendant des profils du repository. */
async function withDirectory(run: (directory: string) => Promise<void>): Promise<void> {
  const directory = await mkdtemp(join(tmpdir(), 'dsq-config-pair-'));
  try {
    await run(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

describe('sélection cohérente des configurations de fixture', () => {
  it('conserve la paire historique lorsque les deux profils spécifiques sont absents', async () => {
    await withDirectory(async (directory) => {
      expect(await resolveFixtureConfigPaths('example.json', directory)).toEqual({
        system: join(directory, 'system.fixture.yaml'),
        catalogue: join(directory, 'catalogue.fixture.yaml')
      });
    });
  });
  it('sélectionne ensemble les deux profils spécifiques', async () => {
    await withDirectory(async (directory) => {
      await writeFile(join(directory, 'system.example.yaml'), '');
      await writeFile(join(directory, 'catalogue.example.yaml'), '');
      expect(await resolveFixtureConfigPaths('example.json', directory)).toEqual({
        system: join(directory, 'system.example.yaml'),
        catalogue: join(directory, 'catalogue.example.yaml')
      });
    });
  });
  for (const member of ['system', 'catalogue']) {
    it(`refuse un profil partiel contenant seulement ${member}`, async () => {
      await withDirectory(async (directory) => {
        await writeFile(join(directory, `${member}.example.yaml`), '');
        await expect(resolveFixtureConfigPaths('example.json', directory)).rejects.toThrow('incomplète');
      });
    });
  }
});
