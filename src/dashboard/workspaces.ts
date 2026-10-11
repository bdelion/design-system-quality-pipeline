/** Organisation des espaces métier et restitution des populations calculées par Analytics. */
import type { Snapshot } from '../domain/types.js';
import { workspaceAnalytics, type WorkspaceAnalytics } from '../analytics/workspaces.js';
import { issueFacts } from './read-model.js';
import { contextAttribute } from './evidence.js';

/** Échappe une valeur avant son insertion dans le HTML. */
function html(value: unknown): string {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!
  );
}
const models = new WeakMap<Snapshot, WorkspaceAnalytics>();
/** Invalide la projection lors d'une nouvelle génération sur un objet de développement modifié. */
export function resetWorkspaceModel(snapshot: Snapshot): void {
  models.delete(snapshot);
}
/** Restitue le contrat stocké ou projette un ancien snapshot sans le modifier. */
export function workspaceModel(snapshot: Snapshot): WorkspaceAnalytics {
  let model = models.get(snapshot);
  if (!model) {
    model =
      snapshot.analytics.workspaces?.version === 1
        ? snapshot.analytics.workspaces
        : workspaceAnalytics(snapshot.normalizedData, snapshot.dataQuality.issues);
    models.set(snapshot, model);
  }
  return model;
}
/** Organise six destinations principales et conserve les URLs historiques en sous-navigation. */
export function workspaceNavigation(title: string): string {
  const group =
    title === 'Vue d’ensemble'
      ? 'index'
      : ['Accessibilité', 'Anomalies', 'Audits et composants'].includes(title)
        ? 'accessibility'
        : title === 'Analyse des issues'
          ? 'issues'
          : ['Analyse des composants', 'Cartographie'].includes(title)
            ? 'components'
            : title === 'Historique'
              ? 'history'
              : 'quality';
  const icons: Record<string, string> = {
    index:
      '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    accessibility: '<circle cx="12" cy="4" r="2"/><path d="M4 9h16M12 6v8M7 21l5-7 5 7"/>',
    issues: '<path d="M8 6h13M8 12h13M8 18h13M3 6h1M3 12h1M3 18h1"/>',
    components: '<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
    history: '<path d="M3 11a9 9 0 1 1 2 7M3 4v7h7M12 7v5l3 2"/>',
    quality: '<path d="m12 3 9 4v6c0 4-5 7-9 9-4-2-9-5-9-9V7l9-4Z"/><path d="m8 12 3 3 5-6"/>'
  };
  const links = [
    ['index', 'Vue d’ensemble'],
    ['accessibility', 'Accessibilité'],
    ['issues', 'Activité des équipes'],
    ['components', 'Composants et versions'],
    ['history', 'Historique'],
    ['quality', 'Qualité des données']
  ];
  return `<nav class="side-nav" aria-label="Navigation principale">${links.map(([file, label]) => `<a data-workspace-nav href="${file}.html"${group === file ? ' aria-current="page" class="active"' : ''}>${`<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true" focusable="false">${icons[file!]}</svg>`}<span>${label}</span></a>`).join('')}</nav>`;
}
/** Fournit les liens détaillés sans dupliquer les espaces dans la navigation principale. */
export function workspaceSubnavigation(title: string): string {
  if (['Accessibilité', 'Anomalies', 'Audits et composants'].includes(title))
    return '<nav class="workspace-tabs" aria-label="Vues accessibilité"><a href="accessibility.html">Indicateurs accessibilité</a><a href="audits.html">Audits et conformité par version</a><a href="accessibility.html#review">Issues à examiner</a><a href="anomalies.html">Tous les défauts normalisés</a></nav>';
  if (['Analyse des composants', 'Cartographie'].includes(title))
    return '<nav class="workspace-tabs" aria-label="Vues du patrimoine"><a href="components.html">Composants et versions</a><a href="graph.html">Cartographie et relations</a></nav>';
  return '';
}
/** Affiche des KPI de la même population ; chaque chiffre dispose d'une définition proche. */
export function workspaceCards(snapshot: Snapshot, compact = false): string {
  const model = workspaceModel(snapshot);
  const summary = model.scopes.find(
    (scope) => !scope.repository && !scope.component && !scope.version
  )?.summary;
  const cards: Array<[string, string, string, string]> = compact
    ? [
        ['coverage', 'Couverture des composants', 'covered', 'components'],
        ['conformity', 'Conformité des composants audités', 'conform', 'covered'],
        ['remaining', 'Anomalies d’accessibilité à traiter', '', ''],
        ['average', 'Délai moyen de correction', '', '']
      ]
    : [
        ['declared', 'Anomalies d’accessibilité déclarées', '', ''],
        ['treated', 'Anomalies traitées', '', ''],
        ['treatmentRate', 'Traitement des anomalies', 'treated', 'declared'],
        ['remaining', 'Anomalies à traiter', '', ''],
        ['cancelled', 'Annulations séparées', '', ''],
        ['presumed', 'Accessibilité présumée', '', ''],
        ['coverage', 'Couverture des composants', 'covered', 'components'],
        ['conformity', 'Conformité des composants audités', 'conform', 'covered'],
        ['nonCovered', 'Composants non couverts', '', ''],
        ['unknown', 'Présence ou couverture indéterminée', '', ''],
        ['average', 'Délai moyen de correction', '', ''],
        ['median', 'Délai médian', '', ''],
        ['p90', 'P90 de correction', '', '']
      ];
  const definitions: Record<string, string> = {
    declared:
      'Issues distinctes qualifiées ou présumées accessibilité ; annulations exclues. Les deux qualifications restent distinguées.',
    treated:
      'Issues accessibilité actuellement Done dans tous leurs contextes Project ET Closed dans GitHub.',
    treatmentRate:
      'Issues traitées / déclarées non annulées. Un dénominateur nul donne une valeur indisponible.',
    remaining: 'Déclarées non annulées moins actuellement traitées : ouvertes et en cours sont incluses.',
    cancelled: 'Annulations conservées dans un effectif séparé, jamais assimilées à des corrections.',
    presumed:
      'Signal a11y/RGAA sans label combinant Audit et RGAA ni relation valide à un audit. Qualification à examiner.',
    coverage:
      'Composants couverts / composants présents dans la version sélectionnée, ou les versions PROD courantes de chaque repository. Les présences inconnues restent inconnues.',
    conformity:
      'Composants conformes / couverts. Non audité reste distinct de non conforme. Le verdict provient des audits applicables, pas de la correction seule.',
    unknown:
      'Composants connus dont la présence dans la version ou le verdict ne peut pas être établi. Ils ne sont pas assimilés à des composants non couverts.',
    nonCovered:
      'Présence du composant connue, sans audit terminé applicable ; aucun verdict non conforme n’est fabriqué.',
    average:
      'Moyenne des délais détection → traitement calculables. Done + Closed requis ; estimations et exclusions sont indiquées.',
    median: 'Médiane des délais calculables de la même population accessibilité.',
    p90: '90e percentile des délais calculables de la même population accessibilité.'
  };
  return `<section class="kpi-grid" data-workspace-cards aria-label="Indicateurs du périmètre">${cards
    .map(([key, label, numerator, denominator]) => {
      const value =
        model.available && summary && !(key === 'nonCovered' && summary.unknown > 0)
          ? summary[key as keyof typeof summary]
          : null;
      const display =
        typeof value === 'number'
          ? value.toLocaleString('fr-FR', { maximumFractionDigits: 1 })
          : 'Indisponible';
      return `<article class="kpi-card"><span class="kpi-label">${label}</span><strong class="number-indicator" data-workspace-kpi="${key}">${display}</strong><span data-workspace-ratio="${key}" data-numerator="${numerator}" data-denominator="${denominator}"></span><p data-workspace-unavailable="${key}">${value === null ? (['coverage', 'conformity', 'nonCovered'].includes(key) ? 'Présence composant × version ou verdict incomplet : consulter les réserves de données.' : 'Population ou dates calculables insuffisantes.') : ''}</p><details class="metric-info"><summary aria-label="Informations sur ${label}" title="Informations sur ${label}"><span aria-hidden="true">i</span></summary><p>${definitions[key]}</p><p><a href="accessibility.html#population">Voir les issues de la population</a> · <a href="quality.html">Réserves de données</a></p></details></article>`;
    })
    .join('')}</section><p role="status" aria-live="polite" data-workspace-summary></p>`;
}
/** Présente la liste nominative des sources à examiner sans écrire ni collecter sur GitHub. */
export function accessibilityPopulation(snapshot: Snapshot, review = false): string {
  const model = workspaceModel(snapshot);
  const rows = review ? model.review : model.rows.filter((row) => row.qualification.status !== 'unqualified');
  return `<article class="panel table-panel" id="${review ? 'review' : 'population'}"><h2>${review ? 'Issues sans label Audit + RGAA à examiner' : 'Population des anomalies d’accessibilité'}</h2><p>${review ? 'Signaux a11y ou RGAA sans label combiné : revue au cas par cas. Une relation d’audit existante reste explicite ; aucun lien n’est inventé.' : 'Qualification prouvée et présomption sont distinguées. Les bugs sans signal accessibilité restent dans l’activité des équipes.'}</p><button type="button" data-accessibility-export="${review ? 'review' : 'population'}">Exporter cette liste en CSV</button><div class="table-wrap" tabindex="0" role="region" aria-label="Liste des issues accessibilité"><table><caption>${review ? 'Cas à examiner' : 'Défauts distincts et preuves de qualification'}</caption><thead><tr>${['Issue GitHub', 'Titre', 'Repository', 'Labels', 'Qualification et motif', 'Criticité / catégories', 'Composants', 'Audit explicitement relié', 'État métier'].map((label) => `<th scope="col">${label}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr data-workspace-row data-review="${review}" ${contextAttribute(row)}><td><a href="${/^https:\/\//.test(row.url) ? html(row.url) : '#'}" rel="noopener noreferrer">#${row.number}</a></td><td>${html(row.title)}</td><td>${html(row.repo)}</td><td>${html(row.labels.join(', '))}</td><td>${html({ qualified: 'Accessibilité qualifiée', presumed: 'Accessibilité présumée', unqualified: 'Non qualifiée' }[row.qualification.status])}<small>${html(row.qualification.reasons.join(', '))}</small></td><td>${html(row.criticality)} / ${html(row.categories.join(', ') || 'inconnues')}</td><td>${html(row.components.join(', ') || 'non déterminés')}</td><td>${row.auditIds.length ? row.auditIds.map((id) => `<a href="audits.html?audit=${encodeURIComponent(id)}">${html(id)}</a>`).join(', ') : html(row.origin) + ' · aucun audit relié'}</td><td>${html(row.status === 'closed' ? 'Done ET Closed' : row.status === 'cancelled' ? 'Annulée' : 'Ouverte / en cours')}</td></tr>`).join('')}</tbody></table></div><p data-workspace-count="${review ? 'review' : 'population'}"></p></article>`;
}
/** Assemble tous les besoins des responsables d'audit, en explicitant les sources indisponibles. */
export function accessibilityContent(snapshot: Snapshot): string {
  return `<section class="panel"><h2>Pilotage des audits d’accessibilité</h2><p>Priorité aux responsables d’audit, puis à la Squad, son PO et son AM. Un audit, une anomalie d’accessibilité et un bug générique sont des objets distincts.</p><p>Sans sélection de version, la conformité porte sur la version PROD courante de chaque repository. Le stock des anomalies inclut les versions non déterminées ; sélectionner une version limite aux relations explicites ou aux audits applicables.</p></section>${workspaceCards(snapshot)}<article class="panel"><h2>Criticités, catégories et composants</h2><div data-workspace-breakdowns></div><p>Les catégories sont multi-étiquettes : leurs effectifs ne s’additionnent pas. Les criticités inconnues restent visibles.</p></article>${accessibilityPopulation(snapshot)}${accessibilityPopulation(snapshot, true)}<section class="panel"><h2>Conformité à la sortie d’une version</h2><p>L’état à la publication reste distinct de la connaissance actuelle et des audits de rattrapage.</p><a href="audits.html#component-versions">Voir les verdicts et les photographies de release</a></section><section class="panel"><h2>Usages des applications et fréquence d’utilisation</h2><p>Indisponible : aucune source de consommation des applications ni fréquence d’usage des composants n’est collectée. Aucun zéro n’est affiché.</p><h2>Audits de maquettes Design</h2><p>Indisponible : les données actuelles ne distinguent pas de façon fiable les audits de maquettes et leurs anomalies. Aucun taux n’est inventé.</p></section>`;
}
/** Expose le contrat pré-calculé avec une sérialisation sûre pour le navigateur. */
export function workspacePayload(snapshot: Snapshot): string {
  return `<script type="application/json" id="workspace-data">${JSON.stringify(workspaceModel(snapshot)).replace(/</g, '\\u003c')}</script><script type="module" src="assets/workspaces.js"></script>`;
}

/** Présente les réserves DQ avec leurs relations explicites et des filtres de diagnostic. */
export function dataQualityContent(snapshot: Snapshot): string {
  const repositories = new Map<string, Set<string>>();
  /** Associe une identité explicite à un repository sans déduire une origine du texte du diagnostic. */
  function associate(id: string, repo: string): void {
    if (!repo) return;
    const values = repositories.get(id) ?? new Set<string>();
    values.add(repo);
    repositories.set(id, values);
  }
  for (const fact of issueFacts(snapshot))
    for (const id of [
      fact.id,
      ...fact.auditIds,
      ...fact.anomalyIds,
      ...fact.componentIds,
      ...fact.versionIds,
      ...fact.prs
    ])
      associate(id, fact.repo);
  const data = snapshot.normalizedData;
  for (const library of data.libraries) {
    associate(library.libraryId, library.repository);
    for (const entity of [...data.components, ...(data.versions ?? [])].filter(
      (item) => item.libraryId === library.libraryId
    )) {
      associate('componentId' in entity ? entity.componentId : entity.versionId, library.repository);
      if (entity.provenance.sourceId) associate(entity.provenance.sourceId, library.repository);
    }
  }
  for (const relation of data.componentVersions ?? [])
    for (const repo of repositories.get(relation.componentId) ?? [])
      associate(relation.componentVersionId, repo);
  const filters: Array<[string, string, string[]]> = [
    [
      'repository',
      'Repository',
      [...new Set([...repositories.values()].flatMap((values) => [...values])), '__unknown__']
    ],
    ['dqRule', 'Règle', snapshot.dataQuality.issues.map((item) => item.ruleId)],
    ['dqSeverity', 'Sévérité', snapshot.dataQuality.issues.map((item) => item.severity)],
    ['dqAction', 'Action', snapshot.dataQuality.issues.map((item) => item.action)],
    ['dqType', 'Type d’entité', snapshot.dataQuality.issues.map((item) => item.entityType)],
    [
      'dqMetric',
      'Métrique affectée',
      snapshot.dataQuality.issues.flatMap((item) => item.impacts.map((impact) => impact.metricId))
    ]
  ];
  return (
    '<article class="panel table-panel" id="quality"><h2>Alertes de qualité des données</h2><p>Une alerte Data Quality décrit une donnée absente ou incohérente ; elle n’est pas une anomalie RGAA. Le repository est affiché uniquement lorsqu’une relation explicite permet de le retrouver.</p><div class="filter-bar">' +
    filters
      .map(
        ([key, label, values]) =>
          '<label>' +
          html(label) +
          '<select data-quality-filter="' +
          key +
          '"><option value="">Tous</option>' +
          [...new Set(values)]
            .sort()
            .map(
              (value) =>
                '<option value="' +
                html(value) +
                '">' +
                html(value === '__unknown__' ? 'Non déterminé' : value) +
                '</option>'
            )
            .join('') +
          '</select></label>'
      )
      .join('') +
    '<label>Rechercher<input type="search" data-quality-filter="dqSearch"></label><button type="button" data-quality-reset>Réinitialiser</button></div><p role="status" aria-live="polite"><strong class="number-indicator" data-quality-count>' +
    snapshot.dataQuality.issues.length +
    '</strong> alertes affichées <span data-quality-total>sur ' +
    snapshot.dataQuality.issues.length +
    '</span></p><div class="table-wrap" tabindex="0" role="region" aria-label="Diagnostics de qualité des données"><table><caption>Réserves, entités et effets sur les métriques</caption><thead><tr>' +
    [
      'Règle',
      'Sévérité',
      'Repository',
      'Type d’entité',
      'Entité / source',
      'Diagnostic',
      'Action',
      'Métriques et impacts'
    ]
      .map((label) => '<th scope="col">' + label + '</th>')
      .join('') +
    '</tr></thead><tbody>' +
    snapshot.dataQuality.issues
      .map((item) => {
        const repos = [...(repositories.get(item.entityId) ?? [])];
        const fact = issueFacts(snapshot).find(
          (row) =>
            row.id === item.entityId ||
            row.auditIds.includes(item.entityId) ||
            row.anomalyIds.includes(item.entityId)
        );
        const context = {
          repository: repos.length ? repos : ['__unknown__'],
          dqRule: [item.ruleId],
          dqSeverity: [item.severity],
          dqAction: [item.action],
          dqType: [item.entityType],
          dqMetric: item.impacts.map((impact) => impact.metricId)
        };
        return (
          '<tr data-quality-row data-quality-context="' +
          html(JSON.stringify(context)) +
          '"><td>' +
          html(item.ruleId) +
          '</td><td>' +
          html(item.severity) +
          '</td><td>' +
          html(repos.join(', ') || 'Non déterminé') +
          '</td><td>' +
          html(item.entityType) +
          '</td><td>' +
          html(item.entityId) +
          (fact
            ? '<br><a href="graph.html?issue=' +
              encodeURIComponent(fact.id) +
              '#traceability">Voir les relations explicites</a>'
            : '') +
          '</td><td>' +
          html(item.message) +
          '</td><td>' +
          html(item.action) +
          '</td><td>' +
          item.impacts
            .map(
              (impact) =>
                html(impact.metricId) +
                ' · ' +
                html(impact.action) +
                '<small>' +
                html(impact.reason) +
                '</small>'
            )
            .join('<br>') +
          '</td></tr>'
        );
      })
      .join('') +
    '</tbody></table></div></article>'
  );
}
