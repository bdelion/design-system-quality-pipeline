import { expect, it } from 'vitest';
import { paginate } from '../src/dashboard/assets/pagination.js';
import { csvText } from '../src/dashboard/assets/csv.js';

it('borne le montage à 50 lignes sans modifier la population, y compris après réduction et sur un résultat vide', () => {
  const rows = Array.from({ length: 120 }, (_, index) => index);
  expect(paginate(rows).rows).toEqual(rows.slice(0, 50));
  expect(paginate(rows, 3)).toMatchObject({ start: 101, end: 120, page: 3, total: 120 });
  expect(paginate(rows.slice(0, 2), 3)).toMatchObject({ rows: [0, 1], page: 1 });
  expect(paginate([], 99)).toMatchObject({ rows: [], start: 0, end: 0, page: 1, pages: 1 });
  expect(paginate(rows, -1).page).toBe(1);
  expect(paginate(rows, NaN).page).toBe(1);
  expect(rows).toHaveLength(120);
});

it('encode toutes les lignes fournies avec guillemets et protection des formules', () => {
  const csv = csvText([['Titre', 'Preuve'], ...Array.from({ length: 120 }, (_, i) => [i, '=1+1;"texte"'])]);
  expect(csv.startsWith('\ufeff')).toBe(true);
  expect(csv.split('\r\n')).toHaveLength(121);
  expect(csv).toContain('"119";"\'=1+1;""texte"""');
});
