import { describe, expect, it } from 'vitest';
import { githubTargets } from '../src/dashboard/assets/github-links.js';

const source = (number: number, repository = 'acme/ui') => ({
  url: `https://github.com/${repository}/issues/${number}`
});

describe('accès GitHub de la vue simplifiée', () => {
  it('ouvre une recherche même pour une source unique et déduplique ses références', () => {
    const result = githubTargets([source(12), source(12)]);
    expect(result.links).toHaveLength(1);
    expect(new URL(result.links[0]!.url).searchParams.get('q')).toBe('repo:acme/ui is:issue (12)');
    expect(result.links[0]!.search).toBe(true);
    expect(result.unavailable).toBe(0);
  });

  it('sépare les dépôts et borne les recherches sans perdre les numéros', () => {
    const sources = [...Array.from({ length: 25 }, (_, index) => source(index + 1)), source(1, 'acme/core')];
    const result = githubTargets(sources);
    expect(result.links.reduce((sum, link) => sum + link.count, 0)).toBe(26);
    const queries = result.links
      .filter((link) => link.search)
      .map((link) => new URL(link.url).searchParams.get('q')!);
    expect(queries.every((query) => query.length <= 256 && query.split(' OR ').length <= 6)).toBe(true);
    expect(queries[0]).toBe('repo:acme/ui is:issue (1 OR 2 OR 3 OR 4 OR 5 OR 6)');
    expect(new URL(result.links.at(-1)!.url).searchParams.get('q')).toBe('repo:acme/core is:issue (1)');
    expect(result.unavailable).toBe(0);
  });

  it('ne fabrique aucune URL depuis un identifiant anonymisé ou un hôte externe', () => {
    const result = githubTargets([
      { url: '' },
      { url: 'javascript:alert(1)' },
      { url: 'https://example.invalid/acme/ui/issues/12' },
      { url: 'https://github.com.evil.test/acme/ui/issues/12' },
      { url: 'https://user:secret@github.com/acme/ui/issues/12' },
      { url: 'https://github.com/acme/ui/issues/12?unexpected=1' },
      { url: 'https://github.com/acme/ui/issues' }
    ]);
    expect(result.links).toEqual([]);
    expect(result.unavailable).toBe(7);
    expect(githubTargets([])).toEqual({ links: [], unavailable: 0 });
  });

  it('signale les sources manquantes sans élargir la sélection accessible', () => {
    const result = githubTargets([source(12), { url: '' }, { url: 'https://example.invalid/opaque' }]);
    expect(result.unavailable).toBe(2);
    expect(new URL(result.links[0]!.url).searchParams.get('q')).toBe('repo:acme/ui is:issue (12)');
  });

  it('préserve le type PR sans filtre de statut courant', () => {
    const result = githubTargets([
      { url: 'https://github.com/acme/ui/pull/10' },
      { url: 'https://github.com/acme/ui/pull/11' }
    ]);
    expect(new URL(result.links[0]!.url).searchParams.get('q')).toBe('repo:acme/ui is:pr (10 OR 11)');
  });
});
