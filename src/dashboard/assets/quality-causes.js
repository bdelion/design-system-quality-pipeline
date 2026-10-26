/** Libellés de présentation issus des fiches docs/quality-rules ; aucune règle métier n’est changée. */
const rules = {
  'DQ-035': [
    'Qualification ou rattachement à vérifier',
    'Vérifier les labels, motifs de résolution et composants des issues concernées.'
  ],
  'DQ-001': ['Criticité absente', 'Vérifier le label ou la donnée de criticité dans la source.'],
  'DQ-002': [
    'Criticités incompatibles',
    'Vérifier les valeurs de criticité configurées et les labels source.'
  ],
  'DQ-003': ['Parents incompatibles', 'Vérifier les relations parent de la source.'],
  'DQ-004': [
    'Pull request identifiable absente',
    'Vérifier les références de fermeture et la relation Development.'
  ],
  'DQ-005': ['Pull request fusionnée et issue ouverte', 'Vérifier l’état de l’issue et le lien de clôture.'],
  'DQ-006': [
    'Composant absent du catalogue',
    'Vérifier le nom et les métadonnées dans le catalogue facultatif.'
  ],
  'DQ-007': ['Label inconnu', 'Vérifier le label source et la configuration des labels reconnus.'],
  'DQ-008': ['Issue annulée référencée par une PR', 'Vérifier la relation entre la PR et l’issue annulée.'],
  'DQ-009': ['Preuves de release indisponibles', 'Vérifier la disponibilité de la source Nexus.'],
  'DQ-010': ['Issue annulée rattachée à une milestone', 'Vérifier la milestone de l’issue annulée.'],
  'DQ-011': ['Date de correction non prouvée', 'Vérifier l’historique des statuts Project de l’anomalie.'],
  'DQ-012': [
    'Date de réalisation d’audit non prouvée',
    'Vérifier l’historique des statuts Project de l’audit.'
  ],
  'DQ-013': ['Anomalie Done avec issue ouverte', 'Vérifier les états Project et GitHub de l’anomalie.'],
  'DQ-014': ['Audit Done avec issue ouverte', 'Vérifier les états Project et GitHub de l’audit.'],
  'DQ-015': ['Catalogue historique absent au tag PROD', 'Vérifier le catalogue au tag PROD exact.'],
  'DQ-016': [
    'Catalogue historique invalide au tag PROD',
    'Vérifier la validité du catalogue au tag PROD exact.'
  ],
  'DQ-017': ['Type GitHub absent', 'Vérifier le champ Issue Type de la source.'],
  'DQ-018': ['Type GitHub non reconnu', 'Vérifier le type source et la configuration des types canoniques.'],
  'DQ-019': ['Type GitHub ambigu', 'Vérifier les correspondances de types canoniques dans la configuration.'],
  'DQ-020': ['Statut Project non reconnu', 'Vérifier le statut source et sa configuration.'],
  'DQ-021': ['Statut Project ambigu', 'Vérifier les correspondances de statuts Project.'],
  'DQ-022': ['Velocity non numérique', 'Vérifier la valeur Velocity dans le Project source.'],
  'DQ-023': ['Audit sans composant reconnu', 'Vérifier les labels Component de l’audit.'],
  'DQ-024': ['Audit avec plusieurs composants', 'Vérifier les rattachements Component de l’audit.'],
  'DQ-025': ['Version cible d’audit indéterminée', 'Vérifier la milestone et la version cible de l’audit.'],
  'DQ-026': ['Relation vers un audit indéterminée', 'Vérifier les relations explicites vers l’audit.'],
  'DQ-027': [
    'Composants de l’anomalie et de l’audit différents',
    'Vérifier les rattachements Component de l’anomalie et de l’audit.'
  ],
  'DQ-028': ['Audit parent de Feature indéterminé', 'Vérifier le parent Audit de la Feature.'],
  'DQ-029': [
    'Référence normalisée orpheline',
    'Vérifier les identités et relations déclarées dans le détail source.'
  ],
  'DQ-030': [
    'État métier non prouvé',
    'Vérifier les statuts et contextes Project, séparément de GitHub Closed.'
  ],
  'DQ-031': ['Date Done absente', 'Vérifier les événements Done dans l’historique Project.'],
  'DQ-032': ['Date de traitement invalide', 'Vérifier la date de création et la date de traitement source.'],
  'DQ-033': ['Borne package indéterminée', 'Vérifier la collecte du package racine et sa version.'],
  'DQ-034': [
    'Versions futures hors du périmètre analytique',
    'Vérifier la borne package et les versions conservées dans l’activité.'
  ]
};

/** Reconnaît seulement une URL source navigable déjà projetée ; aucun lien n’est fabriqué. */
function resolvedSource(row) {
  return /^https:\/\/[^\s"<>]+$/.test(row.sourceUrl);
}

/** Identifie exactement une cause ; messages, types et effets distincts ne sont jamais fusionnés. */
export function qualityCauseKey(row) {
  const impacts = row.impacts.map((impact) => [impact.metricId, impact.action, impact.reason]);
  impacts.sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  return JSON.stringify([
    row.ruleId,
    row.message,
    row.severity,
    row.action,
    row.entityType,
    impacts,
    resolvedSource(row)
  ]);
}

/**
 * Partitionne les occurrences sans les dédupliquer ni modifier leurs preuves.
 * @template T
 * @param {T[]} rows - Occurrences déjà projetées pour l’affichage.
 * @returns {{key: string, rows: T[]}[]} Groupes conservant les faits d’origine.
 */
export function groupQualityRows(rows) {
  const groups = new Map();
  for (const row of rows) {
    const key = qualityCauseKey(row);
    if (!groups.has(key)) groups.set(key, { key, rows: [] });
    groups.get(key).rows.push(row);
  }
  return [...groups.values()];
}

/** Présente une prochaine vérification documentée seulement lorsque source et action sont résolues. */
export function presentQualityCause(row) {
  const documented = Object.hasOwn(rules, row.ruleId) ? rules[row.ruleId] : undefined;
  const knownAction = ['include', 'exclude', 'block'].includes(row.action);
  return {
    title: documented?.[0] ?? 'Cause non documentée',
    severity:
      { ERROR: 'Erreur de données', WARNING: 'Avertissement de données', INFO: 'Information' }[
        row.severity
      ] ?? 'Sévérité inconnue',
    action:
      row.action === 'include'
        ? 'Donnée conservée avec réserve'
        : row.action === 'exclude'
          ? 'Exclusion sur les indicateurs concernés'
          : row.action === 'block'
            ? 'Action déclarée : blocage du traitement'
            : 'Action inconnue',
    next: !resolvedSource(row)
      ? 'Source non résolue ; vérification indisponible.'
      : !knownAction
        ? 'Action inconnue ; vérification indisponible.'
        : (documented?.[1] ?? 'Vérification non documentée pour cette règle.'),
    source: resolvedSource(row) ? 'Source résolue' : 'Source non résolue'
  };
}

/** Nomme les groupes et occurrences filtrés sans confondre ces effectifs avec des défauts produit. */
export function qualityGroupSummary(groups, occurrences) {
  return `${groups} groupe${groups === 1 ? '' : 's'} · ${occurrences} occurrence${occurrences === 1 ? '' : 's'} filtrée${occurrences === 1 ? '' : 's'}`;
}

/** Échappe les messages et codes, y compris ceux qui proviennent de règles non documentées. */
function escape(value) {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]
  );
}

/** Rend un groupe lisible avec accès au message technique original et à ses occurrences paginées. */
export function qualityCauseHtml(group, id, selected = false) {
  const row = group.rows[0];
  const presentation = presentQualityCause(row);
  return `<tr data-review-slot="s17" data-quality-cause-row data-review-key="${escape(group.key)}"><td data-review-slot="s18"><strong data-review-slot="s19">${escape(presentation.title)}</strong><small data-review-slot="s1a">${escape(row.ruleId)} · ${escape(row.entityType)}</small><details data-review-slot="s1b" data-quality-cause-detail="${escape(id)}"><summary data-review-slot="s1c">Message source</summary><p data-review-slot="s1d">${escape(row.message || 'Message source indisponible')}</p></details></td><td data-review-slot="s1e" data-cause-count>${group.rows.length}</td><td data-review-slot="s1f">${escape(presentation.severity)}<small data-review-slot="s1g">${escape(row.severity)} · ${escape(row.action || 'action absente')}</small>${escape(presentation.action)}</td><td data-review-slot="s1h">${row.impacts.map((impact) => `<span data-review-slot="review-cause-impact" data-review-key="${escape(JSON.stringify([impact.metricId, impact.action]))}">${escape(impact.metricId)} · ${escape(impact.action)}<small data-review-slot="s1i">${escape(impact.reason)}</small></span>`).join('') || 'Indicateurs affectés non documentés'}</td><td data-review-slot="s1k">${escape(presentation.next)}<small data-review-slot="s1l">${escape(presentation.source)}</small></td><td data-review-slot="s1m"><button data-review-slot="s1n" type="button" data-quality-cause="${escape(id)}" aria-pressed="${selected}">Voir ${group.rows.length} occurrence${group.rows.length === 1 ? '' : 's'} · ${escape(row.ruleId)}</button></td></tr>`;
}
