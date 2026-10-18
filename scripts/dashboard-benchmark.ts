import { chromium, type Browser } from '@playwright/test';
import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import { cpus, platform, release, totalmem } from 'node:os';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { Command } from 'commander';
import { fixtureVersion, type BenchmarkScenario } from '../tests/support/dashboard-load.js';
import { startDashboardServer } from './serve-dashboard.js';
import {
  compareReports,
  measureHtml,
  summarizeSamples,
  checkBudgets,
  type BenchmarkBudget,
  type ComparableReport
} from './benchmark-metrics.js';

export const benchmarkProtocol = 'dashboard-benchmark-v1';
const viewport = { width: 1440, height: 900 };

/** Mesure une navigation locale neuve, la disponibilité après modules et deux frames, puis le DOM hors capture. */
export async function measureBrowserPage(browser: Browser, url: string, capturePath?: string) {
  const context = await browser.newContext({
    viewport,
    locale: 'fr-FR',
    timezoneId: 'UTC',
    serviceWorkers: 'block'
  });
  const errors: string[] = [];
  await context.route('**/*', async (route) => {
    if (new URL(route.request().url()).origin !== new URL(url).origin) {
      errors.push('Requête non locale interdite');
      await route.abort();
    } else await route.continue();
  });
  try {
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('response', (response) => {
      if (response.status() >= 400) errors.push(`HTTP ${response.status()}`);
    });
    const start = performance.now();
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
    if (!response?.ok()) throw new Error('Navigation locale échouée');
    const navigationMs = performance.now() - start;
    await page.waitForLoadState('load', { timeout: 120000 });
    await page.locator('main h1').waitFor({ state: 'visible' });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done())));
    });
    const resultReadyMs = performance.now() - start;
    const counts = await page.evaluate(() => {
      const walker = document.createTreeWalker(document, NodeFilter.SHOW_ALL);
      let domNodes = 1;
      while (walker.nextNode()) domNodes++;
      const rows = [...document.querySelectorAll('tbody tr')];
      return {
        domNodes,
        domElements: document.querySelectorAll('*').length,
        renderedTableRows: rows.length,
        visibleTableRows: rows.filter((row) => row.getClientRects().length > 0).length
      };
    });
    let captureMs: number | null = null;
    if (capturePath) {
      const captureStart = performance.now();
      await page.screenshot({ path: capturePath, fullPage: false, timeout: 120000 });
      captureMs = performance.now() - captureStart;
    }
    if (errors.length) throw new Error(`Erreurs navigateur : ${errors.join('; ')}`);
    return { ...counts, navigationMs, resultReadyMs, captureMs };
  } finally {
    await context.close();
  }
}

/** Exécute le protocole local sans collecteur, sans fichier d'entrée privé et sans seuil de temps. */
export async function runBenchmark(options: {
  scenario: BenchmarkScenario;
  seed: number;
  runs: number;
  output: string;
  screenshots?: boolean;
  compare?: string;
  channel?: string;
  budgets?: string;
}) {
  if (!Number.isSafeInteger(options.runs) || options.runs < 3 || options.runs > 20)
    throw new Error('Entre 3 et 20 passages mesurés requis');
  if (
    !['control', 'load'].includes(options.scenario) ||
    !Number.isSafeInteger(options.seed) ||
    options.seed < 0 ||
    options.seed > 0xffffffff
  )
    throw new Error('Scénario control/load et graine uint32 requis');
  if (options.budgets && !options.compare) throw new Error('--budgets exige --compare');
  const budget = options.budgets
    ? (JSON.parse(await readFile(resolve(options.budgets), 'utf8')) as BenchmarkBudget)
    : undefined;
  if (
    budget &&
    (budget.status !== 'validated' ||
      !Number.isFinite(budget.maxGrowthPercent) ||
      budget.maxGrowthPercent < 0)
  )
    throw new Error('Budget invalide ou non validé explicitement');
  const output = resolve(options.output);
  // Refuser une sortie existante : ne jamais écraser une preuve ou un dashboard opérationnel.
  await mkdir(output, { recursive: false });
  const generation: number[] = [];
  let preparationMs = 0;
  let fixtureHash = '';
  let counts:
    | {
        repositories: number;
        issues: number;
        pullRequests: number;
        componentVersions: number;
        diagnostics: number;
      }
    | undefined;
  const expected = new Map<string, ReturnType<typeof measureHtml>>();
  for (let pass = 0; pass <= options.runs; pass++) {
    const { stdout } = await promisify(execFile)(
      process.execPath,
      [
        '--import',
        'tsx',
        fileURLToPath(
          new URL(
            import.meta.url.endsWith('.ts') ? './benchmark-generate.ts' : './benchmark-generate.js',
            import.meta.url
          )
        ),
        options.scenario,
        String(options.seed),
        output
      ],
      { maxBuffer: 2 * 1024 * 1024, windowsHide: true }
    );
    const measured = JSON.parse(stdout.trim().split('\n').at(-1)!) as {
      preparationMs: number;
      generationMs: number;
      fixtureHash: string;
      counts: NonNullable<typeof counts>;
      pages: (ReturnType<typeof measureHtml> & { page: string })[];
    };
    if (pass === 0) {
      preparationMs = measured.preparationMs;
      fixtureHash = measured.fixtureHash;
      counts = measured.counts;
    } else if (fixtureHash !== measured.fixtureHash) throw new Error('Fixture non déterministe');
    if (pass > 0) generation.push(measured.generationMs);
    if (pass > 0 && measured.pages.length !== expected.size)
      throw new Error('Liste de pages non déterministe');
    for (const page of measured.pages) {
      const { page: file, ...metrics } = page;
      if (pass === 0) expected.set(file, metrics);
      else if (JSON.stringify(expected.get(file)) !== JSON.stringify(metrics))
        throw new Error(`Génération non déterministe : ${file}`);
    }
    console.log(`Génération ${pass === 0 ? 'chauffe' : pass} terminée (${options.scenario})`);
  }
  const browser = await chromium.launch({
    headless: true,
    ...(options.channel ? { channel: options.channel } : {})
  });
  let server: Awaited<ReturnType<typeof startDashboardServer>> | undefined;
  const pages: (ReturnType<typeof measureHtml> & {
    page: string;
    domNodes: number;
    domElements: number;
    renderedTableRows: number;
    visibleTableRows: number;
    navigationMs: ReturnType<typeof summarizeSamples>;
    resultReadyMs: ReturnType<typeof summarizeSamples>;
    captureMs: number | null;
  })[] = [];
  try {
    server = await startDashboardServer(join(output, 'dashboard'), 0);
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Port local indisponible');
    for (const [file, metrics] of expected) {
      const url = `http://127.0.0.1:${address.port}/${file}`;
      await measureBrowserPage(browser, url);
      const samples: Awaited<ReturnType<typeof measureBrowserPage>>[] = [];
      for (let pass = 0; pass < options.runs; pass++) samples.push(await measureBrowserPage(browser, url));
      const first = samples[0]!;
      for (const sample of samples)
        for (const key of ['domNodes', 'domElements', 'renderedTableRows', 'visibleTableRows'] as const)
          if (sample[key] !== first[key]) throw new Error(`DOM non stable : ${file}, ${key}`);
      // Capture dans un passage supplémentaire : aucun coût de capture ne pollue les temps retenus.
      const capture = options.screenshots
        ? await measureBrowserPage(browser, url, join(output, file + '.png'))
        : null;
      pages.push({
        page: file,
        ...metrics,
        domNodes: first.domNodes,
        domElements: first.domElements,
        renderedTableRows: first.renderedTableRows,
        visibleTableRows: first.visibleTableRows,
        navigationMs: summarizeSamples(samples.map((sample) => sample.navigationMs)),
        resultReadyMs: summarizeSamples(samples.map((sample) => sample.resultReadyMs)),
        captureMs: capture?.captureMs ?? null
      });
      console.log(`Mesures ${file} terminées`);
    }
    const payloads = pages.flatMap((page) => page.payloads);
    const unique = new Map(payloads.map((payload) => [payload.sha256, payload.bytes]));
    const report = {
      protocol: benchmarkProtocol,
      fixtureVersion,
      fixtureHash,
      scenario: options.scenario,
      seed: options.seed,
      counts: counts!,
      revision: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
      workingTreeDirty:
        execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim().length > 0,
      environment: {
        node: process.version,
        os: platform(),
        release: release(),
        arch: process.arch,
        cpu: cpus()[0]?.model ?? 'unknown',
        logicalCpus: cpus().length,
        memoryBytes: totalmem()
      },
      browser: { version: browser.version(), viewport },
      conditions: {
        channel: options.channel ?? 'chromium',
        headless: true,
        locale: 'fr-FR',
        timezone: 'UTC',
        workers: 1,
        runs: options.runs,
        warmup: 1,
        cache: 'nouveau contexte par passage, HTTP no-store, routage local uniquement',
        cpuThrottle: 'aucun',
        network: 'loopback uniquement, sans compression',
        readiness:
          'DOMContentLoaded pour navigation ; load + h1 visible + fonts.ready + deux requestAnimationFrame pour résultat ; pas une mesure d’interactivité complète',
        capture: options.screenshots ? 'viewport, passage distinct hors séries temporelles' : 'désactivée',
        preparation:
          'processus Node neuf par génération ; préparation normalisation/Analytics et démarrage exclus du temps de génération ; chauffe exclue des séries'
      },
      preparationMs,
      generationMs: summarizeSamples(generation),
      duplication: {
        scope:
          'copies exactes des scripts JSON embarqués, toutes pages ; inclut les répétitions au sein des pages',
        totalJsonBytes: payloads.reduce((sum, payload) => sum + payload.bytes, 0),
        uniqueJsonBytes: [...unique.values()].reduce((sum, bytes) => sum + bytes, 0),
        duplicateJsonBytes:
          payloads.reduce((sum, payload) => sum + payload.bytes, 0) -
          [...unique.values()].reduce((sum, bytes) => sum + bytes, 0)
      },
      pages
    };
    const previous = options.compare
      ? (JSON.parse(await readFile(resolve(options.compare), 'utf8')) as ComparableReport)
      : undefined;
    const comparison = previous ? compareReports(previous, report) : null;
    const budgetFailures = budget ? checkBudgets(previous!, report, budget) : [];
    await writeFile(
      join(output, 'report.json'),
      JSON.stringify({ ...report, comparison, budgetFailures }, null, 2) + '\n'
    );
    await writeFile(join(output, 'report.md'), renderReport(report, comparison));
    console.log(`Rapport : ${join(output, 'report.md')}`);
    if (budgetFailures.length) throw new Error(`Budgets dépassés : ${budgetFailures.join('; ')}`);
    return report;
  } finally {
    try {
      if (server) {
        server.closeAllConnections();
        await new Promise<void>((done, reject) => server!.close((error) => (error ? reject(error) : done())));
      }
    } finally {
      await browser.close();
    }
  }
}

/** Produit une synthèse partageable, sans chemins locaux privés ni contenu des entités. */
function renderReport(
  report: Awaited<ReturnType<typeof runBenchmark>>,
  comparison: ReturnType<typeof compareReports> | null
): string {
  return `# Benchmark synthétique ${report.scenario}\n\nProtocole ${report.protocol}, graine ${report.seed}, fixture ${report.fixtureVersion}, SHA-256 ${report.fixtureHash}. Révision ${report.revision}.\n\nVolumes : ${JSON.stringify(report.counts)}.\n\nConditions : ${JSON.stringify(report.environment)} ; navigateur ${JSON.stringify(report.browser)} ; ${JSON.stringify(report.conditions)}.\n\nPréparation : ${report.preparationMs.toFixed(1)} ms. Génération médiane ${report.generationMs.median.toFixed(1)} ms, IQR ${report.generationMs.iqr.toFixed(1)} ms.\n\nOctets non compressés. JSON est inclus dans HTML. Lignes initiales : lignes tbody présentes dans le fichier ; DOM : tous les nœuds après disponibilité du résultat.\n\n| Page | HTML octets | JSON octets | Lignes initiales | Lignes rendues | Nœuds DOM | Navigation médiane/IQR ms | Résultat médiane/IQR ms | Capture ms |\n| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |\n${report.pages.map((page) => `| ${page.page} | ${page.htmlBytes} | ${page.jsonBytes} | ${page.initialTableRows} | ${page.renderedTableRows} | ${page.domNodes} | ${page.navigationMs.median.toFixed(1)}/${page.navigationMs.iqr.toFixed(1)} | ${page.resultReadyMs.median.toFixed(1)}/${page.resultReadyMs.iqr.toFixed(1)} | ${page.captureMs?.toFixed(1) ?? 'désactivée'} |`).join('\n')}\n\nCopies JSON exactes redondantes : ${report.duplication.duplicateJsonBytes} octets sur ${report.duplication.totalJsonBytes}. Ne mesure pas les duplications sémantiques RAW/normalisé.\n\n${comparison ? 'Comparaison des volumes (après − avant) :\n\n```json\n' + JSON.stringify(comparison, null, 2) + '\n```\n' : 'Aucune comparaison demandée.\n'}\nLes durées décrivent cette machine et ce passage ; aucune limite temporelle automatique. Voir report.json pour séries brutes, quantiles et empreintes.\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const command = new Command()
    .option('--scenario <name>', 'control ou load', 'control')
    .option('--seed <number>', 'graine uint32', '81')
    .option('--runs <number>', 'passages mesurés, hors chauffe', '3')
    .requiredOption('--output <directory>', 'nouveau répertoire de sortie dont le parent existe')
    .option('--compare <report>', 'rapport JSON compatible avant optimisation')
    .option('--screenshots', 'captures viewport dans des passages séparés')
    .option('--budgets <file>', 'budgets explicitement validés, exige --compare')
    .option('--channel <name>', 'canal navigateur', process.platform === 'win32' ? 'msedge' : 'chromium')
    .parse();
  const options = command.opts<{
    scenario: string;
    seed: string;
    runs: string;
    output: string;
    screenshots?: boolean;
    compare?: string;
    channel: string;
    budgets?: string;
  }>();
  await runBenchmark({
    ...options,
    scenario: options.scenario as BenchmarkScenario,
    seed: Number(options.seed),
    runs: Number(options.runs)
  });
}
