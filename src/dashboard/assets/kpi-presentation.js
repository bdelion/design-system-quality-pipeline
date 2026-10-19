/** Formate un nombre fini sans convertir une valeur absente en zéro. */
function number(value) {
  return typeof value === 'number' && Number.isFinite(value)
    ? value.toLocaleString('fr-FR', { maximumFractionDigits: 1 })
    : 'Indisponible';
}

/**
 * Présente un KPI pré-calculé, sa population et ses réserves sans recalcul métier.
 * @param {keyof import('../../analytics/workspaces.js').WorkspaceSummary} key - Indicateur demandé.
 * @param {Partial<import('../../analytics/workspaces.js').WorkspaceSummary> | null | undefined} summary - Agrégats du périmètre exact.
 * @returns {{value: string, population: string, reserve: string, unavailable: string}} Présentation commune au HTML et au navigateur.
 */
export function presentWorkspaceKpi(key, summary) {
  const rates = {
    coverage: ['covered', 'components', 'éléments du périmètre calculé'],
    conformity: ['conform', 'covered', 'couples couverts'],
    treatmentRate: ['treated', 'declared', 'issues non annulées']
  };
  const populations = {
    declared: 'issues d’accessibilité non annulées',
    treated: 'issues d’accessibilité traitées',
    remaining: 'issues d’accessibilité non annulées à traiter',
    cancelled: 'issues d’accessibilité annulées',
    presumed: 'issues d’accessibilité présumée, annulations comprises',
    nonCovered: 'éléments du périmètre calculé sans audit terminé applicable',
    unknown: 'composants à présence ou verdict indéterminé'
  };
  const rate = rates[key];
  const duration = ['average', 'median', 'p90'].includes(key);
  const raw = summary?.[key];
  const unknown = ['coverage', 'nonCovered'].includes(key) && summary?.unknown > 0;
  const missingProd =
    ['coverage', 'conformity', 'nonCovered'].includes(key) &&
    summary?.versionSelection?.mode === 'current-prod' &&
    summary.versionSelection.missingRepositories.length > 0;
  const validRate =
    !rate ||
    (typeof summary?.[rate[0]] === 'number' &&
      Number.isFinite(summary[rate[0]]) &&
      summary[rate[0]] >= 0 &&
      typeof summary?.[rate[1]] === 'number' &&
      Number.isFinite(summary[rate[1]]) &&
      summary[rate[1]] > 0);
  const available =
    typeof raw === 'number' &&
    Number.isFinite(raw) &&
    !unknown &&
    !missingProd &&
    validRate &&
    (!duration || (typeof summary?.measured === 'number' && summary.measured > 0));
  const value = available ? number(raw) + (rate ? ' %' : duration ? ' j' : '') : 'Indisponible';
  const population = !summary
    ? 'Population indisponible'
    : rate
      ? available
        ? `${number(summary[rate[0]])} sur ${number(summary[rate[1]])} ${rate[2]}`
        : 'Ratio indisponible'
      : duration
        ? `${number(summary.measured)} issues mesurables · ${number(summary.actual)} dates Done · ${number(summary.estimated)} estimations`
        : (populations[key] ?? 'Population indisponible');
  const unavailable = available
    ? ''
    : missingProd
      ? 'Version PROD non démontrée : consulter le périmètre des versions et ses preuves.'
      : unknown
        ? 'Présence ou couverture indéterminée : aucun zéro ni taux ne peut être conclu.'
        : rate
          ? 'Aucun ratio calculable dans ce périmètre : valeur ou dénominateur indisponible.'
          : 'Population ou dates calculables insuffisantes dans ce périmètre.';
  const reserves = [];
  if (unavailable) reserves.push(unavailable);
  if (summary?.qualityIssues > 0)
    reserves.push(
      `${number(summary.qualityIssues)} réserve${summary.qualityIssues === 1 ? '' : 's'} de données liée${summary.qualityIssues === 1 ? '' : 's'} au périmètre.`
    );
  if (summary?.unknown > 0)
    reserves.push(`${number(summary.unknown)} présences/verdicts de composant indéterminés.`);
  return { value, population, reserve: reserves.join(' '), unavailable };
}
