import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

/** Vérifie la combinaison des filtres de navigation et des filtres locaux. */
describe('filtres contextuels du dashboard', () => {
  const script = readFileSync(new URL('../src/dashboard/assets/app.js', import.meta.url), 'utf8');

  it('ne laisse pas une seconde passe rendre visibles des lignes hors contexte', () => {
    expect(script).toContain("matchesContext(row, ['repository', 'component'])");
    expect(script).toContain('!matchesContext(row)');
    expect(script).not.toContain('applyAuditContext();');
  });

  it('supprime les anciens paramètres de navigation lorsqu’un filtre est effacé', () => {
    expect(script).toContain('if (!context.has(key)) next.delete(key)');
  });
});
