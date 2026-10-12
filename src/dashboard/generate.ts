import {
  workspaceCards,
  workspaceNavigation,
  workspaceSubnavigation,
  accessibilityContent,
  workspacePayload,
  workspaceModel,
  dataQualityContent,
  resetWorkspaceModel
} from './workspaces.js';
import { issueFacts, resetDashboardReadModel } from './read-model.js';
import { teamActivitySummary } from '../analytics/team-activity.js';
import { repositoryActivity } from '../analytics/repository-activity.js';
import { componentGithubLinks } from './component-links.js';
import { latestComponentVersion } from '../analytics/component-versions.js';
import {
  contextAttribute,
  contextToolbar,
  metricExplanationContent,
  traceabilityContent,
  transitionJournalContent
} from './evidence.js';
import { auditReadModel } from './audit-read-model.js';
import { anomaliesForAudit, auditVersionLabel } from './audit-relations.js';
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
  AuditStatus,
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
 *
 * @param snapshot - Snapshot immuable à présenter.
 * @param outputRoot - Répertoire racine de sortie (sous-dossier `dashboard`).
 * @param githubUrl - URL de référence optionnelle pour les liens GitHub.
 */
export async function generateDashboard(
  snapshot: Snapshot,
  outputRoot: string,
  githubUrl?: string,
  componentPrefix = 'Component:'
): Promise<void> {
  resetDashboardReadModel(snapshot);
  resetWorkspaceModel(snapshot);
  const dashboardPath = resolve(outputRoot, 'dashboard');
  await mkdir(resolve(dashboardPath, 'assets'), { recursive: true });
  const serializedSnapshot = JSON.stringify(snapshot).replace(/</g, '\\u003c');
  // Les assets sont lus depuis des fichiers dédiés afin que le HTML reste limité à la structure et aux données.
  await Promise.all([
    writeFile(
      resolve(dashboardPath, 'index.html'),
      page(
        snapshot,
        'Vue d’ensemble',
        '<div data-overview-global>' +
          repositoryComparisonTables(snapshot, githubUrl, componentPrefix) +
          globalOverviewCards(snapshot) +
          '</div>',
        serializedSnapshot
      ),
      'utf8'
    ),
    writeFile(
      resolve(dashboardPath, 'issues.html'),
      page(
        snapshot,
        'Analyse des issues',
        issuesExplorerContent(snapshot, githubUrl, componentPrefix),
        serializedSnapshot
      ),
      'utf8'
    ),
    writeFile(
      resolve(dashboardPath, 'anomalies.html'),
      page(
        snapshot,
        'Anomalies',
        '<p class="panel">Tous les BUG spécialisés sont conservés ici. Ils ne sont pas tous des anomalies d’accessibilité ; voir la qualification de chaque défaut et l’espace Accessibilité.</p>' +
          anomaliesContent(snapshot, githubUrl),
        serializedSnapshot
      ),
      'utf8'
    ),
    writeFile(
      resolve(dashboardPath, 'audits.html'),
      page(
        snapshot,
        'Audits et composants',
        workspaceCards(snapshot, true) + auditsContent(snapshot, githubUrl),
        serializedSnapshot
      ),
      'utf8'
    ),
    writeFile(
      resolve(dashboardPath, 'components.html'),
      page(
        snapshot,
        'Analyse des composants',
        componentsExplorerContent(snapshot, githubUrl, componentPrefix),
        serializedSnapshot
      ),
      'utf8'
    ),
    writeFile(
      resolve(dashboardPath, 'graph.html'),
      page(
        snapshot,
        'Cartographie',
        graphContent(snapshot, githubUrl) + traceabilityContent(snapshot),
        serializedSnapshot
      ),
      'utf8'
    ),
    writeFile(
      resolve(dashboardPath, 'history.html'),
      page(
        snapshot,
        'Historique',
        historyContent(snapshot) + transitionJournalContent(snapshot),
        serializedSnapshot
      ),
      'utf8'
    ),
    writeFile(
      resolve(dashboardPath, 'accessibility.html'),
      page(snapshot, 'Accessibilité', accessibilityContent(snapshot), serializedSnapshot),
      'utf8'
    ),
    writeFile(
      resolve(dashboardPath, 'quality.html'),
      page(
        snapshot,
        'Qualité des données',
        '<section class="panel"><h2>Alertes et fiabilité du snapshot</h2><p>Les alertes Data Quality sont des problèmes de données, pas des anomalies d’accessibilité.</p></section>' +
          dataQualityContent(snapshot, githubUrl) +
          '<details class="panel" data-global-only><summary>Indicateurs historiques du snapshot complet</summary>' +
          overviewContent(snapshot, githubUrl) +
          '</details>' +
          metricExplanationContent(snapshot),
        serializedSnapshot
      ),
      'utf8'
    ),
    copyDashboardAsset(dashboardPath, 'workspaces.js'),
    copyDashboardAsset(dashboardPath, 'style.css'),
    copyDashboardAsset(dashboardPath, 'app.js'),
    copyDashboardAsset(dashboardPath, 'context.js'),
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
function page(snapshot: Snapshot, title: string, content: string, serializedSnapshot: string): string {
  // Le snapshot est sérialisé dans une balise script ; les chevrons sont échappés pour éviter une injection HTML.
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} | Design System Quality</title>
  <link rel="stylesheet" href="assets/style.css">
</head>
<body>
<section class="panel" data-file-warning hidden role="alert"><h2>Ouvrir le dashboard sur HTTP</h2><p>Les filtres et graphiques interactifs nécessitent un serveur local. Pour la démonstration, exécuter <code>npm run dashboard:serve</code>. Pour votre dataset, préciser son dossier avec <code>npm run dashboard:serve -- chemin/du/dashboard</code>, puis ouvrir <a href="http://127.0.0.1:4174/">http://127.0.0.1:4174/</a>.</p></section>
  <a class="skip-link" href="#main-content">Aller au contenu principal</a>
  <header class="topbar"><a class="brand" href="index.html"><img class="brand-logo" src="assets/logo.svg" alt=""> <span>Design System Quality</span></a><span class="workspace-label">Qualité du Design System</span><div class="topbar-actions"><span class="status-pill status-${title === 'Vue d’ensemble' ? 'partial' : 'neutral'}">${qualityLabel(snapshot.reliability)}</span></div></header>
  <div class="dashboard-layout"><aside class="sidebar"><p class="sidebar-label">ESPACES DE PILOTAGE</p>${workspaceNavigation(title)}<div class="sidebar-footer"><span>Snapshot</span><strong data-captured-at></strong><span>Règles</span><strong data-rule-version></strong></div></aside><main class="shell" id="main-content" tabindex="-1"><div class="page-heading"><div><p class="eyebrow">Qualité du Design System / V2.2</p><h1>${title === 'Analyse des issues' ? 'Activité des équipes' : title === 'Analyse des composants' ? 'Composants et versions' : title === 'Anomalies' ? 'Défauts normalisés' : title === 'Audits et composants' ? 'Audits et conformité' : title}</h1><p class="muted">Lecture seule · données du snapshot courant</p></div></div>${workspaceSubnavigation(title)}${['Qualité des données', 'Vue d’ensemble'].includes(title) ? '' : contextToolbar(snapshot, title === 'Historique' ? ['repository'] : undefined)}${content}${workspacePayload(snapshot)}</main></div>
  <script>window.__SNAPSHOT__ = ${serializedSnapshot}; if (location.protocol === 'file:') { document.querySelector('[data-file-warning]').hidden = false; document.querySelectorAll('select, input, button').forEach(control => control.disabled = true); }</script><script type="module" src="assets/app.js"></script>${title === 'Cartographie' ? '<script type="module" src="assets/graph.js"></script>' : ''}${title === 'Analyse des issues' ? '<script type="module" src="assets/issues.js"></script>' : ''}${title === 'Analyse des composants' ? '<script type="module" src="assets/components.js"></script>' : ''}
</body></html>`
    .replace(/class="active" href=/g, 'class="active" aria-current="page" href=')
    .replace(/<th>/g, '<th scope="col">')
    .replace(
      /<div class="table-wrap(?: issue-table-wrap)?">/g,
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
    ['portfolio.components', 'Composants actifs', 'components.html'],
    ['audit.completed', 'Audits terminés', 'audits.html'],
    ['anomaly.total', 'Défauts normalisés déclarés', 'anomalies.html'],
    ['anomaly.open', 'Défauts normalisés ouverts', 'anomalies.html'],
    ['anomaly.correctedEver', 'Défauts corrigés au moins une fois', 'anomalies.html'],
    ['anomaly.correctionDelay.median', 'Délai médian des défauts', 'anomalies.html'],
    ['anomaly.correctionDelay.p90', 'P90 des délais des défauts', 'anomalies.html']
  ];
  return (
    '<section aria-label="Synthèse globale du snapshot"><div class="section-heading"><h2>Patrimoine et activité globale</h2></div><p>Snapshot complet, tous repositories et toutes versions. Les défauts normalisés correspondent aux BUG configurés ; ils ne sont pas tous des anomalies d’accessibilité.</p><section class="kpi-grid">' +
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
    '</section><p><a href="issues.html">Explorer les issues et leurs métriques de sélection</a> · <a href="quality.html">Consulter les diagnostics et les autres indicateurs</a></p></section>'
  );
}

/** Restitue les deux comparaisons globales par repository, sans filtre de navigation. */
function repositoryComparisonTables(
  snapshot: Snapshot,
  githubUrl?: string,
  componentPrefix = 'Component:'
): string {
  const groups = [
    ['global', 'Ensemble (Done + closedAt)'],
    ['done', 'Sans estimation (Done)'],
    ['estimated', 'Avec estimation (closedAt)']
  ];
  return `<article class="panel table-panel"><div class="panel-heading"><div><p class="eyebrow">Comparaison des sources</p><h2>Patrimoine et activité par repository</h2></div><span class="badge">${snapshot.normalizedData.libraries.length} repositories</span></div><p>Stocks du snapshot. Les liens ouvrent les listes GitHub actuelles : composants via leurs labels, anomalies via leurs Issue Types. Les anomalies ouvertes selon le pipeline peuvent différer des issues ouvertes dans GitHub.</p><div class="table-wrap" tabindex="0" role="region" aria-label="Patrimoine et activité par repository"><table><thead><tr>${['Repository', 'Composants', 'Anomalies', 'Anomalies ouvertes', 'Issues', 'Issues ouvertes', 'PR', 'PR fusionnées'].map((label) => `<th scope="col">${label}</th>`).join('')}</tr></thead><tbody>${repositoryRows(snapshot, githubUrl, componentPrefix)}</tbody></table></div></article>
  <article class="panel table-panel"><div class="panel-heading"><div><p class="eyebrow">Délais de traitement</p><h2>Temps de traitement des issues par repository</h2></div><span class="badge">Jours calendaires</span></div><p>Issues distinctes Done ET Closed, dates calculables et exclusions Data Quality appliquées. Done : dernière transition datée. closedAt : estimation admise uniquement si Done est prouvé et sa date absente. Les annulations sont exclues.</p><div class="table-wrap" tabindex="0" role="region" aria-label="Temps de traitement par repository"><table><thead><tr><th scope="col" rowspan="2">Repository</th>${groups.map(([, label]) => `<th scope="colgroup" colspan="4">${label}</th>`).join('')}</tr><tr>${groups.map(() => ['Issues mesurables', 'Moyenne', 'Médiane', 'P90'].map((label) => `<th scope="col">${label}</th>`).join('')).join('')}</tr></thead><tbody>${delayRows(snapshot)}</tbody></table></div></article>`;
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
  return `<section data-global-only aria-label="Synthèse de l’activité des équipes"><div class="section-heading"><h2>Le travail suivi dans les Projects, les issues et les PR</h2><span class="badge">${qualityLabel(summary.quality)}</span></div><p>Snapshot complet, tous repositories et toutes versions. Effectifs distincts observés ; cette synthèse est masquée lorsqu’un filtre est appliqué. Les états des PR sont exclusifs ; les PR reliées sont une sous-population.</p><section class="kpi-grid">${counts.map(([label, value, key]) => `<article class="kpi-card"><span class="kpi-label">${label}</span><strong data-team-count="${key}">${value === 'unknown' ? 'Indisponible' : value}</strong></article>`).join('')}</section><div class="content-grid"><article class="panel"><h3>Ce qui est observable</h3><p>Les statuts, itérations et Velocity sont ceux de chaque Project source. Une Velocity absente reste non renseignée ; aucune performance de sprint n’est déduite. Une transition datée désigne un événement Project connu, sans estimer les événements absents.</p></article><article class="panel"><h3>Réserves Data Quality</h3><p>Les données manquantes et incohérentes restent signalées. Consulter les alertes avant toute comparaison.</p><a href="quality.html">Voir les alertes →</a></article></div></section>`;
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

  return `<section class="hero-band synthesis-hero">
    <div><p class="eyebrow">Point de situation</p><h2>Un état du patrimoine, des audits et des anomalies.</h2><p>Une issue désigne tout travail GitHub ; un audit est une issue de contrôle d’un composant pour une version ; une anomalie est un écart identifié, notamment pendant un audit. Ces ensembles se recoupent et ne s’additionnent pas.</p><p>Les indicateurs sont calculés dans le pipeline puis expliqués ici avec leur périmètre, leur ratio et leur fiabilité.</p></div>
    <div class="hero-facts"><div><strong>${formatMetricValue(open)}</strong><span>ouvertes</span></div><div><strong>${formatMetricValue(total)}</strong><span>anomalies</span></div><div><strong>${formatMetricValue(coverage)}%</strong><span>couverture audit</span></div></div>
  </section>

  <section class="section-heading"><div><p class="eyebrow">Patrimoine</p><h2>Ce qui existe aujourd’hui</h2></div><span class="badge">${qualityLabel(repositories.reliability.status)}</span></section>
  <section class="kpi-grid synthesis-grid">
    ${metricCard('Repositories', repositories, '—', 'audits.html')}
    ${metricCard('Composants actifs', components, '—', 'audits.html')}
    ${metricCard('Component × Version couverts', preferredMetric(metrics, 'componentVersion.covered', 'portfolio.componentsAudited'), ratioLabel(preferredMetric(metrics, 'componentVersion.covered', 'portfolio.componentsAudited')), 'audits.html')}
    ${metricCard('Couverture Component × Version', coverage, ratioLabel(coverage), 'audits.html')}
  </section>

  <section class="section-heading"><div><p class="eyebrow">Audits</p><h2>Résultats et périmètre</h2></div><span class="badge">${formatMetricValue(completedAudits)} audit${completedAudits.value === 1 ? '' : 's'} terminé${completedAudits.value === 1 ? '' : 's'}</span></section>
  <section class="content-grid synthesis-two">
    ${explainMetricPanel('Conformité Component × Version', conformity, ratioLabel(conformity), 'La conformité porte sur les couples Component × Version couverts. Un couple non couvert n’est jamais assimilé à un couple non conforme.', 'audits.html')}
    ${explainMetricPanel('Couverture Component × Version', coverage, ratioLabel(coverage), 'La couverture mesure les couples Component × Version disposant d’au moins un Audit terminé applicable.', 'audits.html')}
  </section>

  <section class="section-heading"><div><p class="eyebrow">Anomalies</p><h2>Stock actuel et délai de correction</h2></div><span class="badge">${qualityLabel(total.reliability.status)}</span></section>
  <section class="kpi-grid synthesis-grid">
    ${metricCard('Anomalies totales', total, denominatorLabel(total), 'anomalies.html')}
    ${metricCard('Anomalies ouvertes', open, denominatorLabel(open), 'anomalies.html')}
    ${metricCard('Anomalies corrigées', corrected, denominatorLabel(corrected), 'anomalies.html')}
    ${metricCard('Délai médian', median, 'jours calendaires', 'anomalies.html')}
    ${metricCard('Délai P90', p90, 'jours calendaires', 'anomalies.html')}
    ${metricCard('Plus ancienne ouverte', oldest, 'âge dans le snapshot', 'anomalies.html')}
  </section>

  <section class="content-grid synthesis-two">
    <article class="panel"><div class="panel-heading"><div><p class="eyebrow">Criticité</p><h2>Répartition des anomalies</h2></div><span class="badge">${formatMetricValue(criticalityCoverage)}% classées</span></div><div class="bars">${criticalityMetricBars(metrics)}</div><p class="panel-note">${formatRawMetricValue(criticalityCoverage.numerator)} / ${formatRawMetricValue(criticalityCoverage.denominator)} anomalies disposent d’une criticité valide.</p></article>
    <article class="panel"><div class="panel-heading"><div><p class="eyebrow">Catégories</p><h2>Critères d’accessibilité</h2></div><span class="badge">multi-étiquettes</span></div><div class="bars">${categoryMetricBars(metrics)}</div><p class="panel-note">Une anomalie peut appartenir à plusieurs catégories. Les catégories concernées par une réserve DQ sont signalées comme partielles.</p></article>
  </section>

  <section class="section-heading"><div><p class="eyebrow">Qualité des données</p><h2>Pourquoi certains chiffres sont partiels</h2></div><span class="alert-count">${dataQuality.issues.length}</span></section>
  <section class="content-grid synthesis-two"><article class="panel alert-panel"><div class="severity-row"><span><i class="dot error"></i>Erreurs</span><strong>${dataQuality.summary.ERROR}</strong></div><div class="severity-row"><span><i class="dot warning"></i>Avertissements</span><strong>${dataQuality.summary.WARNING}</strong></div><div class="severity-row"><span><i class="dot info"></i>Informations</span><strong>${dataQuality.summary.INFO}</strong></div><a class="text-link" href="anomalies.html#quality">Voir les alertes et leurs cibles →</a></article><article class="panel"><div class="panel-heading"><div><p class="eyebrow">Lecture</p><h2>Fiabilité par métrique</h2></div></div>${reliabilityRows(metrics)}</article></section>

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
  return `<a class="kpi-card metric-card" data-metric-id="${escapeHtml(metric.id)}" href="${href}"><span class="kpi-label">${label}</span><strong>${formatMetricValue(metric)}</strong><span class="kpi-ratio">${context} · ${qualityLabel(metric.reliability.status)}</span><span class="kpi-definition">${escapeHtml(metric.definition)}</span></a>`;
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
  return `<a class="panel metric-explainer" href="${href}"><div class="panel-heading"><div><p class="eyebrow">Métrique</p><h2>${title}</h2></div><span class="badge">${qualityLabel(metric.reliability.status)}</span></div><strong class="metric-big">${formatMetricValue(metric)}${metric.unit === 'percentage' ? '%' : ''}</strong><p class="metric-ratio">${escapeHtml(ratio)}</p><p>${escapeHtml(definition)}</p>${metric.reliability.issueIds.length ? `<p class="metric-warning">Réserve DQ : ${metric.reliability.issueIds.length} alerte${metric.reliability.issueIds.length > 1 ? 's' : ''} affecte cette métrique.</p>` : ''}</a>`;
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
      return linkedBar(label, metric.value, `anomalies.html?criticality=${encodeURIComponent(key)}`);
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
        return linkedBar(category, metric.value, `anomalies.html?category=${encodeURIComponent(category)}`);
      })
      .join('') || '<p class="muted">Aucune catégorie détectée.</p>'
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
      return `<div class="reliability-row"><div><strong>${escapeHtml(metricLabel(id))}</strong><small>${metric.reliability.issueIds.length ? `${metric.reliability.issueIds.length} alerte${metric.reliability.issueIds.length > 1 ? 's' : ''} liée${metric.reliability.issueIds.length > 1 ? 's' : ''}` : 'Aucune alerte DQ liée'}</small></div><span class="tag tag-${metric.reliability.status}">${qualityLabel(metric.reliability.status)}</span></div>`;
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
        : `<article class="kpi-card"><span class="kpi-label">${issueFlowLabels[id]}</span><strong>—</strong><span class="kpi-definition">Disponible après comparaison de deux snapshots.</span></article>`;
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
        : `<article class="kpi-card"><span class="kpi-label">${label}</span><strong>—</strong><span class="kpi-definition">Disponible après comparaison avec un snapshot précédent.</span></article>`;
    })
    .join('');
  return `<section class="hero-band"><div><p class="eyebrow">Évolution</p><h2>Ce qui a changé depuis le snapshot précédent</h2><p>Stock courant : ${issueStock} issues distinctes, tous types confondus. Les flux génériques et les flux des anomalies sont présentés séparément.</p><p>${period ? `Période : ${formatDateShort(period.from ?? '')} → ${formatDateShort(period.to ?? '')}` : 'Aucun snapshot précédent comparable dans les données courantes.'}</p></div><div class="hero-ring"><strong>${first ? ids.reduce((sum, id) => sum + Number(flows[id]?.value ?? 0), 0) : '—'}</strong><span>événements détectés</span></div></section><section class="section-heading"><div><p class="eyebrow">Tous types</p><h2>Flux des issues</h2></div></section><section class="kpi-grid" data-history-issue-flows>${issueFlowCards}</section><section class="section-heading"><div><p class="eyebrow">Anomalies normalisées</p><h2>Flux des anomalies</h2></div></section><section class="kpi-grid" data-global-only aria-label="Indicateurs du snapshot complet">${cards}</section><article class="panel table-panel"><div class="panel-heading"><div><p class="eyebrow">Interprétation</p><h2>Stock vs flux</h2></div><span class="badge">snapshot courant</span></div><p data-history-issue-stock>Issues (tous types) : <strong>${issueStock}</strong> distinctes · <strong>${issueStates.open}</strong> ouvertes · <strong>${issueStates.treated}</strong> traitées · <strong>${issueStates.cancelled}</strong> annulées.</p><p class="muted">Les flux des issues et des anomalies sont observés entre deux snapshots et ne doivent pas être additionnés. Ils ne remplacent pas les stocks affichés dans <a class="text-link" href="anomalies.html">Anomalies</a>.</p></article>`;
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
      return `<tr data-table-row ${contextAttribute(issueFacts(snapshot).find((fact) => fact.id === anomaly.issueId) ?? { anomalyIds: [anomaly.anomalyId] })} data-corrected="${anomaly.everCorrected}" data-repository="${escapeHtml(snapshot.normalizedData.libraries.find((library) => library.name === repositoryName)?.repository ?? repositoryName)}" data-status="${status}" data-criticality="${escapeHtml(criticality)}" data-categories="${escapeHtml(anomaly.categories.join('|'))}">
      <td><strong>${escapeHtml(anomaly.anomalyId)}</strong><small>${qualification?.status === 'qualified' ? 'Accessibilité qualifiée' : qualification?.status === 'presumed' ? 'Accessibilité présumée · à examiner' : 'Défaut sans qualification accessibilité'}</small><small>${githubReference(snapshot, anomaly.provenance.sourceId ?? 'source inconnue', githubUrl)}</small></td>
      <td>${repositoryReference(snapshot, repositoryName, githubUrl)}<small>${escapeHtml(component?.name?.trim() || anomaly.componentId?.trim() || 'composant non déterminé')}</small></td>
      <td><span class="tag tag-${criticality}">${criticalityLabel(anomaly.criticality)}</span></td>
      <td>${escapeHtml(categoriesText)}</td><td>${escapeHtml(anomaly.origin)}<small>${anomaly.auditId ? `<a href="audits.html?audit=${encodeURIComponent(anomaly.auditId)}">${escapeHtml(anomaly.auditId)}</a>` : 'Aucun audit explicitement relié'}</small></td>
      <td><span class="state state-${status}">${statusLabel}</span></td>
      <td>${created}</td><td>${correctedAt}</td><td>${delay}</td><td>${escapeHtml(dateLabel)}</td><td>${linkedPullRequests}</td>
    </tr>`;
    })
    .join('');

  const issues = snapshot.dataQuality.issues
    .map(
      (issue) =>
        `<li><span class="tag tag-${issue.severity.toLowerCase()}">${severityLabel(issue.severity)}</span><div><strong>${escapeHtml(issue.ruleId)}</strong><p>${escapeHtml(qualityMessage(issue))}</p>${qualityIssueTarget(snapshot, issue, githubUrl)}</div></li>`
    )
    .join('');

  return `<section class="hero-band anomalies-hero">
    <div><p class="eyebrow">Stock actuel</p><h2>${formatMetricValue(open)} anomalies ouvertes</h2><p>Les anomalies sont des écarts de qualité/accessibilité, pas l’ensemble des issues ni les audits eux-mêmes.</p><p>${formatRawMetricValue(open.numerator)} sur ${formatRawMetricValue(open.denominator)} anomalies du périmètre courant.</p></div>
    <div class="hero-facts"><div><strong>${formatMetricValue(total)}</strong><span>stock total</span></div><div><strong>${formatMetricValue(inProgress)}</strong><span>en cours</span></div><div><strong>${formatMetricValue(done)}</strong><span>terminées</span></div></div>
  </section>

  <section class="section-heading"><div><p class="eyebrow">Stock</p><h2>État des anomalies</h2></div><span class="badge">${qualityLabel(total.reliability.status)}</span></section>
  <section class="kpi-grid anomaly-kpi-grid">
    ${metricCard('Total', total, denominatorLabel(total), 'anomalies.html')}
    ${metricCard('Ouvertes', open, ratioLabel(open), 'anomalies.html?status=open')}
    ${metricCard('En cours', inProgress, ratioLabel(inProgress), 'anomalies.html?status=in_progress')}
    ${metricCard('Terminées', done, ratioLabel(done), 'anomalies.html?status=done')}
    ${metricCard('Corrigées', corrected, ratioLabel(corrected), 'anomalies.html?corrected=true')}
  </section>

  <section class="section-heading"><div><p class="eyebrow">États complémentaires</p><h2>Historique observable dans le snapshot</h2></div><span class="badge">pas un flux temporel</span></section>
  <section class="content-grid synthesis-two">
    ${flowMetricPanel('Déjà corrigées', corrected, 'anomalies.html?corrected=true', corrected.definition)}
    ${flowMetricPanel('Actuellement rouvertes', reopened, 'anomalies.html?status=reopened', reopened.definition)}
    ${flowMetricPanel('Annulées', cancelled, 'anomalies.html?status=cancelled', cancelled.definition)}
  </section>

  <article class="panel" id="history-coverage" aria-labelledby="history-coverage-heading">
    <div class="panel-heading"><div><p class="eyebrow">Qualité des données</p><h2 id="history-coverage-heading">Couverture des historiques et dates de correction</h2></div><span class="badge">${coverage.issuesWithHistory} / ${coverage.issuesTotal} issues avec historique</span></div>
    <p>${coverage.issuesWithoutHistory} issues sans transition de statut Project observable. ${coverage.correctionDatesAvailable} / ${coverage.anomaliesTotal} anomalies disposent d’une date de correction calculable (Done ou clôture estimée).</p>
    <p class="muted">Motifs d’indisponibilité : ${coverage.reasons.no_project_history} sans historique projet, ${coverage.reasons.no_done_transition} sans transition Done, ${coverage.reasons.multiple_done} avec plusieurs transitions Done. Les estimations de clôture entrent désormais dans le KPI officiel.</p>
    <p class="muted">Une clôture utilisée en repli est une estimation, distincte d’une transition métier Done.</p>
  </article>

  <section class="section-heading"><div><p class="eyebrow">Délais</p><h2>Temps de correction</h2></div><span class="badge">jours calendaires</span></section>
  <section class="kpi-grid anomaly-delay-grid">
    ${metricCard('Délai moyen officiel · global', averageGlobal, `${averageGlobal.numerator} corrections · dates Done et estimées`, 'anomalies.html')}
    ${metricCard('Sans estimation · Done', averageActual, `${averageActual.numerator} corrections · dates métier`, 'anomalies.html')}
    ${metricCard('Estimations seules · clôture', averageEstimated, `${averageEstimated.numerator} corrections · closedAt`, 'anomalies.html')}
  </section>
  <p class="muted">Le délai global est calculé sur toutes les corrections admissibles ; les deux autres indicateurs détaillent les dates métier et les estimations. Les issues annulées et les durées invalides sont exclues.</p>
  <section class="kpi-grid anomaly-delay-grid">
    ${metricCard('Médiane', median, 'délai typique', 'anomalies.html')}
    ${metricCard('P90', p90, '9 anomalies sur 10 au plus', 'anomalies.html')}
    ${metricCard('Plus ancienne ouverte', oldest, 'âge dans le snapshot', 'anomalies.html?status=open')}
  </section>

  <section class="content-grid synthesis-two">
    <article class="panel"><div class="panel-heading"><div><p class="eyebrow">Criticité</p><h2>Couverture et répartition</h2></div><span class="badge">${formatMetricValue(criticalityCoverage)}%</span></div><div class="bars">${criticalityMetricBars(metrics)}</div><p class="panel-note">${formatRawMetricValue(criticalityCoverage.numerator)} / ${formatRawMetricValue(criticalityCoverage.denominator)} anomalies disposent d’une criticité valide. Une anomalie sans criticité reste dans le stock général.</p></article>
    <article class="panel"><div class="panel-heading"><div><p class="eyebrow">Catégories</p><h2>Nature des écarts</h2></div><span class="badge">multi-étiquettes</span></div><div class="bars">${categoryMetricBars(metrics)}</div><p class="panel-note">Une anomalie peut apparaître dans plusieurs catégories. Les réserves DQ n’excluent pas automatiquement l’anomalie du stock général.</p></article>
  </section>

  <article class="panel table-panel">
    <div class="panel-heading"><div><p class="eyebrow">Détail des objets</p><h2>Anomalies suivies</h2></div><span class="badge">${snapshot.normalizedData.anomalies.length} lignes</span></div>
    <div class="filter-bar"><input class="search" data-filter aria-label="Rechercher une anomalie" placeholder="Rechercher une anomalie, un composant, une catégorie..."><select data-filter-repository aria-label="Filtrer par repository"><option value="">Tous les repositories</option>${repositories.map((repository) => `<option value="${escapeHtml(repository)}">${escapeHtml(repository)}</option>`).join('')}</select><select data-filter-criticality aria-label="Filtrer par criticality"><option value="">Toutes les criticités</option><option value="blocking">Bloquante</option><option value="major">Majeure</option><option value="minor">Mineure</option><option value="unknown">Inconnue</option></select><select data-filter-category aria-label="Filtrer par category"><option value="">Toutes les catégories</option>${categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('')}</select><select data-filter-status aria-label="Filtrer par status"><option value="">Tous les états</option><option value="open">Ouverte</option><option value="in_progress">En cours</option><option value="done">Terminée</option><option value="reopened">Rouverte</option><option value="cancelled">Annulée</option></select><button type="button" class="reset-button" data-reset-filters>Réinitialiser</button></div>
    <div class="table-wrap"><table><thead><tr><th>Anomalie</th><th>Repository / composant</th><th>Criticité</th><th>Catégorie</th><th>Origine / audit</th><th>État</th><th>Créée</th><th>Correction métier</th><th>Délai</th><th>Disponibilité date</th><th>PR</th></tr></thead><tbody data-table>${rows}</tbody></table></div>
  </article>

  <article class="panel" id="quality"><div class="panel-heading"><div><p class="eyebrow">Qualité des données</p><h2>Alertes et décisions de calcul</h2></div><span class="badge">${snapshot.dataQuality.issues.length} alertes</span></div><ul class="issue-list">${issues || '<li><div><strong>Aucune alerte</strong><p>Les métriques ne présentent aucune réserve DQ dans ce snapshot.</p></div></li>'}</ul></article>`;
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
  return `<a class="panel metric-explainer flow-panel" href="${href}"><div class="panel-heading"><div><p class="eyebrow">État</p><h2>${title}</h2></div><span class="badge">${qualityLabel(metric.reliability.status)}</span></div><strong class="metric-big">${formatMetricValue(metric)}</strong><p class="metric-ratio">${ratioLabel(metric)}</p><p>${escapeHtml(definition)}</p></a>`;
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
function issuesExplorerContent(
  snapshot: Snapshot,
  githubUrl?: string,
  componentPrefix = 'Component:'
): string {
  const repositories = new Map(snapshot.rawData.repositories.map((item) => [item.id, item]));
  const items = issueFacts(snapshot).map((fact) => {
    const issue = snapshot.normalizedData.issues?.find((item) => item.issueId === fact.id);
    const repository = issue ? repositories.get(issue.repositoryId) : undefined;
    const url = /^https:\/\/[^\s]+$/.test(fact.url)
      ? fact.url
      : repository
        ? `${(githubUrl ?? 'https://github.com').replace(/\/+$/, '')}/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/issues/${fact.number}`
        : '';
    return { ...fact, url };
  });
  const payload = JSON.stringify({ items, componentPrefix }).replace(/</g, '\\u003c');
  return `${teamActivityContent(snapshot)}<section class="issues-explorer" data-issues-explorer><h2>Analyse des issues · activité Squad / PO / AM</h2>
    <div class="issue-kpis" aria-live="polite">${[
      ['global', 'Issues · périmètre filtré', 'Done + Closed, dates réelles ou estimées'],
      ['done', 'Sans estimation', 'Dernière transition Done'],
      ['estimated', 'Estimations seules', 'Clôtures GitHub']
    ]
      .map(
        ([name, title, description]) =>
          `<article class="issue-kpi"><span>${title}</span><div class="issue-kpi-stats">${[
            ['average', 'Moyenne'],
            ['median', 'Médiane'],
            ['p90', 'P90']
          ]
            .map(
              ([stat, label]) =>
                `<div><small>${label}</small><strong data-issue-kpi="${name}-${stat}">—</strong></div>`
            )
            .join('')}</div><small data-issue-count="${name}">${description}</small></article>`
      )
      .join('')}</div>
    <section class="panel issue-filters" aria-label="Filtres des issues"><div class="panel-heading"><h2>Filtres et recherche</h2><button class="reset-button" type="button" data-issue-reset>Réinitialiser</button></div>
    <div class="issue-filter-grid"><label>Recherche globale<input class="search" data-issue-search placeholder="Numéro, titre, label…"></label><label>Repository<select data-issue-filter="repo"><option value="">Tous</option></select></label><label>Label<select data-issue-filter="label"><option value="">Tous</option></select></label><label>Issue type<select data-issue-filter="type"><option value="">Tous</option></select></label><label>Famille métier<select data-issue-filter="family"><option value="">Toutes</option><option value="audit">Audit</option><option value="audit_anomaly">Anomalie d’audit</option><option value="anomaly">Défaut hors audit ou origine non résolue</option><option value="improvement">Improvement</option><option value="other">Autre issue / bug non qualifié</option></select></label><label>Statut<select data-issue-filter="status"><option value="">Tous</option><option value="open">Ouvertes / en cours</option><option value="closed">Done ET Closed</option><option value="cancelled">Cancelled</option></select></label><label>État GitHub<select data-issue-filter="githubState"><option value="">Tous</option><option value="OPEN">OPEN</option><option value="CLOSED">CLOSED</option></select></label><label>Tri<select data-issue-sort><option value="repo">Repository</option><option value="number">Numéro</option><option value="age">Ancienneté ouverte</option><option value="delay">Délai de traitement</option></select></label></div>
    <div class="issue-actions"><label><input type="checkbox" data-issue-components> Labels du composant uniquement</label><button class="reset-button" type="button" data-issue-dedupe aria-pressed="false">Dédoublonner par repo / issue</button><button class="reset-button" type="button" data-issue-clear-selection>Réinitialiser la sélection</button><button class="reset-button" type="button" data-issue-export>Exporter CSV</button></div>
    <p class="muted" data-issue-summary></p></section>
    <article class="panel table-panel"><div class="panel-heading"><h2>Issues GitHub · audits, anomalies et autres issues</h2><span class="badge">Tri et recherche par colonne</span></div><div class="table-wrap issue-table-wrap" tabindex="0" role="region" aria-label="Tableau défilant"><table class="issue-table"><thead><tr><th><input type="checkbox" data-issue-select-all aria-label="Sélectionner les issues affichées"></th>${['Repository', 'Issue', 'Label', 'Issue type', 'Statut', 'État GitHub', 'Nb PR', 'Délai issue', 'Ancienneté ouverte', 'Composants', 'Statut Project', 'Itération', 'Velocity source'].map((name, i) => `<th><button type="button" data-issue-column-sort="${i}" aria-label="Trier par ${name}">${name} ↕</button><input class="issue-column-filter" data-issue-column="${i}" aria-label="Filtrer ${name}" placeholder="Filtrer…"></th>`).join('')}</tr></thead><tbody data-issue-rows></tbody></table></div></article>
    <script type="application/json" id="issue-explorer-data">${payload}</script>
  </section>`;
}

/** Synthèse consolidée par composant et repository. */
function componentsExplorerContent(
  snapshot: Snapshot,
  githubUrl?: string,
  componentPrefix = 'Component:'
): string {
  const libraries = new Map(snapshot.normalizedData.libraries.map((library) => [library.libraryId, library]));
  const issues = snapshot.normalizedData.issues ?? [];
  // Les labels des issues sont la source de vérité pour découvrir les composants.
  // Le catalogue normalisé enrichit ces entrées, mais ne limite pas leur périmètre.
  const prefix = componentPrefix.trim().toLocaleLowerCase('fr');
  const discovered = new Map<string, { libraryId: string; name: string; componentId?: string }>();
  for (const issue of issues) {
    for (const label of issue.labels) {
      if (!prefix || !label.toLocaleLowerCase('fr').startsWith(prefix)) continue;
      const name = label.slice(componentPrefix.trim().length).trim();
      if (!name) continue;
      const key = `${issue.libraryId}::${name.toLocaleLowerCase('fr')}`;
      if (!discovered.has(key)) discovered.set(key, { libraryId: issue.libraryId, name });
    }
  }
  for (const component of snapshot.normalizedData.components) {
    const key = `${component.libraryId}::${component.name.toLocaleLowerCase('fr')}`;
    const found = discovered.get(key);
    if (found && (!found.componentId || component.status === 'active'))
      found.componentId = component.componentId;
    else if (!found)
      discovered.set(key, {
        libraryId: component.libraryId,
        name: component.name,
        componentId: component.componentId
      });
  }
  const rows = [...discovered.values()].map((component) => {
    const library = libraries.get(component.libraryId);
    const matchingLabel = `${componentPrefix.trim()}${component.name}`.toLocaleLowerCase('fr');
    const related = issues.filter(
      (issue) =>
        issue.libraryId === component.libraryId &&
        ((component.componentId && issue.componentIds.includes(component.componentId)) ||
          issue.labels.some((label) => label.toLocaleLowerCase('fr') === matchingLabel))
    );
    const audits = snapshot.normalizedData.audits.filter(
      (audit) =>
        (component.componentId && audit.componentId === component.componentId) ||
        related.some((issue) => issue.issueId === audit.issueId)
    );
    const latest =
      latestCompletedAudit(audits, snapshot.normalizedData.issues ?? []) ??
      audits.find((audit) => !isCompletedAudit(audit, snapshot.normalizedData.issues ?? []));
    const items = related.map((issue) => {
      const fact = issueFacts(snapshot).find((item) => item.id === issue.issueId)!;
      return {
        ...fact,
        open: fact.status === 'open',
        cancelled: fact.status === 'cancelled',
        treated: fact.status === 'closed'
      };
    });
    const versionSummaries = (snapshot.normalizedData.componentVersions ?? [])
      .filter((relation) => relation.componentId === component.componentId)
      .map((relation) => ({
        version:
          snapshot.normalizedData.versions?.find((version) => version.versionId === relation.versionId)
            ?.number ?? '',
        versionId: relation.versionId,
        conformity: relation.verdict ?? 'NON_COUVERT',
        auditIds: relation.applicableAuditIds ?? []
      }))
      .sort((a, b) => a.version.localeCompare(b.version, undefined, { numeric: true }));
    const current = versionSummaries.at(-1);
    const facts = issueFacts(snapshot);
    const auditSources = audits
      .map((audit) => ({
        id: audit.auditId,
        url: facts.find((fact) => fact.id === audit.issueId)?.url ?? '',
        version: auditVersionLabel(audit, snapshot),
        status: audit.lifecycle ?? audit.status,
        completedAt: audit.completedAt ?? ''
      }))
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
    return {
      id: `${component.libraryId}:${component.name.toLocaleLowerCase('fr')}`,
      componentId: component.componentId,
      repository: library?.repository ?? component.libraryId,
      name: component.name,
      audits: audits.length,
      version: current?.version ?? '',
      auditStatus: latest?.lifecycle ?? latest?.status ?? 'non audité',
      conformity: current?.conformity ?? 'NON_COUVERT',
      versionSummaries,
      githubLinks: componentGithubLinks(
        snapshot,
        component.libraryId,
        component.name,
        componentPrefix,
        related,
        githubUrl
      ),
      latestAuditUrl: facts.find((fact) => fact.id === latest?.issueId)?.url ?? '',
      latestAuditId: latest?.auditId ?? '',
      auditSources,
      items
    };
  });
  const payload = JSON.stringify(rows).replace(/</g, '\\u003c');
  return `<section class="issues-explorer" data-component-analysis><p class="panel">Les liens chiffrés ouvrent une recherche GitHub sur les données actuelles du repository. Recherches approchées : « Ouvertes » utilise l’état GitHub ; « Traitées » utilise Closed avec motif completed, sans vérifier Done dans Project ; « Annulées » utilise le motif not planned, distinct de Cancelled dans Project. Les PR sont recherchées par références d’issues dans leur description : les liens manuels seuls peuvent manquer. Les grandes listes de PR proposent plusieurs recherches courtes pour conserver toutes les références. Les compteurs restent ceux du snapshot. Dernier audit et conformité ouvrent leurs audits justificatifs.</p>
    <div class="issue-kpis" aria-live="polite">${[
      ['global', 'Global · Officiel'],
      ['done', 'Sans estimation'],
      ['estimated', 'Estimations seules']
    ]
      .map(
        ([key, title]) =>
          `<article class="issue-kpi"><span>${title}</span><div class="issue-kpi-stats">${[
            ['average', 'Moyenne'],
            ['median', 'Médiane'],
            ['p90', 'P90']
          ]
            .map(
              ([stat, label]) =>
                `<div><small>${label}</small><strong data-component-kpi="${key}-${stat}">—</strong></div>`
            )
            .join('')}</div><small data-component-count="${key}">0 issue</small></article>`
      )
      .join('')}</div>
    <section class="panel issue-filters" aria-label="Filtres des composants"><div class="panel-heading"><h2>Filtres et recherche</h2><button type="button" class="reset-button" data-component-reset>Réinitialiser</button></div><div class="issue-filter-grid"><label>Recherche<input class="search" data-component-search placeholder="Composant, repository…"></label><label>Repository<select data-component-filter="repository"><option value="">Tous</option></select></label><label>Composant<select data-component-filter="name"><option value="">Tous</option></select></label><label>État de l'audit<select data-component-filter="auditStatus"><option value="">Tous</option></select></label><label>Conformité<select data-component-filter="conformity"><option value="">Tous</option></select></label><label>Version d'audit<select data-component-filter="version"><option value="">Toutes</option></select></label><label>Issues ouvertes<select data-component-filter="open"><option value="">Toutes</option><option value="yes">Avec issues ouvertes</option><option value="no">Sans issue ouverte</option></select></label></div><div class="issue-actions"><button class="reset-button" data-component-clear type="button">Réinitialiser la sélection</button><button class="reset-button" data-component-export type="button">Exporter CSV</button></div><p class="muted" data-component-summary></p></section>
    <article class="panel table-panel"><div class="panel-heading"><h2>Composants par repository</h2><span class="badge">Une ligne par composant</span></div><div class="table-wrap issue-table-wrap"><table class="issue-table"><thead><tr><th><input type="checkbox" data-component-all aria-label="Sélectionner les composants visibles"></th>${['Repository', 'Composant', 'Issues', 'Ouvertes', 'Traitées', 'Annulées', 'PR', 'Audits', 'Dernier audit', 'Conformité', 'Plus ancienne ouverte', 'Ancienneté maximale', 'Délai moyen'].map((label, i) => `<th><button type="button" data-component-sort="${i}" aria-label="Trier par ${label}">${label} ↕</button><input class="issue-column-filter" data-component-column="${i}" aria-label="Filtrer ${label}" placeholder="Filtrer…"></th>`).join('')}</tr></thead><tbody data-component-rows></tbody></table></div></article><script type="application/json" id="component-analysis-data">${payload}</script>
  </section>`;
}

/** Transforme une référence interne en lien GitHub lorsque l'URL est disponible. */
function githubReference(snapshot: Snapshot, reference: string, githubUrl?: string): string {
  const baseUrl = (githubUrl ?? 'https://github.com').replace(/\/+$/, '');
  for (const repository of snapshot.rawData.repositories) {
    const issue = repository.issues.find((candidate) => candidate.id === reference);
    if (issue)
      return `<a class="text-link" href="${baseUrl}/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/issues/${issue.number}" target="_blank" rel="noopener noreferrer">${escapeHtml(reference)}</a>`;
    const pullRequest = repository.pullRequests.find((candidate) => candidate.id === reference);
    if (pullRequest)
      return `<a class="text-link" href="${baseUrl}/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/pull/${pullRequest.number}" target="_blank" rel="noopener noreferrer">${escapeHtml(reference)}</a>`;
  }
  return escapeHtml(reference);
}

/** Construit un lien vers un repository ou retourne son nom si GitHub est absent. */
function repositoryReference(snapshot: Snapshot, repositoryName: string, githubUrl?: string): string {
  const repository = snapshot.rawData.repositories.find((candidate) => candidate.name === repositoryName);
  if (!repository) return escapeHtml(repositoryName);
  return `<a class="text-link" href="${(githubUrl ?? 'https://github.com').replace(/\/+$/, '')}/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}" target="_blank" rel="noopener noreferrer">${escapeHtml(repositoryName)}</a>`;
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
    return `<div class="quality-target"><span class="quality-target-label">Cible : anomalie ${escapeHtml(issue.entityId)}</span>${source ? `<span>Source : ${githubReference(snapshot, source, githubUrl)}</span>` : '<span>Aucune source GitHub disponible</span>'}</div>`;
  }
  if (issue.entityType === 'component') {
    const component = snapshot.normalizedData.components.find(
      (candidate) => candidate.componentId === issue.entityId
    );
    const source = component?.provenance.sourceId;
    const copyButton =
      issue.ruleId === 'DQ-006' && component
        ? `<button type="button" class="text-link copy-button" data-copy-yaml="${encodeURIComponent(catalogueYaml(component))}">Copier le YAML</button><span class="copy-feedback" aria-live="polite"></span>`
        : '';
    return `<div class="quality-target"><span class="quality-target-label">Cible : composant ${escapeHtml(component?.name ?? issue.entityId)}</span>${source ? `<span>Ouvrir la source : ${githubReference(snapshot, source, githubUrl)}</span>` : '<span>Aucune source GitHub disponible</span>'}${copyButton}</div>`;
  }
  if (issue.entityType === 'pull_request') {
    return `<div class="quality-target"><span class="quality-target-label">Cible : pull request</span><span>Ouvrir la source : ${githubReference(snapshot, issue.entityId, githubUrl)}</span></div>`;
  }
  return `<div class="quality-target"><span class="quality-target-label">Cible : ${escapeHtml(issue.entityType)}</span><span>Aucune source GitHub disponible (${escapeHtml(issue.entityId)})</span></div>`;
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
    if (!anomaly.componentId) continue;
    const list = anomaliesByComponent.get(anomaly.componentId) ?? [];
    list.push(anomaly);
    anomaliesByComponent.set(anomaly.componentId, list);
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
            .map(
              (issue) =>
                `<a class="map-node issue-node" data-map-node data-map-kind="issue" ${contextAttribute(issueFacts(snapshot).find((fact) => fact.id === issue.issueId))} href="${escapeHtml(/^https:\/\/[^\s]+$/.test(issue.url) ? issue.url : '#traceability')}" target="_blank" rel="noopener noreferrer"><span class="node-dot"></span><div><strong>#${issue.number} · ${escapeHtml(issue.title)}</strong><small>${escapeHtml(issue.rawIssueType ?? issue.issueType ?? 'Type inconnu')} · ${escapeHtml(issue.state)}</small></div></a>`
            )
            .join('');
          const open = anomalies.filter((item) =>
            ['open', 'reopened', 'in_progress'].includes(item.status)
          ).length;
          const auditNode = audit
            ? `<div class="map-node audit-node" data-map-node data-map-kind="audit" ${contextAttribute(issueFacts(snapshot).find((fact) => fact.id === audit?.issueId))}><span class="node-dot"></span><div><strong>Audit ${escapeHtml(audit.version)}</strong><small>${isCompletedAudit(audit, snapshot.normalizedData.issues ?? []) ? auditStatusLabel(audit.objectiveAuditResult) : auditStatusLabel(audit.status)} · ${escapeHtml(audit.status)}</small></div><span class="state state-${isCompletedAudit(audit, snapshot.normalizedData.issues ?? []) ? audit.objectiveAuditResult : audit.status}">${auditStatusLabel(isCompletedAudit(audit, snapshot.normalizedData.issues ?? []) ? audit.objectiveAuditResult : audit.status)}</span></div>`
            : `<div class="map-node audit-node muted-node" data-map-node data-map-kind="audit"><span class="node-dot"></span><div><strong>Audit</strong><small>Aucun audit disponible</small></div><span class="state state-unknown">non audité</span></div>`;
          const anomalyNodes = anomalies
            .map((anomaly) => {
              const issueLabel = anomaly.provenance.sourceId ?? anomaly.anomalyId;
              const prs = anomaly.pullRequestRefs
                .map(
                  (reference) =>
                    `<a class="map-node pr-node" data-map-node data-map-kind="pr" href="${githubReferenceHref(snapshot, reference, githubUrl)}"><span class="node-dot"></span><div><strong>${escapeHtml(reference)}</strong><small>PR liée à ${escapeHtml(issueLabel)}</small></div><span class="state state-merged">PR</span></a>`
                )
                .join('');
              return `<div class="map-branch"><a class="map-node anomaly-node" data-map-node data-map-kind="anomaly" ${contextAttribute(issueFacts(snapshot).find((fact) => fact.id === anomaly.issueId))} href="anomalies.html?anomaly=${encodeURIComponent(anomaly.anomalyId)}"><span class="node-dot"></span><div><strong>${escapeHtml(issueLabel)}</strong><small>Anomalie · ${anomaly.cancelled ? 'annulée' : anomalyStatusLabel(anomaly.status)} · ${criticalityLabel(anomaly.criticality)}</small></div><span class="state state-${anomaly.cancelled ? 'cancelled' : anomaly.status}">${anomaly.cancelled ? 'annulée' : anomalyStatusLabel(anomaly.status)}</span></a>${prs ? `<div class="map-edge">PR</div>${prs}` : '<div class="map-edge muted">aucune PR liée</div>'}</div>`;
            })
            .join('');
          return `<div class="map-component" data-map-component data-component="${escapeHtml(component.name)}" data-component-id="${escapeHtml(component.componentId)}" data-search="${escapeHtml(`${library.name} ${component.name} ${component.componentId}`.toLowerCase())}">
        <div class="map-node component-node" data-map-node data-map-kind="component" ${contextAttribute({ repository: library.repository, components: [component.name], componentIds: [component.componentId], versions: (snapshot.normalizedData.componentVersions ?? []).filter((relation) => relation.componentId === component.componentId).map((relation) => snapshot.normalizedData.versions?.find((version) => version.versionId === relation.versionId)?.number) })}><span class="node-dot"></span><div><strong>${escapeHtml(component.name)}</strong><small>Composant · ${escapeHtml(component.componentId)}</small></div><span class="tag tag-${component.dataQualityStatus}">${qualityLabel(component.dataQualityStatus)}</span></div>
        <div class="map-edge">Audit</div>${auditNode}
        <div class="map-edge">${componentIssues.length} issue${componentIssues.length > 1 ? 's' : ''} (tous types)</div>
        <div class="map-issues">${issueNodes || '<p class="muted map-empty">Aucune issue associée.</p>'}</div>
        <div class="map-edge">Anomalies du composant, liens d’audit explicites dans la table · ${anomalies.length} anomalie${anomalies.length > 1 ? 's' : ''} · ${open} ouverte${open > 1 ? 's' : ''}</div>
        <div class="map-anomalies">${anomalyNodes || '<p class="muted map-empty">Aucune anomalie associée au composant ; aucun rattachement automatique à l’audit.</p>'}</div>
      </div>`;
        })
        .join('');
      return `<section class="map-repository" data-map-repository data-repository="${escapeHtml(library.repository)}" data-search="${escapeHtml(`${library.name} ${library.repository}`.toLowerCase())}">
      <div class="map-node repository-node" data-map-node data-map-kind="repository" ${contextAttribute({ repository: library.repository })}><span class="node-dot"></span><div><strong>${repositoryReference(snapshot, library.name, githubUrl)}</strong><small>${escapeHtml(library.repository)} · ${components.length} composant${components.length > 1 ? 's' : ''}</small></div><span class="tag tag-${library.dataQualityStatus}">${qualityLabel(library.dataQualityStatus)}</span></div>
      <div class="map-edge">Contient</div>
      <div class="map-components">${componentSections || '<p class="muted map-empty">Aucun composant actif.</p>'}</div>
    </section>`;
    })
    .join('');

  return `<section class="hero-band synthesis-hero">
    <div><p class="eyebrow">Chaîne de traçabilité</p><h2>Repository → composant → issues / audit → anomalie → PR</h2><p>Les issues de tous types sont représentées ; les anomalies restent une vue spécialisée. Chaque relation est issue du snapshot courant. Un composant non audité reste visible et une anomalie sans PR n’est pas interprétée comme corrigée.</p></div>
    <div class="hero-facts"><div><strong>${formatMetricValue(repositoriesMetric)}</strong><span>repositories</span></div><div><strong>${formatMetricValue(componentsMetric)}</strong><span>composants actifs</span></div><div><strong>${formatMetricValue(openMetric)}</strong><span>anomalies ouvertes</span></div></div>
  </section>
  <section class="section-heading"><div><p class="eyebrow">Lecture</p><h2>Cartographie exploitable</h2></div><span class="badge">${formatMetricValue(auditedMetric)} composants audités</span></section>
  <section class="panel graph-toolbar"><input class="search" data-map-filter aria-label="Rechercher dans la cartographie" placeholder="Rechercher un repository, composant, audit, anomalie ou PR"><select data-map-kind-filter aria-label="Niveau de la cartographie"><option value="">Tous les niveaux</option><option value="repository">Repositories</option><option value="component">Composants</option><option value="audit">Audits</option><option value="issue">Issues (tous types)</option><option value="anomaly">Anomalies</option><option value="pr">Pull requests</option></select><button type="button" class="reset-button" data-map-reset>Réinitialiser</button></section>
  <section class="map-legend"><span class="legend-repository">Repository</span><span class="legend-component">Composant</span><span class="legend-audit">Audit</span><span>Issue</span><span class="legend-anomaly">Anomalie</span><span class="legend-pr">PR</span></section>
  <article class="panel table-panel"><div class="panel-heading"><div><p class="eyebrow">Relations du snapshot</p><h2>Patrimoine et chaîne de preuve</h2></div><span class="badge">${snapshot.normalizedData.anomalies.length} anomalies</span></div><div class="map-canvas">${repositorySections || '<p class="muted">Aucune relation disponible.</p>'}</div></article>
  <article class="panel table-panel" id="map-quality"><div class="panel-heading"><div><p class="eyebrow">Qualité des données</p><h2>Réserves susceptibles d’affecter la cartographie</h2></div><span class="badge">${snapshot.dataQuality.issues.length} alertes</span></div><ul class="issue-list">${snapshot.dataQuality.issues.map((issue) => `<li><div><strong>${escapeHtml(issue.ruleId)} · ${escapeHtml(issue.message)}</strong><p>${escapeHtml(issue.entityType)} · ${escapeHtml(issue.entityId)}</p></div><span class="tag tag-${issue.severity === 'ERROR' ? 'error' : 'warning'}">${severityLabel(issue.severity)}</span></li>`).join('') || '<li><div><strong>Aucune alerte</strong><p>La cartographie ne présente aucune réserve DQ.</p></div></li>'}</ul></article>`;
}

/**
 * Réalise le traitement « github reference href » dans le pipeline de qualité.
 *
 * @param snapshot - Valeur de « snapshot » utilisée par ce traitement.
 * @param reference - Valeur de « reference » utilisée par ce traitement.
 * @param githubUrl - Valeur de « githubUrl » utilisée par ce traitement.
 * @returns Valeur textuelle produite.
 */
function githubReferenceHref(snapshot: Snapshot, reference: string, githubUrl?: string): string {
  if (!githubUrl) return '#';
  const baseUrl = githubUrl.replace(/\/+$/, '');
  for (const repository of snapshot.rawData.repositories) {
    const pullRequest = repository.pullRequests.find((candidate) => candidate.id === reference);
    if (pullRequest)
      return `${baseUrl}/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/pull/${pullRequest.number}`;
  }
  return '#';
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
    if (!anomaly.componentId) continue;
    const list = anomaliesByComponent.get(anomaly.componentId) ?? [];
    list.push(anomaly);
    anomaliesByComponent.set(anomaly.componentId, list);
  }
  const repositoriesWithComponents = libraries.map((library) => {
    const components = activeComponents.filter((component) => component.libraryId === library.libraryId);
    const audited = components.filter((component) => {
      const relation = latestComponentVersion(snapshot.normalizedData, component.componentId);
      return relation && relation.verdict !== 'NON_COUVERT';
    }).length;
    const conform = components.filter(
      (component) =>
        latestComponentVersion(snapshot.normalizedData, component.componentId)?.verdict === 'CONFORME'
    ).length;
    const anomalies = components.flatMap(
      (component) => anomaliesByComponent.get(component.componentId) ?? []
    );
    const open = anomalies.filter((anomaly) =>
      ['open', 'reopened', 'in_progress'].includes(anomaly.status)
    ).length;
    return { library, components, audited, conform, anomalies: anomalies.length, open };
  });

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
      return `<tr data-audit-row ${contextAttribute(issueFacts(snapshot).find((fact) => fact.id === audit.issueId))} data-audit-result="${view?.verdict ?? ''}" data-audit-status="${audit.status}" data-progress="${view?.progress ?? audit.lifecycle ?? 'pending'}" data-audit-version="${escapeHtml(auditVersionLabel(audit, snapshot))}"><td>${repositoryReference(snapshot, library?.name ?? 'repository inconnu', githubUrl)}</td><td><strong>${escapeHtml(component?.name ?? audit.componentId)}</strong><small>${escapeHtml(audit.sourceIssueId)}</small></td><td><span class="state state-${audit.status}">${auditStatusLabel(audit.status)}</span></td><td>${escapeHtml(auditVersionLabel(audit, snapshot))}<small>RC effectivement auditée : ${escapeHtml(audit.auditedReleaseCandidate ?? 'non déterminée / audit PROD selon la source')}</small></td><td>${anomalies.length}${relations.unresolved.length ? `<small>${relations.unresolved.length} non attribuée(s) à cet audit</small>` : ''}</td><td>${anomalies.filter((item) => ['open', 'reopened', 'in_progress'].includes(item.status)).length}</td><td>${qualityLabel(audit.dataQualityStatus)}${view && !view.versionKnown ? '<small>Version canonique non reliée</small>' : ''}</td></tr>`;
    })
    .join('');

  const repositoryRowsV2 = repositoriesWithComponents
    .map(({ library, components, audited, conform, anomalies, open }) => {
      const repositoryCoverage = components.length ? `${audited}/${components.length}` : '0/0';
      return `<tr><td>${repositoryReference(snapshot, library.name, githubUrl)}<small>${escapeHtml(library.repository)}</small></td><td>${components.length}</td><td>${repositoryCoverage}</td><td>${conform}/${audited || 0}</td><td>${anomalies}</td><td>${open}</td><td><span class="tag tag-${library.dataQualityStatus}">${qualityLabel(library.dataQualityStatus)}</span></td></tr>`;
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
      const verdict = relation.verdict ?? 'NON_COUVERT';
      const auditIds = relation.applicableAuditIds ?? [];
      return `<tr ${contextAttribute({ repository: library?.repository, components: [component?.name], componentIds: [relation.componentId], versions: [version?.number], versionIds: [relation.versionId], auditIds: relation.applicableAuditIds ?? [] })} data-component-version-row data-component="${escapeHtml(component?.name ?? relation.componentId)}" data-version="${escapeHtml(version?.number ?? relation.versionId)}" data-repository="${escapeHtml(library?.repository ?? '')}" data-verdict="${verdict}"><td>${repositoryReference(snapshot, library?.name ?? 'repository inconnu', githubUrl)}</td><td><strong>${escapeHtml(component?.name ?? relation.componentId)}</strong><small>${escapeHtml(relation.componentId)}</small></td><td>${escapeHtml(version?.number ?? relation.versionId)}</td><td><span class="state state-${verdict.toLowerCase().replace('_', '-')}">${componentVersionVerdictLabel(verdict)}</span></td><td>${auditIds.length ? auditIds.map((id) => `<a href="audits.html?audit=${encodeURIComponent(id)}">${escapeHtml(id)}</a>${snapshot.normalizedData.audits.find((audit) => audit.auditId === id)?.versionId !== relation.versionId ? ' <span class="tag">hérité</span>' : ' <span class="tag">direct</span>'}`).join('<br>') : '—'}</td><td><span class="tag tag-${relation.dataQualityStatus}">${qualityLabel(relation.dataQualityStatus)}</span></td></tr>`;
    })
    .join('');

  return `<section class="hero-band synthesis-hero">
    <div><p class="eyebrow">Périmètre auditable</p><h2>${formatMetricValue(componentVersionsMetric)} couples Component × Version historisés</h2><p>Le verdict est celui calculé par Analytics V2 à partir des Audits terminés applicables. NON_COUVERT reste distinct de NON_CONFORME.</p></div>
    <div class="hero-facts"><div><strong>${formatMetricValue(auditedMetric)}</strong><span>Component × Version couverts</span></div><div><strong>${formatMetricValue(coverage)}%</strong><span>couverture</span></div><div><strong>${formatMetricValue(conformity)}%</strong><span>conformité des couples couverts</span></div></div>
  </section>

  <section class="section-heading"><div><p class="eyebrow">Indicateurs</p><h2>Couverture et résultats</h2></div><span class="badge">${qualityLabel(coverage.reliability.status)}</span></section>
  <section class="kpi-grid synthesis-grid">
    ${metricCard('Composants actifs', componentsMetric, denominatorLabel(componentsMetric), 'audits.html')}
    ${metricCard('Component × Version', componentVersionsMetric, denominatorLabel(componentVersionsMetric), 'audits.html#component-versions')}
    ${metricCard('Couverture Component × Version', coverage, ratioLabel(coverage), 'audits.html#component-versions')}
    ${metricCard('Audits terminés', completedMetric, denominatorLabel(completedMetric), 'audits.html?progress=completed')}
    <article class="kpi-card"><span class="kpi-label">Audits en cours</span><strong>${formatMetricValue(metricOrUnknown(metrics, 'audit.ongoing'))}</strong><span class="kpi-definition">Statut métier in_progress, toutes versions</span></article>
    <article class="kpi-card"><span class="kpi-label">Audits non évalués</span><strong>${formatMetricValue(metricOrUnknown(metrics, 'audit.pending'))}</strong><span class="kpi-definition">Sans résultat de conformité</span></article>
    ${metricCard('Couples conformes', conformCouples, ratioLabel(conformCouples), 'audits.html#component-versions')}
    ${metricCard('Audits annulés', metricOrUnknown(metrics, 'audit.cancelled'), 'Annulation, aucun verdict', 'audits.html?progress=cancelled')}
    ${metricCard('Conformité Component × Version', conformity, ratioLabel(conformity), 'audits.html#component-versions')}
  </section>

  <section class="content-grid synthesis-two">
    <article class="panel"><div class="panel-heading"><div><p class="eyebrow">Résultats</p><h2>État des audits terminés</h2></div><span class="badge">${formatMetricValue(completedMetric)} terminés</span></div><div class="bars">${linkedBar('conformes', conform.value, 'audits.html?result=conform')}${linkedBar('conditionnels', conditional.value, 'audits.html?result=conditional')}${linkedBar('non conformes', nonConform.value, 'audits.html?result=non_conform')}${linkedBar('critiques', critical.value, 'audits.html?result=critical')}</div><p class="panel-note">Les résultats portent uniquement sur les audits terminés ; la couverture du patrimoine est présentée séparément.</p></article>
    <article class="panel"><div class="panel-heading"><div><p class="eyebrow">Lecture d’un composant</p><h2>Composant → audit → anomalies</h2></div><span class="badge">traçabilité</span></div><p class="panel-note">Chaque ligne ci-dessous relie le composant à son audit et aux anomalies qui lui sont rattachées. Les anomalies restent visibles même lorsqu’elles ont une réserve de qualité.</p><div class="chain-legend"><span>Composant</span><span>Audit</span><span>Anomalies</span></div></article>
  </section>

  <article class="panel table-panel"><div class="panel-heading"><div><p class="eyebrow">Patrimoine actif</p><h2>Composant → audit → anomalies</h2></div><span class="badge">${activeComponents.length} composants actifs</span></div><div class="filter-bar"><input class="search" data-component-filter aria-label="Rechercher un composant" placeholder="Rechercher un composant, repository ou anomalie..."><select data-component-result aria-label="Résultat du composant"><option value="">Tous les résultats</option><option value="audited">Audité</option><option value="not_audited">Non audité</option><option value="conform">Conforme</option><option value="conditional">Conditionnel</option><option value="non_conform">Non conforme</option><option value="critical">Critique</option></select><button type="button" class="reset-button" data-reset-component-filters>Réinitialiser</button></div><div class="table-wrap"><table><thead><tr><th>Repository</th><th>Composant</th><th>Audit</th><th>Résultat</th><th>Anomalies</th><th>Ouvertes / en cours</th><th>Qualité</th></tr></thead><tbody data-component-table>${componentRows}</tbody></table></div></article>

  <article class="panel table-panel" id="component-versions"><div class="panel-heading"><div><p class="eyebrow">Historique du catalogue</p><h2>Verdict par Component × Version</h2></div><span class="badge">${snapshot.normalizedData.componentVersions?.length ?? 0} relations</span></div><p class="panel-note">Cette vue restitue le verdict Analytics V2 sans le recalculer dans le dashboard. Les Audits applicables sont ceux retenus par D-220 à D-228.</p><div class="filter-bar"><select data-component-version-verdict aria-label="Verdict composant par version"><option value="">Tous les verdicts</option><option value="CONFORME">Conforme</option><option value="NON_CONFORME">Non conforme</option><option value="NON_COUVERT">Non couvert</option></select></div><div class="table-wrap"><table><thead><tr><th>Repository</th><th>Composant</th><th>Version PROD</th><th>Verdict</th><th>Audits applicables</th><th>Qualité</th></tr></thead><tbody data-component-version-table>${componentVersionRows || '<tr><td colspan="6">Aucune relation Component × Version matérialisée.</td></tr>'}</tbody></table></div></article>

  <article class="panel table-panel"><div class="panel-heading"><div><p class="eyebrow">Audits réalisés</p><h2>Traçabilité de chaque audit, par version</h2></div><span class="badge">${snapshot.normalizedData.audits.length} audits · ${ongoingAudits.length} en cours</span></div><p class="panel-note">Seules les anomalies rattachées explicitement à chaque audit sont comptées. Les anomalies du même composant sans lien prouvé sont signalées, mais non attribuées à cet audit.</p><div class="filter-bar"><label>Cycle de vie<select data-audit-progress-filter><option value="">Tous</option><option value="pending">Non évalués</option><option value="ongoing">En cours</option><option value="completed">Terminés</option><option value="cancelled">Annulés</option></select></label><label>Résultat des audits terminés<select data-audit-result-filter><option value="">Tous</option><option value="conform">Conforme</option><option value="non_conform">Non conforme</option><option value="conditional">Conditionnel</option><option value="critical">Critique</option></select></label><button type="button" data-reset-audit-filters>Effacer les filtres d'audit</button></div><div class="table-wrap"><table><thead><tr><th>Repository</th><th>Composant / source</th><th>État de l’audit</th><th>Version cible / artefact audité</th><th>Anomalies liées à l’audit</th><th>Ouvertes / en cours liées à l’audit</th><th>Qualité</th></tr></thead><tbody>${auditRows || '<tr><td colspan="7">Aucun audit dans ce snapshot.</td></tr>'}</tbody></table></div></article>

  <article class="panel table-panel"><div class="panel-heading"><div><p class="eyebrow">Comparaison</p><h2>Couverture des dernières versions PROD par repository</h2></div><span class="badge">${repositoriesWithComponents.length} repositories</span></div><div class="table-wrap"><table><thead><tr><th>Repository</th><th>Composants actifs</th><th>Audités</th><th>Conformes</th><th>Anomalies</th><th>Ouvertes / en cours</th><th>Qualité</th></tr></thead><tbody>${repositoryRowsV2}</tbody></table></div></article>

  <article class="panel" id="quality"><div class="panel-heading"><div><p class="eyebrow">Qualité des données</p><h2>Réserves qui affectent les audits ou leur périmètre</h2></div><span class="badge">${snapshot.dataQuality.issues.length} alertes</span></div><ul class="issue-list">${snapshot.dataQuality.issues.map((issue) => `<li><div><strong>${escapeHtml(issue.ruleId)} · ${escapeHtml(issue.message)}</strong><p>${escapeHtml(issue.entityType)} · ${escapeHtml(issue.entityId)} · ${severityLabel(issue.severity)}</p></div><span class="tag tag-${issue.severity === 'ERROR' ? 'error' : 'warning'}">${qualityLabel(issue.action === 'exclude' ? 'partial' : 'reliable')}</span></li>`).join('') || '<li><div><strong>Aucune alerte</strong><p>Les audits et leur périmètre ne présentent aucune réserve DQ.</p></div></li>'}</ul></article>`;
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
            `<a class="tag tag-${item.criticality ?? 'warning'}" href="anomalies.html?anomaly=${encodeURIComponent(item.anomalyId)}">${escapeHtml(item.provenance.sourceId ?? item.anomalyId)}</a>`
        )
        .join(' ')
    : '<span class="muted">Aucune</span>';
  const extra = anomalies.length > 4 ? ` <span class="muted">+${anomalies.length - 4}</span>` : '';
  return `<tr data-component-row ${contextAttribute({ repository: snapshot.normalizedData.libraries.find((library) => library.libraryId === component.libraryId)?.repository, components: [component.name], componentIds: [component.componentId], versions: latestRelation ? [snapshot.normalizedData.versions?.find((version) => version.versionId === latestRelation.versionId)?.number] : [], versionIds: latestRelation ? [latestRelation.versionId] : [] })} data-component="${escapeHtml(component.name)}" data-repository="${escapeHtml(repositoryName)}" data-component-result="${resultClass === 'unknown' ? 'not_audited' : resultClass}" data-component-audited="${verdict === 'NON_COUVERT' ? 'not_audited' : 'audited'}"><td>${repositoryReference(snapshot, repositoryName, githubUrl)}</td><td><strong>${escapeHtml(component.name)}</strong><small>${escapeHtml(component.componentId)}</small></td><td>${audit ? `<span class="state state-${audit.status}">${auditStatusLabel(audit.status)}</span><small>${escapeHtml(audit.version)}</small>` : '<span class="state state-unknown">non audité</span>'}</td><td><span class="state state-${resultClass}">${result}</span><small>Dernière version PROD : ${escapeHtml(snapshot.normalizedData.versions?.find((version) => version.versionId === latestRelation?.versionId)?.number ?? 'non déterminée')}</small></td><td>${anomalyLinks}${extra}</td><td><strong>${open}</strong></td><td><span class="tag tag-${component.dataQualityStatus}">${qualityLabel(component.dataQualityStatus)}</span></td></tr>`;
}

/** Rend une carte KPI avec sa valeur, son ratio et sa définition. */
/** Rend une carte dédiée aux délais exprimés en jours. */
/** Rend les barres de répartition par criticité avec leurs filtres. */
/** Rend les barres de répartition par catégorie d'accessibilité. */
/** Construit la comparaison des repositories dans la page d'accueil. */
function repositoryRows(snapshot: Snapshot, githubUrl?: string, componentPrefix = 'Component:'): string {
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
      const componentLabels = [
        ...new Set(
          issues
            .flatMap((item) => item.labels)
            .filter((label) =>
              label.toLocaleLowerCase('fr').startsWith(componentPrefix.toLocaleLowerCase('fr'))
            )
        )
      ];
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
      const componentQuery =
        'is:issue (' +
        (componentLabels.length ? componentLabels : [componentPrefix])
          .map((label) => 'label:' + quote(label))
          .join(' OR ') +
        ')';
      const anomalyQuery =
        'is:issue (' +
        (types.length ? types : ['Bug']).map((type) => 'type:' + quote(type)).join(' OR ') +
        ')';
      /** Restitue un effectif connu avec sa recherche externe ; une inconnue reste sans lien. */
      const countLink = (value: number | 'unknown', query: string, kind = 'issues'): string =>
        value === 'unknown'
          ? 'Indisponible'
          : /^https:\/\/[^\s]+$/.test(base)
            ? `<a href="${escapeHtml(base + '/' + kind + '?q=' + encodeURIComponent(query))}" target="_blank" rel="noopener noreferrer">${value} ↗</a>`
            : String(value);
      return `<tr><td>${repositoryReference(snapshot, row.name, githubUrl)}<small>${escapeHtml(row.repository)}</small></td><td>${countLink(row.components, componentQuery)}</td><td>${countLink(row.anomalies, anomalyQuery)}</td><td>${countLink(row.openAnomalies, anomalyQuery + ' is:open')}</td><td>${countLink(row.issues, 'is:issue')}</td><td>${countLink(row.openIssues, 'is:issue is:open')}</td><td>${countLink(row.pullRequests, 'is:pr', 'pulls')}</td><td>${countLink(row.mergedPullRequests, 'is:pr is:merged', 'pulls')}</td></tr>`;
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
          return `<td>${row.issues === 'unknown' ? 'Indisponible' : (stats?.count ?? 'Indisponible')}</td>${[
            'average',
            'median',
            'p90'
          ]
            .map((key) => {
              const value = stats?.[key as 'average' | 'median' | 'p90'];
              return `<td>${typeof value === 'number' ? value.toFixed(1) + ' j' : 'inconnu'}</td>`;
            })
            .join('')}`;
        })
        .join('');
      return `<tr><td><strong>${escapeHtml(row.name)}</strong></td>${cells}</tr>`;
    })
    .join('');
}
/** Rend une barre proportionnelle à une valeur numérique. */
function bar(label: string, value: number | 'unknown'): string {
  const width = typeof value === 'number' ? Math.min(value * 25, 100) : 0;
  return `<div class="bar-row"><span>${label}</span><div class="bar-track"><i style="width:${width}%"></i></div><strong>${value}</strong></div>`;
}
/** Rend une barre cliquable vers le filtre correspondant. */
function linkedBar(label: string, value: number | 'unknown', href: string): string {
  return `<a class="bar-link" href="${href}">${bar(label, value)}</a>`;
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
function auditStatusLabel(value: AuditStatus): string {
  return {
    not_evaluated: 'non évalué',
    in_progress: 'en cours',
    cancelled: 'annulé',
    conform: 'conforme',
    conditional: 'conditionnel',
    non_conform: 'non conforme',
    critical: 'critique'
  }[value];
}
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
