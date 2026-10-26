import { qualityReadModel } from './quality-read-model.js';
import { groupQualityRows, qualityCauseHtml, qualityGroupSummary } from './assets/quality-causes.js';
import { qualityRowHtml } from './assets/quality-presentation.js';
import { paginate, paginationContent } from './assets/pagination.js';
/** Organisation des espaces métier et restitution des populations calculées par Analytics. */
import type { Snapshot } from '../domain/types.js';
import {
  workspaceAnalytics,
  type WorkspaceAnalytics,
  type WorkspaceSummary
} from '../analytics/workspaces.js';
import { presentWorkspaceKpi } from './assets/kpi-presentation.js';
import { presentWorkspaceVersions } from './assets/version-presentation.js';
import { contextAttribute } from './evidence.js';

/** Échappe une valeur avant son insertion dans le HTML. */
function html(value: unknown): string {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!
  );
}
const models = new WeakMap<Snapshot, WorkspaceAnalytics>();
/** Ouvre une issue source HTTPS dans un nouvel onglet ; une URL inconnue reste du texte. */
function githubIssueLink(url: string, number: number): string {
  return /^https:\/\/[^\s"<>]+$/.test(url)
    ? `<a data-review-slot="s10i" href="${html(url)}" target="_blank" rel="noopener noreferrer">#${number} ↗</a>`
    : `#${number} · source non résolue`;
}
/** Invalide la projection lors d'une nouvelle génération sur un objet de développement modifié. */
export function resetWorkspaceModel(snapshot: Snapshot): void {
  models.delete(snapshot);
}
/** Restitue le contrat courant ou reprojette ses versions sans modifier les faits ni les qualifications d'un ancien snapshot. */
export function workspaceModel(snapshot: Snapshot): WorkspaceAnalytics {
  let model = models.get(snapshot);
  if (!model) {
    model =
      snapshot.analytics.workspaces?.version === 1 &&
      snapshot.analytics.workspaces.versionSelectionAlgorithm === 'prod-tag-v1'
        ? snapshot.analytics.workspaces
        : workspaceAnalytics(
            snapshot.normalizedData,
            snapshot.dataQuality.issues,
            {},
            snapshot.analytics.workspaces?.rows
          );
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
        : ['Analyse des issues', 'Suivi des Epics'].includes(title)
          ? 'issues'
          : ['Analyse des composants', 'Cartographie'].includes(title)
            ? 'components'
            : title === 'Historique'
              ? 'history'
              : 'quality';
  const icons: Record<string, string> = {
    index:
      '<rect data-review-slot="s10j" x="3" y="3" width="7" height="7" rx="1"/><rect data-review-slot="s10k" x="14" y="3" width="7" height="7" rx="1"/><rect data-review-slot="s10l" x="3" y="14" width="7" height="7" rx="1"/><rect data-review-slot="s10m" x="14" y="14" width="7" height="7" rx="1"/>',
    accessibility:
      '<circle data-review-slot="s10n" cx="12" cy="4" r="2"/><path data-review-slot="s10o" d="M4 9h16M12 6v8M7 21l5-7 5 7"/>',
    issues: '<path data-review-slot="s10p" d="M8 6h13M8 12h13M8 18h13M3 6h1M3 12h1M3 18h1"/>',
    components: '<path data-review-slot="s10q" d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
    history: '<path data-review-slot="s10r" d="M3 11a9 9 0 1 1 2 7M3 4v7h7M12 7v5l3 2"/>',
    quality:
      '<path data-review-slot="s10s" d="m12 3 9 4v6c0 4-5 7-9 9-4-2-9-5-9-9V7l9-4Z"/><path data-review-slot="s10t" d="m8 12 3 3 5-6"/>'
  };
  const links = [
    ['index', 'Vue d’ensemble'],
    ['accessibility', 'Accessibilité'],
    ['issues', 'Activité des équipes'],
    ['components', 'Composants et versions'],
    ['history', 'Historique'],
    ['quality', 'Qualité des données']
  ];
  return `<nav data-review-slot="s10u" class="side-nav" aria-label="Navigation principale">${links.map(([file, label]) => `<a data-review-slot="s10v" data-review-key="${file}" data-workspace-nav href="${file}.html"${group === file ? ' aria-current="page" class="active"' : ''}>${`<svg data-review-slot="s10w" class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true" focusable="false">${icons[file!]}</svg>`}<span data-review-slot="s10x">${label}</span></a>`).join('')}</nav>`;
}
/** Fournit les liens détaillés sans dupliquer les espaces dans la navigation principale. */
export function workspaceSubnavigation(title: string): string {
  if (['Analyse des issues', 'Suivi des Epics'].includes(title))
    return '<nav data-review-slot="s10y" class="workspace-tabs" aria-label="Vues activité"><a data-review-slot="s10z" href="issues.html">Activité des équipes</a><a data-review-slot="s110" href="epics.html">Suivi des Epics</a></nav>';
  if (['Accessibilité', 'Anomalies', 'Audits et composants'].includes(title))
    return '<nav data-review-slot="s111" class="workspace-tabs" aria-label="Vues accessibilité"><a data-review-slot="s112" href="accessibility.html">Indicateurs accessibilité</a><a data-review-slot="s113" href="audits.html">Audits et conformité par version</a><a data-review-slot="s114" href="accessibility.html#review">Issues à examiner</a><a data-review-slot="s115" href="anomalies.html">Tous les défauts normalisés</a></nav>';
  if (['Analyse des composants', 'Cartographie'].includes(title))
    return '<nav data-review-slot="s116" class="workspace-tabs" aria-label="Vues du patrimoine"><a data-review-slot="s117" href="components.html">Composants et versions</a><a data-review-slot="s118" href="graph.html">Cartographie et relations</a></nav>';
  return '';
}
/** Affiche unités, populations et réserves des KPI selon le contrat partagé avec le navigateur. */
export function workspaceCards(snapshot: Snapshot, compact = false): string {
  const model = workspaceModel(snapshot);
  const summary = model.scopes.find(
    (scope) => !scope.repository && !scope.component && !scope.version
  )?.summary;
  const cards: Array<[string, string, string, string]> = compact
    ? [
        ['coverage', 'Couverture du périmètre calculé', 'covered', 'components'],
        ['conformity', 'Conformité des couples couverts', 'conform', 'covered'],
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
        ['coverage', 'Couverture du périmètre calculé', 'covered', 'components'],
        ['conformity', 'Conformité des couples couverts', 'conform', 'covered'],
        ['nonCovered', 'Couples présents non couverts', '', ''],
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
      'Couples couverts / périmètre calculé : identités non retirées en PROD courante, relations matérialisées si version explicite. Ce dénominateur ne prouve pas la présence ; voir le détail nominatif.',
    conformity:
      'Couples conformes / couples couverts. Non audité reste distinct de non conforme. Le verdict provient des audits applicables, pas de la correction seule.',
    unknown:
      'Composants connus dont la présence dans la version ou le verdict ne peut pas être établi. Ils ne sont pas assimilés à des composants non couverts.',
    nonCovered:
      'Présence du composant connue, sans audit terminé applicable ; aucun verdict non conforme n’est fabriqué.',
    average:
      'Moyenne des délais détection → traitement calculables. Done + Closed requis ; estimations et exclusions sont indiquées.',
    median: 'Médiane des délais calculables de la même population accessibilité.',
    p90: '90e percentile des délais calculables de la même population accessibilité.'
  };
  return `<p data-review-slot="s119" class="panel-note" data-workspace-version-context>${html(presentWorkspaceVersions(model.available ? summary?.versionSelection : undefined))}</p><section data-review-slot="s11a" class="kpi-grid" data-workspace-cards aria-label="Indicateurs du périmètre">${cards
    .map(([key, label, numerator, denominator]) => {
      const presentation = presentWorkspaceKpi(
        key as keyof WorkspaceSummary,
        model.available ? summary : null
      );
      return `<article data-review-slot="s11b" data-review-key="${key}" class="kpi-card compact-kpi"><span data-review-slot="s11c" class="kpi-label">${label}</span><strong data-review-slot="s11d" class="number-indicator" data-workspace-kpi="${key}">${html(presentation.value)}</strong><span data-review-slot="s11e" data-workspace-ratio="${key}" data-numerator="${numerator}" data-denominator="${denominator}">${html(presentation.population)}</span><small data-review-slot="s11f" data-workspace-reserve="${key}">${html(presentation.reserve)}</small><button data-review-slot="s11g" type="button" class="metric-info-button" popovertarget="metric-info-${key}" aria-controls="metric-info-${key}" aria-expanded="false" aria-label="Informations sur ${label}"><span data-review-slot="s11h" aria-hidden="true">i</span></button><div data-review-slot="s11i" id="metric-info-${key}" class="metric-tooltip" popover role="dialog" aria-label="Informations sur ${label}"><p data-review-slot="s11j">${definitions[key]}</p><p data-review-slot="s11k" data-workspace-unavailable="${key}">${html(presentation.unavailable)}</p><p data-review-slot="s11l"><a data-review-slot="s11m" href="${['coverage', 'conformity', 'nonCovered', 'unknown'].includes(key) ? 'audits.html#component-populations' : 'accessibility.html#population'}">Voir les preuves de la population</a> · <a data-review-slot="s11n" href="quality.html">Réserves de données</a></p></div></article>`;
    })
    .join(
      ''
    )}</section><p data-review-slot="s11o" role="status" aria-live="polite" data-workspace-summary></p>`;
}
/** Présente la liste nominative des sources à examiner sans écrire ni collecter sur GitHub. */
export function accessibilityPopulation(snapshot: Snapshot, review = false): string {
  const model = workspaceModel(snapshot);
  const rows = review ? model.review : model.rows.filter((row) => row.qualification.status !== 'unqualified');
  return `<article data-review-slot="s11p" class="panel table-panel" id="${review ? 'review' : 'population'}"><h2 data-review-slot="s11q">${review ? 'Issues sans label Audit + RGAA à examiner' : 'Population des anomalies d’accessibilité'}</h2><p data-review-slot="s11r">${review ? 'Signaux a11y ou RGAA sans label combiné : revue au cas par cas. Une relation d’audit existante reste explicite ; aucun lien n’est inventé.' : 'Qualification prouvée et présomption sont distinguées. Les bugs sans signal accessibilité restent dans l’activité des équipes.'}</p><button data-review-slot="s11s" type="button" data-accessibility-export="${review ? 'review' : 'population'}">Exporter cette liste en CSV</button><div data-review-slot="s11t" class="table-wrap" tabindex="0" role="region" aria-label="Liste des issues accessibilité"><table data-review-slot="s11u"><caption data-review-slot="s11v">${review ? 'Cas à examiner' : 'Défauts distincts et preuves de qualification'}</caption><thead data-review-slot="s11w"><tr data-review-slot="s11x">${['Issue GitHub', 'Titre', 'Repository', 'Labels', 'Qualification et motif', 'Criticité / catégories', 'Composants', 'Audit explicitement relié', 'État métier'].map((label, field) => `<th data-review-key="${field}" data-review-slot="s11y" scope="col">${label}</th>`).join('')}</tr></thead><tbody data-review-slot="s11z">${rows.map((row) => `<tr data-review-slot="s120" data-workspace-row data-review="${review}" ${contextAttribute(row)}><td data-review-slot="s121">${githubIssueLink(row.url, row.number)}</td><td data-review-slot="s122">${html(row.title)}</td><td data-review-slot="s123">${html(row.repo)}</td><td data-review-slot="s124">${html(row.labels.join(', '))}</td><td data-review-slot="s125">${html({ qualified: 'Accessibilité qualifiée', presumed: 'Accessibilité présumée', unqualified: 'Non qualifiée' }[row.qualification.status])}<small data-review-slot="s126">${html(row.qualification.reasons.join(', '))}</small></td><td data-review-slot="s127">${html(row.criticality)} / ${html(row.categories.join(', ') || 'inconnues')}</td><td data-review-slot="s128">${html(row.components.join(', ') || 'non déterminés')}</td><td data-review-slot="s129">${row.auditIds.length ? row.auditIds.map((id) => `<a data-review-slot="s12a" data-review-key="${html(id)}" href="audits.html?audit=${encodeURIComponent(id)}">${html(id)}</a>`).join(', ') : html(row.origin) + ' · aucun audit relié'}</td><td data-review-slot="s12b">${html(row.status === 'closed' ? 'Done ET Closed' : row.status === 'cancelled' ? 'Annulée' : 'Ouverte / en cours')}</td></tr>`).join('')}</tbody></table></div><p data-review-slot="s12c" data-workspace-count="${review ? 'review' : 'population'}"></p></article>`;
}
/** Assemble tous les besoins des responsables d'audit, en explicitant les sources indisponibles. */
export function accessibilityContent(snapshot: Snapshot): string {
  return `<section data-review-slot="s12d" class="panel"><h2 data-review-slot="s12e">Pilotage des audits d’accessibilité</h2><p data-review-slot="s12f">Priorité aux responsables d’audit, puis à la Squad, son PO et son AM. Un audit, une anomalie d’accessibilité et un bug générique sont des objets distincts.</p><p data-review-slot="s12g">Sans sélection de version, la conformité porte sur la version PROD courante de chaque repository. Le stock des anomalies inclut les versions non déterminées ; sélectionner une version limite aux relations explicites ou aux audits applicables.</p></section>${workspaceCards(snapshot)}<article data-review-slot="s12h" class="panel"><h2 data-review-slot="s12i">Criticités, catégories et composants</h2><div data-review-slot="s12j" data-workspace-breakdowns></div><p data-review-slot="s12k">Les catégories sont multi-étiquettes : leurs effectifs ne s’additionnent pas. Les criticités inconnues restent visibles.</p></article>${accessibilityPopulation(snapshot)}${accessibilityPopulation(snapshot, true)}<section data-review-slot="s12l" class="panel"><h2 data-review-slot="s12m">Conformité à la sortie d’une version</h2><p data-review-slot="s12n">L’état à la publication reste distinct de la connaissance actuelle et des audits de rattrapage.</p><a data-review-slot="s12o" href="audits.html#component-versions">Voir les verdicts et les photographies de release</a></section><section data-review-slot="s12p" class="panel"><h2 data-review-slot="s12q">Usages des applications et fréquence d’utilisation</h2><p data-review-slot="s12r">Indisponible : aucune source de consommation des applications ni fréquence d’usage des composants n’est collectée. Aucun zéro n’est affiché.</p><h2 data-review-slot="s12s">Audits de maquettes Design</h2><p data-review-slot="s12t">Indisponible : les données actuelles ne distinguent pas de façon fiable les audits de maquettes et leurs anomalies. Aucun taux n’est inventé.</p></section>`;
}
/** Présente les réserves DQ avec leurs relations explicites et des filtres de diagnostic. */
export function dataQualityContent(snapshot: Snapshot, githubUrl?: string): string {
  const rows = qualityReadModel(snapshot, githubUrl);
  const groups = groupQualityRows(rows);
  const filters: Array<[string, string, string[]]> = [
    [
      'repository',
      'Repository',
      [
        ...new Set([
          ...snapshot.normalizedData.libraries.map((library) => library.repository),
          ...rows.flatMap((row) => row.repositories)
        ]),
        '__unknown__'
      ]
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
    '<article data-review-slot="s12u" class="panel table-panel" id="quality"><h2 data-review-slot="s12v">Alertes de qualité des données</h2><p data-review-slot="s12w">Une alerte Data Quality décrit une donnée absente ou incohérente ; elle n’est pas une anomalie RGAA. Le repository est affiché uniquement lorsqu’une relation explicite permet de le retrouver.</p><div data-review-slot="s12x" class="filter-bar">' +
    filters
      .map(
        ([key, label, values]) =>
          '<label data-review-slot="s12y" data-review-key="' +
          key +
          '">' +
          html(label) +
          '<select data-review-slot="s12z" data-quality-filter="' +
          key +
          '"><option data-review-slot="s130" value="">Tous</option>' +
          [...new Set(values)]
            .sort()
            .map(
              (value) =>
                '<option data-review-slot="s131" value="' +
                html(value) +
                '">' +
                html(value === '__unknown__' ? 'Non déterminé' : value) +
                '</option>'
            )
            .join('') +
          '</select></label>'
      )
      .join('') +
    '<label data-review-slot="s132">Rechercher<input data-review-slot="s133" type="search" data-quality-filter="dqSearch"></label><button data-review-slot="s134" type="button" data-quality-reset>Réinitialiser</button></div><p data-review-slot="s135" role="status" aria-live="polite"><strong data-review-slot="s136" class="number-indicator" data-quality-count>' +
    snapshot.dataQuality.issues.length +
    '</strong> diagnostics filtrés <span data-review-slot="s137" data-quality-total>sur ' +
    snapshot.dataQuality.issues.length +
    '</span></p><section data-review-slot="s138" aria-label="Synthèse des causes DQ"><h3 data-review-slot="s139">Causes et prochaines vérifications</h3><p data-review-slot="s13a">Ces occurrences décrivent la fiabilité des données, pas un nombre de défauts produit ni un verdict de conformité RGAA.</p><p data-review-slot="s13b" data-quality-group-summary role="status" aria-live="polite" tabindex="-1">' +
    qualityGroupSummary(groups.length, rows.length) +
    '</p><div data-review-slot="s13c" class="table-wrap" tabindex="0" role="region" aria-label="Causes des diagnostics"><table data-review-slot="s13d"><thead data-review-slot="s13e"><tr data-review-slot="s13f">' +
    [
      'Cause et message source',
      'Occurrences',
      'Sévérité et action',
      'Indicateurs et effets déclarés',
      'Prochaine vérification',
      'Détail'
    ]
      .map(
        (label, field) => `<th data-review-key="${field}" data-review-slot="s13g" scope="col">${label}</th>`
      )
      .join('') +
    '</tr></thead><tbody data-review-slot="s13h" data-quality-causes>' +
    paginate(groups)
      .rows.map((group, index) => qualityCauseHtml(group, `${snapshot.snapshotId}:${index}`))
      .join('') +
    '</tbody></table></div>' +
    paginationContent('quality-causes') +
    '</section><h3 data-review-slot="s13i" data-quality-occurrences-heading tabindex="-1">Occurrences et preuves techniques</h3><p data-review-slot="s13j" data-quality-cause-selection>Comme les filtres, le choix d’une cause limite le détail et le CSV complet.</p><button data-review-slot="s13k" type="button" data-quality-all-causes>Toutes les causes</button><div data-review-slot="s13l" class="table-wrap" tabindex="0" role="region" aria-label="Diagnostics de qualité des données"><table data-review-slot="s13m"><caption data-review-slot="s13n">Réserves, entités et effets sur les métriques</caption><thead data-review-slot="s13o"><tr data-review-slot="s13p">' +
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
      .map(
        (label, index) =>
          `<th data-review-slot="s13q" data-review-key="field:${index}" scope="col"><button data-review-slot="s13r" type="button" data-quality-sort="${index}">${label} ↕</button></th>`
      )
      .join('') +
    '</tr></thead><tbody data-review-slot="s13s" data-quality-rows>' +
    paginate(rows).rows.map(qualityRowHtml).join('') +
    '</tbody></table></div>' +
    paginationContent('quality') +
    '<p data-review-slot="s13t">CSV : tous les diagnostics filtrés, toutes pages.</p><button data-review-slot="s13u" type="button" data-quality-export>Exporter CSV</button></article>'
  );
}
