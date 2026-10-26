import type { Issue, Snapshot } from '../domain/types.js';
import { currentProjectStatus } from '../domain/business.js';
import { projectIssueFacts } from './issues.js';
import { quantile } from './statistics.js';
import type { SimpleCell, SimpleRow, SimpleTable } from './simplified-dashboard.js';

/** Classe uniquement les statuts Project prouvés ; Closed seul ne devient pas Done. */
function projectBucket(issue: Issue): 'active' | 'done' | 'cancelled' | 'unknown' {
  const statuses = issue.projectContexts.map(currentProjectStatus);
  if (statuses.includes('CANCELLED')) return 'cancelled';
  if (!statuses.length || statuses.some((status) => !status)) return 'unknown';
  if (statuses.every((status) => status === 'DONE')) return 'done';
  if (statuses.includes('DONE')) return 'unknown';
  return 'active';
}
/** Produit une cellule traçable avec une note de population lisible. */
function evidence(value: SimpleCell['value'], issues: Issue[], note?: string): SimpleCell {
  return { value, refs: [...new Set(issues.map((issue) => issue.issueId))], ...(note ? { note } : {}) };
}
/** Liste les issues distinctes par repository et composant, avec les cohortes de délais du pipeline. */
export function componentActivityTable(snapshot: Snapshot): SimpleTable {
  const data = snapshot.normalizedData;
  const facts = new Map(projectIssueFacts(data, snapshot.dataQuality.issues).map((fact) => [fact.id, fact]));
  const rows: SimpleRow[] = [];
  for (const library of data.libraries) {
    const components = data.components.filter((component) => component.libraryId === library.libraryId);
    for (const component of components) {
      const selected = [
        ...new Map(
          (data.issues ?? [])
            .filter(
              (issue) =>
                issue.libraryId === library.libraryId && issue.componentIds.includes(component.componentId)
            )
            .map((issue) => [issue.issueId, issue])
        ).values()
      ];
      const known = data.issues !== undefined;
      /** Sélectionne un état Project sans inférer de statut depuis la fermeture GitHub. */
      const bucket = (status: ReturnType<typeof projectBucket>) =>
        selected.filter((issue) => projectBucket(issue) === status);
      const measured = selected.filter((issue) => {
        const delay = facts.get(issue.issueId)?.delay;
        return typeof delay === 'number' && Number.isFinite(delay) && delay >= 0;
      });
      const values = measured.map((issue) => facts.get(issue.issueId)!.delay!);
      const excluded = bucket('done').filter((issue) => !measured.includes(issue));
      const note = `${measured.length} issues mesurables ; ${excluded.length} Done sans délai admissible. Jours calendaires ; dates Done ou estimées et exclusions DQ du pipeline. Done compte le statut Project, pas une correction confirmée.`;
      const opened = selected.filter(
        (issue) => issue.state === 'OPEN' && !['done', 'cancelled'].includes(projectBucket(issue))
      );
      const capture = Date.parse(snapshot.capturedAt);
      const valid = opened.filter(
        (issue) => Number.isFinite(Date.parse(issue.createdAt)) && Date.parse(issue.createdAt) <= capture
      );
      const oldest = [...valid].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))[0];
      const oldestAge = oldest ? (capture - Date.parse(oldest.createdAt)) / 86400000 : null;
      const oldestCell: SimpleCell = !known
        ? evidence(null, [])
        : valid.length !== opened.length || !Number.isFinite(capture)
          ? evidence(
              null,
              opened,
              'Dates absentes ou incohérentes : impossible de garantir le plus ancien ticket.'
            )
          : oldest
            ? {
                ...evidence(
                  `#${oldest.number} · ${Math.floor(oldestAge!)} j`,
                  [oldest],
                  `Créé le ${oldest.createdAt}. Âge au moment du snapshot ; GitHub OPEN, hors Done et Cancelled.`
                ),
                sortValue: oldestAge
              }
            : { ...evidence('Aucun', []), sortValue: null };
      rows.push({
        reviewKey: component.componentId,
        repository: library.repository,
        version: '',
        cells: [
          evidence(library.repository, selected),
          evidence(component.name, selected),
          evidence(known ? selected.length : null, selected),
          evidence(
            known ? bucket('active').length : null,
            bucket('active'),
            'Tous les statuts Project non terminés, y compris Backlog et Ready, hors Done et Cancelled. Les statuts inconnus restent séparés.'
          ),
          evidence(
            known ? bucket('done').length : null,
            bucket('done'),
            'Tous les contextes Project sont Done. Ce compteur ne prouve ni une correction ni la conformité.'
          ),
          evidence(known ? bucket('cancelled').length : null, bucket('cancelled')),
          evidence(
            values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null,
            measured,
            note
          ),
          evidence(quantile(values, 0.5), measured, note),
          evidence(quantile(values, 0.9), measured, note),
          oldestCell,
          evidence(
            known ? bucket('unknown').length : null,
            bucket('unknown'),
            'Statut Project absent, inconnu ou contradictoire ; aucune déduction depuis Closed.'
          ),
          evidence(known ? measured.length : null, measured, note)
        ]
      });
    }
  }
  return {
    id: 'component-activity',
    title: 'Activité par librairie et composant',
    description:
      'Issues distinctes dans chaque ligne ; une issue multi-composants apparaît dans chacune des lignes concernées. En cours inclut Backlog et Ready. Les états inconnus sont séparés. Les délais utilisent les cohortes admissibles du pipeline ; ils ne mesurent pas le temps passé réel.',
    headers: [
      'Librairie',
      'Composant',
      'Issues total',
      'Issues en cours',
      'Issues Done',
      'Issues Cancelled',
      'Temps moyen (j)',
      'Temps médian (j)',
      'P90 (j)',
      'Plus ancienne issue ouverte',
      'Statuts inconnus',
      'Délais mesurables'
    ],
    rows
  };
}
