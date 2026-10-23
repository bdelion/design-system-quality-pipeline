import { describe, expect, it } from 'vitest';
import { githubTargets } from '../src/dashboard/assets/github-links.js';

const rows = [1, 2].map((number) => ({
  url: `https://github.com/acme/ui/issues/${number}`,
  state: 'CLOSED',
  labels: ['Component:Table', 'a11y']
}));

describe('issue #115 : cibles des en-têtes de fenêtres', () => {
  it('ouvre directement la seule source complète et dédupliquée', () => {
    const result = githubTargets([rows[0]!, rows[0]!], { directSingle: true });
    expect(result.links).toEqual([{ url: rows[0]!.url, count: 1, repository: 'acme/ui', search: false }]);
  });

  it('conserve les références, les labels sources partagés et le filtre fermé justifié', () => {
    const result = githubTargets(rows, { directSingle: true, matchLabels: true, state: 'closed' });
    const query = new URL(result.links[0]!.url).searchParams.get('q')!;
    expect(query).toContain('repo:acme/ui is:issue is:closed');
    expect(query).toContain('label:"Component:Table"');
    expect(query).toContain('(1 OR 2)');
    expect(result.stateMismatch).toBeUndefined();
  });

  it('ne filtre pas les états d’un total et n’invente aucun motif de fermeture', () => {
    const result = githubTargets(rows, { directSingle: true, matchLabels: true });
    const query = new URL(result.links[0]!.url).searchParams.get('q')!;
    expect(query).not.toMatch(/is:(open|closed)|reason:/);
  });

  it('préserve une cohorte Project mixte au lieu de masquer les issues d’un autre état GitHub', () => {
    const result = githubTargets([rows[0]!, { ...rows[1]!, state: 'OPEN' }], { state: 'closed' });
    expect(result.stateMismatch).toBe(true);
    expect(new URL(result.links[0]!.url).searchParams.get('q')).not.toContain('is:closed');
  });

  it('borne les requêtes et ne présente pas une sélection partielle comme une source unique', () => {
    const long = Array.from({ length: 30 }, (_, index) => ({
      ...rows[0]!,
      url: `https://github.com/acme/ui/issues/${index + 1}`,
      labels: ['Component:' + 'x'.repeat(280)]
    }));
    const result = githubTargets(long, { matchLabels: true, directSingle: true });
    expect(result.links.reduce((sum, item) => sum + item.count, 0)).toBe(30);
    for (const item of result.links)
      expect(new URL(item.url).searchParams.get('q')!.length).toBeLessThanOrEqual(256);
    const partial = githubTargets([rows[0]!, { url: '' }], { directSingle: true });
    expect(partial.unavailable).toBe(1);
    expect(partial.links[0]!.search).toBe(true);
  });
});
