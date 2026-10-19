/** Formate un instant explicitement zoné en UTC ; aucune date locale implicite n’est inventée. */
export function presentCaptureDate(value) {
  const parts =
    typeof value === 'string'
      ? /^(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/i.exec(value)
      : null;
  if (
    !parts ||
    Number(parts[2]) < 1 ||
    Number(parts[2]) > 12 ||
    Number(parts[3]) < 1 ||
    Number(parts[3]) > new Date(Date.UTC(Number(parts[1]), Number(parts[2]), 0)).getUTCDate()
  )
    return 'Date de capture indisponible';
  const instant = Date.parse(value);
  if (!Number.isFinite(instant)) return 'Date de capture indisponible';
  return `Snapshot du ${new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'UTC',
    dateStyle: 'short',
    timeStyle: 'medium'
  }).format(new Date(instant))} UTC`;
}

/** Nomme le périmètre partagé réellement consommé ; les références de canal proviennent d’Analytics. */
export function presentSnapshotScope(model, params) {
  const global = model.page === 'index' || model.page === 'epics';
  const repository = global ? '' : params.get('repository') || '';
  const component =
    global || ['quality', 'history'].includes(model.page) ? '' : params.get('component') || '';
  const version = global || ['quality', 'history'].includes(model.page) ? '' : params.get('version') || '';
  const scope = [repository || 'Tous repositories', ...(component ? [`Composant : ${component}`] : [])];
  if (model.page === 'accessibility' || model.page === 'audits') {
    const focused = [
      'issue',
      'audit',
      'anomaly',
      'family',
      'progress',
      'result',
      'criticality',
      'category',
      'status'
    ].some((key) => params.has(key));
    const summary =
      !focused && model.data.workspaces?.available
        ? model.data.workspaces.scopes.find(
            (item) =>
              item.repository === repository && item.component === component && item.version === version
          )?.summary
        : null;
    const selection = summary?.versionSelection;
    if (!selection) scope.push('Synthèse de couverture/conformité indisponible sur ce périmètre');
    else {
      scope.push(
        'Couverture/conformité : ' +
          (selection.versions
            .map(
              (item) =>
                `${item.repository} : ${item.number} (${item.channel === 'prod' ? 'PROD' : item.channel === 'development' ? 'développement' : 'publication PROD non démontrée'})`
            )
            .join(' ; ') || 'aucune version démontrée')
      );
      if (selection.missingRepositories.length)
        scope.push(`PROD non démontrée : ${selection.missingRepositories.join(', ')}`);
    }
    scope.push(version ? `Faits : version ${version}` : 'Faits : toutes versions');
  } else {
    scope.push(version ? `Version cible : ${version} (relations explicites)` : 'Toutes versions');
  }
  const focus = global
    ? []
    : [
        'issue',
        'audit',
        'anomaly',
        'family',
        'progress',
        'result',
        'criticality',
        'category',
        'status',
        'dqRule',
        'dqSeverity',
        'dqAction',
        'dqType',
        'dqMetric',
        'dqSearch'
      ]
        .filter((key) => params.has(key))
        .map((key) => `${key} : ${params.get(key)}`);
  return [...scope, ...focus].join(' · ');
}
