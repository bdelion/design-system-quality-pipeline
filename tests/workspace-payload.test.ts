import { expect, it } from 'vitest';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { generateDashboard } from '../src/dashboard/generate.js';
import { workspaceModel } from '../src/dashboard/workspaces.js';
import { consolidationSnapshot } from './support/consolidation.js';

for (const state of ['current', 'legacy', 'absent'] as const) {
  it(`issue #82 : une seule représentation courante, capture ${state} immuable`, async () => {
    const snapshot = consolidationSnapshot();
    snapshot.analytics.workspaces!.rows[0]!.title =
      'Sonde </script><script>window.__payloadProbe=true</script>';
    if (state === 'current') {
      const summary = snapshot.analytics.workspaces!.scopes[0]!;
      snapshot.analytics.workspaces!.scopes = Array.from({ length: 100 }, (_, index) => ({
        ...structuredClone(summary),
        version: index ? `synthetic-context-${index}` : ''
      }));
    }
    if (state === 'legacy') {
      delete snapshot.analytics.workspaces!.versionSelectionAlgorithm;
      snapshot.analytics.workspaces!.scopes[0]!.summary.coverage = -1;
      snapshot.analytics.workspaces!.rows[0]!.qualification.reasons.push(
        'Qualification historique conservée'
      );
    }
    if (state === 'absent') delete snapshot.analytics.workspaces;
    const source = JSON.stringify(snapshot);
    const expected = workspaceModel(snapshot);
    const directory = await mkdtemp(join(tmpdir(), 'dsq-single-workspace-'));
    try {
      await generateDashboard(snapshot, directory);
      const pages = (await readdir(join(directory, 'dashboard'))).filter((file) => file.endsWith('.html'));
      expect(pages).toHaveLength(10);
      for (const page of pages) {
        const html = await readFile(join(directory, 'dashboard', page), 'utf8');
        expect(html.includes('id="workspace-data"')).toBe(false);
        expect(html.includes('</script><script>window.__payloadProbe=true')).toBe(false);
        expect(html.match(/"versionSelectionAlgorithm":"prod-tag-v1"/g)).toHaveLength(1);
        const json = html.match(/window\.__SNAPSHOT__ = ([\s\S]*?); if \(location\.protocol/)![1]!;
        if (state === 'current') expect(json === source.replace(/</g, '\\u003c')).toBe(true);
        expect(JSON.parse(json).analytics.workspaces).toEqual(expected);
        expect(html.match(/src="assets\/workspaces\.js"/g)).toHaveLength(1);
      }
      expect(JSON.stringify(snapshot)).toBe(source);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
}
