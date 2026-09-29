import { describe, expect, it } from 'vitest';
import { fixtureConfigPaths } from '../src/lib/paths.js';

describe('fixture-specific configuration', () => {
  it('derives stable config filenames from the fixture filename', () => {
    expect(fixtureConfigPaths('fixtures/my-real-dataset-anonymized.json')).toEqual({
      system: expect.stringMatching(/config[\\/]system\.my-real-dataset-anonymized\.yaml$/),
      catalogue: expect.stringMatching(/config[\\/]catalogue\.my-real-dataset-anonymized\.yaml$/)
    });
  });
});
