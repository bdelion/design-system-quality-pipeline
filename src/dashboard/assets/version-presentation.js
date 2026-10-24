/**
 * Nomme les références pré-calculées et distingue le périmètre de conformité du stock d'anomalies.
 * @param {import('../../analytics/workspaces.js').WorkspaceVersionSelection | undefined} selection - Références du périmètre exact.
 * @returns {string} Bandeau lisible sans inférence de publication côté navigateur.
 */
export function presentWorkspaceVersions(selection) {
  if (!selection) return 'Périmètre/version indisponible : aucun résultat global n’est substitué.';
  const references = selection.versions.map((version) => {
    const channel =
      version.channel === 'prod'
        ? `PROD, tag ${version.tag}`
        : version.channel === 'development'
          ? 'développement, publication PROD non démontrée'
          : 'publication PROD non démontrée';
    return `${version.repository} : ${version.number} (${channel})`;
  });
  const missing = selection.missingRepositories.length
    ? ` PROD non démontrée pour : ${selection.missingRepositories.join(', ')} ; couverture/conformité indisponibles sur ce périmètre.`
    : '';
  return (
    (selection.mode === 'current-prod'
      ? 'Couverture/conformité — PROD courantes démontrées : '
      : 'Version sélectionnée : ') +
    (references.join(' ; ') || 'aucune référence démontrée') +
    '.' +
    missing +
    (selection.mode === 'current-prod'
      ? ' Anomalies, délais et répartitions : toutes versions, y compris les versions indéterminées.'
      : ' Anomalies, délais et répartitions : version sélectionnée, selon les relations explicites.')
  );
}
