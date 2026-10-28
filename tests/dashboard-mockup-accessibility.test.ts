import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(
  new URL('../docs/08-implementation/maquettes/fenetres-github.html', import.meta.url),
  'utf8'
);

describe('maquette des fenêtres GitHub', () => {
  it('associe les en-têtes à des cellules de données dès le HTML initial', () => {
    const tables = [...html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/g)];
    expect(tables).toHaveLength(2);
    for (const [, table] of tables) {
      const headers = [...table!.matchAll(/<th\b([^>]*)>/g)];
      expect(headers.length).toBeGreaterThan(0);
      for (const [, attributes] of headers) expect(attributes).toContain('scope="col"');
      const body = table!.match(/<tbody\b[^>]*>([\s\S]*?)<\/tbody>/)?.[1];
      const rows = [...(body ?? '').matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)];
      expect(rows.length).toBeGreaterThan(0);
      for (const [, row] of rows) {
        expect([...row!.matchAll(/<td\b/g)]).toHaveLength(headers.length);
      }
    }
  });
});
