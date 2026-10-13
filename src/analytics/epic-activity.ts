import type { Issue, NormalizedData } from '../domain/types.js';

/** Une ligne de suivi par composant et issue, sans assimiler la durée à une charge de travail. */
export interface EpicActivityRow {
  issueId: string;
  number: number;
  url: string;
  component: string;
  velocity: string | number | null;
  velocityReason: string;
  startedAt: string | null;
  finishedAt: string | null;
  elapsedHours: number | null;
  reason: string;
}

/** Population analytique autonome, incluant les milestones futures de l'activité. */
export interface EpicActivity {
  version: 1;
  epics: {
    id: string;
    number: number;
    repository: string;
    url: string;
    title: string;
    referencesCaptured: boolean;
    rows: EpicActivityRow[];
  }[];
}

/** Mesure le temps calendaire entre première entrée In progress et dernière entrée Done du Project unique. */
function timing(issue: Issue): Omit<EpicActivityRow, 'issueId' | 'number' | 'url' | 'component'> {
  const result: ReturnType<typeof timing> = {
    velocity: null,
    velocityReason: 'Vélocité absente',
    startedAt: null,
    finishedAt: null,
    elapsedHours: null,
    reason: ''
  };
  if (issue.projectContexts.length !== 1) {
    result.reason = issue.projectContexts.length ? 'Plusieurs Projects : calcul ambigu' : 'Project absent';
    result.velocityReason = issue.projectContexts.length
      ? 'Vélocité ambiguë : plusieurs Projects'
      : 'Project absent';
    return result;
  }
  const project = issue.projectContexts[0]!;
  if (project.rawVelocity !== undefined && String(project.rawVelocity).trim() !== '') {
    result.velocity = project.rawVelocity;
    result.velocityReason = '';
  }
  const history = project.statusHistory;
  if (!history.length) {
    result.reason = 'Historique Project absent';
    return result;
  }
  const starts = history.filter(
    (event) => event.status === 'IN_PROGRESS' && event.previousStatus !== 'IN_PROGRESS'
  );
  const ends = history.filter((event) => event.status === 'DONE');
  if ([...starts, ...ends].some((event) => !Number.isFinite(Date.parse(event.transitionedAt)))) {
    result.reason = 'Date de transition invalide';
    return result;
  }
  result.startedAt =
    starts.map((event) => event.transitionedAt).sort((a, b) => Date.parse(a) - Date.parse(b))[0] ?? null;
  result.finishedAt =
    ends
      .map((event) => event.transitionedAt)
      .sort((a, b) => Date.parse(a) - Date.parse(b))
      .at(-1) ?? null;
  result.reason = [
    !result.startedAt ? 'Premier passage à In progress absent' : '',
    !result.finishedAt ? 'Dernier passage à Done absent' : ''
  ]
    .filter(Boolean)
    .join(' ; ');
  const earliest = [...history]
    .filter((event) => Number.isFinite(Date.parse(event.transitionedAt)))
    .sort((a, b) => Date.parse(a.transitionedAt) - Date.parse(b.transitionedAt))[0];
  if (earliest?.previousStatus === 'IN_PROGRESS') {
    result.startedAt = null;
    result.reason =
      'Date du premier passage à In progress inconnue : historique déjà commencé en In progress';
  }
  if (result.startedAt && result.finishedAt) {
    const milliseconds = Date.parse(result.finishedAt) - Date.parse(result.startedAt);
    if (milliseconds < 0) result.reason = 'Dernier Done antérieur au premier In progress';
    else result.elapsedHours = milliseconds / 3600000;
  }
  return result;
}

/** Agrège uniquement les mentions de description vers une Epic, sans déduire un rattachement des parents. */
export function epicActivity(data: NormalizedData, componentPrefix: string): EpicActivity {
  const issues = data.issues ?? [];
  const libraries = new Map(data.libraries.map((library) => [library.libraryId, library.repository]));
  return {
    version: 1,
    epics: issues
      .filter((issue) => issue.issueType === 'EPIC')
      .map((epic) => ({
        id: epic.issueId,
        number: epic.number,
        repository: libraries.get(epic.libraryId) ?? '',
        url: epic.url ?? '',
        title: epic.title,
        referencesCaptured: issues.every((issue) => issue.descriptionIssueIds !== undefined),
        rows: issues
          .filter(
            (issue) => issue.issueId !== epic.issueId && issue.descriptionIssueIds?.includes(epic.issueId)
          )
          .flatMap((issue) => {
            const components = [
              ...new Set(
                issue.labels
                  .filter((label) => label.toLowerCase().startsWith(componentPrefix.toLowerCase()))
                  .map((label) => label.slice(componentPrefix.length).trim())
                  .filter(Boolean)
              )
            ];
            return (components.length ? components : ['Composant absent']).map((component) => ({
              issueId: issue.issueId,
              number: issue.number,
              url: issue.url ?? '',
              component,
              ...timing(issue)
            }));
          })
          .sort(
            (a, b) => a.component.localeCompare(b.component, 'fr', { numeric: true }) || a.number - b.number
          )
      }))
      .sort((a, b) => a.repository.localeCompare(b.repository, 'fr') || a.number - b.number)
  };
}
