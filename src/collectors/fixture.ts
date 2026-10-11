/**
 * @module collectors.fixture
 * Lit une fixture locale en respectant le contrat de collecte RAW.
 * @remarks Documentation des contrats et responsabilités du module.
 */

import { readJson } from '../lib/files.js';
import { fixturePath } from '../lib/paths.js';
import type { RawDataset } from '../domain/types.js';

/** Retourne les données locales utilisées pour les tests et la démonstration. */
export async function collectFixture(path: string = fixturePath): Promise<RawDataset> {
  return readJson<RawDataset>(path);
}
