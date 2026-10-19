import { chromium } from '@playwright/test';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Command } from 'commander';
import { generateDashboard } from '../src/dashboard/generate.js';
import { paginationSnapshot } from '../tests/support/pagination-snapshot.js';
import { measureBrowserPage } from './dashboard-benchmark.js';
import { digest, measureHtml } from './benchmark-metrics.js';
import { startDashboardServer } from './serve-dashboard.js';

/** Compare deux générateurs locaux sur les mêmes faits fictifs, avec les mesures DOM du protocole #81. */
async function run(beforeSource: string, output: string): Promise<void> {
  const previous = (await import(pathToFileURL(resolve(beforeSource)).href)) as {
    generateDashboard: typeof generateDashboard;
  };
  if (typeof previous.generateDashboard !== 'function') throw new Error('Générateur de référence absent');
  const snapshot = paginationSnapshot();
  const directory = await mkdtemp(join(tmpdir(), 'dsq-pagination-measure-'));
  const browser = await chromium.launch(process.platform === 'win32' ? { channel: 'msedge' } : {});
  const results = [];
  try {
    for (const [state, generate] of [
      ['before', previous.generateDashboard],
      ['after', generateDashboard]
    ] as const) {
      const target = join(directory, state);
      await generate(snapshot, target, 'https://github.enterprise.test');
      const server = await startDashboardServer(join(target, 'dashboard'), 0);
      try {
        const address = server.address();
        if (!address || typeof address === 'string') throw new Error('Port indisponible');
        for (const page of ['issues.html', 'quality.html']) {
          const url = `http://127.0.0.1:${address.port}/${page}`;
          await measureBrowserPage(browser, url);
          const samples = [];
          for (let run = 0; run < 3; run++) samples.push(await measureBrowserPage(browser, url));
          results.push({
            state,
            page,
            ...measureHtml(await readFile(join(target, 'dashboard', page), 'utf8')),
            samples
          });
        }
      } finally {
        server.closeAllConnections();
        await new Promise<void>((done, reject) => server.close((error) => (error ? reject(error) : done())));
      }
    }
    await mkdir(dirname(resolve(output)), { recursive: true });
    await writeFile(
      output,
      JSON.stringify(
        {
          protocol: 'dashboard-pagination-v1',
          measurement:
            'dashboard-benchmark-v1 (#81), chauffe puis 3 contextes neufs, 1440×900, HTTP local sans cache, aucune limite de temps',
          fixture: 'pagination-synthetic-v1',
          fixtureHash: digest(JSON.stringify(snapshot)),
          browser: browser.version(),
          results
        },
        null,
        2
      ) + '\n'
    );
  } finally {
    await browser.close();
    await rm(directory, { recursive: true, force: true });
  }
}

const options = new Command()
  .requiredOption('--before-source <file>', 'générateur local de référence autorisé')
  .requiredOption('--output <file>', 'rapport JSON synthétique')
  .parse()
  .opts<{ beforeSource: string; output: string }>();
await run(options.beforeSource, options.output);
