import { performance } from 'node:perf_hooks';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import {
  benchmarkSnapshot,
  benchmarkCounts,
  type BenchmarkScenario
} from '../tests/support/dashboard-load.js';
import { generateDashboard } from '../src/dashboard/generate.js';
import { digest, measureHtml } from './benchmark-metrics.js';

// Un processus par génération : les caches et allocations du générateur ne survivent pas au passage.
const scenario = process.argv[2] as BenchmarkScenario;
const seed = Number(process.argv[3]);
const output = process.argv[4];
if (!output) throw new Error('Sortie de benchmark requise');
const preparationStart = performance.now();
const snapshot = benchmarkSnapshot(scenario, seed);
const preparationMs = performance.now() - preparationStart;
const fixtureHash = digest(JSON.stringify(snapshot));
const start = performance.now();
await generateDashboard(snapshot, output);
const generationMs = performance.now() - start;
const pages = [];
for (const file of (await readdir(join(output, 'dashboard')))
  .filter((file) => file.endsWith('.html'))
  .sort()) {
  pages.push({ page: file, ...measureHtml(await readFile(join(output, 'dashboard', file), 'utf8')) });
}
console.log(
  JSON.stringify({ preparationMs, generationMs, fixtureHash, counts: benchmarkCounts(snapshot), pages })
);
