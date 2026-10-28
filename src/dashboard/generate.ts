import { reviewContext } from './review-output.js';
import { auditScopeSnapshot } from '../analytics/audit-scope.js';
import { dashboardChoice, generateSimplifiedDashboard } from './simplified.js';
import { paginationContent } from './assets/pagination.js';
import { presentCaptureDate } from './assets/snapshot-context.js';
import { componentPopulationContent } from './component-populations.js';
import { auditStatusLabel } from './audit-presentation.js';
import { dashboardPageModel } from './page-read-model.js';
import {
  workspaceCards,
  workspaceNavigation,
  workspaceSubnavigation,
  accessibilityContent,
  workspaceModel,
  dataQualityContent,
  resetWorkspaceModel
} from './workspaces.js';
import { issueFacts, resetDashboardReadModel } from './read-model.js';
import { teamActivitySummary } from '../analytics/team-activity.js';
import { repositoryActivity } from '../analytics/repository-activity.js';
import { latestComponentVersion } from '../analytics/component-versions.js';
import { epicsContent } from './epics.js';
import {
  contextAttribute,
  contextToolbar,
  metricExplanationContent,
  traceabilityContent,
  transitionJournalContent
} from './evidence.js';
import { auditReadModel } from './audit-read-model.js';
import { anomaliesForAudit, auditVersionLabel } from './audit-relations.js';
import { businessReviewContent } from './business-review.js';
import { latestCompletedAudit, isCompletedAudit } from './audit-selection.js';
import { calculateHistoryCoverage, correctionDateReason } from './history-coverage.js';
/**
 * @module dashboard.generate
 * Génère les pages et ressources statiques du dashboard à partir d’un snapshot.
 * @remarks Documentation des contrats et responsabilités du module.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stringify } from 'yaml';
import type {
  AnomalyStatus,
  Component,
  DataQualityStatus,
  Metric,
  Severity,
  Snapshot
} from '../domain/types.js';

const dashboardAssetSource = resolve(fileURLToPath(new URL('./assets', import.meta.url)));

/**
 * Génère le dashboard HTML statique à partir d'un snapshot déjà calculé.
 *
 * Cette couche restitue les indicateurs ; elle ne doit pas recalculer les
 * règles métier de normalisation ni les formules analytiques.
 * La page d’audit utilise la projection Analytics du périmètre suivi ; les autres pages gardent l’historique.
 *
 * @param snapshot - Snapshot immuable à présenter.
 * @param outputRoot - Répertoire racine de sortie (sous-dossier `dashboard`).
 * @param githubUrl - URL de référence optionnelle pour les liens GitHub.
 */
export async function generateClassicDashboard(
  snapshot: Snapshot,
  outputRoot: string,
  githubUrl?: string,
  componentPrefix = 'Component:',
  targetPath?: string
): Promise<void> {
  resetDashboardReadModel(snapshot);
  resetWorkspaceModel(snapshot);
  const auditSnapshot = auditScopeSnapshot(snapshot);
  const dashboardPath = targetPath ?? resolve(outputRoot, 'dashboard');
  await mkdir(resolve(dashboardPath, 'assets'), { recursive: true });
  /** Construit uniquement le contrat du parcours demandé, sans RAW ni snapshot complet. */
  const pageModel = (id: import('./page-read-model.js').DashboardPage) =>
    dashboardPageModel(id === 'audits' ? auditSnapshot : snapshot, id, githubUrl, componentPrefix);
  // Les assets sont lus depuis des fichiers dédiés afin que le HTML reste limité à la structure et aux données.
  await Promise.all([
    writeFile(
      resolve(dashboardPath, 'index.html'),
      page(
        snapshot,
        'Vue d’ensemble',
        '<div data-review-slot="s91" data-overview-global>' +
          repositoryComparisonTables(snapshot, githubUrl) +
          globalOverviewCards(snapshot) +
          '</div>',
        pageModel
      ),
      'utf8'
    ),
    writeFile(
      resolve(dashboardPath, 'issues.html'),
      page(snapshot, 'Analyse des issues', issuesExplorerContent(snapshot), pageModel),
      'utf8'
    ),
    writeFile(
      resolve(dashboardPath, 'anomalies.html'),
      page(
        snapshot,
        'Anomalies',
        '<p data-review-slot="s92" class="panel">Tous les BUG spécialisés sont conservés ici. Ils ne sont pas tous des anomalies d’accessibilité ; voir la qualification de chaque défaut et l’espace Accessibilité.</p>' +
          anomaliesContent(snapshot, githubUrl),
        pageModel
      ),
      'utf8'
    ),
    writeFile(
      resolve(dashboardPath, 'audits.html'),
      page(
        auditSnapshot,
        'Audits et composants',
        workspaceCards(auditSnapshot, true) +
          businessReviewContent(auditSnapshot) +
          auditsContent(auditSnapshot, githubUrl) +
          componentPopulationContent(auditSnapshot),
        pageModel
      ),
      'utf8'
    ),
    writeFile(
      resolve(dashboardPath, 'components.html'),
      page(snapshot, 'Analyse des composants', componentsExplorerContent(snapshot.capturedAt), pageModel),
      'utf8'
    ),
    writeFile(
      resolve(dashboardPath, 'graph.html'),
      page(
        snapshot,
        'Cartographie',
        graphContent(snapshot, githubUrl) + traceabilityContent(snapshot, githubUrl),
        pageModel
      ),
      'utf8'
    ),
    writeFile(
      resolve(dashboardPath, 'history.html'),
      page(snapshot, 'Historique', historyContent(snapshot) + transitionJournalContent(snapshot), pageModel),
      'utf8'
    ),
    writeFile(
      resolve(dashboardPath, 'accessibility.html'),
      page(snapshot, 'Accessibilité', accessibilityContent(snapshot), pageModel),
      'utf8'
    ),
    writeFile(
      resolve(dashboardPath, 'quality.html'),
      page(
        snapshot,
        'Qualité des données',
        '<section data-review-slot="s93" class="panel"><h2 data-review-slot="s94">Alertes et fiabilité du snapshot</h2><p data-review-slot="s95">Les alertes Data Quality sont des problèmes de données, pas des anomalies d’accessibilité.</p></section>' +
          dataQualityContent(snapshot, githubUrl) +
          '<details data-review-slot="s96" class="panel" data-global-only><summary data-review-slot="s97">Indicateurs historiques du snapshot complet</summary>' +
          overviewContent(snapshot, githubUrl) +
          '</details>' +
          metricExplanationContent(snapshot),
        pageModel
      ),
      'utf8'
    ),
    copyDashboardAsset(dashboardPath, 'workspaces.js'),
    writeFile(
      resolve(dashboardPath, 'epics.html'),
      page(snapshot, 'Suivi des Epics', epicsContent(), pageModel),
      'utf8'
    ),
    copyDashboardAsset(dashboardPath, 'epics.js'),
    copyDashboardAsset(dashboardPath, 'style.css'),
    copyDashboardAsset(dashboardPath, 'app.js'),
    copyDashboardAsset(dashboardPath, 'review.js'),
    copyDashboardAsset(dashboardPath, 'review-core.js'),
    writeFile(
      resolve(dashboardPath, 'assets/review-context.js'),
      'export default ' + JSON.stringify(await reviewContext(snapshot, { githubUrl, componentPrefix })) + ';',
      'utf8'
    ),
    copyDashboardAsset(dashboardPath, 'pagination.js'),
    copyDashboardAsset(dashboardPath, 'csv.js'),
    copyDashboardAsset(dashboardPath, 'quality.js'),
    copyDashboardAsset(dashboardPath, 'quality-causes.js'),
    copyDashboardAsset(dashboardPath, 'quality-presentation.js'),
    copyDashboardAsset(dashboardPath, 'snapshot-context.js'),
    copyDashboardAsset(dashboardPath, 'populations.js'),
    copyDashboardAsset(dashboardPath, 'page-model.js'),
    copyDashboardAsset(dashboardPath, 'context.js'),
    copyDashboardAsset(dashboardPath, 'kpi-presentation.js'),
    copyDashboardAsset(dashboardPath, 'version-presentation.js'),
    writeFile(
      resolve(dashboardPath, 'assets/statistics.js'),
      await readFile(new URL('../analytics/statistics.js', import.meta.url))
    ),
    copyDashboardAsset(dashboardPath, 'graph.js'),
    copyDashboardAsset(dashboardPath, 'issues.js'),
    copyDashboardAsset(dashboardPath, 'components.js'),
    copyDashboardAsset(dashboardPath, 'logo.svg')
  ]);
}

/** Copie un asset statique vers le dashboard généré. */
async function copyDashboardAsset(dashboardPath: string, assetName: string): Promise<void> {
  const content = await readFile(resolve(dashboardAssetSource, assetName));
  await writeFile(resolve(dashboardPath, 'assets', assetName), content);
}

/** Assemble une page HTML complète à partir d'un contenu et d'un snapshot. */
function page(
  snapshot: Snapshot,
  title: string,
  content: string,
  pageModel: (
    id: import('./page-read-model.js').DashboardPage
  ) => import('./page-read-model.js').DashboardPageModel
): string {
  const pageIds = {
    'Vue d’ensemble': 'index',
    'Analyse des issues': 'issues',
    Anomalies: 'anomalies',
    'Audits et composants': 'audits',
    'Analyse des composants': 'components',
    Cartographie: 'graph',
    Historique: 'history',
    Accessibilité: 'accessibility',
    'Qualité des données': 'quality',
    'Suivi des Epics': 'epics'
  } as const;
  const id = pageIds[title as keyof typeof pageIds];
  const data = JSON.stringify(pageModel(id)).replace(/</g, '\\u003c');
  // Seul le modèle de cette page est sérialisé ; les chevrons échappés empêchent une injection HTML.
  return `<!doctype html>
<html data-review-slot="s98" lang="fr">
<head data-review-slot="s99">
  <meta data-review-slot="s9a" charset="utf-8">
  <meta data-review-slot="s9b" name="viewport" content="width=device-width, initial-scale=1">
  <title data-review-slot="s9c">${title} | Design System Quality</title>
  <link data-review-slot="s9d" rel="stylesheet" href="assets/style.css">
</head>
<body data-review-slot="s9e" data-dashboard-page="${id}">
<section data-review-slot="s9f" class="panel" data-file-warning hidden role="alert"><h2 data-review-slot="s9g">Ouvrir le dashboard sur HTTP</h2><p data-review-slot="s9h">Les filtres et graphiques interactifs nécessitent un serveur local. Pour la démonstration, exécuter <code data-review-slot="s9i">npm run dashboard:serve</code>. Pour votre dataset, préciser son dossier avec <code data-review-slot="s9j">npm run dashboard:serve -- chemin/du/dashboard</code>, puis ouvrir <a data-review-slot="s9k" href="http://127.0.0.1:4174/">http://127.0.0.1:4174/</a>.</p></section>
  <a data-review-slot="s9l" class="skip-link" href="#main-content">Aller au contenu principal</a>
  <header data-review-slot="s9m" class="topbar"><a data-review-slot="s9n" class="brand" href="../index.html"><img data-review-slot="s9o" class="brand-logo" src="assets/logo.svg" alt=""> <span data-review-slot="s9p">Changer de vue</span></a></header>
  <div data-review-slot="s9q" class="dashboard-layout"><aside data-review-slot="s9r" class="sidebar"><p data-review-slot="s9s" class="sidebar-label">ESPACES DE PILOTAGE</p>${workspaceNavigation(title)}<div data-review-slot="s9t" class="sidebar-footer"><span data-review-slot="s9u">Règles</span><strong data-review-slot="s9v" data-rule-version></strong></div></aside><main data-review-slot="s9w" class="shell" id="main-content" tabindex="-1"><div data-review-slot="s9x" class="page-heading"><div data-review-slot="s9y"><p data-review-slot="s9z" class="eyebrow" data-snapshot-date>${escapeHtml(presentCaptureDate(snapshot.capturedAt))}</p><h1 data-review-slot="sa0">${title === 'Analyse des issues' ? 'Activité des équipes' : title === 'Analyse des composants' ? 'Composants et versions' : title === 'Anomalies' ? 'Défauts normalisés' : title === 'Audits et composants' ? 'Audits et conformité' : title}</h1><p data-review-slot="sa1" class="muted" data-snapshot-scope="${escapeHtml(snapshot.scope ?? '')}">Capture : ${escapeHtml(snapshot.scope || 'indisponible')} · Périmètre partagé</p><a data-review-slot="sa2" data-snapshot-reliability href="quality.html#quality">Fiabilité globale : ${qualityLabel(snapshot.reliability) ?? 'indisponible'} · ${snapshot.dataQuality.issues.length ? `${snapshot.dataQuality.issues.length} diagnostics` : snapshot.reliability === 'reliable' ? 'aucun diagnostic' : 'causes non documentées'}</a></div></div>${workspaceSubnavigation(title)}${['Qualité des données', 'Vue d’ensemble', 'Suivi des Epics'].includes(title) ? '' : contextToolbar(snapshot, title === 'Historique' ? ['repository'] : undefined, id === 'components' ? { feedback: false, resetLabel: 'Effacer le périmètre' } : {})}${content}</main></div>
  <script data-review-slot="sa3" type="application/json" id="dashboard-page-data">${data}</script><script data-review-slot="sa4">if (location.protocol === 'file:') { document.querySelector('[data-file-warning]').hidden = false; document.querySelectorAll('select, input, button').forEach(control => control.disabled = true); }</script><script data-review-slot="sa5" type="module" src="assets/app.js"></script>${id === 'quality' ? '<script data-review-slot="sa6" type="module" src="assets/quality.js"></script>' : ''}${id === 'audits' ? '<script data-review-slot="sa7" type="module" src="assets/populations.js"></script>' : ''}${id === 'epics' ? '<script data-review-slot="sa8" type="module" src="assets/epics.js"></script>' : ''}${['accessibility', 'audits', 'quality'].includes(id) ? '<script data-review-slot="sa9" type="module" src="assets/workspaces.js"></script>' : ''}${title === 'Cartographie' ? '<script data-review-slot="saa" type="module" src="assets/graph.js"></script>' : ''}${title === 'Analyse des issues' ? '<script data-review-slot="sab" type="module" src="assets/issues.js"></script>' : ''}${title === 'Analyse des composants' ? '<script data-review-slot="sac" type="module" src="assets/components.js"></script>' : ''}
</body></html>`
    .replace(/>\s+</g, '><')
    .replace(/class="active" href=/g, 'class="active" aria-current="page" href=')
    .replace(/<\/main><\/div>\s+<script/, '</main></div><script')
    .replace(/<th(?![^>]*\bscope=)(\s[^>]*)?>/g, '<th$1 scope="col">')
    .replace(
      /<div(?: data-review-slot="[^"]+")? class="table-wrap(?: issue-table-wrap)?">/g,
      (wrapper) => wrapper.slice(0, -1) + ' tabindex="0" role="region" aria-label="Tableau défilant">'
    );
}

/**
 * Réalise le traitement « preferred metric » dans le pipeline de qualité.
 *
 * @param metrics - Valeur de « metrics » utilisée par ce traitement.
 * @param primaryId - Valeur de « primaryId » utilisée par ce traitement.
 * @param legacyId - Valeur de « legacyId » utilisée par ce traitement.
 * @returns Résultat du traitement.
 */
function preferredMetric(metrics: Record<string, Metric>, primaryId: string, legacyId: string): Metric {
  return metrics[primaryId] ?? metricOrUnknown(metrics, legacyId);
}

/**
 * Réalise le traitement « component version verdict label » dans le pipeline de qualité.
 *
 * @param value - Valeur de « value » utilisée par ce traitement.
 * @returns Valeur textuelle produite.
 */
function componentVersionVerdictLabel(value: 'NON_COUVERT' | 'CONFORME' | 'NON_CONFORME'): string {
  return { NON_COUVERT: 'non couvert', CONFORME: 'conforme', NON_CONFORME: 'non conforme' }[value];
}

/** Restitue les métriques globales existantes sans les confondre avec la population accessibilité filtrée. */
function globalOverviewCards(snapshot: Snapshot): string {
  const cards: Array<[string, string, string]> = [
    ['portfolio.repositories', 'Repositories', 'components.html'],
    ['portfolio.components', 'Composants actifs', 'audits.html#component-populations'],
    ['audit.completed', 'Audits terminés', 'audits.html'],
    ['anomaly.total', 'Défauts normalisés déclarés', 'anomalies.html'],
    ['anomaly.open', 'Défauts normalisés ouverts', 'anomalies.html'],
    ['anomaly.correctedEver', 'Défauts corrigés au moins une fois', 'anomalies.html'],
    ['anomaly.correctionDelay.median', 'Délai médian des défauts', 'anomalies.html'],
    ['anomaly.correctionDelay.p90', 'P90 des délais des défauts', 'anomalies.html']
  ];
  return (
    '<section data-review-slot="sae" aria-label="Synthèse globale du snapshot"><div data-review-slot="saf" class="section-heading"><h2 data-review-slot="sag">Patrimoine et activité globale</h2></div><p data-review-slot="sah">Snapshot complet, tous repositories et toutes versions. Les défauts normalisés correspondent aux BUG configurés ; ils ne sont pas tous des anomalies d’accessibilité.</p><section data-review-slot="sai" class="kpi-grid">' +
    cards
      .map(([id, label, link]) => {
        const metric = metricOrUnknown(snapshot.analytics.metrics, id);
        return metricCard(
          label,
          metric,
          id.includes('Delay') ? 'jours calendaires' : denominatorLabel(metric),
          link
        );
      })
      .join('') +
    '</section><p data-review-slot="saj"><a data-review-slot="sak" href="issues.html">Explorer les issues et leurs métriques de sélection</a> · <a data-review-slot="sal" href="quality.html">Consulter les diagnostics et les autres indicateurs</a></p></section>'
  );
}

/** Restitue les deux comparaisons globales par repository, sans filtre de navigation. */
function repositoryComparisonTables(snapshot: Snapshot, githubUrl?: string): string {
  const groups = [
    ['global', 'Ensemble (Done + closedAt)'],
    ['done', 'Sans estimation (Done)'],
    ['estimated', 'Avec estimation (closedAt)']
  ];
  return `<article data-review-slot="sam" class="panel table-panel"><div data-review-slot="san" class="panel-heading"><h2 data-review-slot="sao">Patrimoine et activité par repository</h2><span data-review-slot="sap" class="badge">${snapshot.normalizedData.libraries.length} repositories</span></div><p data-review-slot="saq">Snapshot du ${escapeHtml(snapshot.capturedAt?.slice(0, 10) ?? 'date indisponible')}. Compteurs figés ; GitHub actuel ≈ : recherche approchée, sans preuve du compte. Identités : preuves locales.</p><div data-review-slot="sar" class="table-wrap" tabindex="0" role="region" aria-label="Patrimoine et activité par repository"><table data-review-slot="sas"><thead data-review-slot="sat"><tr data-review-slot="sau">${['Repository', 'Identités historiques', 'Anomalies', 'Anomalies ouvertes', 'Issues', 'Issues ouvertes', 'PR', 'PR fusionnées'].map((label, field) => `<th data-review-key="${field}" data-review-slot="sav" scope="col">${label}</th>`).join('')}</tr></thead><tbody data-review-slot="saw">${repositoryRows(snapshot, githubUrl)}</tbody></table></div></article>
  <article data-review-slot="sax" class="panel table-panel"><div data-review-slot="say" class="panel-heading"><div data-review-slot="saz"><p data-review-slot="sb0" class="eyebrow">Délais de traitement</p><h2 data-review-slot="sb1">Temps de traitement des issues par repository</h2></div><span data-review-slot="sb2" class="badge">Jours calendaires</span></div><p data-review-slot="sb3">Issues distinctes Done ET Closed, dates calculables et exclusions Data Quality appliquées. Done : dernière transition datée. closedAt : estimation admise uniquement si Done est prouvé et sa date absente. Les annulations sont exclues.</p><div data-review-slot="sb4" class="table-wrap" tabindex="0" role="region" aria-label="Temps de traitement par repository"><table data-review-slot="sb5"><thead data-review-slot="sb6"><tr data-review-slot="sb7"><th data-review-slot="sb8" scope="col" rowspan="2">Repository</th>${groups.map(([key, label]) => `<th data-review-key="${key}" data-review-slot="sb9" scope="colgroup" colspan="4">${label}</th>`).join('')}</tr><tr data-review-slot="sba">${groups.map(([cohort]) => ['Issues mesurables', 'Moyenne', 'Médiane', 'P90'].map((label, field) => `<th data-review-key="${cohort}:${field}" data-review-slot="sbb" scope="col">${label}</th>`).join('')).join('')}</tr></thead><tbody data-review-slot="sbc">${delayRows(snapshot)}</tbody></table></div></article>`;
}

/** Restitue les effectifs d'activité calculés dans Analytics pour le snapshot complet. */
function teamActivityContent(snapshot: Snapshot): string {
  const summary = snapshot.analytics.teamActivity ?? teamActivitySummary(snapshot.normalizedData);
  const counts: Array<[string, number | 'unknown', string]> = [
    ['Issues du snapshot', summary.issues, 'issues'],
    ['Avec contexte Project', summary.withProject, 'projects'],
    ['Avec itération', summary.withIteration, 'iterations'],
    ['Avec transition datée', summary.datedTransitions, 'transitions'],
    ['PR du snapshot', summary.pullRequests, 'prs'],
    ['PR ouvertes', summary.openPullRequests, 'open-prs'],
    ['PR fusionnées', summary.mergedPullRequests, 'merged-prs'],
    ['PR fermées sans fusion', summary.closedPullRequests, 'closed-prs'],
    ['PR reliées à une issue', summary.linkedPullRequests, 'linked-prs']
  ];
  return `<section data-review-slot="sbd" data-global-only aria-label="Synthèse de l’activité des équipes"><div data-review-slot="sbe" class="section-heading"><h2 data-review-slot="sbf">Le travail suivi dans les Projects, les issues et les PR</h2><span data-review-slot="sbg" class="badge">${qualityLabel(summary.quality)}</span></div><p data-review-slot="sbh">Snapshot complet, tous repositories et toutes versions. Effectifs distincts observés ; cette synthèse est masquée lorsqu’un filtre est appliqué. Les états des PR sont exclusifs ; les PR reliées sont une sous-population.</p><section data-review-slot="sbi" class="kpi-grid">${counts.map(([label, value, key]) => `<article data-review-slot="sbj" data-review-key="${key}" class="kpi-card"><span data-review-slot="sbk" class="kpi-label">${label}</span><strong data-review-slot="sbl" data-team-count="${key}">${value === 'unknown' ? 'Indisponible' : value}</strong></article>`).join('')}</section><div data-review-slot="sbm" class="content-grid"><article data-review-slot="sbn" class="panel"><h3 data-review-slot="sbo">Ce qui est observable</h3><p data-review-slot="sbp">Les statuts, itérations et Velocity sont ceux de chaque Project source. Une Velocity absente reste non renseignée ; aucune performance de sprint n’est déduite. Une transition datée désigne un événement Project connu, sans estimer les événements absents.</p></article><article data-review-slot="sbq" class="panel"><h3 data-review-slot="sbr">Réserves Data Quality</h3><p data-review-slot="sbs">Les données manquantes et incohérentes restent signalées. Consulter les alertes avant toute comparaison.</p><a data-review-slot="sbt" href="quality.html">Voir les alertes →</a></article></div></section>`;
}

/** Construit le contenu de la page de synthèse des KPI et alertes. */
function overviewContent(snapshot: Snapshot, githubUrl?: string): string {
  const { analytics, dataQuality } = snapshot;
  const metrics = analytics.metrics;
  const repositories = metricOrUnknown(metrics, 'portfolio.repositories');
  const components = metricOrUnknown(metrics, 'portfolio.components');
  // const audited = metricOrUnknown(metrics, 'portfolio.componentsAudited');
  const coverage = preferredMetric(metrics, 'componentVersion.auditCoverage', 'portfolio.auditCoverage');
  const conformity = preferredMetric(metrics, 'componentVersion.conformityRate', 'audit.conformityRate');
  const completedAudits = metricOrUnknown(metrics, 'audit.completed');
  const open = metricOrUnknown(metrics, 'anomaly.open');
  const total = metricOrUnknown(metrics, 'anomaly.total');
  const corrected = metricOrUnknown(metrics, 'anomaly.correctedEver');
  const median = metricOrUnknown(metrics, 'anomaly.correctionDelay.median');
  const p90 = metricOrUnknown(metrics, 'anomaly.correctionDelay.p90');
  const oldest = metricOrUnknown(metrics, 'anomaly.backlog.oldestAge');
  const criticalityCoverage = metricOrUnknown(metrics, 'anomaly.criticalityCoverage');

  return `<section data-review-slot="sbu" class="hero-band synthesis-hero">
    <div data-review-slot="sbv"><p data-review-slot="sbw" class="eyebrow">Point de situation</p><h2 data-review-slot="sbx">Un état du patrimoine, des audits et des anomalies.</h2><p data-review-slot="sby">Une issue désigne tout travail GitHub ; un audit est une issue de contrôle d’un composant pour une version ; une anomalie est un écart identifié, notamment pendant un audit. Ces ensembles se recoupent et ne s’additionnent pas.</p><p data-review-slot="sbz">Les indicateurs sont calculés dans le pipeline puis expliqués ici avec leur périmètre, leur ratio et leur fiabilité.</p></div>
    <div data-review-slot="sc0" class="hero-facts"><div data-review-slot="sc1"><strong data-review-slot="sc2">${formatMetricValue(open)}</strong><span data-review-slot="sc3">ouvertes</span></div><div data-review-slot="sc4"><strong data-review-slot="sc5">${formatMetricValue(total)}</strong><span data-review-slot="sc6">anomalies</span></div><div data-review-slot="sc7"><strong data-review-slot="sc8">${formatMetricValue(coverage)}%</strong><span data-review-slot="sc9">couverture audit</span></div></div>
  </section>

  <section data-review-slot="sca" class="section-heading"><div data-review-slot="scb"><p data-review-slot="scc" class="eyebrow">Patrimoine</p><h2 data-review-slot="scd">Ce qui existe aujourd’hui</h2></div><span data-review-slot="sce" class="badge">${qualityLabel(repositories.reliability.status)}</span></section>
  <section data-review-slot="scf" class="kpi-grid synthesis-grid">
    ${metricCard('Repositories', repositories, '—', 'audits.html')}
    ${metricCard('Composants actifs', components, '—', 'audits.html')}
    ${metricCard('Component × Version couverts', preferredMetric(metrics, 'componentVersion.covered', 'portfolio.componentsAudited'), ratioLabel(preferredMetric(metrics, 'componentVersion.covered', 'portfolio.componentsAudited')), 'audits.html')}
    ${metricCard('Couverture Component × Version', coverage, ratioLabel(coverage), 'audits.html')}
  </section>

  <section data-review-slot="scg" class="section-heading"><div data-review-slot="sch"><p data-review-slot="sci" class="eyebrow">Audits</p><h2 data-review-slot="scj">Résultats et périmètre</h2></div><span data-review-slot="sck" class="badge">${formatMetricValue(completedAudits)} audit${completedAudits.value === 1 ? '' : 's'} terminé${completedAudits.value === 1 ? '' : 's'}</span></section>
  <section data-review-slot="scl" class="content-grid synthesis-two">
    ${explainMetricPanel('Conformité Component × Version', conformity, ratioLabel(conformity), 'La conformité porte sur les couples Component × Version couverts. Un couple non couvert n’est jamais assimilé à un couple non conforme.', 'audits.html')}
    ${explainMetricPanel('Couverture Component × Version', coverage, ratioLabel(coverage), 'La couverture mesure les couples Component × Version disposant d’au moins un Audit terminé applicable.', 'audits.html')}
  </section>

  <section data-review-slot="scm" class="section-heading"><div data-review-slot="scn"><p data-review-slot="sco" class="eyebrow">Anomalies</p><h2 data-review-slot="scp">Stock actuel et délai de correction</h2></div><span data-review-slot="scq" class="badge">${qualityLabel(total.reliability.status)}</span></section>
  <section data-review-slot="scr" class="kpi-grid synthesis-grid">
    ${metricCard('Anomalies totales', total, denominatorLabel(total), 'anomalies.html')}
    ${metricCard('Anomalies ouvertes', open, denominatorLabel(open), 'anomalies.html')}
    ${metricCard('Anomalies corrigées', corrected, denominatorLabel(corrected), 'anomalies.html')}
    ${metricCard('Délai médian', median, 'jours calendaires', 'anomalies.html')}
    ${metricCard('Délai P90', p90, 'jours calendaires', 'anomalies.html')}
    ${metricCard('Plus ancienne ouverte', oldest, 'âge dans le snapshot', 'anomalies.html')}
  </section>

  <section data-review-slot="scs" class="content-grid synthesis-two">
    <article data-review-slot="sct" class="panel"><div data-review-slot="scu" class="panel-heading"><div data-review-slot="scv"><p data-review-slot="scw" class="eyebrow">Criticité</p><h2 data-review-slot="scx">Répartition des anomalies</h2></div><span data-review-slot="scy" class="badge">${formatMetricValue(criticalityCoverage)}% classées</span></div><div data-review-slot="scz" class="bars">${criticalityMetricBars(metrics)}</div><p data-review-slot="sd0" class="panel-note">${formatRawMetricValue(criticalityCoverage.numerator)} / ${formatRawMetricValue(criticalityCoverage.denominator)} anomalies disposent d’une criticité valide.</p></article>
    <article data-review-slot="sd1" class="panel"><div data-review-slot="sd2" class="panel-heading"><div data-review-slot="sd3"><p data-review-slot="sd4" class="eyebrow">Catégories</p><h2 data-review-slot="sd5">Critères d’accessibilité</h2></div><span data-review-slot="sd6" class="badge">multi-étiquettes</span></div><div data-review-slot="sd7" class="bars">${categoryMetricBars(metrics)}</div><p data-review-slot="sd8" class="panel-note">Une anomalie peut appartenir à plusieurs catégories. Les catégories concernées par une réserve DQ sont signalées comme partielles.</p></article>
  </section>

  <section data-review-slot="sd9" class="section-heading"><div data-review-slot="sda"><p data-review-slot="sdb" class="eyebrow">Qualité des données</p><h2 data-review-slot="sdc">Pourquoi certains chiffres sont partiels</h2></div><span data-review-slot="sdd" class="alert-count">${dataQuality.issues.length}</span></section>
  <section data-review-slot="sde" class="content-grid synthesis-two"><article data-review-slot="sdf" class="panel alert-panel"><div data-review-slot="sdg" class="severity-row"><span data-review-slot="sdh"><i data-review-slot="sdi" class="dot error"></i>Erreurs</span><strong data-review-slot="sdj">${dataQuality.summary.ERROR}</strong></div><div data-review-slot="sdk" class="severity-row"><span data-review-slot="sdl"><i data-review-slot="sdm" class="dot warning"></i>Avertissements</span><strong data-review-slot="sdn">${dataQuality.summary.WARNING}</strong></div><div data-review-slot="sdo" class="severity-row"><span data-review-slot="sdp"><i data-review-slot="sdq" class="dot info"></i>Informations</span><strong data-review-slot="sdr">${dataQuality.summary.INFO}</strong></div><a data-review-slot="sds" class="text-link" href="anomalies.html#quality">Voir les alertes et leurs cibles →</a></article><article data-review-slot="sdt" class="panel"><div data-review-slot="sdu" class="panel-heading"><div data-review-slot="sdv"><p data-review-slot="sdw" class="eyebrow">Lecture</p><h2 data-review-slot="sdx">Fiabilité par métrique</h2></div></div>${reliabilityRows(metrics)}</article></section>

  ${repositoryComparisonTables(snapshot, githubUrl)}`;
}

/**
 * Réalise le traitement « metric or unknown » dans le pipeline de qualité.
 *
 * @param metrics - Valeur de « metrics » utilisée par ce traitement.
 * @param id - Valeur de « id » utilisée par ce traitement.
 * @returns Résultat du traitement.
 */
function metricOrUnknown(metrics: Record<string, Metric>, id: string): Metric {
  return (
    metrics[id] ?? {
      id,
      value: 'unknown',
      unit: 'count',
      scope: 'portfolio',
      definition: 'Métrique indisponible.',
      sourceEntityIds: [],
      reliability: { status: 'unknown', issueIds: [] },
      exclusions: []
    }
  );
}

/**
 * Formate metric value dans le contexte du pipeline de qualité.
 *
 * @param metric - Valeur de « metric » utilisée par ce traitement.
 * @returns Valeur textuelle produite.
 */
function formatMetricValue(metric: Metric): string {
  if (metric.value === 'unknown') return '—';
  return metric.unit === 'percentage'
    ? `${metric.value}`
    : metric.unit === 'days'
      ? `${metric.value} j`
      : `${metric.value}`;
}

/**
 * Formate raw metric value dans le contexte du pipeline de qualité.
 *
 * @param value - Valeur de « value » utilisée par ce traitement.
 * @returns Valeur textuelle produite.
 */
function formatRawMetricValue(value: number | 'unknown' | undefined): string {
  return typeof value === 'number' ? `${value}` : '—';
}

/**
 * Réalise le traitement « ratio label » dans le pipeline de qualité.
 *
 * @param metric - Valeur de « metric » utilisée par ce traitement.
 * @returns Valeur textuelle produite.
 */
function ratioLabel(metric: Metric): string {
  if (typeof metric.numerator !== 'number' || typeof metric.denominator !== 'number')
    return 'ratio indisponible';
  return `${metric.numerator}/${metric.denominator}`;
}

/**
 * Réalise le traitement « denominator label » dans le pipeline de qualité.
 *
 * @param metric - Valeur de « metric » utilisée par ce traitement.
 * @returns Valeur textuelle produite.
 */
function denominatorLabel(metric: Metric): string {
  if (typeof metric.denominator !== 'number') return 'périmètre inconnu';
  return `${metric.denominator} au total`;
}

/**
 * Réalise le traitement « metric card » dans le pipeline de qualité.
 *
 * @param label - Valeur de « label » utilisée par ce traitement.
 * @param metric - Valeur de « metric » utilisée par ce traitement.
 * @param context - Valeur de « context » utilisée par ce traitement.
 * @param href - Valeur de « href » utilisée par ce traitement.
 * @returns Valeur textuelle produite.
 */
function metricCard(label: string, metric: Metric, context: string, href: string): string {
  return `<a data-review-slot="sdy" class="kpi-card metric-card" data-metric-id="${escapeHtml(metric.id)}" href="${href}"><span data-review-slot="sdz" class="kpi-label">${label}</span><strong data-review-slot="se0">${formatMetricValue(metric)}</strong><span data-review-slot="se1" class="kpi-ratio">${context} · ${qualityLabel(metric.reliability.status)}</span><span data-review-slot="se2" class="kpi-definition">${escapeHtml(metric.definition)}</span></a>`;
}

/**
 * Réalise le traitement « explain metric panel » dans le pipeline de qualité.
 *
 * @param title - Valeur de « title » utilisée par ce traitement.
 * @param metric - Valeur de « metric » utilisée par ce traitement.
 * @param ratio - Valeur de « ratio » utilisée par ce traitement.
 * @param definition - Valeur de « definition » utilisée par ce traitement.
 * @param href - Valeur de « href » utilisée par ce traitement.
 * @returns Valeur textuelle produite.
 */
function explainMetricPanel(
  title: string,
  metric: Metric,
  ratio: string,
  definition: string,
  href: string
): string {
  return `<a data-review-slot="se3" data-review-key="${escapeHtml(metric.id)}" class="panel metric-explainer" href="${href}"><div data-review-slot="se4" class="panel-heading"><div data-review-slot="se5"><p data-review-slot="se6" class="eyebrow">Métrique</p><h2 data-review-slot="se7">${title}</h2></div><span data-review-slot="se8" class="badge">${qualityLabel(metric.reliability.status)}</span></div><strong data-review-slot="se9" class="metric-big">${formatMetricValue(metric)}${metric.unit === 'percentage' ? '%' : ''}</strong><p data-review-slot="sea" class="metric-ratio">${escapeHtml(ratio)}</p><p data-review-slot="seb">${escapeHtml(definition)}</p>${metric.reliability.issueIds.length ? `<p data-review-slot="sec" class="metric-warning">Réserve DQ : ${metric.reliability.issueIds.length} alerte${metric.reliability.issueIds.length > 1 ? 's' : ''} affecte cette métrique.</p>` : ''}</a>`;
}

/**
 * Réalise le traitement « criticality metric bars » dans le pipeline de qualité.
 *
 * @param metrics - Valeur de « metrics » utilisée par ce traitement.
 * @returns Valeur textuelle produite.
 */
function criticalityMetricBars(metrics: Record<string, Metric>): string {
  const values: Array<[string, string]> = [
    ['blocking', 'bloquante'],
    ['major', 'majeure'],
    ['minor', 'mineure']
  ];
  return values
    .map(([key, label]) => {
      const metric = metricOrUnknown(metrics, `anomaly.byCriticality.${key}`);
      return linkedBar(label, metric.value, `anomalies.html?criticality=${encodeURIComponent(key)}`, key);
    })
    .join('');
}

/**
 * Réalise le traitement « category metric bars » dans le pipeline de qualité.
 *
 * @param metrics - Valeur de « metrics » utilisée par ce traitement.
 * @returns Valeur textuelle produite.
 */
function categoryMetricBars(metrics: Record<string, Metric>): string {
  const entries = Object.values(metrics)
    .filter((metric) => metric.id.startsWith('anomaly.byCategory.'))
    .sort(
      (a, b) => Number(b.value === 'unknown' ? -1 : b.value) - Number(a.value === 'unknown' ? -1 : a.value)
    );
  return (
    entries
      .map((metric) => {
        const category = metric.id.slice('anomaly.byCategory.'.length);
        return linkedBar(
          category,
          metric.value,
          `anomalies.html?category=${encodeURIComponent(category)}`,
          metric.id
        );
      })
      .join('') || '<p data-review-slot="sed" class="muted">Aucune catégorie détectée.</p>'
  );
}

/**
 * Réalise le traitement « reliability rows » dans le pipeline de qualité.
 *
 * @param metrics - Valeur de « metrics » utilisée par ce traitement.
 * @returns Valeur textuelle produite.
 */
function reliabilityRows(metrics: Record<string, Metric>): string {
  const selected = [
    'portfolio.repositories',
    'portfolio.components',
    'componentVersion.auditCoverage',
    'componentVersion.conformityRate',
    'anomaly.total',
    'anomaly.open',
    'anomaly.criticalityCoverage',
    'anomaly.correctionDelay.median'
  ];
  return selected
    .map((id) => {
      const metric = metricOrUnknown(metrics, id);
      return `<div data-review-slot="see" data-review-key="${escapeHtml(id)}" class="reliability-row"><div data-review-slot="sef"><strong data-review-slot="seg">${escapeHtml(metricLabel(id))}</strong><small data-review-slot="seh">${metric.reliability.issueIds.length ? `${metric.reliability.issueIds.length} alerte${metric.reliability.issueIds.length > 1 ? 's' : ''} liée${metric.reliability.issueIds.length > 1 ? 's' : ''}` : 'Aucune alerte DQ liée'}</small></div><span data-review-slot="sei" class="tag tag-${metric.reliability.status}">${qualityLabel(metric.reliability.status)}</span></div>`;
    })
    .join('');
}

/**
 * Réalise le traitement « metric label » dans le pipeline de qualité.
 *
 * @param id - Valeur de « id » utilisée par ce traitement.
 * @returns Valeur textuelle produite.
 */
function metricLabel(id: string): string {
  return (
    (
      {
        'portfolio.repositories': 'Repositories',
        'portfolio.components': 'Composants',
        'portfolio.auditCoverage': 'Couverture des audits',
        'audit.conformityRate': 'Conformité objective',
        'componentVersion.auditCoverage': 'Couverture Component × Version',
        'componentVersion.conformityRate': 'Conformité Component × Version',
        'anomaly.total': 'Anomalies totales',
        'anomaly.open': 'Anomalies ouvertes',
        'anomaly.criticalityCoverage': 'Couverture criticité',
        'anomaly.correctionDelay.median': 'Délai médian'
      } as Record<string, string>
    )[id] ?? id
  );
}

/** Vue temporelle issue de la comparaison entre snapshots. */
function historyContent(snapshot: Snapshot): string {
  const flows = snapshot.analytics.flows ?? {};
  const ids = [
    'anomaly.flow.created',
    'anomaly.flow.corrected',
    'anomaly.flow.reopened',
    'anomaly.flow.cancelled'
  ] as const;
  const labels: Record<string, string> = {
    'anomaly.flow.created': 'Anomalies créées',
    'anomaly.flow.corrected': 'Anomalies corrigées',
    'anomaly.flow.reopened': 'Anomalies rouvertes',
    'anomaly.flow.cancelled': 'Anomalies annulées'
  };
  const issueFlowIds = [
    'issue.flow.created',
    'issue.flow.treated',
    'issue.flow.reopened',
    'issue.flow.cancelled'
  ] as const;
  const issueFlowLabels: Record<string, string> = {
    'issue.flow.created': 'Issues créées',
    'issue.flow.treated': 'Issues traitées',
    'issue.flow.reopened': 'Issues rouvertes',
    'issue.flow.cancelled': 'Issues annulées'
  };
  const issueFlowCards = issueFlowIds
    .map((id) => {
      const metric = flows[id];
      return metric
        ? metricCard(
            issueFlowLabels[id] ?? id,
            metric,
            `${formatDateShort(metric.period?.from ?? '')} → ${formatDateShort(metric.period?.to ?? '')}`,
            'issues.html'
          )
        : `<article data-review-slot="sej" data-review-key="${id}" class="kpi-card"><span data-review-slot="sek" class="kpi-label">${issueFlowLabels[id]}</span><strong data-review-slot="sel">—</strong><span data-review-slot="sem" class="kpi-definition">Disponible après comparaison de deux snapshots.</span></article>`;
    })
    .join('');
  const first = flows[ids[0]];
  const period = first?.period;
  // Le stock d'issues inclut tous les types ; les flux ci-dessous restent propres aux anomalies.
  const issueStock = snapshot.analytics.metrics['issue.total']?.value ?? 'unknown';
  const issueStates = {
    open: snapshot.analytics.metrics['issue.open']?.value ?? 'unknown',
    treated: snapshot.analytics.metrics['issue.treated']?.value ?? 'unknown',
    cancelled: snapshot.analytics.metrics['issue.cancelled']?.value ?? 'unknown'
  };
  const cards = ids
    .map((id) => {
      const metric = flows[id];
      const label = labels[id] ?? id;
      return metric
        ? metricCard(
            label,
            metric,
            `${formatDateShort(metric.period?.from ?? '')} → ${formatDateShort(metric.period?.to ?? '')}`,
            'anomalies.html'
          )
        : `<article data-review-slot="sen" data-review-key="${id}" class="kpi-card"><span data-review-slot="seo" class="kpi-label">${label}</span><strong data-review-slot="sep">—</strong><span data-review-slot="seq" class="kpi-definition">Disponible après comparaison avec un snapshot précédent.</span></article>`;
    })
    .join('');
  return `<section data-review-slot="ser" class="hero-band"><div data-review-slot="ses"><p data-review-slot="set" class="eyebrow">Évolution</p><h2 data-review-slot="seu">Ce qui a changé depuis le snapshot précédent</h2><p data-review-slot="sev">Stock courant : ${issueStock} issues distinctes, tous types confondus. Les flux génériques et les flux des anomalies sont présentés séparément.</p><p data-review-slot="sew">${period ? `Période : ${formatDateShort(period.from ?? '')} → ${formatDateShort(period.to ?? '')}` : 'Aucun snapshot précédent comparable dans les données courantes.'}</p></div><div data-review-slot="sex" class="hero-ring"><strong data-review-slot="sey">${first ? ids.reduce((sum, id) => sum + Number(flows[id]?.value ?? 0), 0) : '—'}</strong><span data-review-slot="sez">événements détectés</span></div></section><section data-review-slot="sf0" class="section-heading"><div data-review-slot="sf1"><p data-review-slot="sf2" class="eyebrow">Tous types</p><h2 data-review-slot="sf3">Flux des issues</h2></div></section><section data-review-slot="sf4" class="kpi-grid" data-history-issue-flows>${issueFlowCards}</section><section data-review-slot="sf5" class="section-heading"><div data-review-slot="sf6"><p data-review-slot="sf7" class="eyebrow">Anomalies normalisées</p><h2 data-review-slot="sf8">Flux des anomalies</h2></div></section><section data-review-slot="sf9" class="kpi-grid" data-global-only aria-label="Indicateurs du snapshot complet">${cards}</section><article data-review-slot="sfa" class="panel table-panel"><div data-review-slot="sfb" class="panel-heading"><div data-review-slot="sfc"><p data-review-slot="sfd" class="eyebrow">Interprétation</p><h2 data-review-slot="sfe">Stock vs flux</h2></div><span data-review-slot="sff" class="badge">snapshot courant</span></div><p data-review-slot="sfg" data-history-issue-stock>Issues (tous types) : <strong data-review-slot="sfh">${issueStock}</strong> distinctes · <strong data-review-slot="sfi">${issueStates.open}</strong> ouvertes · <strong data-review-slot="sfj">${issueStates.treated}</strong> traitées · <strong data-review-slot="sfk">${issueStates.cancelled}</strong> annulées.</p><p data-review-slot="sfl" class="muted">Les flux des issues et des anomalies sont observés entre deux snapshots et ne doivent pas être additionnés. Ils ne remplacent pas les stocks affichés dans <a data-review-slot="sfm" class="text-link" href="anomalies.html">Anomalies</a>.</p></article>`;
}

/** Construit la vue V2 des anomalies : stock, flux, délais, criticité et qualité des données. */
function anomaliesContent(snapshot: Snapshot, githubUrl?: string): string {
  const metrics = snapshot.analytics.metrics;
  const libraryById = new Map(
    snapshot.normalizedData.libraries.map((library) => [library.libraryId, library.name])
  );
  const issueLibraryById = new Map(
    (snapshot.normalizedData.issues ?? []).map((issue) => [issue.issueId, issue.libraryId])
  );
  const repositories = [
    ...new Set(snapshot.normalizedData.libraries.map((library) => library.repository))
  ].sort();
  const categories = [
    ...new Set(snapshot.normalizedData.anomalies.flatMap((anomaly) => anomaly.categories))
  ].sort();
  const total = metricOrUnknown(metrics, 'anomaly.total');
  const open = metricOrUnknown(metrics, 'anomaly.open');
  const inProgress = metricOrUnknown(metrics, 'anomaly.inProgress');
  const done = metricOrUnknown(metrics, 'anomaly.done');
  const corrected = metricOrUnknown(metrics, 'anomaly.correctedEver');
  const reopened = metricOrUnknown(metrics, 'anomaly.reopened');
  const cancelled = metricOrUnknown(metrics, 'anomaly.cancelled');
  const averageGlobal = metricOrUnknown(metrics, 'anomaly.correctionDelay.average');
  const averageActual = metricOrUnknown(metrics, 'anomaly.correctionDelay.averageActual');
  const averageEstimated = metricOrUnknown(metrics, 'anomaly.correctionDelay.averageEstimated');
  const median = metricOrUnknown(metrics, 'anomaly.correctionDelay.median');
  const p90 = metricOrUnknown(metrics, 'anomaly.correctionDelay.p90');
  const oldest = metricOrUnknown(metrics, 'anomaly.backlog.oldestAge');
  const criticalityCoverage = metricOrUnknown(metrics, 'anomaly.criticalityCoverage');

  const coverage = calculateHistoryCoverage(
    snapshot.normalizedData.issues ?? [],
    snapshot.normalizedData.anomalies
  );
  const coverageIssueById = new Map(
    (snapshot.normalizedData.issues ?? []).map((issue) => [issue.issueId, issue])
  );
  const reasonLabels = {
    available: 'Date métier fiable',
    multiple_done: 'Plusieurs transitions Done',
    no_project_history: 'Historique projet absent',
    no_done_transition: 'Aucune transition Done'
  };

  const rows = snapshot.normalizedData.anomalies
    .map((anomaly) => {
      const component = anomaly.componentId
        ? snapshot.normalizedData.components.find((item) => item.componentId === anomaly.componentId)
        : undefined;
      const repositoryName =
        libraryById.get(issueLibraryById.get(anomaly.issueId) ?? component?.libraryId ?? '') ??
        'repository inconnu';
      const status = anomaly.cancelled ? 'cancelled' : anomaly.status;
      const statusLabel = anomaly.cancelled ? 'Annulée' : anomalyStatusLabel(anomaly.status);
      const criticality = anomaly.criticality ?? 'unknown';
      const categoriesText = anomaly.categories.join(', ') || '—';
      const linkedPullRequests =
        anomaly.pullRequestRefs
          .map((reference) => githubReference(snapshot, reference, githubUrl))
          .join(' ') || '—';
      const created = formatDateShort(anomaly.createdAt);
      const reason = correctionDateReason(anomaly, coverageIssueById.get(anomaly.issueId));
      const candidateDate = anomaly.effectiveCorrectedAt ?? anomaly.correctedAt;
      const candidateDelay = candidateDate ? delayDays(anomaly.createdAt, candidateDate) : NaN;
      const hasValidDelay = Number.isFinite(candidateDelay) && candidateDelay >= 0;
      const correctedAt = hasValidDelay && candidateDate ? formatDateShort(candidateDate) : '—';
      const delay = hasValidDelay ? `${candidateDelay.toFixed(1)} j` : '—';
      const dateLabel =
        candidateDate && !hasValidDelay
          ? 'Date incohérente'
          : anomaly.correctionDateSource === 'issue_closed'
            ? 'Clôture estimée'
            : anomaly.correctionDateSource === 'last_done'
              ? 'Dernier Done'
              : anomaly.correctionDateSource === 'done'
                ? 'Done'
                : reasonLabels[reason];
      const qualification = workspaceModel(snapshot).rows.find(
        (row) => row.id === anomaly.issueId
      )?.qualification;
      return `<tr data-review-slot="sfn" data-table-row ${contextAttribute(issueFacts(snapshot).find((fact) => fact.id === anomaly.issueId) ?? { anomalyIds: [anomaly.anomalyId] })} data-corrected="${anomaly.everCorrected}" data-repository="${escapeHtml(snapshot.normalizedData.libraries.find((library) => library.name === repositoryName)?.repository ?? repositoryName)}" data-status="${status}" data-criticality="${escapeHtml(criticality)}" data-categories="${escapeHtml(anomaly.categories.join('|'))}">
      <td data-review-slot="sfo"><strong data-review-slot="sfp">${escapeHtml(anomaly.anomalyId)}</strong><small data-review-slot="sfq">${qualification?.status === 'qualified' ? 'Accessibilité qualifiée' : qualification?.status === 'presumed' ? 'Accessibilité présumée · à examiner' : 'Défaut sans qualification accessibilité'}</small><small data-review-slot="sfr">${githubReference(snapshot, anomaly.provenance.sourceId ?? 'source inconnue', githubUrl)}</small></td>
      <td data-review-slot="sfs">${repositoryReference(snapshot, repositoryName, githubUrl)}<small data-review-slot="sft">${escapeHtml(component?.name?.trim() || anomaly.componentId?.trim() || 'composant non déterminé')}</small></td>
      <td data-review-slot="sfu"><span data-review-slot="sfv" class="tag tag-${criticality}">${criticalityLabel(anomaly.criticality)}</span></td>
      <td data-review-slot="sfw">${escapeHtml(categoriesText)}</td><td data-review-slot="sfx">${escapeHtml(anomaly.origin)}<small data-review-slot="sfy">${anomaly.auditId ? `<a data-review-slot="sfz" href="audits.html?audit=${encodeURIComponent(anomaly.auditId)}">${escapeHtml(anomaly.auditId)}</a>` : 'Aucun audit explicitement relié'}</small></td>
      <td data-review-slot="sg0"><span data-review-slot="sg1" class="state state-${status}">${statusLabel}</span></td>
      <td data-review-slot="sg2">${created}</td><td data-review-slot="sg3">${correctedAt}</td><td data-review-slot="sg4">${delay}</td><td data-review-slot="sg5">${escapeHtml(dateLabel)}</td><td data-review-slot="sg6">${linkedPullRequests}</td>
    </tr>`;
    })
    .join('');

  const issues = snapshot.dataQuality.issues
    .map(
      (issue) =>
        `<li data-review-slot="sg7" data-review-key="${escapeHtml(issue.id)}"><span data-review-slot="sg8" class="tag tag-${issue.severity.toLowerCase()}">${severityLabel(issue.severity)}</span><div data-review-slot="sg9"><strong data-review-slot="sga">${escapeHtml(issue.ruleId)}</strong><p data-review-slot="sgb">${escapeHtml(qualityMessage(issue))}</p>${qualityIssueTarget(snapshot, issue, githubUrl)}</div></li>`
    )
    .join('');

  return `<section data-review-slot="sgc" class="hero-band anomalies-hero">
    <div data-review-slot="sgd"><p data-review-slot="sge" class="eyebrow">Stock actuel</p><h2 data-review-slot="sgf">${formatMetricValue(open)} anomalies ouvertes</h2><p data-review-slot="sgg">Les anomalies sont des écarts de qualité/accessibilité, pas l’ensemble des issues ni les audits eux-mêmes.</p><p data-review-slot="sgh">${formatRawMetricValue(open.numerator)} sur ${formatRawMetricValue(open.denominator)} anomalies du périmètre courant.</p></div>
    <div data-review-slot="sgi" class="hero-facts"><div data-review-slot="sgj"><strong data-review-slot="sgk">${formatMetricValue(total)}</strong><span data-review-slot="sgl">stock total</span></div><div data-review-slot="sgm"><strong data-review-slot="sgn">${formatMetricValue(inProgress)}</strong><span data-review-slot="sgo">en cours</span></div><div data-review-slot="sgp"><strong data-review-slot="sgq">${formatMetricValue(done)}</strong><span data-review-slot="sgr">terminées</span></div></div>
  </section>

  <section data-review-slot="sgs" class="section-heading"><div data-review-slot="sgt"><p data-review-slot="sgu" class="eyebrow">Stock</p><h2 data-review-slot="sgv">État des anomalies</h2></div><span data-review-slot="sgw" class="badge">${qualityLabel(total.reliability.status)}</span></section>
  <section data-review-slot="sgx" class="kpi-grid anomaly-kpi-grid">
    ${metricCard('Total', total, denominatorLabel(total), 'anomalies.html')}
    ${metricCard('Ouvertes', open, ratioLabel(open), 'anomalies.html?status=open')}
    ${metricCard('En cours', inProgress, ratioLabel(inProgress), 'anomalies.html?status=in_progress')}
    ${metricCard('Terminées', done, ratioLabel(done), 'anomalies.html?status=done')}
    ${metricCard('Corrigées', corrected, ratioLabel(corrected), 'anomalies.html?corrected=true')}
  </section>

  <section data-review-slot="sgy" class="section-heading"><div data-review-slot="sgz"><p data-review-slot="sh0" class="eyebrow">États complémentaires</p><h2 data-review-slot="sh1">Historique observable dans le snapshot</h2></div><span data-review-slot="sh2" class="badge">pas un flux temporel</span></section>
  <section data-review-slot="sh3" class="content-grid synthesis-two">
    ${flowMetricPanel('Déjà corrigées', corrected, 'anomalies.html?corrected=true', corrected.definition)}
    ${flowMetricPanel('Actuellement rouvertes', reopened, 'anomalies.html?status=reopened', reopened.definition)}
    ${flowMetricPanel('Annulées', cancelled, 'anomalies.html?status=cancelled', cancelled.definition)}
  </section>

  <article data-review-slot="sh4" class="panel" id="history-coverage" aria-labelledby="history-coverage-heading">
    <div data-review-slot="sh5" class="panel-heading"><div data-review-slot="sh6"><p data-review-slot="sh7" class="eyebrow">Qualité des données</p><h2 data-review-slot="sh8" id="history-coverage-heading">Couverture des historiques et dates de correction</h2></div><span data-review-slot="sh9" class="badge">${coverage.issuesWithHistory} / ${coverage.issuesTotal} issues avec historique</span></div>
    <p data-review-slot="sha">${coverage.issuesWithoutHistory} issues sans transition de statut Project observable. ${coverage.correctionDatesAvailable} / ${coverage.anomaliesTotal} anomalies disposent d’une date de correction calculable (Done ou clôture estimée).</p>
    <p data-review-slot="shb" class="muted">Motifs d’indisponibilité : ${coverage.reasons.no_project_history} sans historique projet, ${coverage.reasons.no_done_transition} sans transition Done, ${coverage.reasons.multiple_done} avec plusieurs transitions Done. Les estimations de clôture entrent désormais dans le KPI officiel.</p>
    <p data-review-slot="shc" class="muted">Une clôture utilisée en repli est une estimation, distincte d’une transition métier Done.</p>
  </article>

  <section data-review-slot="shd" class="section-heading"><div data-review-slot="she"><p data-review-slot="shf" class="eyebrow">Délais</p><h2 data-review-slot="shg">Temps de correction</h2></div><span data-review-slot="shh" class="badge">jours calendaires</span></section>
  <section data-review-slot="shi" class="kpi-grid anomaly-delay-grid">
    ${metricCard('Délai moyen officiel · global', averageGlobal, `${averageGlobal.numerator} corrections · dates Done et estimées`, 'anomalies.html')}
    ${metricCard('Sans estimation · Done', averageActual, `${averageActual.numerator} corrections · dates métier`, 'anomalies.html')}
    ${metricCard('Estimations seules · clôture', averageEstimated, `${averageEstimated.numerator} corrections · closedAt`, 'anomalies.html')}
  </section>
  <p data-review-slot="shj" class="muted">Le délai global est calculé sur toutes les corrections admissibles ; les deux autres indicateurs détaillent les dates métier et les estimations. Les issues annulées et les durées invalides sont exclues.</p>
  <section data-review-slot="shk" class="kpi-grid anomaly-delay-grid">
    ${metricCard('Médiane', median, 'délai typique', 'anomalies.html')}
    ${metricCard('P90', p90, '9 anomalies sur 10 au plus', 'anomalies.html')}
    ${metricCard('Plus ancienne ouverte', oldest, 'âge dans le snapshot', 'anomalies.html?status=open')}
  </section>

  <section data-review-slot="shl" class="content-grid synthesis-two">
    <article data-review-slot="shm" class="panel"><div data-review-slot="shn" class="panel-heading"><div data-review-slot="sho"><p data-review-slot="shp" class="eyebrow">Criticité</p><h2 data-review-slot="shq">Couverture et répartition</h2></div><span data-review-slot="shr" class="badge">${formatMetricValue(criticalityCoverage)}%</span></div><div data-review-slot="shs" class="bars">${criticalityMetricBars(metrics)}</div><p data-review-slot="sht" class="panel-note">${formatRawMetricValue(criticalityCoverage.numerator)} / ${formatRawMetricValue(criticalityCoverage.denominator)} anomalies disposent d’une criticité valide. Une anomalie sans criticité reste dans le stock général.</p></article>
    <article data-review-slot="shu" class="panel"><div data-review-slot="shv" class="panel-heading"><div data-review-slot="shw"><p data-review-slot="shx" class="eyebrow">Catégories</p><h2 data-review-slot="shy">Nature des écarts</h2></div><span data-review-slot="shz" class="badge">multi-étiquettes</span></div><div data-review-slot="si0" class="bars">${categoryMetricBars(metrics)}</div><p data-review-slot="si1" class="panel-note">Une anomalie peut apparaître dans plusieurs catégories. Les réserves DQ n’excluent pas automatiquement l’anomalie du stock général.</p></article>
  </section>

  <article data-review-slot="si2" class="panel table-panel">
    <div data-review-slot="si3" class="panel-heading"><div data-review-slot="si4"><p data-review-slot="si5" class="eyebrow">Détail des objets</p><h2 data-review-slot="si6">Anomalies suivies</h2></div><span data-review-slot="si7" class="badge">${snapshot.normalizedData.anomalies.length} lignes</span></div>
    <div data-review-slot="si8" class="filter-bar"><input data-review-slot="si9" class="search" data-filter aria-label="Rechercher une anomalie" placeholder="Rechercher une anomalie, un composant, une catégorie..."><select data-review-slot="sia" data-filter-repository aria-label="Filtrer par repository"><option data-review-slot="sib" value="">Tous les repositories</option>${repositories.map((repository) => `<option data-review-slot="sic" value="${escapeHtml(repository)}">${escapeHtml(repository)}</option>`).join('')}</select><select data-review-slot="sid" data-filter-criticality aria-label="Filtrer par criticality"><option data-review-slot="sie" value="">Toutes les criticités</option><option data-review-slot="sif" value="blocking">Bloquante</option><option data-review-slot="sig" value="major">Majeure</option><option data-review-slot="sih" value="minor">Mineure</option><option data-review-slot="sii" value="unknown">Inconnue</option></select><select data-review-slot="sij" data-filter-category aria-label="Filtrer par category"><option data-review-slot="sik" value="">Toutes les catégories</option>${categories.map((category) => `<option data-review-slot="sil" value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('')}</select><select data-review-slot="sim" data-filter-status aria-label="Filtrer par status"><option data-review-slot="sin" value="">Tous les états</option><option data-review-slot="sio" value="open">Ouverte</option><option data-review-slot="sip" value="in_progress">En cours</option><option data-review-slot="siq" value="done">Terminée</option><option data-review-slot="sir" value="reopened">Rouverte</option><option data-review-slot="sis" value="cancelled">Annulée</option></select><button data-review-slot="sit" type="button" class="reset-button" data-reset-filters>Réinitialiser</button></div>
    <div data-review-slot="siu" class="table-wrap"><table data-review-slot="siv"><thead data-review-slot="siw"><tr data-review-slot="six"><th data-review-slot="siy">Anomalie</th><th data-review-slot="siz">Repository / composant</th><th data-review-slot="sj0">Criticité</th><th data-review-slot="sj1">Catégorie</th><th data-review-slot="sj2">Origine / audit</th><th data-review-slot="sj3">État</th><th data-review-slot="sj4">Créée</th><th data-review-slot="sj5">Correction métier</th><th data-review-slot="sj6">Délai</th><th data-review-slot="sj7">Disponibilité date</th><th data-review-slot="sj8">PR</th></tr></thead><tbody data-review-slot="sj9" data-table>${rows}</tbody></table></div>
  </article>

  <article data-review-slot="sja" class="panel" id="quality"><div data-review-slot="sjb" class="panel-heading"><div data-review-slot="sjc"><p data-review-slot="sjd" class="eyebrow">Qualité des données</p><h2 data-review-slot="sje">Alertes et décisions de calcul</h2></div><span data-review-slot="sjf" class="badge">${snapshot.dataQuality.issues.length} alertes</span></div><ul data-review-slot="sjg" class="issue-list">${issues || '<li data-review-slot="sjh"><div data-review-slot="sji"><strong data-review-slot="sjj">Aucune alerte</strong><p data-review-slot="sjk">Les métriques ne présentent aucune réserve DQ dans ce snapshot.</p></div></li>'}</ul></article>`;
}

/**
 * Réalise le traitement « flow metric panel » dans le pipeline de qualité.
 *
 * @param title - Valeur de « title » utilisée par ce traitement.
 * @param metric - Valeur de « metric » utilisée par ce traitement.
 * @param href - Valeur de « href » utilisée par ce traitement.
 * @param definition - Valeur de « definition » utilisée par ce traitement.
 * @returns Valeur textuelle produite.
 */
function flowMetricPanel(title: string, metric: Metric, href: string, definition: string): string {
  return `<a data-review-slot="sjl" data-review-key="${escapeHtml(metric.id)}" class="panel metric-explainer flow-panel" href="${href}"><div data-review-slot="sjm" class="panel-heading"><div data-review-slot="sjn"><p data-review-slot="sjo" class="eyebrow">État</p><h2 data-review-slot="sjp">${title}</h2></div><span data-review-slot="sjq" class="badge">${qualityLabel(metric.reliability.status)}</span></div><strong data-review-slot="sjr" class="metric-big">${formatMetricValue(metric)}</strong><p data-review-slot="sjs" class="metric-ratio">${ratioLabel(metric)}</p><p data-review-slot="sjt">${escapeHtml(definition)}</p></a>`;
}

/**
 * Attend days dans le contexte du pipeline de qualité.
 *
 * @param from - Valeur de « from » utilisée par ce traitement.
 * @param to - Valeur de « to » utilisée par ce traitement.
 * @returns Résultat du traitement.
 */
function delayDays(from: string, to: string): number {
  return (new Date(to).getTime() - new Date(from).getTime()) / 86_400_000;
}

/**
 * Formate date short dans le contexte du pipeline de qualité.
 *
 * @param value - Valeur de « value » utilisée par ce traitement.
 * @returns Valeur textuelle produite.
 */
function formatDateShort(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('fr-FR');
}

/** Vue exhaustive des issues, indépendamment de leur classification en anomalies. */
function issuesExplorerContent(snapshot: Snapshot): string {
  return `${teamActivityContent(snapshot)}<section data-review-slot="sju" class="issues-explorer" data-issues-explorer><h2 data-review-slot="sjv">Analyse des issues · activité Squad / PO / AM</h2>
    <div data-review-slot="sjw" class="issue-kpis" aria-live="polite">${[
      ['global', 'Issues · périmètre filtré', 'Done + Closed, dates réelles ou estimées'],
      ['done', 'Sans estimation', 'Dernière transition Done'],
      ['estimated', 'Estimations seules', 'Clôtures GitHub']
    ]
      .map(
        ([name, title, description]) =>
          `<article data-review-slot="sjx" data-review-key="${name}" class="issue-kpi"><span data-review-slot="sjy">${title}</span><div data-review-slot="sjz" class="issue-kpi-stats">${[
            ['average', 'Moyenne'],
            ['median', 'Médiane'],
            ['p90', 'P90']
          ]
            .map(
              ([stat, label]) =>
                `<div data-review-slot="sk0" data-review-key="${stat}"><small data-review-slot="sk1">${label}</small><strong data-review-slot="sk2" data-issue-kpi="${name}-${stat}">—</strong></div>`
            )
            .join(
              ''
            )}</div><small data-review-slot="sk3" data-issue-count="${name}">${description}</small></article>`
      )
      .join('')}</div>
    <section data-review-slot="sk4" class="panel issue-filters" aria-label="Filtres des issues"><div data-review-slot="sk5" class="panel-heading"><h2 data-review-slot="sk6">Filtres et recherche</h2><button data-review-slot="sk7" class="reset-button" type="button" data-issue-reset>Réinitialiser</button></div>
    <div data-review-slot="sk8" class="issue-filter-grid"><label data-review-slot="sk9">Recherche globale<input data-review-slot="ska" class="search" data-issue-search placeholder="Numéro, titre, label…"></label><label data-review-slot="skb">Repository<select data-review-slot="skc" data-issue-filter="repo"><option data-review-slot="skd" value="">Tous</option></select></label><label data-review-slot="ske">Label<select data-review-slot="skf" data-issue-filter="label"><option data-review-slot="skg" value="">Tous</option></select></label><label data-review-slot="skh">Issue type<select data-review-slot="ski" data-issue-filter="type"><option data-review-slot="skj" value="">Tous</option></select></label><label data-review-slot="skk">Famille métier<select data-review-slot="skl" data-issue-filter="family"><option data-review-slot="skm" value="">Toutes</option><option data-review-slot="skn" value="audit">Audit</option><option data-review-slot="sko" value="audit_anomaly">Anomalie d’audit</option><option data-review-slot="skp" value="anomaly">Défaut hors audit ou origine non résolue</option><option data-review-slot="skq" value="improvement">Improvement</option><option data-review-slot="skr" value="other">Autre issue / bug non qualifié</option></select></label><label data-review-slot="sks">Statut<select data-review-slot="skt" data-issue-filter="status"><option data-review-slot="sku" value="">Tous</option><option data-review-slot="skv" value="open">Ouvertes / en cours</option><option data-review-slot="skw" value="closed">Done ET Closed</option><option data-review-slot="skx" value="cancelled">Cancelled</option></select></label><label data-review-slot="sky">État GitHub<select data-review-slot="skz" data-issue-filter="githubState"><option data-review-slot="sl0" value="">Tous</option><option data-review-slot="sl1" value="OPEN">OPEN</option><option data-review-slot="sl2" value="CLOSED">CLOSED</option></select></label><label data-review-slot="sl3">Rattachement Project<select data-review-slot="sl4" data-issue-filter="project"><option data-review-slot="sl5" value="">Tous</option><option data-review-slot="sl6" value="none">Sans Project enregistré</option><option data-review-slot="sl7" value="missing-status">Avec Project, statut manquant</option><option data-review-slot="sl8" value="with-status">Avec Project et statut</option></select></label><label data-review-slot="sl9">Nature du bug<select data-review-slot="sla" data-issue-filter="kind"><option data-review-slot="slb" value="">Toutes</option><option data-review-slot="slc" value="accessibility">Accessibilité</option><option data-review-slot="sld" value="functional">Fonctionnel</option><option data-review-slot="sle" value="unknown">Nature non renseignée</option></select></label><label data-review-slot="slf">Vérifications<select data-review-slot="slg" data-issue-filter="review"><option data-review-slot="slh" value="">Toutes</option><option data-review-slot="sli" value="no-audit">Anomalies sans audit rattaché</option><option data-review-slot="slj" value="no-component">Anomalies sans composant</option><option data-review-slot="slk" value="audit-no-component">Audits sans composant</option><option data-review-slot="sll" value="advice">Avis auditeur demandé</option><option data-review-slot="slm" value="corrected">Corrections confirmées</option><option data-review-slot="sln" value="improvements">Améliorations proposées</option><option data-review-slot="slo" value="warnings">Signalements</option></select></label><label data-review-slot="slp">Tri<select data-review-slot="slq" data-issue-sort><option data-review-slot="slr" value="repo">Repository</option><option data-review-slot="sls" value="number">Numéro</option><option data-review-slot="slt" value="age">Ancienneté ouverte</option><option data-review-slot="slu" value="delay">Délai de traitement</option></select></label></div>
    <div data-review-slot="slv" class="issue-actions"><label data-review-slot="slw"><input data-review-slot="slx" type="checkbox" data-issue-components> Labels du composant uniquement</label><button data-review-slot="sly" class="reset-button" type="button" data-issue-dedupe aria-pressed="false">Dédoublonner par repo / issue</button><button data-review-slot="slz" class="reset-button" type="button" data-issue-clear-selection>Réinitialiser la sélection</button><button data-review-slot="sm0" class="reset-button" type="button" data-issue-export>Exporter CSV</button></div>
    <p data-review-slot="sm1">CSV : toutes les lignes filtrées, toutes pages. La sélection porte sur les issues distinctes de toutes les pages filtrées et sert aux KPI.</p>
    <p data-review-slot="sm2" class="muted" data-issue-summary></p></section>
    <article data-review-slot="sm3" class="panel table-panel"><div data-review-slot="sm4" class="panel-heading"><h2 data-review-slot="sm5">Issues GitHub · audits, anomalies et autres issues</h2><span data-review-slot="sm6" class="badge">Tri et recherche par colonne</span></div><div data-review-slot="sm7" class="table-wrap issue-table-wrap" tabindex="0" role="region" aria-label="Tableau défilant"><table data-review-slot="sm8" class="issue-table"><thead data-review-slot="sm9"><tr data-review-slot="sma"><th data-review-slot="smb"><input data-review-slot="smc" type="checkbox" data-issue-select-all aria-label="Sélectionner toutes les issues filtrées, toutes pages"></th>${['Repository', 'Issue', 'Label', 'Issue type', 'Statut', 'État GitHub', 'Nb PR', 'Délai issue', 'Ancienneté ouverte', 'Composants', 'Statut Project', 'Itération', 'Velocity source', 'Nature du bug', 'Correction / résolution', 'Version de correction', 'Signalements'].map((name, i) => `<th data-review-slot="smd" data-review-key="field:${i}"><button data-review-slot="sme" type="button" data-issue-column-sort="${i}" aria-label="Trier par ${name}">${name} ↕</button><input data-review-slot="smf" class="issue-column-filter" data-issue-column="${i}" aria-label="Filtrer ${name}" placeholder="Filtrer…"></th>`).join('')}</tr></thead><tbody data-review-slot="smg" data-issue-rows></tbody></table></div>${paginationContent('issues')}</article>
  </section>`;
}

/** Synthèse par composant : restitue les résultats d’audits par version cible sans inventer d’héritage. */
function componentsExplorerContent(capturedAt: string): string {
  return `<section data-review-slot="smh" class="issues-explorer" data-component-analysis>
    <section data-review-slot="smi" class="panel issue-filters" aria-label="Affiner les résultats"><div data-review-slot="smj" class="panel-heading"><h2 data-review-slot="smk">Affiner les résultats</h2><button data-review-slot="sml" type="button" class="reset-button" data-component-reset>Réinitialiser la vue</button></div><div data-review-slot="smm" class="issue-filter-grid"><label data-review-slot="smn">Recherche locale<input data-review-slot="smo" class="search" data-component-search placeholder="Composant, repository…"></label><label data-review-slot="smp">État de l'audit<select data-review-slot="smq" data-component-filter="auditStatus"><option data-review-slot="smr" value="">Tous</option></select></label><label data-review-slot="sms">Résultat de l’audit<select data-review-slot="smt" data-component-filter="conformity"><option data-review-slot="smu" value="">Tous</option></select></label><label data-review-slot="smv">Issues ouvertes<select data-review-slot="smw" data-component-filter="open"><option data-review-slot="smx" value="">Toutes</option><option data-review-slot="smy" value="yes">Avec issues ouvertes</option><option data-review-slot="smz" value="no">Sans issue ouverte</option></select></label></div><div data-review-slot="sn0" class="issue-actions"><button data-review-slot="sn1" class="reset-button" data-component-clear type="button">Réinitialiser la sélection</button><button data-review-slot="sn2" class="reset-button" data-component-export type="button">Exporter CSV</button></div><p data-review-slot="sn3" class="muted" role="status" aria-live="polite" data-component-summary data-filter-feedback></p></section>
    <article data-review-slot="sn4" class="panel table-panel"><div data-review-slot="sn5" class="panel-heading"><h2 data-review-slot="sn6">Composants par repository</h2><span data-review-slot="sn7" class="badge">Snapshot du ${escapeHtml(capturedAt?.slice(0, 10) ?? 'date indisponible')}</span></div><div data-review-slot="sn8" class="table-wrap issue-table-wrap"><table data-review-slot="sn9" class="issue-table"><thead data-review-slot="sna"><tr data-review-slot="snb"><th data-review-slot="snc"><input data-review-slot="snd" type="checkbox" data-component-all aria-label="Sélectionner les composants visibles"></th>${['Repository', 'Composant', 'Issues', 'Ouvertes', 'Traitées', 'Annulées', 'PR', 'Audits', 'Dernier audit', 'Résultat de l’audit · version cible', 'Plus ancienne ouverte', 'Ancienneté maximale', 'Délai moyen'].map((label, i) => `<th data-review-slot="sne" data-review-key="field:${i}"><button data-review-slot="snf" type="button" data-component-sort="${i}" aria-label="Trier par ${label}">${label} ↕</button><input data-review-slot="sng" class="issue-column-filter" data-component-column="${i}" aria-label="Filtrer ${label}" placeholder="Filtrer…"></th>`).join('')}</tr></thead><tbody data-review-slot="snh" data-component-rows></tbody></table></div></article>
    <details data-review-slot="sni" class="panel" data-component-statistics><summary data-review-slot="snj">Délais des issues du résultat ou de la sélection</summary><div data-review-slot="snk" class="issue-kpis" aria-live="polite">${[
      ['global', 'Global · Officiel'],
      ['done', 'Sans estimation'],
      ['estimated', 'Estimations seules']
    ]
      .map(
        ([key, title]) =>
          `<article data-review-slot="snl" data-review-key="${key}" class="issue-kpi"><span data-review-slot="snm">${title}</span><div data-review-slot="snn" class="issue-kpi-stats">${[
            ['average', 'Moyenne'],
            ['median', 'Médiane'],
            ['p90', 'P90']
          ]
            .map(
              ([stat, label]) =>
                `<div data-review-slot="sno" data-review-key="${stat}"><small data-review-slot="snp">${label}</small><strong data-review-slot="snq" data-component-kpi="${key}-${stat}">—</strong></div>`
            )
            .join(
              ''
            )}</div><small data-review-slot="snr" data-component-count="${key}">0 issue</small></article>`
      )
      .join('')}</div></details>
    <details data-review-slot="sns" class="panel" data-component-help><summary data-review-slot="snt">Comprendre les résultats et les liens GitHub</summary><p data-review-slot="snu">Les liens chiffrés ouvrent une recherche GitHub sur les données actuelles du repository. Recherches approchées : « Ouvertes » utilise l’état GitHub ; « Traitées » utilise Closed avec motif completed, sans vérifier Done dans Project ; « Annulées » utilise le motif not planned, distinct de Cancelled dans Project. Les PR sont recherchées par références d’issues dans leur description : les liens manuels seuls peuvent manquer. Les grandes listes de PR proposent plusieurs recherches courtes pour conserver toutes les références. Les compteurs restent ceux du snapshot. Le résultat affiché porte sur la version cible de l’audit, sans propagation aux autres versions. Un audit en cours n’a pas de résultat définitif. La publication de cette version reste distincte de sa milestone. Dernier audit et résultat ouvrent leur audit justificatif. Ce tableau regroupe les noms par repository ; les identités historiques distinctes et leurs présences sont consultables dans le <a data-review-slot="snv" href="audits.html#component-populations">détail des populations</a>.</p></details>
  </section>`;
}

/** Transforme une référence interne en lien GitHub lorsque l'URL est disponible. */
function githubReference(snapshot: Snapshot, reference: string, githubUrl?: string): string {
  const baseUrl = (githubUrl ?? 'https://github.com').replace(/\/+$/, '');
  for (const repository of snapshot.rawData.repositories) {
    const issue = repository.issues.find((candidate) => candidate.id === reference);
    if (issue)
      return `<a data-review-slot="snw" data-review-key="${escapeHtml(reference)}" class="text-link" href="${baseUrl}/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/issues/${issue.number}" target="_blank" rel="noopener noreferrer">${escapeHtml(reference)}</a>`;
    const pullRequest = repository.pullRequests.find((candidate) => candidate.id === reference);
    if (pullRequest)
      return `<a data-review-slot="snx" data-review-key="${escapeHtml(reference)}" class="text-link" href="${baseUrl}/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/pull/${pullRequest.number}" target="_blank" rel="noopener noreferrer">${escapeHtml(reference)}</a>`;
  }
  return escapeHtml(reference);
}

/** Construit un lien vers un repository ou retourne son nom si GitHub est absent. */
function repositoryReference(snapshot: Snapshot, repositoryName: string, githubUrl?: string): string {
  const repository = snapshot.rawData.repositories.find((candidate) => candidate.name === repositoryName);
  if (!repository) return escapeHtml(repositoryName);
  return `<a data-review-slot="sny" class="text-link" href="${(githubUrl ?? 'https://github.com').replace(/\/+$/, '')}/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}" target="_blank" rel="noopener noreferrer">${escapeHtml(repositoryName)}</a>`;
}

/** Ajoute à une alerte qualité la cible et sa source consultable. */
function qualityIssueTarget(
  snapshot: Snapshot,
  issue: Snapshot['dataQuality']['issues'][number],
  githubUrl?: string
): string {
  if (issue.entityType === 'anomaly') {
    const anomaly = snapshot.normalizedData.anomalies.find(
      (candidate) => candidate.anomalyId === issue.entityId
    );
    const source = anomaly?.provenance.sourceId;
    return `<div data-review-slot="snz" class="quality-target"><span data-review-slot="so0" class="quality-target-label">Cible : anomalie ${escapeHtml(issue.entityId)}</span>${source ? `<span data-review-slot="so1">Source : ${githubReference(snapshot, source, githubUrl)}</span>` : '<span data-review-slot="so2">Aucune source GitHub disponible</span>'}</div>`;
  }
  if (issue.entityType === 'component') {
    const component = snapshot.normalizedData.components.find(
      (candidate) => candidate.componentId === issue.entityId
    );
    const source = component?.provenance.sourceId;
    const copyButton =
      issue.ruleId === 'DQ-006' && component
        ? `<button data-review-slot="so3" type="button" class="text-link copy-button" data-copy-yaml="${encodeURIComponent(catalogueYaml(component))}">Copier le YAML</button><span data-review-slot="so4" class="copy-feedback" aria-live="polite"></span>`
        : '';
    return `<div data-review-slot="so5" class="quality-target"><span data-review-slot="so6" class="quality-target-label">Cible : composant ${escapeHtml(component?.name ?? issue.entityId)}</span>${source ? `<span data-review-slot="so7">Ouvrir la source : ${githubReference(snapshot, source, githubUrl)}</span>` : '<span data-review-slot="so8">Aucune source GitHub disponible</span>'}${copyButton}</div>`;
  }
  if (issue.entityType === 'pull_request') {
    return `<div data-review-slot="so9" class="quality-target"><span data-review-slot="soa" class="quality-target-label">Cible : pull request</span><span data-review-slot="sob">Ouvrir la source : ${githubReference(snapshot, issue.entityId, githubUrl)}</span></div>`;
  }
  return `<div data-review-slot="soc" class="quality-target"><span data-review-slot="sod" class="quality-target-label">Cible : ${escapeHtml(issue.entityType)}</span><span data-review-slot="soe">Aucune source GitHub disponible (${escapeHtml(issue.entityId)})</span></div>`;
}

/** Produit une entrée YAML prête à compléter et à coller dans le catalogue. */
function catalogueYaml(component: Component): string {
  const catalogueComponent = {
    name: component.name,
    stream: component.stream ?? 'TODO',
    owner: component.owner ?? 'TODO',
    squad: component.squad ?? 'TODO',
    status: component.status === 'active' ? 'stable' : component.status,
    rgaaLevel: component.rgaaLevel ?? 'TODO',
    ...(component.figmaUrl ? { figmaUrl: component.figmaUrl } : {}),
    ...(component.documentationUrl ? { documentationUrl: component.documentationUrl } : {}),
    tags: component.tags,
    ...(component.audit ? { audit: component.audit } : {})
  };
  const yaml = stringify(catalogueComponent, { lineWidth: 0 }).trimEnd();
  return `  - ${yaml.replace(/\n/g, '\n    ')}\n`;
}

/** Traduit un identifiant DQ en message lisible dans le dashboard. */
function qualityMessage(issue: Snapshot['dataQuality']['issues'][number]): string {
  return (
    {
      'DQ-001': 'L’anomalie n’a pas de criticité.',
      'DQ-002': 'L’anomalie possède plusieurs criticités incompatibles.',
      'DQ-003': 'L’anomalie possède plusieurs parents incompatibles.',
      'DQ-004': 'L’issue est terminée mais aucune pull request identifiable ne lui est associée.',
      'DQ-005': 'La pull request est fusionnée alors que l’issue associée est encore ouverte.',
      'DQ-006': 'Le composant détecté n’est pas présent dans le catalogue.',
      'DQ-007': 'L’issue contient un label inconnu.',
      'DQ-008': 'L’issue annulée est référencée par une pull request.',
      'DQ-009': 'Nexus est indisponible : les preuves de release sont inconnues.',
      'DQ-010': 'L’issue annulée est rattachée à une milestone.',
      'DQ-011':
        'L’Anomalie Done + Closed n’a pas de correctedAt déterminable à partir de l’historique Project.',
      'DQ-012': 'L’Audit Done + Closed n’a pas de completedAt déterminable à partir de l’historique Project.',
      'DQ-013': 'L’Anomalie est Done dans le Project alors que son Issue GitHub est encore ouverte.',
      'DQ-014': 'L’Audit est Done dans le Project alors que son Issue GitHub est encore ouverte.',
      'DQ-015': 'Le catalogue historique est absent au tag PROD exact de la Version.',
      'DQ-016': 'Le catalogue historique est invalide au tag PROD exact de la Version.',
      'DQ-017': 'Le type GitHub de l’Issue est absent.',
      'DQ-018': 'Le type GitHub de l’Issue n’est pas reconnu par la configuration.',
      'DQ-019': 'Le type GitHub de l’Issue correspond à plusieurs types canoniques.',
      'DQ-020': 'Le statut Project n’est pas reconnu par la configuration.',
      'DQ-021': 'Le statut Project correspond à plusieurs statuts canoniques.',
      'DQ-022': 'La Velocity Project n’est pas interprétable comme un nombre.',
      'DQ-023': 'L’Issue Audit ne possède aucun Component reconnu.',
      'DQ-024': 'L’Issue Audit possède plusieurs Components reconnus.',
      'DQ-025': 'La Version PROD cible de l’Audit est indéterminable.',
      'DQ-026': 'La relation attendue vers un Audit est invalide ou ambiguë.',
      'DQ-027': 'Le Component de l’Anomalie diffère de celui de son Audit.',
      'DQ-028': 'La Feature ne possède pas exactement un Audit parent valide.',
      'DQ-029': 'Une relation du modèle normalisé est orpheline.'
    }[issue.ruleId] ?? issue.message
  );
}

/** Construit la cartographie, y compris les composants observés dont le cycle de vie reste inconnu. */
function graphContent(snapshot: Snapshot, githubUrl?: string): string {
  const { metrics } = snapshot.analytics;
  const libraries = snapshot.normalizedData.libraries;
  const componentsByLibrary = new Map<string, Component[]>();
  for (const component of snapshot.normalizedData.components.filter(
    (item) => item.status === 'active' || item.status === 'unknown'
  )) {
    const list = componentsByLibrary.get(component.libraryId) ?? [];
    list.push(component);
    componentsByLibrary.set(component.libraryId, list);
  }
  const auditsByComponent = new Map<string, Snapshot['normalizedData']['audits']>();
  for (const audit of snapshot.normalizedData.audits) {
    const list = auditsByComponent.get(audit.componentId) ?? [];
    list.push(audit);
    auditsByComponent.set(audit.componentId, list);
  }
  // Une issue non classée comme anomalie doit rester visible dans la cartographie.
  const issuesByComponent = new Map<string, NonNullable<Snapshot['normalizedData']['issues']>>();
  for (const issue of snapshot.normalizedData.issues ?? []) {
    for (const componentId of new Set(issue.componentIds)) {
      const items = issuesByComponent.get(componentId) ?? [];
      items.push(issue);
      issuesByComponent.set(componentId, items);
    }
  }
  const anomaliesByComponent = new Map<string, Snapshot['normalizedData']['anomalies']>();
  for (const anomaly of snapshot.normalizedData.anomalies) {
    const source = snapshot.normalizedData.issues?.find((issue) => issue.issueId === anomaly.issueId);
    const componentIds = source?.review
      ? source.componentIds
      : anomaly.componentId
        ? [anomaly.componentId]
        : [];
    for (const id of new Set(componentIds)) {
      const list = anomaliesByComponent.get(id) ?? [];
      list.push(anomaly);
      anomaliesByComponent.set(id, list);
    }
  }

  const repositoriesMetric = metricOrUnknown(metrics, 'portfolio.repositories');
  const componentsMetric = metricOrUnknown(metrics, 'portfolio.components');
  const auditedMetric = metricOrUnknown(metrics, 'portfolio.componentsAudited');
  const openMetric = metricOrUnknown(metrics, 'anomaly.open');

  const repositorySections = libraries
    .map((library) => {
      const components = (componentsByLibrary.get(library.libraryId) ?? []).sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      const componentSections = components
        .map((component) => {
          const audits = (auditsByComponent.get(component.componentId) ?? []).sort(
            (a, b) => Date.parse(b.provenance.collectedAt) - Date.parse(a.provenance.collectedAt)
          );
          const audit =
            latestCompletedAudit(audits, snapshot.normalizedData.issues ?? []) ??
            audits.find((candidate) => !isCompletedAudit(candidate, snapshot.normalizedData.issues ?? []));
          const anomalies = anomaliesByComponent.get(component.componentId) ?? [];
          const componentIssues = issuesByComponent.get(component.componentId) ?? [];
          const issueNodes = componentIssues
            .map((issue) => {
              const href = /^https:\/\/[^\s]+$/.test(issue.url) ? issue.url : '';
              const tag = href ? 'a' : 'div';
              return `<${tag} data-review-slot="graph-issue-node" class="map-node issue-node" data-map-node data-map-kind="issue" ${contextAttribute(issueFacts(snapshot).find((fact) => fact.id === issue.issueId))}${href ? ` href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer"` : ''}><span data-review-slot="sof" class="node-dot"></span><div data-review-slot="sog"><strong data-review-slot="soh">#${issue.number} · ${escapeHtml(issue.title)}</strong><small data-review-slot="soi">${escapeHtml(issue.rawIssueType ?? issue.issueType ?? 'Type inconnu')} · ${escapeHtml(issue.state)}</small></div></${tag}>`;
            })
            .join('');
          const open = anomalies.filter((item) =>
            ['open', 'reopened', 'in_progress'].includes(item.status)
          ).length;
          const auditNode = audit
            ? `<div data-review-slot="soj" class="map-node audit-node" data-map-node data-map-kind="audit" ${contextAttribute(issueFacts(snapshot).find((fact) => fact.id === audit?.issueId))}><span data-review-slot="sok" class="node-dot"></span><div data-review-slot="sol"><strong data-review-slot="som">Audit ${escapeHtml(audit.version)}</strong><small data-review-slot="son">${isCompletedAudit(audit, snapshot.normalizedData.issues ?? []) ? auditStatusLabel(audit.objectiveAuditResult) : auditStatusLabel(audit.status)} · ${escapeHtml(audit.status)}</small></div><span data-review-slot="soo" class="state state-${isCompletedAudit(audit, snapshot.normalizedData.issues ?? []) ? audit.objectiveAuditResult : audit.status}">${auditStatusLabel(isCompletedAudit(audit, snapshot.normalizedData.issues ?? []) ? audit.objectiveAuditResult : audit.status)}</span></div>`
            : `<div data-review-slot="sop" class="map-node audit-node muted-node" data-map-node data-map-kind="audit"><span data-review-slot="soq" class="node-dot"></span><div data-review-slot="sor"><strong data-review-slot="sos">Audit</strong><small data-review-slot="sot">Aucun audit disponible</small></div><span data-review-slot="sou" class="state state-unknown">non audité</span></div>`;
          const anomalyNodes = anomalies
            .map((anomaly) => {
              const issueLabel = anomaly.provenance.sourceId ?? anomaly.anomalyId;
              const prs = anomaly.pullRequestRefs
                .map((reference) => {
                  const href = githubReferenceHref(snapshot, reference, githubUrl);
                  const tag = href ? 'a' : 'div';
                  return `<${tag} data-review-slot="graph-pr-node" data-review-key="${escapeHtml(reference)}" class="map-node pr-node" data-map-node data-map-kind="pr"${href ? ` href="${escapeHtml(href)}"` : ''}><span data-review-slot="sov" class="node-dot"></span><div data-review-slot="sow"><strong data-review-slot="sox">${escapeHtml(reference)}</strong><small data-review-slot="soy">PR liée à ${escapeHtml(issueLabel)}</small></div><span data-review-slot="soz" class="state state-merged">PR</span></${tag}>`;
                })
                .join('');
              return `<div data-review-slot="sp0" data-review-key="${escapeHtml(anomaly.anomalyId)}" class="map-branch"><a data-review-slot="sp1" class="map-node anomaly-node" data-map-node data-map-kind="anomaly" ${contextAttribute(issueFacts(snapshot).find((fact) => fact.id === anomaly.issueId))} href="anomalies.html?anomaly=${encodeURIComponent(anomaly.anomalyId)}"><span data-review-slot="sp2" class="node-dot"></span><div data-review-slot="sp3"><strong data-review-slot="sp4">${escapeHtml(issueLabel)}</strong><small data-review-slot="sp5">Anomalie · ${anomaly.cancelled ? 'annulée' : anomalyStatusLabel(anomaly.status)} · ${criticalityLabel(anomaly.criticality)}</small></div><span data-review-slot="sp6" class="state state-${anomaly.cancelled ? 'cancelled' : anomaly.status}">${anomaly.cancelled ? 'annulée' : anomalyStatusLabel(anomaly.status)}</span></a>${prs ? `<div data-review-slot="sp7" class="map-edge">PR</div>${prs}` : '<div data-review-slot="sp8" class="map-edge muted">aucune PR liée</div>'}</div>`;
            })
            .join('');
          return `<div data-review-slot="sp9" class="map-component" data-map-component data-component="${escapeHtml(component.name)}" data-component-id="${escapeHtml(component.componentId)}" data-search="${escapeHtml(`${library.name} ${component.name} ${component.componentId}`.toLowerCase())}">
        <div data-review-slot="spa" class="map-node component-node" data-map-node data-map-kind="component" ${contextAttribute({ repository: library.repository, components: [component.name], componentIds: [component.componentId], versions: (snapshot.normalizedData.componentVersions ?? []).filter((relation) => relation.componentId === component.componentId).map((relation) => snapshot.normalizedData.versions?.find((version) => version.versionId === relation.versionId)?.number) })}><span data-review-slot="spb" class="node-dot"></span><div data-review-slot="spc"><strong data-review-slot="spd">${escapeHtml(component.name)}</strong><small data-review-slot="spe">Composant · ${escapeHtml(component.componentId)}</small></div><span data-review-slot="spf" class="tag tag-${component.dataQualityStatus}">${qualityLabel(component.dataQualityStatus)}</span></div>
        <div data-review-slot="spg" class="map-edge">Audit</div>${auditNode}
        <div data-review-slot="sph" class="map-edge">${componentIssues.length} issue${componentIssues.length > 1 ? 's' : ''} (tous types)</div>
        <div data-review-slot="spi" class="map-issues">${issueNodes || '<p data-review-slot="spj" class="muted map-empty">Aucune issue associée.</p>'}</div>
        <div data-review-slot="spk" class="map-edge">Anomalies du composant, liens d’audit explicites dans la table · ${anomalies.length} anomalie${anomalies.length > 1 ? 's' : ''} · ${open} ouverte${open > 1 ? 's' : ''}</div>
        <div data-review-slot="spl" class="map-anomalies">${anomalyNodes || '<p data-review-slot="spm" class="muted map-empty">Aucune anomalie associée au composant ; aucun rattachement automatique à l’audit.</p>'}</div>
      </div>`;
        })
        .join('');
      return `<section data-review-slot="spn" class="map-repository" data-map-repository data-repository="${escapeHtml(library.repository)}" data-search="${escapeHtml(`${library.name} ${library.repository}`.toLowerCase())}">
      <div data-review-slot="spo" class="map-node repository-node" data-map-node data-map-kind="repository" ${contextAttribute({ repository: library.repository })}><span data-review-slot="spp" class="node-dot"></span><div data-review-slot="spq"><strong data-review-slot="spr">${repositoryReference(snapshot, library.name, githubUrl)}</strong><small data-review-slot="sps">${escapeHtml(library.repository)} · ${components.length} composant${components.length > 1 ? 's' : ''}</small></div><span data-review-slot="spt" class="tag tag-${library.dataQualityStatus}">${qualityLabel(library.dataQualityStatus)}</span></div>
      <div data-review-slot="spu" class="map-edge">Contient</div>
      <div data-review-slot="spv" class="map-components">${componentSections || '<p data-review-slot="spw" class="muted map-empty">Aucun composant actif.</p>'}</div>
    </section>`;
    })
    .join('');

  return `<section data-review-slot="spx" class="hero-band synthesis-hero">
    <div data-review-slot="spy"><p data-review-slot="spz" class="eyebrow">Chaîne de traçabilité</p><h2 data-review-slot="sq0">Repository → composant → issues / audit → anomalie → PR</h2><p data-review-slot="sq1">Les issues de tous types sont représentées ; les anomalies restent une vue spécialisée. Chaque relation est issue du snapshot courant. Un composant non audité reste visible et une anomalie sans PR n’est pas interprétée comme corrigée.</p></div>
    <div data-review-slot="sq2" class="hero-facts"><div data-review-slot="sq3"><strong data-review-slot="sq4">${formatMetricValue(repositoriesMetric)}</strong><span data-review-slot="sq5">repositories</span></div><div data-review-slot="sq6"><strong data-review-slot="sq7">${formatMetricValue(componentsMetric)}</strong><span data-review-slot="sq8">composants actifs</span></div><div data-review-slot="sq9"><strong data-review-slot="sqa">${formatMetricValue(openMetric)}</strong><span data-review-slot="sqb">anomalies ouvertes</span></div></div>
  </section>
  <section data-review-slot="sqc" class="section-heading"><div data-review-slot="sqd"><p data-review-slot="sqe" class="eyebrow">Lecture</p><h2 data-review-slot="sqf">Cartographie exploitable</h2></div><span data-review-slot="sqg" class="badge">${formatMetricValue(auditedMetric)} composants audités</span></section>
  <section data-review-slot="sqh" class="panel graph-toolbar"><input data-review-slot="sqi" class="search" data-map-filter aria-label="Rechercher dans la cartographie" placeholder="Rechercher un repository, composant, audit, anomalie ou PR"><select data-review-slot="sqj" data-map-kind-filter aria-label="Niveau de la cartographie"><option data-review-slot="sqk" value="">Tous les niveaux</option><option data-review-slot="sql" value="repository">Repositories</option><option data-review-slot="sqm" value="component">Composants</option><option data-review-slot="sqn" value="audit">Audits</option><option data-review-slot="sqo" value="issue">Issues (tous types)</option><option data-review-slot="sqp" value="anomaly">Anomalies</option><option data-review-slot="sqq" value="pr">Pull requests</option></select><button data-review-slot="sqr" type="button" class="reset-button" data-map-reset>Réinitialiser</button></section>
  <section data-review-slot="sqs" class="map-legend"><span data-review-slot="sqt" class="legend-repository">Repository</span><span data-review-slot="squ" class="legend-component">Composant</span><span data-review-slot="sqv" class="legend-audit">Audit</span><span data-review-slot="sqw">Issue</span><span data-review-slot="sqx" class="legend-anomaly">Anomalie</span><span data-review-slot="sqy" class="legend-pr">PR</span></section>
  <article data-review-slot="sqz" class="panel table-panel"><div data-review-slot="sr0" class="panel-heading"><div data-review-slot="sr1"><p data-review-slot="sr2" class="eyebrow">Relations du snapshot</p><h2 data-review-slot="sr3">Patrimoine et chaîne de preuve</h2></div><span data-review-slot="sr4" class="badge">${snapshot.normalizedData.anomalies.length} anomalies</span></div><div data-review-slot="sr5" class="map-canvas">${repositorySections || '<p data-review-slot="sr6" class="muted">Aucune relation disponible.</p>'}</div></article>
  <article data-review-slot="sr7" class="panel table-panel" id="map-quality"><div data-review-slot="sr8" class="panel-heading"><div data-review-slot="sr9"><p data-review-slot="sra" class="eyebrow">Qualité des données</p><h2 data-review-slot="srb">Réserves susceptibles d’affecter la cartographie</h2></div><span data-review-slot="src" class="badge">${snapshot.dataQuality.issues.length} alertes</span></div><ul data-review-slot="srd" class="issue-list">${snapshot.dataQuality.issues.map((issue) => `<li data-review-slot="sre" data-review-key="${escapeHtml(issue.id)}"><div data-review-slot="srf"><strong data-review-slot="srg">${escapeHtml(issue.ruleId)} · ${escapeHtml(issue.message)}</strong><p data-review-slot="srh">${escapeHtml(issue.entityType)} · ${escapeHtml(issue.entityId)}</p></div><span data-review-slot="sri" class="tag tag-${issue.severity === 'ERROR' ? 'error' : 'warning'}">${severityLabel(issue.severity)}</span></li>`).join('') || '<li data-review-slot="srj"><div data-review-slot="srk"><strong data-review-slot="srl">Aucune alerte</strong><p data-review-slot="srm">La cartographie ne présente aucune réserve DQ.</p></div></li>'}</ul></article>`;
}

/**
 * Résout une PR observée vers son endpoint web configuré, sans lien de substitution.
 *
 * @param snapshot - Valeur de « snapshot » utilisée par ce traitement.
 * @param reference - Valeur de « reference » utilisée par ce traitement.
 * @param githubUrl - Valeur de « githubUrl » utilisée par ce traitement.
 * @returns URL de la PR, ou chaîne vide si la référence ou l’endpoint est indisponible.
 */
function githubReferenceHref(snapshot: Snapshot, reference: string, githubUrl?: string): string {
  if (!githubUrl) return '';
  const baseUrl = githubUrl.replace(/\/+$/, '');
  if (!/^https:\/\/[^\s]+$/.test(baseUrl)) return '';
  for (const repository of snapshot.rawData.repositories) {
    const pullRequest = repository.pullRequests.find((candidate) => candidate.id === reference);
    if (pullRequest)
      return `${baseUrl}/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/pull/${pullRequest.number}`;
  }
  return '';
}

/** Construit la page listant les composants, audits et statuts de fiabilité. */
function auditsContent(snapshot: Snapshot, githubUrl?: string): string {
  const { metrics } = snapshot.analytics;
  const libraries = snapshot.normalizedData.libraries;
  const activeComponents = snapshot.normalizedData.components.filter(
    (component) => component.status === 'active'
  );
  const completedAudits = snapshot.normalizedData.audits.filter((audit) =>
    isCompletedAudit(audit, snapshot.normalizedData.issues ?? [])
  );
  const ongoingAudits = snapshot.normalizedData.audits.filter((audit) => audit.status === 'in_progress');
  const completedByComponent = new Map<string, (typeof completedAudits)[number]>();
  for (const component of activeComponents) {
    const latest = latestCompletedAudit(
      completedAudits.filter((audit) => audit.componentId === component.componentId)
    );
    if (latest) completedByComponent.set(component.componentId, latest);
  }
  const anomaliesByComponent = new Map<string, typeof snapshot.normalizedData.anomalies>();
  for (const anomaly of snapshot.normalizedData.anomalies) {
    const source = snapshot.normalizedData.issues?.find((issue) => issue.issueId === anomaly.issueId);
    const componentIds = source?.review
      ? source.componentIds
      : anomaly.componentId
        ? [anomaly.componentId]
        : [];
    for (const id of new Set(componentIds)) {
      const list = anomaliesByComponent.get(id) ?? [];
      list.push(anomaly);
      anomaliesByComponent.set(id, list);
    }
  }

  const coverage = preferredMetric(metrics, 'componentVersion.auditCoverage', 'portfolio.auditCoverage');
  const componentsMetric = metricOrUnknown(metrics, 'portfolio.components');
  const componentVersionsMetric = metricOrUnknown(metrics, 'componentVersion.total');
  const auditedMetric = preferredMetric(metrics, 'componentVersion.covered', 'portfolio.componentsAudited');
  const completedMetric = metricOrUnknown(metrics, 'audit.completed');
  const conformity = preferredMetric(metrics, 'componentVersion.conformityRate', 'audit.conformityRate');
  const conform = metricOrUnknown(metrics, 'audit.conform');
  const conformCouples = metricOrUnknown(metrics, 'componentVersion.conform');
  const conditional = metricOrUnknown(metrics, 'audit.conditional');
  const nonConform = metricOrUnknown(metrics, 'audit.nonConform');
  const critical = metricOrUnknown(metrics, 'audit.critical');

  const componentRows = activeComponents
    .map((component) => {
      const library = libraries.find((item) => item.libraryId === component.libraryId);
      const audit =
        completedByComponent.get(component.componentId) ??
        snapshot.normalizedData.audits.find(
          (item) =>
            item.componentId === component.componentId &&
            !isCompletedAudit(item, snapshot.normalizedData.issues ?? [])
        );
      const anomalies = anomaliesByComponent.get(component.componentId) ?? [];
      return componentAuditRow(
        snapshot,
        component,
        library?.name ?? 'repository inconnu',
        audit,
        anomalies,
        githubUrl
      );
    })
    .join('');

  const auditViews = new Map(auditReadModel(snapshot).map((view) => [view.auditId, view]));
  const auditRows = snapshot.normalizedData.audits
    .map((audit) => {
      const component = snapshot.normalizedData.components.find(
        (item) => item.componentId === audit.componentId
      );
      const library = libraries.find((item) => item.libraryId === audit.libraryId);
      const relations = anomaliesForAudit(
        audit,
        snapshot.normalizedData.anomalies,
        snapshot.normalizedData.issues ?? []
      );
      const view = auditViews.get(audit.auditId);
      const anomalies = relations.linked;
      return `<tr data-review-slot="srn" data-review-key="${escapeHtml(audit.auditId)}" data-audit-row ${contextAttribute(issueFacts(snapshot).find((fact) => fact.id === audit.issueId))} data-audit-result="${view?.verdict ?? ''}" data-audit-status="${audit.status}" data-progress="${view?.progress ?? audit.lifecycle ?? 'pending'}" data-audit-version="${escapeHtml(auditVersionLabel(audit, snapshot))}"><td data-review-slot="sro">${repositoryReference(snapshot, library?.name ?? 'repository inconnu', githubUrl)}</td><td data-review-slot="srp"><strong data-review-slot="srq">${escapeHtml(component?.name ?? audit.componentId)}</strong><small data-review-slot="srr">${escapeHtml(audit.sourceIssueId)}</small></td><td data-review-slot="srs"><span data-review-slot="srt" class="state state-${audit.status}">${auditStatusLabel(audit.status)}</span></td><td data-review-slot="sru">${escapeHtml(auditVersionLabel(audit, snapshot))}<small data-review-slot="srv">RC effectivement auditée : ${escapeHtml(audit.auditedReleaseCandidate ?? 'non déterminée / audit PROD selon la source')}</small></td><td data-review-slot="srw">${anomalies.length}${relations.unresolved.length ? `<small data-review-slot="srx">${relations.unresolved.length} non attribuée(s) à cet audit</small>` : ''}</td><td data-review-slot="sry">${anomalies.filter((item) => ['open', 'reopened', 'in_progress'].includes(item.status)).length}</td><td data-review-slot="srz">${qualityLabel(audit.dataQualityStatus)}${view && !view.versionKnown ? '<small data-review-slot="ss0">Version canonique non reliée</small>' : ''}</td></tr>`;
    })
    .join('');

  const campaignRows = (snapshot.analytics.auditCampaigns ?? [])
    .map((row) => {
      const library = libraries.find((item) => item.libraryId === row.libraryId);
      const other =
        'Conditionnels : ' +
        row.results.conditional +
        ' ; critiques : ' +
        row.results.critical +
        ' ; indéterminés : ' +
        row.results.unknown;
      return (
        '<tr data-review-slot="ss1" data-review-key="' +
        escapeHtml(JSON.stringify([row.libraryId, row.version])) +
        '" data-audit-campaign><td data-review-slot="ss2">' +
        repositoryReference(snapshot, library?.name ?? row.libraryId, githubUrl) +
        '</td><td data-review-slot="ss3">' +
        escapeHtml(row.version) +
        '<small data-review-slot="ss4">' +
        (row.publication === 'prod' ? 'PROD' : 'publication non prouvée') +
        '</small></td>' +
        [
          row.components,
          row.audits,
          row.progress.completed,
          row.progress.ongoing,
          row.progress.pending,
          row.progress.cancelled,
          row.results.conform,
          row.results.non_conform
        ]
          .map(
            (value, field) => '<td data-review-slot="ss5" data-review-key="' + field + '">' + value + '</td>'
          )
          .join('') +
        '<td data-review-slot="ss6">' +
        other +
        '</td><td data-review-slot="ss7">' +
        row.anomalies +
        '</td><td data-review-slot="ss8">' +
        (row.openAnomalies === 'unknown' ? 'Indéterminé' : row.openAnomalies) +
        '</td><td data-review-slot="ss9">' +
        row.improvements +
        '</td><td data-review-slot="ssa">' +
        qualityLabel(row.quality) +
        '</td></tr>'
      );
    })
    .join('');

  const componentVersionRows = [...(snapshot.normalizedData.componentVersions ?? [])]
    .sort(
      (left, right) =>
        left.versionId.localeCompare(right.versionId) || left.componentId.localeCompare(right.componentId)
    )
    .map((relation) => {
      const component = snapshot.normalizedData.components.find(
        (item) => item.componentId === relation.componentId
      );
      const version = (snapshot.normalizedData.versions ?? []).find(
        (item) => item.versionId === relation.versionId
      );
      const library = libraries.find(
        (item) => item.libraryId === (version?.libraryId ?? component?.libraryId)
      );
      const verdict = relation.verdict;
      const auditIds = relation.applicableAuditIds ?? [];
      return `<tr data-review-slot="ssb" ${contextAttribute({ repository: library?.repository, components: [component?.name], componentIds: [relation.componentId], versions: [version?.number], versionIds: [relation.versionId], auditIds: relation.applicableAuditIds ?? [] })} data-component-version-row data-component="${escapeHtml(component?.name ?? relation.componentId)}" data-version="${escapeHtml(version?.number ?? relation.versionId)}" data-repository="${escapeHtml(library?.repository ?? '')}" data-verdict="${verdict ?? 'unknown'}"><td data-review-slot="ssc">${repositoryReference(snapshot, library?.name ?? 'repository inconnu', githubUrl)}</td><td data-review-slot="ssd"><strong data-review-slot="sse">${escapeHtml(component?.name ?? relation.componentId)}</strong><small data-review-slot="ssf">${escapeHtml(relation.componentId)}</small></td><td data-review-slot="ssg">${escapeHtml(version?.number ?? relation.versionId)}</td><td data-review-slot="ssh"><span data-review-slot="ssi" class="state state-${verdict?.toLowerCase().replace('_', '-') ?? 'unknown'}">${verdict ? componentVersionVerdictLabel(verdict) : 'indéterminé'}</span></td><td data-review-slot="ssj">${auditIds.length ? auditIds.map((id) => `<a data-review-slot="ssk" data-review-key="${escapeHtml(id)}" href="audits.html?audit=${encodeURIComponent(id)}">${escapeHtml(id)}</a>${snapshot.normalizedData.audits.find((audit) => audit.auditId === id)?.versionId !== relation.versionId ? ' <span data-review-slot="ssl" class="tag">hérité</span>' : ' <span data-review-slot="ssm" class="tag">direct</span>'}`).join('<br data-review-slot="ssn">') : '—'}</td><td data-review-slot="sso"><span data-review-slot="ssp" class="tag tag-${relation.dataQualityStatus}">${qualityLabel(relation.dataQualityStatus)}</span></td></tr>`;
    })
    .join('');

  return `<section data-review-slot="ssq" class="hero-band synthesis-hero">
    <div data-review-slot="ssr"><p data-review-slot="sss" class="eyebrow">Périmètre auditable</p><h2 data-review-slot="sst">${formatMetricValue(componentVersionsMetric)} couples Component × Version historisés</h2><p data-review-slot="ssu">Le verdict est celui calculé par Analytics V2 à partir des Audits terminés applicables. NON_COUVERT reste distinct de NON_CONFORME.</p></div>
    <div data-review-slot="ssv" class="hero-facts"><div data-review-slot="ssw"><strong data-review-slot="ssx">${formatMetricValue(auditedMetric)}</strong><span data-review-slot="ssy">Component × Version couverts</span></div><div data-review-slot="ssz"><strong data-review-slot="st0">${formatMetricValue(coverage)}%</strong><span data-review-slot="st1">couverture</span></div><div data-review-slot="st2"><strong data-review-slot="st3">${formatMetricValue(conformity)}%</strong><span data-review-slot="st4">conformité des couples couverts</span></div></div>
  </section>

  <section data-review-slot="st5" class="section-heading"><div data-review-slot="st6"><p data-review-slot="st7" class="eyebrow">Indicateurs</p><h2 data-review-slot="st8">Couverture et résultats</h2></div><span data-review-slot="st9" class="badge">${qualityLabel(coverage.reliability.status)}</span></section>
  <section data-review-slot="sta" class="kpi-grid synthesis-grid">
    ${metricCard('Composants actifs', componentsMetric, denominatorLabel(componentsMetric), 'audits.html')}
    ${metricCard('Component × Version', componentVersionsMetric, denominatorLabel(componentVersionsMetric), 'audits.html#component-versions')}
    ${metricCard('Couverture Component × Version', coverage, ratioLabel(coverage), 'audits.html#component-versions')}
    ${metricCard('Audits terminés', completedMetric, denominatorLabel(completedMetric), 'audits.html?progress=completed')}
    <article data-review-slot="stb" class="kpi-card"><span data-review-slot="stc" class="kpi-label">Audits en cours</span><strong data-review-slot="std">${formatMetricValue(metricOrUnknown(metrics, 'audit.ongoing'))}</strong><span data-review-slot="ste" class="kpi-definition">Statut métier in_progress, toutes versions</span></article>
    <article data-review-slot="stf" class="kpi-card"><span data-review-slot="stg" class="kpi-label">Audits non évalués</span><strong data-review-slot="sth">${formatMetricValue(metricOrUnknown(metrics, 'audit.pending'))}</strong><span data-review-slot="sti" class="kpi-definition">Sans résultat de conformité</span></article>
    ${metricCard('Couples conformes', conformCouples, ratioLabel(conformCouples), 'audits.html#component-versions')}
    ${metricCard('Audits annulés', metricOrUnknown(metrics, 'audit.cancelled'), 'Annulation, aucun verdict', 'audits.html?progress=cancelled')}
    ${metricCard('Conformité Component × Version', conformity, ratioLabel(conformity), 'audits.html#component-versions')}
  </section>

  <section data-review-slot="stj" class="content-grid synthesis-two">
    <article data-review-slot="stk" class="panel"><div data-review-slot="stl" class="panel-heading"><div data-review-slot="stm"><p data-review-slot="stn" class="eyebrow">Résultats</p><h2 data-review-slot="sto">État des audits terminés</h2></div><span data-review-slot="stp" class="badge">${formatMetricValue(completedMetric)} terminés</span></div><div data-review-slot="stq" class="bars">${linkedBar('conformes', conform.value, 'audits.html?result=conform', 'conform')}${linkedBar('conditionnels', conditional.value, 'audits.html?result=conditional', 'conditional')}${linkedBar('non conformes', nonConform.value, 'audits.html?result=non_conform', 'non_conform')}${linkedBar('critiques', critical.value, 'audits.html?result=critical', 'critical')}</div><p data-review-slot="str" class="panel-note">Les résultats portent uniquement sur les audits terminés ; la couverture du patrimoine est présentée séparément.</p></article>
    <article data-review-slot="sts" class="panel"><div data-review-slot="stt" class="panel-heading"><div data-review-slot="stu"><p data-review-slot="stv" class="eyebrow">Lecture d’un composant</p><h2 data-review-slot="stw">Composant → audit → anomalies</h2></div><span data-review-slot="stx" class="badge">traçabilité</span></div><p data-review-slot="sty" class="panel-note">Chaque ligne ci-dessous relie le composant à son audit et aux anomalies qui lui sont rattachées. Les anomalies restent visibles même lorsqu’elles ont une réserve de qualité.</p><div data-review-slot="stz" class="chain-legend"><span data-review-slot="su0">Composant</span><span data-review-slot="su1">Audit</span><span data-review-slot="su2">Anomalies</span></div></article>
  </section>

  <article data-review-slot="su3" class="panel table-panel"><div data-review-slot="su4" class="panel-heading"><div data-review-slot="su5"><p data-review-slot="su6" class="eyebrow">Patrimoine actif</p><h2 data-review-slot="su7">Composant → audit → anomalies</h2></div><span data-review-slot="su8" class="badge">${activeComponents.length} composants actifs</span></div><div data-review-slot="su9" class="filter-bar"><input data-review-slot="sua" class="search" data-component-filter aria-label="Rechercher un composant" placeholder="Rechercher un composant, repository ou anomalie..."><select data-review-slot="sub" data-component-result aria-label="Résultat du composant"><option data-review-slot="suc" value="">Tous les résultats</option><option data-review-slot="sud" value="audited">Audité</option><option data-review-slot="sue" value="not_audited">Non audité</option><option data-review-slot="suf" value="conform">Conforme</option><option data-review-slot="sug" value="conditional">Conditionnel</option><option data-review-slot="suh" value="non_conform">Non conforme</option><option data-review-slot="sui" value="critical">Critique</option></select><button data-review-slot="suj" type="button" class="reset-button" data-reset-component-filters>Réinitialiser</button></div><div data-review-slot="suk" class="table-wrap"><table data-review-slot="sul"><thead data-review-slot="sum"><tr data-review-slot="sun"><th data-review-slot="suo">Repository</th><th data-review-slot="sup">Composant</th><th data-review-slot="suq">Audit</th><th data-review-slot="sur">Résultat</th><th data-review-slot="sus">Anomalies</th><th data-review-slot="sut">Ouvertes / en cours</th><th data-review-slot="suu">Qualité</th></tr></thead><tbody data-review-slot="suv" data-component-table>${componentRows}</tbody></table></div></article>

  <article data-review-slot="suw" class="panel table-panel" id="component-versions"><div data-review-slot="sux" class="panel-heading"><div data-review-slot="suy"><p data-review-slot="suz" class="eyebrow">Historique du catalogue</p><h2 data-review-slot="sv0">Verdict par Component × Version</h2></div><span data-review-slot="sv1" class="badge">${snapshot.normalizedData.componentVersions?.length ?? 0} relations</span></div><p data-review-slot="sv2" class="panel-note">Cette vue restitue le verdict Analytics V2 sans le recalculer dans le dashboard. Les Audits applicables sont ceux retenus par D-220 à D-228.</p><div data-review-slot="sv3" class="filter-bar"><select data-review-slot="sv4" data-component-version-verdict aria-label="Verdict composant par version"><option data-review-slot="sv5" value="">Tous les verdicts</option><option data-review-slot="sv6" value="CONFORME">Conforme</option><option data-review-slot="sv7" value="NON_CONFORME">Non conforme</option><option data-review-slot="sv8" value="NON_COUVERT">Non couvert</option></select></div><div data-review-slot="sv9" class="table-wrap"><table data-review-slot="sva"><thead data-review-slot="svb"><tr data-review-slot="svc"><th data-review-slot="svd">Repository</th><th data-review-slot="sve">Composant</th><th data-review-slot="svf">Version PROD</th><th data-review-slot="svg">Verdict</th><th data-review-slot="svh">Audits applicables</th><th data-review-slot="svi">Qualité</th></tr></thead><tbody data-review-slot="svj" data-component-version-table>${componentVersionRows || '<tr data-review-slot="svk"><td data-review-slot="svl" colspan="6">Aucune relation Component × Version matérialisée.</td></tr>'}</tbody></table></div></article>

  <article data-review-slot="svm" class="panel table-panel"><div data-review-slot="svn" class="panel-heading"><div data-review-slot="svo"><p data-review-slot="svp" class="eyebrow">Audits réalisés</p><h2 data-review-slot="svq">Traçabilité de chaque audit, par version</h2></div><span data-review-slot="svr" class="badge">${snapshot.normalizedData.audits.length} audits · ${ongoingAudits.length} en cours</span></div><p data-review-slot="svs" class="panel-note">Seules les anomalies rattachées explicitement à chaque audit sont comptées. Les anomalies du même composant sans lien prouvé sont signalées, mais non attribuées à cet audit.</p><div data-review-slot="svt" class="filter-bar"><label data-review-slot="svu">Cycle de vie<select data-review-slot="svv" data-audit-progress-filter><option data-review-slot="svw" value="">Tous</option><option data-review-slot="svx" value="pending">Non évalués</option><option data-review-slot="svy" value="ongoing">En cours</option><option data-review-slot="svz" value="completed">Terminés</option><option data-review-slot="sw0" value="cancelled">Annulés</option></select></label><label data-review-slot="sw1">Résultat des audits terminés<select data-review-slot="sw2" data-audit-result-filter><option data-review-slot="sw3" value="">Tous</option><option data-review-slot="sw4" value="conform">Conforme</option><option data-review-slot="sw5" value="non_conform">Non conforme</option><option data-review-slot="sw6" value="conditional">Conditionnel</option><option data-review-slot="sw7" value="critical">Critique</option></select></label><button data-review-slot="sw8" type="button" data-reset-audit-filters>Effacer les filtres d'audit</button></div><div data-review-slot="sw9" class="table-wrap"><table data-review-slot="swa"><thead data-review-slot="swb"><tr data-review-slot="swc"><th data-review-slot="swd">Repository</th><th data-review-slot="swe">Composant / source</th><th data-review-slot="swf">État de l’audit</th><th data-review-slot="swg">Version cible / artefact audité</th><th data-review-slot="swh">Anomalies liées à l’audit</th><th data-review-slot="swi">Ouvertes / en cours liées à l’audit</th><th data-review-slot="swj">Qualité</th></tr></thead><tbody data-review-slot="swk">${auditRows || '<tr data-review-slot="swl"><td data-review-slot="swm" colspan="7">Aucun audit dans ce snapshot.</td></tr>'}</tbody></table></div></article>

  <article data-review-slot="swn" class="panel table-panel" data-audit-campaign-summary><div data-review-slot="swo" class="panel-heading"><div data-review-slot="swp"><p data-review-slot="swq" class="eyebrow">Comparaison</p><h2 data-review-slot="swr">Résultats d’audit par repository et version cible</h2></div></div><p data-review-slot="sws">Audits reconnus sur leur version cible, sans héritage ni hypothèse de couverture PROD. Seuls les audits terminés ont un résultat définitif. Les anomalies et améliorations comptées sont explicitement rattachées à ces audits. Les repositories sans audit reconnu ne sont pas représentés. La qualité concerne ces preuves, pas celle du repository seul.</p><div data-review-slot="swt" class="table-wrap" tabindex="0" role="region" aria-label="Synthèse des audits par version cible"><table data-review-slot="swu"><thead data-review-slot="swv"><tr data-review-slot="sww">${['Repository', 'Version cible', 'Composants avec audit', 'Audits', 'Terminés', 'En cours', 'À faire', 'Annulés', 'Conformes', 'Non conformes', 'Autres résultats terminés', 'Anomalies liées', 'Ouvertes / en cours', 'Améliorations', 'Qualité'].map((label, field) => '<th data-review-key="' + field + '" data-review-slot="swx" scope="col">' + label + '</th>').join('')}</tr></thead><tbody data-review-slot="swy">${campaignRows || '<tr data-review-slot="swz"><td data-review-slot="sx0" colspan="15">' + (snapshot.analytics.auditCampaigns ? 'Aucun audit reconnu.' : 'Synthèse indisponible dans cet ancien snapshot : relancer le pipeline.') + '</td></tr>'}</tbody></table></div></article>

  <article data-review-slot="sx1" class="panel" id="quality"><div data-review-slot="sx2" class="panel-heading"><div data-review-slot="sx3"><p data-review-slot="sx4" class="eyebrow">Qualité des données</p><h2 data-review-slot="sx5">Réserves qui affectent les audits ou leur périmètre</h2></div><span data-review-slot="sx6" class="badge">${snapshot.dataQuality.issues.length} alertes</span></div><ul data-review-slot="sx7" class="issue-list">${snapshot.dataQuality.issues.map((issue) => `<li data-review-slot="sx8" data-review-key="${escapeHtml(issue.id)}"><div data-review-slot="sx9"><strong data-review-slot="sxa">${escapeHtml(issue.ruleId)} · ${escapeHtml(issue.message)}</strong><p data-review-slot="sxb">${escapeHtml(issue.entityType)} · ${escapeHtml(issue.entityId)} · ${severityLabel(issue.severity)}</p></div><span data-review-slot="sxc" class="tag tag-${issue.severity === 'ERROR' ? 'error' : 'warning'}">${qualityLabel(issue.action === 'exclude' ? 'partial' : 'reliable')}</span></li>`).join('') || '<li data-review-slot="sxd"><div data-review-slot="sxe"><strong data-review-slot="sxf">Aucune alerte</strong><p data-review-slot="sxg">Les audits et leur périmètre ne présentent aucune réserve DQ.</p></div></li>'}</ul></article>`;
}

/**
 * Réalise le traitement « component audit row » dans le pipeline de qualité.
 *
 * @param snapshot - Valeur de « snapshot » utilisée par ce traitement.
 * @param component - Valeur de « component » utilisée par ce traitement.
 * @param repositoryName - Valeur de « repositoryName » utilisée par ce traitement.
 * @param audit - Valeur de « audit » utilisée par ce traitement.
 * @param anomalies - Valeur de « anomalies » utilisée par ce traitement.
 * @param githubUrl - Valeur de « githubUrl » utilisée par ce traitement.
 * @returns Valeur textuelle produite.
 */
function componentAuditRow(
  snapshot: Snapshot,
  component: Component,
  repositoryName: string,
  audit: Snapshot['normalizedData']['audits'][number] | undefined,
  anomalies: Snapshot['normalizedData']['anomalies'],
  githubUrl?: string
): string {
  const open = anomalies.filter((item) => ['open', 'reopened', 'in_progress'].includes(item.status)).length;
  const latestRelation = latestComponentVersion(snapshot.normalizedData, component.componentId);
  const verdict = latestRelation?.verdict ?? 'NON_COUVERT';
  const result = componentVersionVerdictLabel(verdict);
  const resultClass =
    verdict === 'CONFORME' ? 'conform' : verdict === 'NON_CONFORME' ? 'non_conform' : 'unknown';
  const anomalyLinks = anomalies.length
    ? anomalies
        .slice(0, 4)
        .map(
          (item) =>
            `<a data-review-slot="sxh" class="tag tag-${item.criticality ?? 'warning'}" href="anomalies.html?anomaly=${encodeURIComponent(item.anomalyId)}">${escapeHtml(item.provenance.sourceId ?? item.anomalyId)}</a>`
        )
        .join(' ')
    : '<span data-review-slot="sxi" class="muted">Aucune</span>';
  const extra =
    anomalies.length > 4 ? ` <span data-review-slot="sxj" class="muted">+${anomalies.length - 4}</span>` : '';
  return `<tr data-review-slot="sxk" data-component-row ${contextAttribute({ repository: snapshot.normalizedData.libraries.find((library) => library.libraryId === component.libraryId)?.repository, components: [component.name], componentIds: [component.componentId], versions: latestRelation ? [snapshot.normalizedData.versions?.find((version) => version.versionId === latestRelation.versionId)?.number] : [], versionIds: latestRelation ? [latestRelation.versionId] : [] })} data-component="${escapeHtml(component.name)}" data-repository="${escapeHtml(repositoryName)}" data-component-result="${resultClass === 'unknown' ? 'not_audited' : resultClass}" data-component-audited="${verdict === 'NON_COUVERT' ? 'not_audited' : 'audited'}"><td data-review-slot="sxl">${repositoryReference(snapshot, repositoryName, githubUrl)}</td><td data-review-slot="sxm"><strong data-review-slot="sxn">${escapeHtml(component.name)}</strong><small data-review-slot="sxo">${escapeHtml(component.componentId)}</small></td><td data-review-slot="sxp">${audit ? `<span data-review-slot="sxq" class="state state-${audit.status}">${auditStatusLabel(audit.status)}</span><small data-review-slot="sxr">${escapeHtml(audit.version)}</small>` : '<span data-review-slot="sxs" class="state state-unknown">non audité</span>'}</td><td data-review-slot="sxt"><span data-review-slot="sxu" class="state state-${resultClass}">${result}</span><small data-review-slot="sxv">Dernière version PROD : ${escapeHtml(snapshot.normalizedData.versions?.find((version) => version.versionId === latestRelation?.versionId)?.number ?? 'non déterminée')}</small></td><td data-review-slot="sxw">${anomalyLinks}${extra}</td><td data-review-slot="sxx"><strong data-review-slot="sxy">${open}</strong></td><td data-review-slot="sxz"><span data-review-slot="sy0" class="tag tag-${component.dataQualityStatus}">${qualityLabel(component.dataQualityStatus)}</span></td></tr>`;
}

/** Rend une carte KPI avec sa valeur, son ratio et sa définition. */
/** Rend une carte dédiée aux délais exprimés en jours. */
/** Rend les barres de répartition par criticité avec leurs filtres. */
/** Rend les barres de répartition par catégorie d'accessibilité. */
/** Construit la comparaison des repositories dans la page d'accueil. */
function repositoryRows(snapshot: Snapshot, githubUrl?: string): string {
  const rows =
    snapshot.analytics.repositoryActivity ??
    repositoryActivity(snapshot.normalizedData, snapshot.dataQuality.issues);
  return rows
    .map((row) => {
      const source = snapshot.rawData.repositories.find(
        (item) => `${item.owner}/${item.name}` === row.repository
      );
      const base = source
        ? `${(githubUrl ?? 'https://github.com').replace(/\/+$/, '')}/${encodeURIComponent(source.owner)}/${encodeURIComponent(source.name)}`
        : '';
      const issues = (snapshot.normalizedData.issues ?? []).filter(
        (item) => item.libraryId === row.libraryId
      );
      const anomalyIds = new Set(snapshot.normalizedData.anomalies.map((item) => item.issueId));
      const types = [
        ...new Set(
          issues
            .filter((item) => anomalyIds.has(item.issueId))
            .map((item) => item.rawIssueType ?? item.issueType)
            .filter((type): type is string => Boolean(type))
        )
      ];
      /** Protège un littéral de recherche GitHub. */
      const quote = (value: string): string => `"${value.replace(/["\\]/g, '\\$&')}"`;
      const anomalyQuery =
        'is:issue (' +
        (types.length ? types : ['Bug']).map((type) => 'type:' + quote(type)).join(' OR ') +
        ')';
      /** Restitue un effectif connu avec sa recherche externe ; une inconnue reste sans lien. */
      const countLink = (value: number | 'unknown', query: string, kind = 'issues'): string =>
        value === 'unknown'
          ? 'Indisponible'
          : /^https:\/\/[^\s]+$/.test(base)
            ? `<a data-review-slot="sy1" href="${escapeHtml(base + '/' + kind + '?q=' + encodeURIComponent(query))}" target="_blank" rel="noopener noreferrer">${value} · GitHub actuel ≈ ↗</a>`
            : String(value);
      return `<tr data-review-slot="sy2" data-review-key="${escapeHtml(row.libraryId)}"><td data-review-slot="sy3">${repositoryReference(snapshot, row.name, githubUrl)}<small data-review-slot="sy4">${escapeHtml(row.repository)}</small></td><td data-review-slot="sy5"><a data-review-slot="sy6" href="audits.html?repository=${encodeURIComponent(row.repository)}#component-populations">${row.components}</a></td><td data-review-slot="sy7">${countLink(row.anomalies, anomalyQuery)}</td><td data-review-slot="sy8">${countLink(row.openAnomalies, anomalyQuery + ' is:open')}</td><td data-review-slot="sy9">${countLink(row.issues, 'is:issue')}</td><td data-review-slot="sya">${countLink(row.openIssues, 'is:issue is:open')}</td><td data-review-slot="syb">${countLink(row.pullRequests, 'is:pr', 'pulls')}</td><td data-review-slot="syc">${countLink(row.mergedPullRequests, 'is:pr is:merged', 'pulls')}</td></tr>`;
    })
    .join('');
}
/** Restitue les cohortes de délais précalculées par repository, sans inventer une durée pour une population vide. */
function delayRows(snapshot: Snapshot): string {
  const rows =
    snapshot.analytics.repositoryActivity ??
    repositoryActivity(snapshot.normalizedData, snapshot.dataQuality.issues);
  return rows
    .map((row) => {
      const cells = (['global', 'done', 'estimated'] as const)
        .map((cohort) => {
          const stats = row.delays[cohort];
          return `<td data-review-slot="syd" data-review-key="${cohort}:count">${row.issues === 'unknown' ? 'Indisponible' : (stats?.count ?? 'Indisponible')}</td>${[
            'average',
            'median',
            'p90'
          ]
            .map((key) => {
              const value = stats?.[key as 'average' | 'median' | 'p90'];
              return `<td data-review-slot="sye" data-review-key="${cohort}:${key}">${typeof value === 'number' ? value.toFixed(1) + ' j' : 'inconnu'}</td>`;
            })
            .join('')}`;
        })
        .join('');
      return `<tr data-review-slot="syf" data-review-key="${escapeHtml(row.libraryId)}"><td data-review-slot="syg"><strong data-review-slot="syh">${escapeHtml(row.name)}</strong></td>${cells}</tr>`;
    })
    .join('');
}
/** Rend une barre proportionnelle à une valeur numérique. */
function bar(label: string, value: number | 'unknown'): string {
  const width = typeof value === 'number' ? Math.min(value * 25, 100) : 0;
  return `<div data-review-slot="syi" class="bar-row"><span data-review-slot="syj">${label}</span><div data-review-slot="syk" class="bar-track"><i data-review-slot="syl" style="width:${width}%"></i></div><strong data-review-slot="sym">${value}</strong></div>`;
}
/** Rend une barre cliquable vers le filtre correspondant. */
function linkedBar(label: string, value: number | 'unknown', href: string, role: string): string {
  return `<a data-review-slot="syn" data-review-key="${escapeHtml(role)}" class="bar-link" href="${href}">${bar(label, value)}</a>`;
}
/** Traduit un statut de fiabilité pour l'interface française. */
function qualityLabel(value: DataQualityStatus): string {
  return { reliable: 'fiable', partial: 'partielle', unknown: 'inconnue', invalid: 'invalide' }[value];
}
/** Traduit une criticité technique en libellé métier. */
function criticalityLabel(value: 'blocking' | 'major' | 'minor' | undefined): string {
  return value ? { blocking: 'bloquante', major: 'majeure', minor: 'mineure' }[value] : 'inconnue';
}
/** Traduit l'état d'une anomalie pour le dashboard. */
function anomalyStatusLabel(value: AnomalyStatus): string {
  return {
    open: 'ouverte',
    in_progress: 'en cours',
    done: 'terminée',
    reopened: 'réouverte',
    cancelled: 'annulée'
  }[value];
}
/** Traduit l'état d'un audit pour le dashboard. */

/** Traduit le niveau de sévérité d'une alerte qualité. */
function severityLabel(value: Severity): string {
  return { INFO: 'information', WARNING: 'avertissement', ERROR: 'erreur' }[value];
}
/** Traduit l'origine de découverte d'un composant. */
/** Échappe les valeurs avant leur insertion dans le HTML généré. */
function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character] ?? character
  );
}

/** Génère systématiquement les deux présentations et leur page de choix à partir du même snapshot. */
export async function generateDashboard(
  snapshot: Snapshot,
  outputRoot: string,
  githubUrl?: string,
  componentPrefix = 'Component:',
  githubRules?: import('../config.js').GithubProcessingConfig
): Promise<void> {
  const root = resolve(outputRoot, 'dashboard');
  await generateClassicDashboard(snapshot, outputRoot, githubUrl, componentPrefix, resolve(root, 'classic'));
  await generateSimplifiedDashboard(snapshot, root, githubRules);
  await writeFile(resolve(root, 'index.html'), dashboardChoice(snapshot.capturedAt), 'utf8');
  await writeFile(
    resolve(root, 'review-choice.js'),
    "import { startReview } from './simplified/review.js'; startReview('choice');",
    'utf8'
  );
  // Les anciens liens profonds restent utilisables, avec leurs filtres et leur ancre.
  await Promise.all(
    [
      'issues',
      'anomalies',
      'audits',
      'components',
      'graph',
      'history',
      'accessibility',
      'quality',
      'epics'
    ].map(async (name) => {
      const target = 'classic/' + name + '.html';
      await writeFile(
        resolve(root, name + '.html'),
        '<!doctype html><html data-review-slot="syo" lang="fr"><head data-review-slot="syp"><meta data-review-slot="syq" charset="utf-8"><title data-review-slot="syr">Ouvrir la vue détaillée</title></head><body data-review-slot="sys"><a data-review-slot="syt" href="' +
          target +
          '">Ouvrir la vue détaillée</a><script data-review-slot="syu">window.location.replace(' +
          JSON.stringify(target) +
          '+window.location.search+window.location.hash)</script></body></html>',
        'utf8'
      );
    })
  );
}
