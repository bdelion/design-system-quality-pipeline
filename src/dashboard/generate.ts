import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stringify } from 'yaml';
import type { AnomalyStatus, AuditStatus, Component, DataQualityStatus, Metric, Severity, Snapshot } from '../domain/types.js';

const dashboardAssetSource = resolve(fileURLToPath(new URL('./assets', import.meta.url)));

/** Génère les quatre pages statiques et leurs assets depuis un snapshot. */
export async function generateDashboard(snapshot: Snapshot, outputRoot: string, githubUrl?: string): Promise<void> {
  const dashboardPath = resolve(outputRoot, 'dashboard');
  await mkdir(resolve(dashboardPath, 'assets'), { recursive: true });
  const serializedSnapshot = JSON.stringify(snapshot).replace(/</g, '\\u003c');

  await Promise.all([
    writeFile(resolve(dashboardPath, 'index.html'), page(snapshot, 'Vue d’ensemble', overviewContent(snapshot, githubUrl), serializedSnapshot), 'utf8'),
    writeFile(resolve(dashboardPath, 'anomalies.html'), page(snapshot, 'Anomalies', anomaliesContent(snapshot, githubUrl), serializedSnapshot), 'utf8'),
    writeFile(resolve(dashboardPath, 'audits.html'), page(snapshot, 'Audits et composants', auditsContent(snapshot, githubUrl), serializedSnapshot), 'utf8'),
    writeFile(resolve(dashboardPath, 'graph.html'), page(snapshot, 'Cartographie', graphContent(snapshot, githubUrl), serializedSnapshot), 'utf8'),
    copyDashboardAsset(dashboardPath, 'style.css'),
    copyDashboardAsset(dashboardPath, 'app.js'),
    copyDashboardAsset(dashboardPath, 'graph.js'),
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
  const openCount = snapshot.analytics?.openAnomalies?.value ?? 0;
  const statusClass = openCount > 0 ? 'status-partial' : 'status-neutral';
  const statusText = openCount > 0 ? `${openCount} EN COURS` : 'CONFORME';

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} | Design System Quality</title>
  <link rel="stylesheet" href="assets/style.css">
</head>
<body>
  <header class="topbar">
    <a class="brand" href="index.html">
      <img class="brand-logo" src="assets/logo.svg" alt="ArchInsight Logo">
      <span>ArchInsight</span>
    </a>
    <span class="workspace-label">Qualité du Design System</span>
    <div class="topbar-actions">
      <span class="status-pill ${statusClass}">${statusText}</span>
      <span class="avatar">${escapeHtml(snapshot.ruleVersion || 'V2')}</span>
    </div>
  </header>
  <div class="dashboard-layout">
    <aside class="sidebar">
      <p class="sidebar-label">PILOTAGE</p>
      <nav class="side-nav">
        <a class="${title === 'Vue d’ensemble' ? 'active' : ''}" href="index.html"><span>◈</span>Vue d’ensemble</a>
        <a class="${title === 'Anomalies' ? 'active' : ''}" href="anomalies.html"><span>!</span>Anomalies<span class="nav-count">${snapshotCountForPage(snapshot, title)}</span></a>
        <a class="${title === 'Cartographie' ? 'active' : ''}" href="graph.html"><span>⌘</span>Cartographie</a>
        <a class="${title === 'Audits et composants' ? 'active' : ''}" href="audits.html"><span>◇</span>Composants</a>
      </nav>
      <p class="sidebar-label">RÉFÉRENTIELS</p>
      <nav class="side-nav">
        <a href="audits.html"><span>▦</span>Audits</a>
        <a href="anomalies.html#quality"><span>◌</span>Qualité des données</a>
      </nav>
      <div class="sidebar-footer">
        <span>Snapshot</span><strong data-captured-at></strong>
        <span>Règles</span><strong data-rule-version></strong>
      </div>
    </aside>
    <main class="shell">
      <div class="page-heading">
        <div>
          <p class="eyebrow">Qualité du Design System / ${escapeHtml(snapshot.ruleVersion || 'V2.0')}</p>
          <h1>${title}</h1>
          <p class="muted">Moteur analytique V2 · Données temps réel du snapshot</p>
        </div>
      </div>
      ${content}
    </main>
  </div>
  <script>window.__SNAPSHOT__ = ${serializedSnapshot};</script>
  <script src="assets/app.js"></script>
  ${title === 'Cartographie' ? '<script src="assets/graph.js"></script>' : ''}
</body>
</html>`;
}

/** Retourne le nombre d'éléments affiché dans la navigation latérale. */
function snapshotCountForPage(snapshot: Snapshot, title: string): number | string {
  return title === 'Anomalies' ? (snapshot.dataQuality?.issues?.length ?? 0) : '';
}

/** Construit le contenu de la page de synthèse des KPI et alertes. */
function overviewContent(snapshot: Snapshot, githubUrl?: string): string {
  const analytics = snapshot.analytics ?? {};
  const libraries = snapshot.normalizedData?.libraries ?? [];
  const issues = snapshot.dataQuality?.issues ?? [];
  const openValue = analytics.openAnomalies?.value ?? 0;

  const summary = snapshot.dataQuality?.summary ?? {
    ERROR: issues.filter((i) => i.severity === 'ERROR').length,
    WARNING: issues.filter((i) => i.severity === 'WARNING').length,
    INFO: issues.filter((i) => i.severity === 'INFO').length,
  };

  return `<section class="hero-band">
  <div>
    <p class="eyebrow">Point de situation V2</p>
    <h2>La qualité se pilote avec des faits.</h2>
    <p>Distinction claire entre le stock d'anomalies, les flux de traitement et la couverture d'audit du patrimoine.</p>
  </div>
  <div class="hero-ring">
    <strong>${openValue}</strong>
    <span>anomalie${openValue === 1 ? '' : 's'} en stock</span>
  </div>
</section>

<section class="kpi-grid">
  ${kpiMetricCard('Flux : Déclarées', analytics.anomaliesDeclared, 'anomalies.html')}
  ${kpiMetricCard('Flux : Corrigées', analytics.anomaliesCorrected, 'anomalies.html')}
  ${kpiMetricCard('Couverture Audits', analytics.auditsCoverage, 'audits.html', true)}
  ${kpiMetricCard('Conformité Objective', analytics.conformityRate, 'audits.html', true)}
  ${delayMetricCard('Délai Moyen', analytics.averageCorrectionDelayDays, 'anomalies.html')}
  ${delayMetricCard('Délai Médian', analytics.medianCorrectionDelayDays, 'anomalies.html')}
</section>

<section class="content-grid">
  <article class="panel">
    <div class="panel-heading">
      <div>
        <p class="eyebrow">Répartition du stock</p>
        <h2>Criticité des anomalies</h2>
      </div>
      <span class="badge">${qualityLabel(analytics.anomaliesDeclared?.reliability?.status ?? 'reliable')}</span>
    </div>
    <div class="bars">${criticalityBars(analytics)}</div>
  </article>
  <article class="panel">
    <div class="panel-heading">
      <div>
        <p class="eyebrow">Catégories</p>
        <h2>Critères d’accessibilité</h2>
      </div>
      <span class="badge">${Object.keys(analytics.anomaliesByCategory || {}).length} catégories</span>
    </div>
    <div class="bars">${categoryBars(analytics)}</div>
  </article>
</section>

<section class="content-grid">
  <article class="panel alert-panel">
    <div class="panel-heading">
      <div>
        <p class="eyebrow">Qualité des données (DQ)</p>
        <h2>Alertes & Réserves de calcul</h2>
      </div>
      <span class="alert-count">${issues.length}</span>
    </div>
    <div class="severity-row"><span><i class="dot error"></i>Erreurs</span><strong>${summary.ERROR ?? 0}</strong></div>
    <div class="severity-row"><span><i class="dot warning"></i>Avertissements</span><strong>${summary.WARNING ?? 0}</strong></div>
    <div class="severity-row"><span><i class="dot info"></i>Informations</span><strong>${summary.INFO ?? 0}</strong></div>
    <a class="text-link" href="anomalies.html#quality">Consulter le détail des réserves DQ →</a>
  </article>
</section>

<article class="panel table-panel">
  <div class="panel-heading">
    <div>
      <p class="eyebrow">Patrimoine Applicatif</p>
      <h2>Analyse par Repository</h2>
    </div>
    <span class="badge">${libraries.length} repositories</span>
  </div>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Repository</th>
          <th>Composants</th>
          <th>Total Anomalies</th>
          <th>Stock Ouvert</th>
          <th>PRs Fusionnées</th>
          <th>Fiabilité DQ</th>
        </tr>
      </thead>
      <tbody>${repositoryRows(snapshot, githubUrl)}</tbody>
    </table>
  </div>
</article>

<article class="panel table-panel">
  <div class="panel-heading">
    <div>
      <p class="eyebrow">Délais de résolution</p>
      <h2>Temps de correction par repository (Jours calendaires)</h2>
    </div>
    <span class="badge">Distribution Moyen / Médian / P90</span>
  </div>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Repository</th>
          <th>Corrigées</th>
          <th>Moyenne</th>
          <th>Médiane</th>
          <th>P90 (90e centile)</th>
          <th>Max</th>
        </tr>
      </thead>
      <tbody>${delayRows(snapshot)}</tbody>
    </table>
  </div>
</article>`;
}

/** Construit le tableau des anomalies et la liste des alertes qualité. */
function anomaliesContent(snapshot: Snapshot, githubUrl?: string): string {
  const libraries = snapshot.normalizedData?.libraries ?? [];
  const anomalies = snapshot.normalizedData?.anomalies ?? [];
  const components = snapshot.normalizedData?.components ?? [];
  const issuesList = snapshot.dataQuality?.issues ?? [];

  const libraryById = new Map(libraries.map((library) => [library.libraryId, library.name]));
  const repositories = [...new Set(libraries.map((library) => library.name))];
  const categories = [...new Set(anomalies.flatMap((anomaly) => anomaly.categories))].sort();

  const rows = anomalies.map((anomaly) => {
    const component = components.find((item) => item.componentId === anomaly.componentId);
    const repositoryName = libraryById.get(component?.libraryId ?? '') ?? 'repository inconnu';
    const linkedPullRequests = anomaly.pullRequestRefs.map((reference) => githubReference(snapshot, reference, githubUrl)).join(' ') || '—';
    const categoriesFormatted = anomaly.categories.join(', ') || '—';
    const status = anomaly.cancelled ? 'cancelled' : anomaly.status;
    const statusLabel = anomaly.cancelled ? 'annulée' : anomalyStatusLabel(anomaly.status);

    return `<tr data-repository="${escapeHtml(repositoryName)}" data-status="${status}" data-criticality="${escapeHtml(anomaly.criticality ?? 'unknown')}" data-categories="${escapeHtml(anomaly.categories.join('|'))}">
      <td><strong>${escapeHtml(anomaly.anomalyId)}</strong><small>${githubReference(snapshot, anomaly.provenance.sourceId ?? 'source inconnue', githubUrl)}</small></td>
      <td>${repositoryReference(snapshot, repositoryName, githubUrl)}</td>
      <td>${escapeHtml(component?.name ?? anomaly.componentId)}</td>
      <td><span class="tag tag-${anomaly.criticality ?? 'unknown'}">${criticalityLabel(anomaly.criticality)}</span></td>
      <td>${escapeHtml(categoriesFormatted)}</td>
      <td><span class="state state-${status}">${statusLabel}</span></td>
      <td>${linkedPullRequests}</td>
      <td>${anomaly.everCorrected ? 'Oui' : 'Non'}</td>
    </tr>`;
  }).join('');

  const issues = issuesList.map((issue) => `
    <li>
      <span class="tag tag-${issue.severity.toLowerCase()}">${severityLabel(issue.severity)}</span>
      <div>
        <strong>${escapeHtml(issue.ruleId)}</strong>
        <p>${escapeHtml(qualityMessage(issue))}</p>
        ${qualityIssueTarget(snapshot, issue, githubUrl)}
      </div>
    </li>`).join('');

  return `<section class="page-intro">
  <p class="muted">${anomalies.length} anomalies normalisées au total · ${snapshot.analytics?.openAnomalies?.value ?? 0} actuellement ouvertes</p>
</section>

<article class="panel table-panel">
  <div class="panel-heading">
    <div>
      <p class="eyebrow">Détail des objets</p>
      <h2>Anomalies suivies</h2>
    </div>
    <span class="badge">${issuesList.length} alertes DQ</span>
  </div>
  <div class="filter-bar">
    <input class="search" data-filter placeholder="Rechercher une anomalie, un composant...">
    <select data-filter-repository>
      <option value="">Tous les repositories</option>
      ${repositories.map((repo) => `<option value="${escapeHtml(repo)}">${escapeHtml(repo)}</option>`).join('')}
    </select>
    <select data-filter-criticality>
      <option value="">Toutes les criticités</option>
      <option value="blocking">Bloquante</option>
      <option value="major">Majeure</option>
      <option value="minor">Mineure</option>
      <option value="unknown">Inconnue</option>
    </select>
    <select data-filter-category>
      <option value="">Toutes les catégories</option>
      ${categories.map((cat) => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`).join('')}
    </select>
    <select data-filter-status>
      <option value="">Tous les états</option>
      <option value="open">Ouverte</option>
      <option value="in_progress">En cours</option>
      <option value="done">Terminée</option>
      <option value="cancelled">Annulée</option>
    </select>
    <button type="button" class="reset-button" data-reset-filters>Réinitialiser</button>
  </div>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Identifiant</th>
          <th>Repository</th>
          <th>Composant</th>
          <th>Criticité</th>
          <th>Catégorie</th>
          <th>État</th>
          <th>PRs liées</th>
          <th>Corrigée</th>
        </tr>
      </thead>
      <tbody data-table>${rows}</tbody>
    </table>
  </div>
</article>

<article class="panel" id="quality">
  <div class="panel-heading">
    <div>
      <p class="eyebrow">Qualité des données</p>
      <h2>Réserves DQ & Règlements d'exclusion</h2>
    </div>
  </div>
  <ul class="issue-list">${issues || '<p class="muted">Aucune alerte de qualité détectée.</p>'}</ul>
</article>`;
}

/** Transforme une référence interne en lien GitHub lorsque l'URL est disponible. */
function githubReference(snapshot: Snapshot, reference: string, githubUrl?: string): string {
  if (!githubUrl) return escapeHtml(reference);
  const baseUrl = githubUrl.replace(/\/+$/, '');
  const repositories = snapshot.rawData?.repositories ?? [];

  for (const repository of repositories) {
    const issue = repository.issues.find((candidate) => candidate.id === reference);
    if (issue) return `<a class="text-link" href="${baseUrl}/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/issues/${issue.number}" target="_blank" rel="noreferrer">${escapeHtml(reference)}</a>`;
    const pullRequest = repository.pullRequests.find((candidate) => candidate.id === reference);
    if (pullRequest) return `<a class="text-link" href="${baseUrl}/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/pull/${pullRequest.number}" target="_blank" rel="noreferrer">${escapeHtml(reference)}</a>`;
  }
  return escapeHtml(reference);
}

/** Construit un lien vers un repository ou retourne son nom si GitHub est absent. */
function repositoryReference(snapshot: Snapshot, repositoryName: string, githubUrl?: string): string {
  const repositories = snapshot.rawData?.repositories ?? [];
  const repository = repositories.find((candidate) => candidate.name === repositoryName);
  if (!repository || !githubUrl) return escapeHtml(repositoryName);
  return `<a class="text-link" href="${githubUrl.replace(/\/+$/, '')}/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}" target="_blank" rel="noreferrer">${escapeHtml(repositoryName)}</a>`;
}

/** Ajoute à une alerte qualité la cible et sa source consultable. */
function qualityIssueTarget(snapshot: Snapshot, issue: NonNullable<Snapshot['dataQuality']>['issues'][number], githubUrl?: string): string {
  const anomalies = snapshot.normalizedData?.anomalies ?? [];
  const components = snapshot.normalizedData?.components ?? [];

  if (issue.entityType === 'anomaly') {
    const anomaly = anomalies.find((candidate) => candidate.anomalyId === issue.entityId);
    const source = anomaly?.provenance.sourceId;
    return `<div class="quality-target"><span class="quality-target-label">Cible : anomalie ${escapeHtml(issue.entityId)}</span>${source ? `<span>Source : ${githubReference(snapshot, source, githubUrl)}</span>` : '<span>Aucune source GitHub disponible</span>'}</div>`;
  }
  if (issue.entityType === 'component') {
    const component = components.find((candidate) => candidate.componentId === issue.entityId);
    const source = component?.provenance.sourceId;
    const copyButton = issue.ruleId === 'DQ-006' && component
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
function qualityMessage(issue: NonNullable<Snapshot['dataQuality']>['issues'][number]): string {
  return ({
    'DQ-001': 'L’anomalie n’a pas de criticité explicite.',
    'DQ-002': 'L’anomalie possède plusieurs criticités incompatibles.',
    'DQ-003': 'L’anomalie possède plusieurs parents incompatibles.',
    'DQ-004': 'L’issue est terminée mais aucune pull request identifiable ne lui est associée.',
    'DQ-005': 'La pull request est fusionnée alors que l’issue associée est encore ouverte.',
    'DQ-006': 'Le composant détecté n’est pas répertorié dans le catalogue.',
    'DQ-007': 'L’issue contient un label non reconnu.',
    'DQ-008': 'L’issue annulée est référencée par une pull request.',
    'DQ-009': 'Nexus est indisponible : les preuves de release sont inconnues.',
    'DQ-010': 'L’issue annulée est rattachée à une milestone.'
  }[issue.ruleId] ?? issue.message);
}

/** Construit la cartographie dynamique des dépendances. */
function graphContent(snapshot: Snapshot, githubUrl?: string): string {
  const components = snapshot.normalizedData?.components ?? [];
  const anomalies = snapshot.normalizedData?.anomalies ?? [];
  const componentsById = new Map(components.map((component) => [component.componentId, component]));

  const graphRows = anomalies.map((anomaly) => {
    const component = componentsById.get(anomaly.componentId);
    const issueLabel = anomaly.provenance.sourceId ?? anomaly.anomalyId;
    const issueNode = `<div class="graph-node issue" data-graph-node><span class="node-dot"></span><div><strong>${escapeHtml(issueLabel)}</strong><small>Issue · ${anomaly.cancelled ? 'annulée' : anomalyStatusLabel(anomaly.status)}</small></div><span class="state state-${anomaly.cancelled ? 'cancelled' : anomaly.status}">${anomaly.cancelled ? 'annulée' : anomalyStatusLabel(anomaly.status)}</span></div>`;
    const componentNode = component ? `<div class="graph-node" data-graph-node><span class="node-dot"></span><div><strong>${escapeHtml(component.name)}</strong><small>Composant · ${discoveryLabel(component.discoverySource)}</small></div><span class="tag tag-${component.dataQualityStatus}">${qualityLabel(component.dataQualityStatus)}</span></div>` : '';
    const pullRequestNodes = anomaly.pullRequestRefs.map((reference) => `<div class="graph-node pr" data-graph-node><span class="node-dot"></span><div><strong>${githubReference(snapshot, reference, githubUrl)}</strong><small>Pull request · relation détectée</small></div><span class="state state-merged">liée</span></div>`).join('');

    return `<div class="graph-lines">
      <div class="graph-row-title">${escapeHtml(anomaly.anomalyId)} <span class="badge">${criticalityLabel(anomaly.criticality)}</span></div>
      ${componentNode}
      <div class="graph-edge">comporte l'anomalie</div>
      ${issueNode}
      ${pullRequestNodes ? `<div class="graph-edge">est liée à</div>${pullRequestNodes}` : '<div class="graph-edge">aucune PR liée</div>'}
    </div>`;
  }).join('');

  return `<section class="dashboard-intro">
  <div><p class="muted">${anomalies.length} chaînes d'impact · Composants, Issues & Pull Requests</p></div>
  <div class="graph-legend"><span class="legend-component">Composant</span><span class="legend-issue">Issue</span><span class="legend-pr">Pull request</span></div>
</section>
<article class="panel table-panel">
  <div class="panel-heading">
    <div>
      <p class="eyebrow">Relations du snapshot</p>
      <h2>Cartographie des dépendances qualité</h2>
    </div>
    <input class="search" data-graph-filter placeholder="Rechercher une issue, un composant ou une PR...">
  </div>
  <div class="graph-canvas">${graphRows || '<p class="muted">Aucune relation disponible dans le snapshot.</p>'}</div>
</article>`;
}

/** Construit la page listant les composants, audits et statuts de fiabilité. */
function auditsContent(snapshot: Snapshot, githubUrl?: string): string {
  const libraries = snapshot.normalizedData?.libraries ?? [];
  const components = snapshot.normalizedData?.components ?? [];
  const audits = snapshot.normalizedData?.audits ?? [];
  const libraryById = new Map(libraries.map((library) => [library.libraryId, library.name]));

  const rows = components.map((component) => {
    const audit = audits.find((item) => item.componentId === component.componentId);
    return `<tr>
      <td>${repositoryReference(snapshot, libraryById.get(component.libraryId) ?? 'repository inconnu', githubUrl)}</td>
      <td><strong>${escapeHtml(component.name)}</strong><small>${escapeHtml(component.componentId)}</small></td>
      <td><span class="tag tag-${component.discoverySource}">${discoveryLabel(component.discoverySource)}</span></td>
      <td>${audit ? `<span class="state state-${audit.status}">${auditStatusLabel(audit.status)}</span>` : '<span class="state state-unknown">non évalué</span>'}</td>
      <td>${audit?.version ?? '—'}</td>
      <td><span class="tag tag-${component.dataQualityStatus}">${qualityLabel(component.dataQualityStatus)}</span></td>
    </tr>`;
  }).join('');

  return `<section class="page-intro">
  <p class="muted">Note de méthode : Un composant non audité sur la période n’est pas comptabilisé comme non conforme.</p>
</section>
<article class="panel table-panel">
  <div class="panel-heading">
    <div>
      <p class="eyebrow">Catalogue et Audits</p>
      <h2>Couverture du Patrimoine</h2>
    </div>
    <span class="badge">${components.length} composants répertoriés</span>
  </div>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Repository</th>
          <th>Composant</th>
          <th>Origine</th>
          <th>Résultat Audit</th>
          <th>Version Auditée</th>
          <th>Fiabilité DQ</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
</article>`;
}

/** Rend une carte KPI dynamique basée sur le type Metric V2. */
function kpiMetricCard(label: string, metric: Metric<number> | undefined, href: string, isPercentage = false): string {
  if (!metric) {
    return `<a class="kpi-card" href="${href}"><span class="kpi-label">${label}</span><strong>—</strong><span class="kpi-ratio">Non disponible</span></a>`;
  }

  const val = metric.value;
  const display = val === 'unknown' ? '—' : isPercentage ? `${Math.round(val)}%` : val;
  const num = metric.numerator;
  const den = metric.denominator;

  let ratioText = '';
  if (typeof num === 'number' && typeof den === 'number' && den > 0) {
    ratioText = isPercentage ? `${num}/${den} audités` : `${num}/${den}`;
  } else if (typeof den === 'number') {
    ratioText = `Échantillon : ${den}`;
  } else {
    ratioText = 'Ratio n/a';
  }

  const reliabilityStatus = metric.reliability?.status ?? 'reliable';

  return `<a class="kpi-card" href="${href}">
    <span class="kpi-label">${label}</span>
    <strong>${display}</strong>
    <span class="kpi-ratio">${ratioText} · ${qualityLabel(reliabilityStatus)}</span>
    <span class="kpi-definition">${escapeHtml(metric.definition || '')}</span>
  </a>`;
}

/** Rend une carte dédiée aux délais exprimés en jours. */
function delayMetricCard(label: string, metric: Metric<number> | undefined, href: string): string {
  if (!metric) {
    return `<a class="kpi-card" href="${href}"><span class="kpi-label">${label}</span><strong>—</strong><span class="kpi-ratio">Non disponible</span></a>`;
  }

  const val = metric.value;
  const display = val === 'unknown' ? '—' : `${val} j`;
  const sample = typeof metric.denominator === 'number' ? `${metric.denominator} corrigée${metric.denominator === 1 ? '' : 's'}` : 'échantillon inconnu';
  const reliabilityStatus = metric.reliability?.status ?? 'reliable';

  return `<a class="kpi-card" href="${href}">
    <span class="kpi-label">${label}</span>
    <strong>${display}</strong>
    <span class="kpi-ratio">${sample} · ${qualityLabel(reliabilityStatus)}</span>
    <span class="kpi-definition">${escapeHtml(metric.definition || '')}</span>
  </a>`;
}

/** Rend les barres de répartition par criticité. */
function criticalityBars(analytics: Snapshot['analytics']): string {
  const values: Array<[string, string]> = [['blocking', 'bloquante'], ['major', 'majeure'], ['minor', 'mineure']];
  return values.map(([key, label]) => linkedBar(label, analytics?.anomaliesByCriticality?.[key] ?? 0, `anomalies.html?criticality=${encodeURIComponent(key)}`)).join('');
}

/** Rend les barres de répartition par catégorie d'accessibilité. */
function categoryBars(analytics: Snapshot['analytics']): string {
  return Object.entries(analytics?.anomaliesByCategory || {})
    .sort(([, left], [, right]) => Number(right) - Number(left))
    .map(([category, value]) => linkedBar(category, value, `anomalies.html?category=${encodeURIComponent(category)}`))
    .join('') || '<p class="muted">Aucune catégorie répertoriée.</p>';
}

/** Construit la comparaison des repositories. */
function repositoryRows(snapshot: Snapshot, githubUrl?: string): string {
  const libraries = snapshot.normalizedData?.libraries ?? [];
  const componentsAll = snapshot.normalizedData?.components ?? [];
  const anomaliesAll = snapshot.normalizedData?.anomalies ?? [];
  const pullRequestsAll = snapshot.normalizedData?.pullRequests ?? [];

  return libraries.map((library) => {
    const components = componentsAll.filter((comp) => comp.libraryId === library.libraryId);
    const componentIds = new Set(components.map((comp) => comp.componentId));
    const anomalies = anomaliesAll.filter((anomaly) => componentIds.has(anomaly.componentId));
    const pullRequests = pullRequestsAll.filter((pr) => pr.repository === library.name);
    const open = anomalies.filter((anomaly) => anomaly.status === 'open' || anomaly.status === 'in_progress' || anomaly.status === 'reopened').length;
    const reliability = components.some((comp) => comp.dataQualityStatus !== 'reliable') ? 'partial' : 'reliable';

    return `<tr>
      <td>${repositoryReference(snapshot, library.name, githubUrl)}<small>${escapeHtml(library.repository)}</small></td>
      <td>${components.length}</td>
      <td>${anomalies.length}</td>
      <td><strong>${open}</strong></td>
      <td>${pullRequests.filter((pr) => pr.state === 'merged').length}</td>
      <td><span class="tag tag-${reliability === 'reliable' ? 'reliable' : 'warning'}">${qualityLabel(reliability)}</span></td>
    </tr>`;
  }).join('');
}

/** Calcule les délais moyen, médian, P90 et maximal par repository. */
function delayRows(snapshot: Snapshot): string {
  const libraries = snapshot.normalizedData?.libraries ?? [];
  const componentsAll = snapshot.normalizedData?.components ?? [];
  const anomaliesAll = snapshot.normalizedData?.anomalies ?? [];
  const libraryById = new Map(libraries.map((lib) => [lib.libraryId, lib.name]));

  return libraries.map((library) => {
    const componentIds = new Set(
      componentsAll
        .filter((comp) => comp.libraryId === library.libraryId)
        .map((comp) => comp.componentId)
    );

    const delays = anomaliesAll
      .filter((anomaly) => componentIds.has(anomaly.componentId) && anomaly.firstDoneAt)
      .map((anomaly) => (Date.parse(anomaly.firstDoneAt!) - Date.parse(anomaly.createdAt)) / 86_400_000)
      .sort((a, b) => a - b);

    if (delays.length === 0) {
      return `<tr>
        <td><strong>${escapeHtml(libraryById.get(library.libraryId) ?? library.name)}</strong></td>
        <td>0</td><td>—</td><td>—</td><td>—</td><td>—</td>
      </tr>`;
    }

    const avg = (delays.reduce((acc, val) => acc + val, 0) / delays.length).toFixed(1);
    const median = (delays.length % 2 === 1
      ? (delays[Math.floor(delays.length / 2)] ?? 0)
      : ((delays[delays.length / 2 - 1] ?? 0) + (delays[Math.floor(delays.length / 2)] ?? 0)) / 2
    ).toFixed(1);

    const p90Index = Math.floor(delays.length * 0.9);
    const p90 = (delays[Math.min(p90Index, delays.length - 1)] ?? 0).toFixed(1);
    const max = (delays[delays.length - 1] ?? 0).toFixed(1);

    return `<tr>
      <td><strong>${escapeHtml(libraryById.get(library.libraryId) ?? library.name)}</strong></td>
      <td>${delays.length}</td>
      <td>${avg} j</td>
      <td>${median} j</td>
      <td><strong>${p90} j</strong></td>
      <td>${max} j</td>
    </tr>`;
  }).join('');
}

/** Rend une barre proportionnelle à une valeur numérique. */
function bar(label: string, value: number | 'unknown'): string {
  const width = typeof value === 'number' ? Math.min(value * 25, 100) : 0;
  return `<div class="bar-row">
    <span>${label}</span>
    <div class="bar-track"><i style="width:${width}%"></i></div>
    <strong>${value}</strong>
  </div>`;
}

/** Rend une barre cliquable vers le filtre correspondant. */
function linkedBar(label: string, value: number | 'unknown', href: string): string {
  return `<a class="bar-link" href="${href}">${bar(label, value)}</a>`;
}

/** Traduit un statut de fiabilité pour l'interface. */
function qualityLabel(value: DataQualityStatus): string {
  return ({ reliable: 'fiable', partial: 'partielle', unknown: 'inconnue', invalid: 'invalide' })[value] ?? value;
}

/** Traduit une criticité technique en libellé métier. */
function criticalityLabel(value: 'blocking' | 'major' | 'minor' | undefined): string {
  return value ? ({ blocking: 'bloquante', major: 'majeure', minor: 'mineure' })[value] : 'inconnue';
}

/** Traduit l'état d'une anomalie. */
function anomalyStatusLabel(value: AnomalyStatus): string {
  return ({ open: 'ouverte', in_progress: 'en cours', done: 'terminée', reopened: 'réouverte', cancelled: 'annulée' })[value] ?? value;
}

/** Traduit l'état d'un audit. */
function auditStatusLabel(value: AuditStatus): string {
  return ({ not_evaluated: 'non évalué', in_progress: 'en cours', conform: 'conforme', conditional: 'conditionnel', non_conform: 'non conforme', critical: 'critique' })[value] ?? value;
}

/** Traduit la sévérité d'une alerte. */
function severityLabel(value: Severity): string {
  return ({ INFO: 'information', WARNING: 'avertissement', ERROR: 'erreur' })[value] ?? value;
}

/** Traduit l'origine de découverte d'un composant. */
function discoveryLabel(value: 'catalogue' | 'github' | 'suggested'): string {
  return ({ catalogue: 'catalogue', github: 'GitHub', suggested: 'suggestion' })[value] ?? value;
}

/** Échappe les caractères spéciaux HTML. */
function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char] ?? char);
}