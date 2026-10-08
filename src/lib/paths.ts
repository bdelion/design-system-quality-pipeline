/**
 * @module lib.paths
 * Centralise les chemins par défaut des configurations, fixtures et sorties.
 * @remarks Documentation des contrats et responsabilités du module.
 */

import { fileURLToPath } from 'node:url';
import { basename, dirname, extname, resolve } from 'node:path';

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
