import { describe, expect, it } from 'vitest';
import { benchmarkSnapshot, benchmarkCounts } from './support/dashboard-load.js';
import {
  measureHtml,
  summarizeSamples,
  compareReports,
  checkBudgets,
  digest
} from '../scripts/benchmark-metrics.js';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { generateDashboard } from '../src/dashboard/generate.js';

describe('benchmark synthétique #81', () => {
  it('reproduit la capture et les identités avec la même graine', () => {
    const first = benchmarkSnapshot('control', 81);
    expect(benchmarkSnapshot('control', 81)).toEqual(first);
    expect(benchmarkSnapshot('control', 82)).not.toEqual(first);
    expect(benchmarkCounts(first)).toEqual({
      repositories: 1,
      issues: 24,
      pullRequests: 18,
      componentVersions: 12,
      diagnostics: 30
    });
    expect(JSON.stringify(first)).not.toMatch(/github\.com|token|secret/i);
    expect(
      first.rawData.repositories.every(
        (repository) =>
          repository.owner === 'benchmark' &&
          repository.issues.every((issue) => issue.url?.startsWith('https://example.invalid/'))
      )
    ).toBe(true);
  });

  it('produit les volumes de charge sans source distante', () => {
    expect(benchmarkCounts(benchmarkSnapshot('load', 81))).toEqual({
      repositories: 3,
      issues: 1800,
      pullRequests: 1500,
      componentVersions: 2300,
      diagnostics: 3000
    });
  }, 120000);

  it('compte les octets UTF-8 et les copies JSON exactes sans les confondre avec le HTML', () => {
    const html =
      '<tbody><tr><td>é</td></tr></tbody><script type="application/json" id="a">{"x":"é"}</script><script type="application/json" id="b">{"x":"é"}</script>';
    const measured = measureHtml(html);
    expect(measured.htmlBytes).toBe(Buffer.byteLength(html));
    expect(measured.jsonBytes).toBe(2 * Buffer.byteLength('{"x":"é"}'));
    expect(measured.duplicateJsonBytes).toBe(Buffer.byteLength('{"x":"é"}'));
    expect(measured.initialTableRows).toBe(1);
    expect(measured.payloads.map((payload) => payload.id)).toEqual(['a', 'b']);
    expect(measureHtml('<script>window.__SNAPSHOT__ = {"a":1}; if (true) {}</script>').jsonBytes).toBe(7);
  });

  it('rapporte médiane et dispersion sans budget de temps instable', () => {
    expect(summarizeSamples([9, 1, 5, 3])).toEqual({
      samples: [9, 1, 5, 3],
      median: 4,
      min: 1,
      max: 9,
      p25: 2.5,
      p75: 6,
      iqr: 3.5
    });
    expect(() => summarizeSamples([])).toThrow();
    expect(() => summarizeSamples([NaN])).toThrow();
  });

  it('refuse les comparaisons de scénarios ou protocoles différents', () => {
    expect(() => compareReports({ protocol: 'a' }, { protocol: 'b' })).toThrow(/incompatibles/);
  });

  it('reproduit les volumes de toutes les pages et compare leurs deltas', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'dsq-benchmark-control-'));
    try {
      const snapshot = benchmarkSnapshot('control', 81);
      await generateDashboard(snapshot, directory);
      const files = (await readdir(join(directory, 'dashboard')))
        .filter((file) => file.endsWith('.html'))
        .sort();
      const first = await Promise.all(
        files.map(async (page) => ({
          page,
          ...measureHtml(await readFile(join(directory, 'dashboard', page), 'utf8'))
        }))
      );
      await generateDashboard(benchmarkSnapshot('control', 81), directory);
      const second = await Promise.all(
        files.map(async (page) => ({
          page,
          ...measureHtml(await readFile(join(directory, 'dashboard', page), 'utf8'))
        }))
      );
      expect(second).toEqual(first);
      expect(first).toHaveLength(10);
      const baseline = JSON.parse(await readFile('config/benchmark-control-baseline.json', 'utf8')) as {
        fixtureHash: string;
        pages: { page: string; htmlBytes: number; jsonBytes: number; initialTableRows: number }[];
      };
      expect(digest(JSON.stringify(snapshot))).toBe(baseline.fixtureHash);
      const budget = JSON.parse(await readFile('config/benchmark-budgets.json', 'utf8')) as {
        status: string;
        maxGrowthPercent: number;
      };
      expect(budget.status).toBe('validated');
      for (const page of first) {
        const reference = baseline.pages.find((item) => item.page === page.page)!;
        for (const key of ['htmlBytes', 'jsonBytes', 'initialTableRows'] as const)
          expect(page[key], `${page.page} ${key}`).toBeLessThanOrEqual(
            Math.ceil(reference[key] * (1 + budget.maxGrowthPercent / 100))
          );
      }
      const pages = first.map((page) => ({
        ...page,
        domNodes: 100,
        renderedTableRows: page.initialTableRows
      }));
      const before = { protocol: 'test', fixtureHash: 'same', pages };
      const after = {
        ...before,
        pages: pages.map((page) => ({ ...page, htmlBytes: page.htmlBytes - 1, domNodes: page.domNodes - 2 }))
      };
      expect(
        compareReports(before, after).every(
          (page) => page.htmlBytes === -1 && page.domNodes === -2 && page.jsonBytes === 0
        )
      ).toBe(true);
      expect(() => compareReports(before, { ...after, fixtureHash: 'other' })).toThrow(/incompatibles/);
      expect(() => checkBudgets(before, after, { status: 'proposed', maxGrowthPercent: 5 })).toThrow(
        /validation/
      );
      expect(checkBudgets(before, after, { status: 'validated', maxGrowthPercent: 5 })).toEqual([]);
      const grown = { ...before, pages: pages.map((page) => ({ ...page, htmlBytes: page.htmlBytes * 2 })) };
      expect(checkBudgets(before, grown, { status: 'validated', maxGrowthPercent: 5 })).toHaveLength(10);
      const oneByteMore = {
        ...before,
        pages: pages.map((page) => ({ ...page, htmlBytes: page.htmlBytes + 1 }))
      };
      expect(checkBudgets(before, oneByteMore, { status: 'validated', maxGrowthPercent: 0 })).toHaveLength(
        10
      );
      const desktop = {
        ...before,
        browser: { version: 'test-browser', viewport: { width: 1440, height: 900 } }
      };
      expect(() =>
        compareReports(desktop, { ...desktop, browser: { ...desktop.browser, version: 'different' } })
      ).toThrow(/incompatibles/);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
