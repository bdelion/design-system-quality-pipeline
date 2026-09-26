import { readJson } from '../lib/files.js';
import { fixturePath } from '../lib/paths.js';
import type { RawDataset } from '../domain/types.js';

/** Retourne les données locales utilisées pour les tests et la démonstration. */
export async function collectFixture(): Promise<RawDataset> {
  return readJson<RawDataset>(fixturePath);
}
