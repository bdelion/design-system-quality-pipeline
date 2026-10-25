import { describe, expect, it } from 'vitest';
import { githubTargets } from '../src/dashboard/assets/github-links.js';

const rows = [1, 2].map((number) => ({
  url: `https://github.com/acme/ui/issues/${number}`,
  state: 'CLOSED',
  labels: ['Component:Table', 'a11y']
}));

describe('issue #115 : destination unique des fenêtres', () => {
  it('ouvre directement la seule source dédupliquée', () => {
    expect(githubTargets([rows[0]!, rows[0]!], { directSingle: true }).links).toEqual([
      { url: rows[0]!.url, count: 1, repository: 'acme/ui', search: false }
    ]);
  });
  it('utilise les labels sources sans numéros ni lots', () => {
    const result = githubTargets(rows, {
      matchLabels: true,
      state: 'closed',
      universe: [
        ...rows,
        { url: 'https://github.com/acme/ui/issues/3', labels: ['Component:Button'], state: 'CLOSED' }
      ]
    });
    expect(result.links).toHaveLength(1);
    expect(new URL(result.links[0]!.url).searchParams.get('q')).toBe(
      'is:issue is:closed label:"Component:Table" label:"a11y"'
    );
  });
  it('ne limite pas un total aux issues ouvertes ou fermées', () => {
    const result = githubTargets(rows, { matchLabels: true });
    expect(new URL(result.links[0]!.url).searchParams.get('q')).not.toMatch(/is:(open|closed)|reason:/);
  });
  it('ne confond pas les statuts Project avec les états GitHub', () => {
    const result = githubTargets([rows[0]!, { ...rows[1]!, state: 'OPEN' }], { state: 'closed' });
    expect(result.stateMismatch).toBe(true);
    expect(new URL(result.links[0]!.url).searchParams.get('q')).not.toContain('is:closed');
  });
  it('garde un seul lien pour une grande population partageant les mêmes filtres', () => {
    const sources = Array.from({ length: 300 }, (_, i) => ({
      ...rows[0]!,
      url: `https://github.com/acme/ui/issues/${i + 1}`
    }));
    const result = githubTargets(sources, { matchLabels: true, universe: sources });
    expect(result.links).toHaveLength(1);
    expect(result.links[0]!.count).toBe(300);
    expect(new URL(result.links[0]!.url).searchParams.get('q')!.length).toBeLessThanOrEqual(256);
  });
  it('explique une sélection impossible au lieu d’ouvrir une liste plus large', () => {
    const result = githubTargets([rows[0]!], { matchLabels: true, universe: rows });
    expect(result.links).toEqual([]);
    expect(result.reason).toContain('ne correspond pas');
  });
  it('ne propose pas une recherche partielle quand une URL manque', () => {
    const result = githubTargets([rows[0]!, { url: '' }], { directSingle: true });
    expect(result.links).toEqual([]);
    expect(result.unavailable).toBe(1);
    expect(result.reason).toContain('anonymisées');
  });
  it('conserve l’hôte GitHub Enterprise depuis les sources', () => {
    const sources = rows.map((row) => ({ ...row, url: row.url.replace('github.com', 'git.acme.internal') }));
    const result = githubTargets(sources, { matchLabels: true });
    expect(new URL(result.links[0]!.url).origin).toBe('https://git.acme.internal');
    expect(githubTargets([sources[0]!, rows[1]!]).links).toEqual([]);
  });
  it('respecte la recherche insensible à la casse des labels de GitHub', () => {
    const result = githubTargets([rows[0]!], {
      matchLabels: true,
      universe: [rows[0]!, { ...rows[1]!, labels: ['component:table', 'A11Y'] }]
    });
    expect(result.links).toEqual([]);
  });
  it('regroupe des labels historiques distincts dans un seul lien quand leur union est fidèle', () => {
    const sources = [rows[0]!, { ...rows[1]!, labels: ['Table historique'] }];
    const result = githubTargets(sources, {
      matchLabels: true,
      universe: [...sources, { url: 'https://github.com/acme/ui/issues/9', labels: ['Component:Button'] }]
    });
    expect(result.links).toHaveLength(1);
    const query = new URL(result.links[0]!.url).searchParams.get('q')!;
    expect(query).toContain(' OR ');
    expect(query).toContain('label:"Table historique"');
    expect(query).not.toContain('Button');
  });
  it('propose le repli élargi validé, avec un marqueur explicite et sans lots', () => {
    const result = githubTargets([rows[0]!], { universe: rows, matchLabels: true, allowBroader: true });
    expect(result.links).toHaveLength(1);
    expect(result.approximate).toBe(true);
    expect(new URL(result.links[0]!.url).searchParams.get('q')).toBe(
      'is:issue label:"Component:Table" label:"a11y"'
    );
  });
  it('replie une requête trop longue sur son seul dépôt sans limiter un total aux ouvertes', () => {
    const sources = rows.map((row) => ({ ...row, labels: ['x'.repeat(300)] }));
    const result = githubTargets(sources, { matchLabels: true, allowBroader: true });
    expect(result.approximate).toBe(true);
    expect(new URL(result.links[0]!.url).searchParams.get('q')).toBe('is:issue');
  });
});
