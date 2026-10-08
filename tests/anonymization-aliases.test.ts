import { describe, expect, it } from 'vitest';
import type { RawDataset } from '../src/domain/types.js';
import { anonymizationAliases, withAliases } from '../src/anonymization/aliases.js';

const source = {
  repositories: [
    { name: 'design-system-core', owner: 'source-org' },
    { name: 'design-system-react', owner: 'source-org' },
    { name: 'design-system-docs', owner: 'source-org' }
  ]
} as RawDataset;

describe('anonymization aliases', () => {
  it('resolves multiple repository aliases independently of RAW order', () => {
    const env = {
      ANON_GITHUB_OWNER: 'demo-org',
      ANON_REPO_DESIGN_SYSTEM_CORE: 'demo-core',
      ANON_REPO_DESIGN_SYSTEM_REACT: 'demo-react',
      ANON_REPO_DESIGN_SYSTEM_DOCS: 'demo-docs'
    };
    const aliases = anonymizationAliases(source, env);
    const mapper = withAliases((_namespace, value) => `fallback-${value}`, aliases);
    expect(source.repositories.map((repo) => mapper('repository', repo.name, 'repo'))).toEqual([
      'demo-core',
      'demo-react',
      'demo-docs'
    ]);
    expect(mapper('owner', 'source-org', 'owner')).toBe('demo-org');
  });

  it('rejects normalized source name collisions instead of silently overwriting', () => {
    const colliding = {
      repositories: [
        { name: 'design-system-react', owner: 'source-org' },
        { name: 'design.system.react', owner: 'source-org' }
      ]
    } as RawDataset;
    expect(() =>
      anonymizationAliases(colliding, {
        ANON_REPO_DESIGN_SYSTEM_REACT: 'demo-react'
      })
    ).toThrow(/nom ambigu/);
  });

  it('rejects duplicate destination aliases', () => {
    expect(() =>
      anonymizationAliases(source, {
        ANON_REPO_DESIGN_SYSTEM_CORE: 'same',
        ANON_REPO_DESIGN_SYSTEM_REACT: 'same'
      })
    ).toThrow(/doublon/);
  });
});
