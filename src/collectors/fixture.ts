import { readJson } from '../lib/files.js';
import { fixturePath } from '../lib/paths.js';
import type { RawDataset } from '../domain/types.js';

export async function collectFixture(): Promise<RawDataset> {
  return readJson<RawDataset>(fixturePath);
}
