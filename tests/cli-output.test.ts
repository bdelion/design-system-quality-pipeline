import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { expect, it } from 'vitest';
import { pipelineSummary } from '../src/lib/cli-output.js';
import { consolidationSnapshot } from './support/consolidation.js';

const execute = promisify(execFile);
/** Vérifie la sortie de présentation sans masquer les réserves ni exposer les objets source. */
it('présente les compteurs, réserves et fichiers sans JSON ni identifiant technique', () => {
  const snapshot = consolidationSnapshot();
  const summary = pipelineSummary(snapshot, 'Pipeline', 'PARTIAL');
  expect(summary).toContain('Statut : partiel');
  expect(summary).toContain('8 issues ; 1 PR');
  expect(summary).toContain('Qualité des données');
  expect(summary).toContain('data/output/demo/current/snapshot.json');
  expect(summary).not.toContain(snapshot.snapshotId);
  expect(summary).not.toContain('anomaly-a');
  expect(summary).not.toContain('{');
  delete snapshot.analytics.metrics['issue.total'];
  expect(pipelineSummary(snapshot, 'Analyse', 'PARTIAL')).toContain('nombre d’issues indisponible');
});

/** Vérifie l'interface CLI en lecture seule et les options avant toute collecte ou écriture. */
it('la CLI propose une synthèse française et refuse les seuils invalides', async () => {
  const result = await execute(process.execPath, ['--import', 'tsx', 'src/cli.ts', 'collect', '--help']);
  expect(result.stdout).toContain('--repositories');
  expect(result.stdout).not.toContain('"metrics"');
  expect(result.stderr).not.toContain('test-token');
  await expect(
    execute(process.execPath, [
      '--import',
      'tsx',
      'src/cli.ts',
      'collect',
      '--repositories',
      'unused.json',
      '--output',
      'unused.json',
      '--rest-quota-reserve',
      '-1'
    ])
  ).rejects.toMatchObject({ stderr: expect.stringContaining('entier positif ou nul') });
  const help = await execute(process.execPath, ['--import', 'tsx', 'src/cli.ts', 'collect', '--help']);
  expect(help.stdout).toContain('--wait-for-quota');
  expect(help.stdout).toContain('--quota-max-wait');
}, 30_000);
