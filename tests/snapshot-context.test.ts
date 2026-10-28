import { expect, it } from 'vitest';
import { presentCaptureDate, presentSnapshotScope } from '../src/dashboard/assets/snapshot-context.js';
import { dashboardPageModel } from '../src/dashboard/page-read-model.js';
import { prodAndDevelopmentSnapshot } from './support/workspace-version-snapshot.js';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generateClassicDashboard as generateDashboard } from '../src/dashboard/generate.js';

it('place date, scope et fiabilité près du titre avec accès aux preuves, sans modifier le snapshot', async () => {
  const snapshot = prodAndDevelopmentSnapshot();
  snapshot.capturedAt = '2026-10-01T10:00:00Z';
  snapshot.scope = '<jeu-synthétique>';
  snapshot.reliability = 'partial';
  const before = JSON.stringify(snapshot);
  const output = await mkdtemp(join(tmpdir(), 'dsq-header-89-'));
  try {
    await generateDashboard(snapshot, output);
    const html = (await readFile(join(output, 'dashboard/index.html'), 'utf8')).replace(
      / data-review-(?:slot|key)="[^"]*"/g,
      ''
    );
    const heading = html.match(/<div class="page-heading">([\s\S]*?)<\/div><\/div>/)![1]!;
    expect(heading).toContain('Snapshot du 01/10/2026 10:00:00 UTC');
    expect(heading).toContain('&lt;jeu-synthétique&gt;');
    expect(heading).toContain('Fiabilité globale : partielle');
    expect(heading).toContain('href="quality.html#quality"');
    expect(heading).toContain(`${snapshot.dataQuality.issues.length} diagnostics`);
    expect(JSON.stringify(snapshot)).toBe(before);
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});

it('rend la capture en UTC et refuse une date absente, invalide ou sans fuseau', () => {
  expect(presentCaptureDate('2026-10-01T12:00:00+02:00')).toBe('Snapshot du 01/10/2026 10:00:00 UTC');
  for (const value of [
    undefined,
    '',
    'invalide',
    '2026-10-01T10:00:00',
    '2026-02-30T10:00:00Z',
    '2026-10-01Z'
  ])
    expect(presentCaptureDate(value)).toBe('Date de capture indisponible');
});

it('ne substitue aucune PROD à une publication non démontrée', () => {
  const snapshot = prodAndDevelopmentSnapshot();
  for (const version of snapshot.normalizedData.versions!) delete version.prodTag;
  const model = dashboardPageModel(snapshot, 'accessibility');
  const scope = presentSnapshotScope(model, new URLSearchParams());
  expect(scope).toContain('PROD non démontrée : acme/ds-react');
  expect(scope).not.toContain('1.7.1 (PROD)');
});

it('réutilise la PROD calculée puis le développement explicite, sans substituer une version inconnue', () => {
  const model = dashboardPageModel(prodAndDevelopmentSnapshot(), 'accessibility');
  expect(presentSnapshotScope(model, new URLSearchParams())).toContain('1.7.1 (PROD)');
  const explicit = presentSnapshotScope(
    model,
    new URLSearchParams('repository=acme/ds-react&component=Button&version=1.8.0')
  );
  expect(explicit).toContain('Composant : Button');
  expect(explicit).toContain('1.8.0 (développement)');
  expect(explicit).not.toContain('1.7.1');
  expect(presentSnapshotScope(model, new URLSearchParams('version=inconnue'))).toContain('indisponible');
  expect(presentSnapshotScope(model, new URLSearchParams('issue=anomaly-a'))).not.toContain('(PROD)');
});

it('préserve le stock global de l’accueil et ne présente pas les audits par version comme une PROD', () => {
  const snapshot = prodAndDevelopmentSnapshot();
  expect(
    presentSnapshotScope(
      dashboardPageModel(snapshot, 'index'),
      new URLSearchParams('repository=ancien&version=1.8.0')
    )
  ).toBe('Tous repositories · Toutes versions');
  expect(
    presentSnapshotScope(dashboardPageModel(snapshot, 'components'), new URLSearchParams('version=1.8.0'))
  ).toContain('Version cible : 1.8.0 (relations explicites)');
});
