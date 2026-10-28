import type { Issue, NormalizedData } from '../domain/types.js';
import { latestAuditVersions, compareAuditVersions } from '../domain/audit-tracking.js';
import { isCompletedAudit, currentProjectStatus } from '../domain/business.js';
import { auditChildAnomalies } from './audit-evidence.js';
import type { SimpleTable, SimpleRow } from './simplified-dashboard.js';

/** Date le traitement confirmé depuis les transitions et les PR ; une date manquante reste inconnue. */
function treatmentDate(issue: Issue, data: NormalizedData): number | null {
  const cancelled = issue.projectContexts.some((c) => currentProjectStatus(c) === 'CANCELLED');
  const dates = issue.projectContexts
    .flatMap((c) => c.statusHistory)
    .filter((entry) => entry.status === (cancelled ? 'CANCELLED' : 'DONE'))
    .map((entry) => Date.parse(entry.transitionedAt));
  if (!dates.length) dates.push(Date.parse(issue.closedAt ?? ''));
  if (!cancelled) {
    for (const id of issue.review?.mergedPullRequestIds ?? [])
      dates.push(Date.parse(data.pullRequests.find((pr) => pr.pullRequestId === id)?.mergedAt ?? ''));
  }
  return dates.length && dates.every(Number.isFinite) ? Math.max(...dates) : null;
}

/** Liste les besoins d’audit du catalogue latest, avec motifs cumulables et réserves de datation. */
export function auditPlanTable(data: NormalizedData): SimpleTable {
  const rows: SimpleRow[] = [];
  const missing: string[] = [];
  const latest = latestAuditVersions(data);
  const issues = new Map((data.issues ?? []).map((issue) => [issue.issueId, issue]));
  for (const library of data.libraries) {
    const number = latest.get(library.libraryId);
    const version = data.versions?.find((v) => v.libraryId === library.libraryId && v.number === number);
    if (!number) continue;
    if (
      !version ||
      !(data.componentVersions ?? []).some((relation) => relation.versionId === version.versionId)
    ) {
      missing.push(library.repository + ' ' + number);
      continue;
    }
    for (const relation of data.componentVersions ?? []) {
      if (relation.versionId !== version.versionId) continue;
      const component = data.components.find((c) => c.componentId === relation.componentId);
      const audits = data.audits.filter(
        (a) =>
          a.libraryId === library.libraryId &&
          a.componentId === relation.componentId &&
          compareAuditVersions(a.version, version.number) <= 0
      );
      const completed = audits.filter((a) => isCompletedAudit(a, data.issues ?? []));
      const reasons: string[] = [];
      const reserves: string[] = [];
      const refs = new Set<string>();
      if (!completed.length) reasons.push('Aucun audit terminé dans le périmètre suivi');
      if (
        version.channel === 'development' &&
        ['modified', 'added', 'renamed'].includes(relation.change ?? '')
      )
        reasons.push('Évolution dans la version en développement');
      if (version.channel === 'development' && (!relation.change || relation.change === 'unspecified'))
        reserves.push('Évolution non renseignée');
      const cohort = completed.filter((a) => relation.applicableAuditIds?.includes(a.auditId));
      const anomalies = auditChildAnomalies(data, cohort);
      if (
        anomalies.length &&
        anomalies.every((anomaly) => {
          const issue = issues.get(anomaly.issueId);
          return (
            issue?.review?.correctionConfirmed ||
            issue?.projectContexts.some((c) => currentProjectStatus(c) === 'CANCELLED')
          );
        })
      ) {
        const dates = anomalies.map((anomaly) => treatmentDate(issues.get(anomaly.issueId)!, data));
        const auditDates = cohort.map((audit) => Date.parse(audit.completedAt ?? ''));
        const dated =
          dates.every((date) => date !== null) && auditDates.length > 0 && auditDates.every(Number.isFinite);
        const lastTreatment = dated ? Math.max(...(dates as number[])) : null;
        const lastAudit = dated ? Math.max(...auditDates) : null;
        if (lastTreatment !== null && lastAudit !== null && lastAudit < lastTreatment)
          reasons.push('Retours du dernier audit tous traités — réaudit requis');
        else if (!dated) reserves.push('Retours tous traités ; chronologie du réaudit indéterminable');
        for (const anomaly of anomalies) refs.add(anomaly.issueId);
      }
      if (!reasons.length && !reserves.length) continue;
      for (const audit of audits) refs.add(audit.issueId);
      const active = audits.filter(
        (a) =>
          !isCompletedAudit(a, data.issues ?? []) && a.lifecycle !== 'cancelled' && a.status !== 'cancelled'
      );
      rows.push({
        reviewKey: relation.componentVersionId,
        repository: library.repository,
        version: version.number,
        cells: [
          { value: library.repository },
          { value: version.number },
          { value: component?.name ?? relation.componentId },
          { value: reasons.join(' ; ') || 'Besoin à confirmer', refs: [...refs] },
          { value: active.length, refs: active.map((a) => a.issueId) },
          { value: reserves.join(' ; ') || 'Aucune réserve complémentaire' }
        ]
      });
    }
  }
  return {
    id: 'audit-plan',
    title: 'Composants à auditer',
    description:
      'Catalogue de la dernière version publiée ou explicitement en développement. Motifs cumulables dans le périmètre suivi. Un audit en cours reste visible et ne vaut pas un audit terminé ; les inconnues sont signalées.' +
      (missing.length
        ? ' Catalogue latest indisponible : ' + missing.join(', ') + ' ; besoins impossibles à dénombrer.'
        : ''),
    headers: ['Librairie', 'Version', 'Composant', 'Motifs', 'Audits déjà planifiés ou en cours', 'Réserves'],
    rows
  };
}
