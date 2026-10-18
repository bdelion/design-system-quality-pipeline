import { createHash } from 'node:crypto';

/** Calcule une empreinte UTF-8 indépendante du chemin local des artefacts. */
export function digest(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

/** Mesure les scripts JSON et le HTML généré sans confondre sous-ensemble JSON et octets additionnels. */
export function measureHtml(html: string) {
  const payloads: { id: string; bytes: number; sha256: string }[] = [];
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attributes = match[1]!;
    const body = match[2]!;
    let json: string | undefined;
    let id = attributes.match(/\bid="([^"]+)"/)?.[1] ?? 'anonymous';
    if (/\btype="application\/json"/i.test(attributes)) json = body;
    else if (body.startsWith('window.__SNAPSHOT__ = ')) {
      json = body.slice('window.__SNAPSHOT__ = '.length).split('; if (')[0];
      id = 'snapshot';
    }
    if (json !== undefined) {
      // Détacher les identifiants des énormes chaînes HTML : une sous-chaîne peut retenir tout leur tampon.
      payloads.push({
        id: Buffer.from(id).toString('utf8'),
        bytes: Buffer.byteLength(json),
        sha256: digest(json)
      });
    }
  }
  const seen = new Set<string>();
  let duplicateJsonBytes = 0;
  for (const payload of payloads) {
    if (seen.has(payload.sha256)) duplicateJsonBytes += payload.bytes;
    seen.add(payload.sha256);
  }
  return {
    htmlBytes: Buffer.byteLength(html),
    htmlSha256: digest(html),
    jsonBytes: payloads.reduce((sum, payload) => sum + payload.bytes, 0),
    duplicateJsonBytes,
    initialTableRows: [...html.matchAll(/<tbody\b[^>]*>([\s\S]*?)<\/tbody>/gi)].reduce(
      (count, match) => count + [...match[1]!.matchAll(/<tr\b/gi)].length,
      0
    ),
    payloads
  };
}

/** Résume une série mesurée avec quantiles interpolés et dispersion, sans lui imposer de seuil temporel. */
export function summarizeSamples(samples: number[]) {
  if (!samples.length || samples.some((value) => !Number.isFinite(value) || value < 0))
    throw new Error('Mesures finies positives requises');
  const sorted = [...samples].sort((a, b) => a - b);
  /** Interpole un quantile sur la série triée. */
  function quantile(fraction: number): number {
    const position = (sorted.length - 1) * fraction;
    const index = Math.floor(position);
    return (
      sorted[index]! + (sorted[Math.min(index + 1, sorted.length - 1)]! - sorted[index]!) * (position - index)
    );
  }
  return {
    samples,
    median: quantile(0.5),
    min: sorted[0]!,
    max: sorted.at(-1)!,
    p25: quantile(0.25),
    p75: quantile(0.75),
    iqr: quantile(0.75) - quantile(0.25)
  };
}

/** Contrat minimal de comparaison des volumes, indépendant des statistiques temporelles. */
export interface ComparableReport {
  protocol?: string;
  fixtureHash?: string;
  browser?: { viewport: { width: number; height: number }; version: string };
  pages?: {
    page: string;
    htmlBytes: number;
    jsonBytes: number;
    initialTableRows: number;
    domNodes: number;
    renderedTableRows: number;
  }[];
}

/** Compare uniquement des charges et protocoles identiques ; les temps restent informatifs. */
export function compareReports(before: ComparableReport, after: ComparableReport) {
  for (const report of [before, after]) {
    if (
      !report.pages?.length ||
      new Set(report.pages.map((page) => page.page)).size !== report.pages.length ||
      report.pages.some((page) =>
        ['htmlBytes', 'jsonBytes', 'initialTableRows', 'domNodes', 'renderedTableRows'].some(
          (key) =>
            !Number.isSafeInteger(page[key as keyof typeof page]) ||
            Number(page[key as keyof typeof page]) < 0
        )
      )
    )
      throw new Error('Rapports incompatibles : comptes absents, invalides ou pages dupliquées');
  }
  if (
    !before.protocol ||
    !before.fixtureHash ||
    before.protocol !== after.protocol ||
    before.fixtureHash !== after.fixtureHash ||
    JSON.stringify(before.browser) !== JSON.stringify(after.browser) ||
    !before.pages ||
    !after.pages ||
    before.pages.map((page) => page.page).join() !== after.pages.map((page) => page.page).join()
  )
    throw new Error('Rapports incompatibles : protocole, charge, navigateur ou pages différents');
  return after.pages.map((page, index) => {
    const previous = before.pages![index]!;
    return {
      page: page.page,
      htmlBytes: page.htmlBytes - previous.htmlBytes,
      jsonBytes: page.jsonBytes - previous.jsonBytes,
      initialTableRows: page.initialTableRows - previous.initialTableRows,
      domNodes: page.domNodes - previous.domNodes,
      renderedTableRows: page.renderedTableRows - previous.renderedTableRows
    };
  });
}

/** Budgets de non-régression proposés ; leur activation exige une validation explicite. */
export interface BenchmarkBudget {
  status: 'proposed' | 'validated';
  maxGrowthPercent: number;
}

/** Vérifie exclusivement les octets et comptes déterministes face à une baseline compatible. */
export function checkBudgets(
  before: ComparableReport,
  after: ComparableReport,
  budget: BenchmarkBudget
): string[] {
  if (budget.status !== 'validated')
    throw new Error('Budgets proposés : validation explicite requise avant activation');
  if (!Number.isFinite(budget.maxGrowthPercent) || budget.maxGrowthPercent < 0)
    throw new Error('Budget de croissance invalide');
  compareReports(before, after);
  const failures: string[] = [];
  for (let index = 0; index < after.pages!.length; index++) {
    const page = after.pages![index]!;
    const previous = before.pages![index]!;
    for (const key of [
      'htmlBytes',
      'jsonBytes',
      'initialTableRows',
      'domNodes',
      'renderedTableRows'
    ] as const) {
      const maximum = Math.ceil(previous[key] * (1 + budget.maxGrowthPercent / 100));
      if (page[key] > maximum) failures.push(`${page.page} ${key} : ${page[key]} > ${maximum}`);
    }
  }
  return failures;
}
