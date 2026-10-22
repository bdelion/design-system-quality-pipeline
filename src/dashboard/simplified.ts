import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Snapshot } from '../domain/types.js';
import { simplifiedModel } from '../analytics/simplified-dashboard.js';

/** Génère une page d’entrée légère pour choisir les deux présentations du même snapshot. */
export function dashboardChoice(capturedAt: string): string {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Choisir le dashboard</title><link rel="stylesheet" href="simplified/style.css"></head><body><main><h1>Votre Design System</h1><p>Deux présentations du même snapshot. Capture : ${escapeHtml(capturedAt)}</p><div class="cards"><section class="panel"><h2>Vue synthétique</h2><p>Actions, composants, activité des équipes et audits par version.</p><a class="button" href="simplified/index.html">Ouvrir la vue synthétique</a></section><section class="panel"><h2>Vue détaillée</h2><p>Explorateurs, preuves, règles et diagnostics du dashboard classique.</p><a class="button" href="classic/index.html">Ouvrir la vue détaillée</a></section></div></main></body></html>`;
}
/** Protège les textes de contexte injectés dans le document HTML. */
function escapeHtml(text: string): string {
  return text.replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!
  );
}
/** Génère la présentation synthétique autonome, sans sérialiser le RAW ni les règles. */
export async function generateSimplifiedDashboard(snapshot: Snapshot, dashboardRoot: string): Promise<void> {
  const output = resolve(dashboardRoot, 'simplified');
  await mkdir(output, { recursive: true });
  const model = simplifiedModel(snapshot);
  const data = JSON.stringify({ version: model.version, tables: model.tables, issues: model.issues }).replace(
    /</g,
    '\\u003c'
  );
  const spaces = [
    ['summary', 'Synthèse'],
    ['components', 'Composants'],
    ['activity', 'Activité'],
    ['team', 'Repositories et équipe'],
    ['versions', 'Audits par version']
  ];
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Synthèse | Design System Quality</title><link rel="stylesheet" href="style.css"></head><body><a class="skip" href="#main">Aller au contenu principal</a><div class="sticky-shell"><header><strong>Design System Quality</strong><a href="../index.html">Choisir la présentation</a><a href="../classic/index.html">Vue détaillée</a></header><nav aria-label="Espaces">${spaces.map(([id, name]) => `<a href="#${id}" data-space="${id}">${name}</a>`).join('')}</nav></div><main id="main" tabindex="-1"><p class="muted">Capture : ${escapeHtml(snapshot.capturedAt)} · Données du snapshot, pas l’état GitHub en direct.</p><h1 id="heading">Synthèse</h1><form id="context" class="toolbar"><label>Repository <select name="repository"><option value="">Tous</option>${model.repositories.map((row) => `<option>${escapeHtml(row.repository)}</option>`).join('')}</select></label><label>Version <input name="version" type="search" placeholder="Toutes"></label><button type="reset">Effacer les filtres</button></form><p id="scope" aria-live="polite"></p><div id="content"></div><details class="panel"><summary>Fiabilité et explications</summary><p>${snapshot.dataQuality.issues.length} diagnostics. Fiabilité : ${escapeHtml(snapshot.reliability)}. Une valeur indisponible ne vaut pas zéro. Les améliorations ne dégradent pas la conformité ; les corrections seules ne la prouvent pas.</p><a href="../classic/quality.html">Examiner les diagnostics dans la vue détaillée</a></details></main><dialog id="detail" aria-labelledby="detail-title"><button id="close-detail" type="button">Fermer</button><h2 id="detail-title">Éléments comptés</h2><p id="detail-note"></p><div id="detail-content"></div><div id="detail-pagination" class="pager"></div></dialog><script type="application/json" id="simplified-data">${data}</script><script type="module" src="app.js"></script></body></html>`;
  await writeFile(resolve(output, 'index.html'), html, 'utf8');
  await Promise.all(
    ['app.js', 'style.css', 'csv.js'].map(async (name) =>
      writeFile(
        resolve(output, name),
        await readFile(
          new URL(
            name === 'csv.js'
              ? './assets/csv.js'
              : './assets/simplified.' + (name.endsWith('.js') ? 'js' : 'css'),
            import.meta.url
          )
        )
      )
    )
  );
}
