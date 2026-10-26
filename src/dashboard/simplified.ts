import { reviewContext } from './review-output.js';

import type { GithubProcessingConfig } from '../config.js';
import { applyProjectLinks, projectLinkSettings, componentProjectLabels } from './project-links.js';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Snapshot } from '../domain/types.js';
import { simplifiedModel } from '../analytics/simplified-dashboard.js';

/** Génère une page d’entrée légère pour choisir les deux présentations du même snapshot. */
export function dashboardChoice(capturedAt: string): string {
  return `<!doctype html><html data-review-slot="syv" lang="fr"><head data-review-slot="syw"><meta data-review-slot="syx" charset="utf-8"><meta data-review-slot="syy" name="viewport" content="width=device-width,initial-scale=1"><title data-review-slot="syz">Choisir le dashboard</title><link data-review-slot="sz0" rel="stylesheet" href="simplified/style.css"></head><body data-review-slot="sz1"><main data-review-slot="sz2"><h1 data-review-slot="sz3">Votre Design System</h1><p data-review-slot="sz4">Deux présentations du même snapshot. Capture : ${escapeHtml(capturedAt)}</p><div data-review-slot="sz5" class="cards"><section data-review-slot="sz6" class="panel"><h2 data-review-slot="sz7">Vue synthétique</h2><p data-review-slot="sz8">Actions, composants, activité des équipes et audits par version.</p><a data-review-slot="sz9" class="button" href="simplified/index.html">Ouvrir la vue synthétique</a></section><section data-review-slot="sza" class="panel"><h2 data-review-slot="szb">Vue détaillée</h2><p data-review-slot="szc">Explorateurs, preuves, règles et diagnostics du dashboard classique.</p><a data-review-slot="szd" class="button" href="classic/index.html">Ouvrir la vue détaillée</a></section></div></main><script data-review-slot="review-choice-script" type="module" src="review-choice.js"></script></body></html>`;
}
/** Protège les textes de contexte injectés dans le document HTML. */
function escapeHtml(text: string): string {
  return text.replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!
  );
}
/** Génère la présentation synthétique autonome, sans sérialiser le RAW ni les règles. */
export async function generateSimplifiedDashboard(
  snapshot: Snapshot,
  dashboardRoot: string,
  githubRules?: GithubProcessingConfig
): Promise<void> {
  const output = resolve(dashboardRoot, 'simplified');
  await mkdir(output, { recursive: true });
  const model = simplifiedModel(snapshot);
  await writeFile(
    resolve(output, 'review-context.js'),
    'export default ' + JSON.stringify(await reviewContext(snapshot)) + ';',
    'utf8'
  );

  const configured = [
    'GITHUB_PROJECT_OWNER_TYPE',
    'GITHUB_PROJECT_OWNER',
    'GITHUB_PROJECT_NUMBER',
    'GITHUB_PROJECT_VIEW_NUMBER',
    'GITHUB_PROJECT_REPOSITORY_OWNER',
    'GITHUB_PROJECT_REPOSITORIES'
  ].some((name) => process.env[name]?.trim());
  if (configured) {
    const rules =
      githubRules ??
      (
        JSON.parse(await readFile(new URL('../../config/profiles/dsq.json', import.meta.url), 'utf8')) as {
          github: GithubProcessingConfig;
        }
      ).github;
    const settings = projectLinkSettings(rules.projectStatuses.keywords);
    if (settings)
      applyProjectLinks(
        model.tables,
        settings,
        componentProjectLabels(snapshot, rules.labels.componentPrefix)
      );
  }
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
  const html = `<!doctype html><html data-review-slot="sze" lang="fr"><head data-review-slot="szf"><meta data-review-slot="szg" charset="utf-8"><meta data-review-slot="szh" name="viewport" content="width=device-width,initial-scale=1"><title data-review-slot="szi">Synthèse | Design System Quality</title><link data-review-slot="szj" rel="stylesheet" href="style.css"></head><body data-review-slot="szk"><a data-review-slot="szl" class="skip" href="#main">Aller au contenu principal</a><div data-review-slot="szm" class="sticky-shell"><header data-review-slot="szn"><strong data-review-slot="szo">Design System Quality</strong><a data-review-slot="szp" href="../index.html">Choisir la présentation</a><a data-review-slot="szq" href="../classic/index.html">Vue détaillée</a></header><nav data-review-slot="szr" aria-label="Espaces">${spaces.map(([id, name]) => `<a data-review-slot="szs" href="#${id}" data-space="${id}">${name}</a>`).join('')}</nav></div><main data-review-slot="szt" id="main" tabindex="-1"><p data-review-slot="szu" class="muted">Capture : ${escapeHtml(snapshot.capturedAt)} · Données du snapshot, pas l’état GitHub en direct.</p><h1 data-review-slot="szv" id="heading">Synthèse</h1><form data-review-slot="szw" id="context" class="toolbar"><label data-review-slot="szx">Repository <select data-review-slot="szy" name="repository"><option data-review-slot="szz" value="">Tous</option>${model.repositories.map((row) => `<option data-review-slot="s100">${escapeHtml(row.repository)}</option>`).join('')}</select></label><label data-review-slot="s101">Version <input data-review-slot="s102" name="version" type="search" placeholder="Toutes"></label><button data-review-slot="s103" type="reset">Effacer les filtres</button></form><p data-review-slot="s104" id="scope" aria-live="polite"></p><div data-review-slot="s105" id="content"></div><details data-review-slot="s106" class="panel"><summary data-review-slot="s107">Fiabilité et explications</summary><p data-review-slot="s108">${snapshot.dataQuality.issues.length} diagnostics. Fiabilité : ${escapeHtml(snapshot.reliability)}. Une valeur indisponible ne vaut pas zéro. Les améliorations ne dégradent pas la conformité ; les corrections seules ne la prouvent pas.</p><a data-review-slot="s109" href="../classic/quality.html">Examiner les diagnostics dans la vue détaillée</a></details></main><dialog data-review-slot="s10a" id="detail" aria-labelledby="detail-title"><button data-review-slot="s10b" id="close-detail" type="button">Fermer</button><h2 data-review-slot="s10c" id="detail-title">Éléments comptés</h2><p data-review-slot="s10d" id="detail-note"></p><div data-review-slot="s10e" id="detail-content"></div><div data-review-slot="s10f" id="detail-pagination" class="pager"></div></dialog><script data-review-slot="s10g" type="application/json" id="simplified-data">${data}</script><script data-review-slot="s10h" type="module" src="app.js"></script></body></html>`;
  await writeFile(resolve(output, 'index.html'), html, 'utf8');
  await Promise.all(
    ['app.js', 'style.css', 'csv.js', 'github-links.js', 'review.js', 'review-core.js'].map(async (name) =>
      writeFile(
        resolve(output, name),
        await readFile(
          new URL(
            ['csv.js', 'github-links.js', 'review.js', 'review-core.js'].includes(name)
              ? './assets/' + name
              : './assets/simplified.' + (name.endsWith('.js') ? 'js' : 'css'),
            import.meta.url
          )
        )
      )
    )
  );
}
