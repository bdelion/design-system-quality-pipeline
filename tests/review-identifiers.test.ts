import { describe, expect, it } from 'vitest';
import { reviewContext } from '../src/dashboard/review-output.js';
import { reviewId, reviewEntity } from '../src/dashboard/assets/review-core.js';
import { benchmarkSnapshot } from './support/dashboard-load.js';

describe('références de revue', () => {
  it('ne transforme ni les textes ni les URL navigables en identité', () => {
    const link = {
      dataset: {},
      localName: 'a',
      id: '',
      href: 'https://github.test/org/repo/issues/1',
      textContent: '12'
    };
    expect(reviewEntity(link)).toBe('');
    link.href = 'https://another.test/other/repo/issues/999';
    link.textContent = '99';
    expect(reviewEntity(link)).toBe('');
    expect(reviewEntity({ ...link, dataset: { reviewKey: 'source-entity' } })).toBe('source-entity');
  });

  it('sépare les dimensions sans collision de séparateurs ni hachage destructif', () => {
    const base = reviewId('site', 'simple', 'components', ['table', 'a/b', 'done']);
    expect(reviewId('site', 'simple', 'components', ['table', 'a', 'b/done'])).not.toBe(base);
    for (const dimensions of [
      ['other', 'simple', 'components'],
      ['site', 'classic', 'components'],
      ['site', 'simple', 'team']
    ])
      expect(reviewId(...dimensions, ['table', 'a/b', 'done'])).not.toBe(base);
    expect(base.split('/').map(decodeURIComponent)).toEqual([
      'DSQ1',
      'site',
      'simple',
      'components',
      'table',
      'a/b',
      'done'
    ]);
  });

  it('sépare identité du site et génération sans copier les titres ou le RAW', async () => {
    const snapshot = benchmarkSnapshot('control', 81);
    const before = JSON.stringify(snapshot);
    const original = await reviewContext(snapshot);
    snapshot.snapshotId += '-new';
    snapshot.capturedAt = '2026-10-27T00:00:00Z';
    snapshot.normalizedData.issues![0]!.title = 'Titre privé à ne pas exporter';
    const newer = await reviewContext(snapshot);
    expect(newer.site).toBe(original.site);
    expect(newer.generation).not.toBe(original.generation);
    expect(
      (await reviewContext(snapshot, { githubUrl: 'https://github.enterprise.test' })).generation
    ).not.toBe(newer.generation);
    expect(JSON.stringify(newer)).not.toContain('Titre privé');
    snapshot.rawData.repositories[0]!.id += '-independent';
    expect((await reviewContext(snapshot)).site).not.toBe(original.site);
    expect(original.generator).toMatch(/^\d+\.\d+\.\d+\+[a-f0-9]{64}$/);
    expect(before).not.toBe(JSON.stringify(snapshot));
  });
});
