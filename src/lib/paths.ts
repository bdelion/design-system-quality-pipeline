/**
 * @module lib.paths
 * Centralise les chemins par défaut des configurations, fixtures et sorties.
 * @remarks Documentation des contrats et responsabilités du module.
 */

import { fileURLToPath } from 'node:url';
import { basename, dirname, extname, resolve } from 'node:path';
import { access } from 'node:fs/promises';

/** Racine du projet, calculée à partir de ce module plutôt que du répertoire courant. */
export const rootPath = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
/**
 * Expose la constante « fixturePath » du module.
 */
export const fixturePath = resolve(rootPath, 'fixtures/github.json');
/**
 * Expose la constante « configPath » du module.
 */
export const configPath = resolve(rootPath, 'config');
/**
 * Expose la constante « cataloguePath » du module.
 */
export const cataloguePath = resolve(configPath, 'catalogue.yaml');
/**
 * Expose la constante « runPath » du module.
 */
export const runPath = resolve(rootPath, 'data/runs');
/**
 * Expose la constante « currentPath » du module.
 */
export const currentPath = resolve(rootPath, 'data/current');
/**
 * Expose la constante « dashboardPath » du module.
 */
export const dashboardPath = resolve(rootPath, 'data');

/** Retourne les fichiers de configuration associés à une fixture donnée. */
export function fixtureConfigPaths(fixtureFile: string): { system: string; catalogue: string } {
  const stem = basename(fixtureFile, extname(fixtureFile));
  return {
    system: resolve(configPath, `system.${stem}.yaml`),
    catalogue: resolve(configPath, `catalogue.${stem}.yaml`)
  };
}

/** Sélectionne une paire complète de configurations, sans mélanger deux profils de fixture. */
export async function resolveFixtureConfigPaths(
  fixtureFile?: string,
  directory: string = configPath
): Promise<{ system: string; catalogue: string }> {
  const legacy = {
    system: resolve(directory, 'system.fixture.yaml'),
    catalogue: resolve(directory, 'catalogue.fixture.yaml')
  };
  if (!fixtureFile) return legacy;
  const stem = basename(fixtureFile, extname(fixtureFile));
  const selected = {
    system: resolve(directory, `system.${stem}.yaml`),
    catalogue: resolve(directory, `catalogue.${stem}.yaml`)
  };
  /** Vérifie la présence d'un fichier et propage les erreurs autres qu'une absence. */
  async function exists(path: string): Promise<boolean> {
    try {
      await access(path);
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
      throw error;
    }
  }
  const [system, catalogue] = await Promise.all([exists(selected.system), exists(selected.catalogue)]);
  if (system !== catalogue) {
    throw new Error(
      `Configuration de fixture incomplète : ${selected.system} et ${selected.catalogue} doivent exister ensemble.`
    );
  }
  return system ? selected : legacy;
}
