import { describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { importComponentComparison } from '../src/component-comparison.js';
import { mkdtemp, writeFile, readFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { parse } from 'yaml';
import { validateHistoricalComponents } from '../src/historical-components.js';

/** Construit un classeur minimal sans données privées. */
async function workbook(rows: unknown[][]): Promise<Buffer> {
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet('Component Comparison');
  for (const row of rows) sheet.addRow(row);
  return Buffer.from(await book.xlsx.writeBuffer());
}

describe('import des comparaisons Excel', () => {
  it('génère un YAML importable avec mapping et refuse une destination existante', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'dsq-excel-test-'));
    try {
      const input = join(directory, 'input');
      const output = join(directory, 'output');
      await mkdir(input);
      await writeFile(
        join(input, 'lib_component_comparison.xlsx'),
        await workbook([
          ['Component', 'Source File', '1.0.0'],
          ['Button', 'src/button.tsx', '+']
        ])
      );
      const mapping = join(directory, 'repositories.json');
      await writeFile(mapping, JSON.stringify({ lib: 'org/lib' }));
      const args = [
        resolve('node_modules/tsx/dist/cli.mjs'),
        resolve('scripts/import-component-comparisons.ts'),
        '--input',
        input,
        '--output',
        output,
        '--repositories',
        mapping
      ];
      await promisify(execFile)(process.execPath, args);
      const file = join(output, 'lib-historique-composants.yaml');
      const original = await readFile(file, 'utf8');
      expect(validateHistoricalComponents(parse(original)).repository).toBe('org/lib');
      expect(JSON.parse(await readFile(join(output, 'rapport.json'), 'utf8'))[0].components).toBe(1);
      await expect(promisify(execFile)(process.execPath, args)).rejects.toThrow();
      expect(await readFile(file, 'utf8')).toBe(original);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }, 30000);

  it('conserve les preuves, trie numériquement et distingue les candidates du PROD', async () => {
    const result = await importComponentComparison(
      await workbook([
        ['Component', 'Source File', '0.10.0 (release candidate) 💥', '0.2.0'],
        ['Button', 'src/button.tsx', '~\ndiffAST', '+']
      ]),
      'lib_component_comparison.xlsx',
      'org/lib'
    );
    expect(result.catalogue.versions.map((version) => [version.version, version.channel])).toEqual([
      ['0.2.0', 'release'],
      ['0.10.0', 'development']
    ]);
    expect(result.catalogue.components[0]!.history[1]).toMatchObject({
      present: true,
      change: 'modified',
      evidence: [{ cell: 'C2', symbol: 'Button', value: '~\ndiffAST' }]
    });
  });

  it('conserve une identité après renommage et en crée une autre après disparition', async () => {
    const result = await importComponentComparison(
      await workbook([
        ['Component', 'Source File', '1.0.0', '1.1.0', '1.2.0', '1.3.0', '1.4.0'],
        ['New', 'src/new.ts', '+\nname: Old', '~\nnameChanged: Old -> New', '-', '', '+']
      ]),
      'lib.xlsx',
      'lib'
    );
    const history = result.catalogue.components[0]!.history;
    expect(history.map((value) => value.change)).toEqual(['added', 'renamed', 'removed', 'absent', 'added']);
    expect(history[0]!.historicalName).toBe('Old');
    expect(history[0]!.identity).toBe(history[1]!.identity);
    expect(history[4]!.identity).not.toBe(history[0]!.identity);
    expect(history[3]!.identity).toBeNull();
  });

  it('sépare les homonymes et inclut les utilitaires sans filtrage UI', async () => {
    const result = await importComponentComparison(
      await workbook([
        ['Component', 'Source File', '1.0.0'],
        ['helper ⚠️', 'src/a.ts', '+'],
        ['helper ⚠️', 'src/b.ts', '+']
      ]),
      'lib.xlsx',
      'lib'
    );
    expect(result.catalogue.components.map((component) => component.name)).toEqual([
      'helper [ligne 2]',
      'helper [ligne 3]'
    ]);
    expect(result.warnings).toHaveLength(2);
  });

  it.each(['?', ' \nunknown'])('refuse le symbole inconnu %s', async (value) => {
    await expect(
      importComponentComparison(
        await workbook([
          ['Component', 'Source File', '1.0.0'],
          ['Button', 'src/button.ts', value]
        ]),
        'lib.xlsx',
        'lib'
      )
    ).rejects.toThrow('symbole inconnu');
  });

  it('refuse les formules au lieu de les traiter comme une absence', async () => {
    await expect(
      importComponentComparison(
        await workbook([
          ['Component', 'Source File', '1.0.0'],
          ['Button', 'src/button.ts', { formula: '"+"', result: '+' }]
        ]),
        'lib.xlsx',
        'lib'
      )
    ).rejects.toThrow('formule');
  });

  it('refuse les versions dupliquées et les canaux inconnus', async () => {
    for (const label of ['1.0.0', '1.1.0 (unknown)']) {
      await expect(
        importComponentComparison(
          await workbook([
            ['Component', 'Source File', '1.0.0', label],
            ['Button', 'src/button.ts', '+', '=']
          ]),
          'lib.xlsx',
          'lib'
        )
      ).rejects.toThrow();
    }
  });
});
