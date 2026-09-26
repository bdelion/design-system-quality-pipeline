import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

/** Racine du projet, calculée à partir de ce module plutôt que du répertoire courant. */
export const rootPath = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const fixturePath = resolve(rootPath, 'fixtures/github.json');
export const configPath = resolve(rootPath, 'config');
export const cataloguePath = resolve(configPath, 'catalogue.yaml');
export const runPath = resolve(rootPath, 'data/runs');
export const currentPath = resolve(rootPath, 'data/current');
export const dashboardPath = resolve(rootPath, 'data');
