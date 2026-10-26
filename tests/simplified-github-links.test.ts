import { describe, expect, it } from 'vitest';
import { githubTargets } from '../src/dashboard/assets/github-links.js';

const source = (number: number, repository = 'acme/ui') => ({
  url: `https://github.com/${repository}/issues/${number}`
});

describe('recherches GitHub sans lots', () => {
  it('préserve les labels préfixés et leurs emojis dans la page Issues du dépôt', () => {
    const result = githubTargets([{ ...source(12), labels: ['🧩 Component:Input Pagination'] }], {
      matchLabels: true
    });
    const url = new URL(result.links[0]!.url);
    expect(url.origin + url.pathname).toBe('https://github.com/acme/ui/issues');
    expect(url.searchParams.get('q')).toBe('is:issue label:"🧩 Component:Input Pagination"');
    expect(url.searchParams.has('type')).toBe(false);
  });
  it('déduplique les références et utilise un filtre de dépôt', () => {
    const result = githubTargets([source(12), source(12)]);
    expect(result.links).toHaveLength(1);
    expect(new URL(result.links[0]!.url).pathname).toBe('/acme/ui/issues');
    expect(new URL(result.links[0]!.url).searchParams.get('q')).toBe('is:issue');
  });
  it('rassemble plusieurs dépôts en une seule recherche', () => {
    const result = githubTargets([source(12), source(1, 'acme/core')]);
    expect(result.links).toHaveLength(1);
    expect(new URL(result.links[0]!.url).searchParams.get('q')).toBe(
      '(repo:acme/ui is:issue) OR (repo:acme/core is:issue)'
    );
  });
  it('ne fabrique aucun accès depuis des URL anonymisées ou dangereuses', () => {
    for (const url of [
      '',
      'javascript:alert(1)',
      'https://example.invalid/acme/ui/issues/12',
      'https://github.com.evil.test/acme/ui/issues/12',
      'https://user:secret@github.com/acme/ui/issues/12',
      'https://github.com/acme/ui/issues/12?unexpected=1'
    ]) {
      const result = githubTargets([{ url }]);
      expect(result.links).toEqual([]);
      expect(result.unavailable).toBe(1);
    }
    expect(githubTargets([])).toEqual({ links: [], unavailable: 0 });
  });
  it('préserve le type PR et tous ses états', () => {
    const result = githubTargets([
      { url: 'https://github.com/acme/ui/pull/10' },
      { url: 'https://github.com/acme/ui/pull/11' }
    ]);
    expect(new URL(result.links[0]!.url).pathname).toBe('/acme/ui/pulls');
    expect(new URL(result.links[0]!.url).searchParams.get('q')).toBe('is:pr');
  });
  it('refuse les requêtes trop longues au lieu de les répartir en lots', () => {
    expect(githubTargets([{ ...source(1), labels: ['x'.repeat(300)] }], { matchLabels: true }).links).toEqual(
      []
    );
    expect(githubTargets(Array.from({ length: 7 }, (_, i) => source(1, 'acme/repo' + i))).links).toEqual([]);
  });
});
