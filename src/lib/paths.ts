/**
 * @module lib.paths
 * Centralise les chemins par défaut des configurations, fixtures et sorties.
 * @remarks Documentation des contrats et responsabilités du module.
 */

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

/** Racine du projet, calculée à partir de ce module plutôt que du répertoire courant. */
export const rootPath = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
