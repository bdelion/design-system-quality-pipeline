import { describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { collectFixture } from '../src/collectors/fixture.js';

describe('fixture collector', () => {
  it('loads an explicitly selected fixture instead of always using fixtures/github.json', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'ds-quality-fixture-'));
    const path = join(directory, 'custom.json');
    try {
      const dataset = {
        collectedAt: '2026-01-01T00:00:00.000Z',
        repositories: [],
        catalogueComponents: [],
        nexusAvailable: false
      };
      await writeFile(path, JSON.stringify(dataset), 'utf8');
      await expect(collectFixture(path)).resolves.toEqual(dataset);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
