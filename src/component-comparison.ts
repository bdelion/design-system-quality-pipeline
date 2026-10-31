import ExcelJS from 'exceljs';
import { createHash } from 'node:crypto';
import { basename } from 'node:path';
import {
  compareHistoricalVersions,
  validateHistoricalComponents,
  type HistoricalComponentCatalogue,
  type HistoricalComponentObservation
} from './historical-components.js';

/** Résultat de conversion et réserves de qualification des exports techniques. */
export interface ComparisonImport {
  catalogue: HistoricalComponentCatalogue;
  source: { workbook: string; sheet: string; sha256: string };
  warnings: string[];
  exports: { name: string; row: number; sourceFile: string; sourceName: string }[];
}

/** Lit une cellule textuelle sans transformer une formule ou une erreur en absence. */
function text(cell: ExcelJS.Cell): string {
  const value = cell.value;
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.replace(/\r\n?/g, '\n');
  if (typeof value === 'object' && 'hyperlink' in value && 'text' in value) return value.text;
  if (typeof value === 'object' && 'richText' in value)
    return value.richText.map((part) => part.text).join('');
  throw new Error(`Cellule ${cell.address} : texte attendu, formule ou valeur inconnue refusée.`);
}

/** Retire uniquement le marqueur de revue ajouté au nom par l’outil de comparaison. */
function exportName(value: string): string {
  return value.replace(/\s*⚠️?\s*$/, '').trim();
}

/** Convertit la feuille de comparaison, en conservant les cellules et les identités temporelles. */
export async function importComponentComparison(
  buffer: Buffer,
  filename: string,
  repository: string
): Promise<ComparisonImport> {
  if (!repository.trim()) throw new Error('Repository requis.');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  const sheet = workbook.getWorksheet('Component Comparison');
  if (!sheet) throw new Error('Feuille Component Comparison absente.');
  const columns = new Map<string, number>();
  const versions: (HistoricalComponentCatalogue['versions'][number] & { column: number })[] = [];
  sheet.getRow(1).eachCell((cell, column) => {
    const label = text(cell).trim();
    const match = /^(\d+\.\d+\.\d+)(.*)$/u.exec(label);
    if (!match) {
      columns.set(label, column);
      return;
    }
    const suffix = match[2]!.replace(/💥/gu, '').trim();
    if (suffix && !/^\((develop|release candidate|hotfix candidate)\)$/.test(suffix))
      throw new Error(`En-tête ${cell.address} : canal de version inconnu.`);
    versions.push({
      version: match[1]!,
      channel: suffix ? 'development' : 'release',
      sourceLabel: label,
      column
    });
  });
  for (const required of ['Component', 'Source File'])
    if (!columns.has(required)) throw new Error(`Colonne ${required} absente.`);
  versions.sort((a, b) => compareHistoricalVersions(a.version, b.version));
  if (!versions.length) throw new Error('Aucune colonne de version reconnue.');
  const rows: { row: ExcelJS.Row; name: string; source: string }[] = [];
  sheet.eachRow((row, index) => {
    if (index === 1) return;
    const name = exportName(text(row.getCell(columns.get('Component')!)));
    if (!name) throw new Error(`Ligne ${index} : nom d’export absent.`);
    rows.push({ row, name, source: text(row.getCell(columns.get('Source File')!)) });
  });
  const warnings: string[] = [];
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row.name, (counts.get(row.name) ?? 0) + 1);
  const components = rows.map(({ row, name, source }) => {
    const ambiguous = counts.get(name)! > 1;
    const qualified = ambiguous ? `${name} [ligne ${row.number}]` : name;
    if (ambiguous)
      warnings.push(
        `Ligne ${row.number} : nom homonyme conservé séparément ; correspondance métier à revoir.`
      );
    const values = versions.map((version) => text(row.getCell(version.column)));
    const names = new Array<string>(versions.length);
    let currentName = name;
    for (let index = versions.length - 1; index >= 0; index--) {
      const value = values[index]!;
      const explicit = /^name: (.+)$/m.exec(value);
      const rename = /^nameChanged: (.+) -> (.+)$/m.exec(value);
      names[index] = explicit?.[1] ?? rename?.[2] ?? currentName;
      currentName = rename?.[1] ?? names[index]!;
    }
    let epoch = 0;
    let previous: HistoricalComponentObservation | undefined;
    const history = versions.map((version, index): HistoricalComponentObservation => {
      const value = values[index]!;
      const symbol = value.split('\n')[0]!;
      if (!['', '+', '~', '=', '-'].includes(symbol))
        throw new Error(`Cellule ${row.getCell(version.column).address} : symbole inconnu.`);
      if (!symbol && value)
        throw new Error(`Cellule ${row.getCell(version.column).address} : absence ambiguë.`);
      const present = ['+', '~', '='].includes(symbol);
      const wasPresent = previous?.present ?? false;
      if (present && !wasPresent) epoch++;
      const identity = present
        ? 'export-' +
          createHash('sha256').update(`${repository}:${source}:${row.number}:${epoch}`).digest('hex')
        : wasPresent
          ? previous!.identity
          : null;
      const historicalName = ambiguous ? `${names[index]!} [ligne ${row.number}]` : names[index]!;
      const change = present
        ? !wasPresent
          ? 'added'
          : historicalName !== previous!.historicalName
            ? 'renamed'
            : symbol === '~' || symbol === '+'
              ? 'modified'
              : 'unchanged'
        : wasPresent
          ? 'removed'
          : 'absent';
      const observation: HistoricalComponentObservation = {
        version: version.version,
        channel: version.channel,
        present,
        change,
        identity,
        historicalName,
        evidence: [{ cell: row.getCell(version.column).address, symbol: name, value }]
      };
      previous = observation;
      return observation;
    });
    return { name: qualified, history };
  });
  const review = workbook.getWorksheet('Historique à vérifier');
  if (review && review.actualRowCount > 1)
    warnings.push(
      `${review.actualRowCount - 1} ligne(s) dans Historique à vérifier : continuités issues du comparateur à revoir.`
    );
  return {
    catalogue: validateHistoricalComponents({
      schemaVersion: 1,
      repository,
      versions: versions.map(({ version, channel, sourceLabel }) => ({ version, channel, sourceLabel })),
      components
    }),
    source: {
      workbook: basename(filename),
      sheet: sheet.name,
      sha256: createHash('sha256').update(buffer).digest('hex')
    },
    warnings,
    exports: rows.map(({ row, name, source }) => ({
      name: counts.get(name)! > 1 ? `${name} [ligne ${row.number}]` : name,
      row: row.number,
      sourceFile: source,
      sourceName: name
    }))
  };
}
