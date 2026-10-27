import type { Audit, NormalizedData } from '../domain/types.js';
import { currentProjectStatus } from '../domain/business.js';
import type { SimpleTable } from './simplified-dashboard.js';

/** Retient les anomalies d’accessibilité enfants explicites des audits, avec repository et composant cohérents. */
export function auditChildAnomalies(data: NormalizedData, audits: Audit[]) {
  const issues = new Map((data.issues ?? []).map((issue) => [issue.issueId, issue]));
  const auditById = new Map(
    audits
      .filter((audit) => issues.get(audit.issueId)?.issueType !== 'EPIC')
      .map((audit) => [audit.auditId, audit])
  );
  return [
    ...new Map(
      data.anomalies
        .filter((anomaly) => {
          const audit = anomaly.auditId ? auditById.get(anomaly.auditId) : undefined;
          const issue = issues.get(anomaly.issueId);
          return (
            audit &&
            anomaly.origin === 'AUDIT' &&
            anomaly.accessibility !== false &&
            (!issue || issue.libraryId === audit.libraryId) &&
            (!issue || issue.parentIssueId === audit.issueId) &&
            (!issue?.review || issue.componentIds.includes(audit.componentId))
          );
        })
        .map((anomaly) => [anomaly.issueId, anomaly])
    ).values()
  ];
}

/** Prépare les trois répartitions par campagne ; chaque case conserve ses issues distinctes et ses inconnues. */
export function auditDistributionTables(data: NormalizedData): SimpleTable[] {
  const anomalies = auditChildAnomalies(data, data.audits);
  const audits = new Map(data.audits.map((audit) => [audit.auditId, audit]));
  const issues = new Map((data.issues ?? []).map((issue) => [issue.issueId, issue]));
  const components = new Map(data.components.map((component) => [component.componentId, component.name]));
  const libraries = new Map(data.libraries.map((library) => [library.libraryId, library.repository]));
  return (['criticality', 'category', 'component'] as const).map((dimension) => {
    const groups = new Map<string, { repository: string; version: string; label: string; ids: string[] }>();
    for (const anomaly of anomalies) {
      const audit = audits.get(anomaly.auditId!)!;
      const issue = issues.get(anomaly.issueId);
      const labels =
        dimension === 'criticality'
          ? [
              ({ blocking: 'Bloquante', major: 'Majeure', minor: 'Mineure' } as Record<string, string>)[
                anomaly.criticality ?? ''
              ] ?? 'Non renseignée'
            ]
          : dimension === 'category'
            ? anomaly.categories.length
              ? anomaly.categories
              : ['Non renseigné']
            : (issue?.componentIds.length ? issue.componentIds : [audit.componentId]).map(
                (id) => components.get(id) ?? id
              );
      for (const label of new Set(labels)) {
        const key = JSON.stringify([audit.libraryId, audit.version, label]);
        const group = groups.get(key) ?? {
          repository: libraries.get(audit.libraryId) ?? audit.libraryId,
          version: audit.version,
          label,
          ids: [] as string[]
        };
        group.ids.push(anomaly.issueId);
        groups.set(key, group);
      }
    }
    const name = { criticality: 'Criticité', category: 'Critère d’accessibilité', component: 'Composant' }[
      dimension
    ];
    return {
      id: 'audit-' + dimension,
      title: 'Anomalies d’audit — ' + name.toLocaleLowerCase('fr'),
      description:
        'Issues distinctes liées aux audits de la version, sans héritage. Réalisé = correction confirmée (Done + PR fusionnée), sans preuve automatique de conformité. Annulées et états inconnus séparés. Une issue multi-critères/composants peut apparaître dans plusieurs lignes.',
      headers: ['Librairie', 'Version', name, 'Total', 'Restant', 'Réalisé', 'Annulées', 'Statut inconnu'],
      populationColumns: [3, 4, 5],
      rows: [...groups.entries()].map(([key, group]) => {
        const ids = [...new Set(group.ids)];
        const populations = [
          ids,
          ...(['remaining', 'done', 'cancelled', 'unknown'] as const).map((bucket) =>
            ids.filter((id) => {
              const issue = issues.get(id);
              const statuses = issue?.projectContexts.map(currentProjectStatus) ?? [];
              const state = statuses.includes('CANCELLED')
                ? 'cancelled'
                : issue?.review?.correctionConfirmed
                  ? 'done'
                  : !statuses.length || statuses.some((status) => !status) || !issue?.review
                    ? 'unknown'
                    : 'remaining';
              return state === bucket;
            })
          )
        ];
        return {
          reviewKey: key,
          repository: group.repository,
          version: group.version,
          cells: [
            { value: group.repository },
            { value: group.version },
            { value: group.label },
            ...populations.map((refs) => ({ value: refs.length, refs }))
          ]
        };
      })
    };
  });
}
