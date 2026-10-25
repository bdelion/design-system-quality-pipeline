import { describe, expect, it } from 'vitest';
import { projectLinkSettings, applyProjectLinks } from '../src/dashboard/project-links.js';
import { simplifiedModel } from '../src/analytics/simplified-dashboard.js';
import { benchmarkSnapshot } from './support/dashboard-load.js';

const env = {
  GITHUB_URL: 'https://git.acme.internal',
  GITHUB_PROJECT_OWNER_TYPE: 'users',
  GITHUB_PROJECT_OWNER: 'acme',
  GITHUB_PROJECT_NUMBER: '12',
  GITHUB_PROJECT_VIEW_NUMBER: '3'
};
const keywords = { DONE: ['Fait', '✅ Done'], CANCELLED: ['Abandonné', '🛑 Cancelled'] };

describe('issue #118 : liens Projects locaux', () => {
  it('laisse les datasets inchangés sans configuration et refuse une configuration partielle', () => {
    expect(projectLinkSettings(keywords, {})).toBeUndefined();
    expect(() => projectLinkSettings(keywords, { GITHUB_PROJECT_OWNER: 'acme' })).toThrow(
      'GITHUB_PROJECT_NUMBER'
    );
    for (const value of [
      'javascript:alert(1)',
      'https://user:secret@git.acme.internal',
      'https://git.acme.internal/api'
    ])
      expect(() => projectLinkSettings(keywords, { ...env, GITHUB_URL: value })).toThrow();
    expect(() => projectLinkSettings(keywords, { ...env, GITHUB_PROJECT_OWNER: '..' })).toThrow();
  });
  it('utilise les statuts du profil sans déduire Done de Closed, ni modifier les références', () => {
    const model = simplifiedModel(benchmarkSnapshot('control', 81));
    const original = structuredClone(model.tables);
    applyProjectLinks(model.tables, projectLinkSettings(keywords, env)!);
    const row = model.tables.find((table) => table.id === 'component-activity')!.rows[0]!;
    for (const [index, values] of [
      [4, keywords.DONE],
      [5, keywords.CANCELLED]
    ] as const) {
      const url = new URL(row.cells[index]!.url!);
      expect(url.origin + url.pathname).toBe('https://git.acme.internal/users/acme/projects/12/views/3');
      expect(url.searchParams.get('filterQuery')).toBe(
        'status:' + values.map((value) => JSON.stringify(value)).join(',') + ' repo:' + row.repository
      );
      expect(url.searchParams.get('filterQuery')).not.toMatch(/is:(closed|open)|reason:/);
      expect(row.cells[index]!.refs).toEqual(original[0]!.rows[0]!.cells[index]!.refs);
    }
    expect(row.cells[2]!.url).toBeUndefined();
  });
  it('applique seulement les alias explicitement configurés', () => {
    const model = simplifiedModel(benchmarkSnapshot('control', 81));
    const row = model.tables[0]!.rows[0]!;
    const settings = projectLinkSettings(keywords, {
      ...env,
      GITHUB_PROJECT_OWNER_TYPE: 'orgs',
      GITHUB_PROJECT_REPOSITORY_OWNER: 'fallback',
      GITHUB_PROJECT_REPOSITORIES: JSON.stringify({ [row.repository]: 'real-org/real-repo' })
    })!;
    applyProjectLinks(model.tables, settings);
    expect(new URL(row.cells[4]!.url!).searchParams.get('filterQuery')).toContain('repo:real-org/real-repo');
    expect(() => projectLinkSettings(keywords, { ...env, GITHUB_PROJECT_REPOSITORIES: '[]' })).toThrow();
    expect(() => projectLinkSettings(keywords, { ...env, GITHUB_PROJECT_REPOSITORIES: '{' })).toThrow();
  });
});
