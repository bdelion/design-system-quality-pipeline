import type { GithubProcessingConfig } from '../config.js';
import type { Issue, Snapshot } from '../domain/types.js';
import type { SimpleCell, SimpleTable } from '../analytics/simplified-dashboard.js';
import type { ProjectLinkSettings } from './project-links.js';

/** Retrouve une origine réelle depuis une issue source, sans reconstruire les URL anonymisées. */
function repositoryBase(snapshot: Snapshot, repository: string): string | undefined {
  const library = snapshot.normalizedData.libraries.find((item) => item.repository === repository);
  const source = snapshot.normalizedData.issues?.find(
    (issue) =>
      issue.libraryId === library?.libraryId &&
      /^https:\/\/[^/@?#:\s]+(?::\d+)?\/[\w.-]+\/[\w.-]+\/issues\/[1-9]\d*$/.test(issue.url)
  );
  if (!source) return undefined;
  const url = new URL(source.url);
  if (
    /\.(invalid|test|example)$/.test(url.hostname) ||
    ['example.com', 'example.org', 'example.net'].includes(url.hostname)
  )
    return undefined;
  return source.url.replace(/\/issues\/\d+$/, '');
}

/** Conserve une recherche de périmètre signalée comme actuelle et potentiellement plus large que les preuves locales. */
function destination(cell: SimpleCell | undefined, url: URL, note: string): void {
  if (!cell) return;
  cell.url = url.href;
  cell.searchApproximate = true;
  cell.note = (cell.note ? cell.note + ' ' : '') + note;
}

/** Construit le filtre Done de la vue configurée en respectant les correspondances de repositories. */
function projectDestination(
  settings: ProjectLinkSettings,
  repository: string,
  filters: string[]
): URL | undefined {
  const statuses = settings.keywords.DONE ?? [];
  if (!statuses.length) return undefined;
  const repo =
    settings.repositories?.[repository] ??
    (settings.repositoryOwner ? settings.repositoryOwner + '/' + repository.split('/').at(-1) : repository);
  const url = new URL(settings.url);
  url.searchParams.set(
    'filterQuery',
    ['repo:' + repo, 'status:' + statuses.map((value) => JSON.stringify(value)).join(','), ...filters].join(
      ' '
    )
  );
  return url;
}

/** Construit des branches de recherche fondées sur les types bruts et labels de reconnaissance configurés. */
function issueBranches(issues: Issue[], rules: GithubProcessingConfig, family: 'audit' | 'bug'): string[] {
  return [
    ...new Set(
      issues
        .map((issue) => {
          const type = issue.rawIssueType;
          const strategy =
            family === 'audit'
              ? rules.auditDetection?.strategies.find(
                  (item) =>
                    item.issueTypes.some((value) => value.toLowerCase() === type?.toLowerCase()) &&
                    (item.requiredLabels ?? []).every((label) =>
                      issue.labels.some((actual) => actual.toLowerCase() === label.toLowerCase())
                    )
                )
              : undefined;
          const labels =
            family === 'audit'
              ? (strategy?.requiredLabels ?? [])
              : issue.labels.filter(
                  (label) =>
                    (rules.issuePolicy?.bugInference?.labels ?? []).includes(label) ||
                    (rules.issuePolicy?.bugInference?.prefixes ?? []).some((prefix) =>
                      label.startsWith(prefix)
                    )
                );
          return [
            type ? 'type:' + JSON.stringify(type) : '',
            ...labels.map((label) => 'label:' + JSON.stringify(label))
          ]
            .filter(Boolean)
            .join(' ');
        })
        .filter(Boolean)
    )
  ];
}

/** Affine les accès de revue avec les seuls labels métier pertinents, sans modifier les populations. */
export function applyReviewLinks(
  snapshot: Snapshot,
  tables: SimpleTable[],
  rules: GithubProcessingConfig,
  settings?: ProjectLinkSettings
): void {
  const data = snapshot.normalizedData;
  const issues = new Map((data.issues ?? []).map((issue) => [issue.issueId, issue]));
  const milestones = new Map(
    snapshot.rawData.repositories.flatMap((repo) =>
      repo.issues.flatMap((issue) =>
        issue.url && issue.milestone ? [[issue.url, issue.milestone.title] as const] : []
      )
    )
  );
  for (const row of tables.find((table) => table.id === 'repositories')?.rows ?? []) {
    const base = repositoryBase(snapshot, row.repository);
    if (!base) continue;
    const url = new URL(base + '/labels');
    url.searchParams.set('q', rules.labels.componentPrefix);
    destination(
      row.cells[1],
      url,
      'Labels du repository recherchés avec le préfixe composant du profil ; le compteur reste celui du catalogue.'
    );
  }
  for (const row of tables.find((table) => table.id === 'delays')?.rows ?? []) {
    const base = repositoryBase(snapshot, row.repository);
    if (!base) continue;
    const url = new URL(base + '/issues');
    if (row.reviewKey.endsWith(':github-closure')) {
      url.searchParams.set('q', 'is:issue state:closed');
      destination(
        row.cells[1],
        url,
        'Recherche actuelle des issues Closed ; la médiane ne retient que les dates admissibles.'
      );
    } else if (row.reviewKey.endsWith(':business-treatment') && settings) {
      const project = projectDestination(settings, row.repository, ['is:closed']);
      if (project)
        destination(
          row.cells[1],
          project,
          'Vue Done et Closed. Les exclusions DQ et les dates mesurables restent détaillées localement.'
        );
    } else if (row.reviewKey.endsWith(':confirmed-correction')) {
      const selected = (row.cells[1]?.refs ?? []).flatMap((id) => (issues.get(id) ? [issues.get(id)!] : []));
      const branches = issueBranches(selected, rules, 'bug');
      if (branches.length) {
        const query =
          branches.length === 1
            ? 'is:issue ' + branches[0]
            : branches.map((branch) => '(is:issue ' + branch + ')').join(' OR ');
        if (query.length <= 256) {
          url.searchParams.set('q', query);
          destination(
            row.cells[1],
            url,
            'Recherche par types et labels sources du profil ; Done + PR fusionnée reste vérifié dans le snapshot, pas par ce filtre GitHub.'
          );
        }
      }
    }
  }
  const epic = rules.issueTypes.keywords.EPIC ?? [];
  const negatives = epic.flatMap((value) => [
    '-type:' + JSON.stringify(value),
    '-label:' + JSON.stringify(value)
  ]);
  for (const row of tables.find((table) => table.id === 'campaigns')?.rows ?? []) {
    const base = repositoryBase(snapshot, row.repository);
    if (!base) continue;
    for (const index of [3, 6, 7, 8, 9, 10, 11, 17, 18]) {
      const cell = row.cells[index];
      const selected = (cell?.refs ?? []).flatMap((id) => (issues.get(id) ? [issues.get(id)!] : []));
      if (!selected.length) continue;
      const titles = [
        ...new Set(
          selected
            .map((issue) => milestones.get(issue.url))
            .filter((value): value is string => value !== undefined)
        )
      ];
      const allMilestones = selected.every((issue) => milestones.has(issue.url));
      const branches = issueBranches(selected, rules, 'audit');
      if (index !== 3 && settings) {
        const rawTypes = [...new Set(selected.map((issue) => issue.rawIssueType))];
        const recognition =
          rules.auditDetection?.strategies.flatMap((strategy) => strategy.requiredLabels ?? []) ?? [];
        const common = selected[0]!.labels.filter(
          (label) => recognition.includes(label) && selected.every((issue) => issue.labels.includes(label))
        );
        const filters = [
          ...negatives,
          ...(allMilestones ? ['milestone:' + titles.map((title) => JSON.stringify(title)).join(',')] : []),
          ...(rawTypes.length === 1 && rawTypes[0]
            ? ['type:' + JSON.stringify(rawTypes[0])]
            : common.map((label) => 'label:' + JSON.stringify(label)))
        ];
        const url = projectDestination(settings, row.repository, filters);
        if (url)
          destination(
            cell,
            url,
            'Vue Project Done des preuves d’audit. Les filtres ne calculent ni le verdict cumulé ni les labels/types des sous-issues ; la liste locale conserve la sélection exacte.'
          );
      } else if (branches.length && allMilestones && titles.length) {
        const query = branches
          .flatMap((branch) =>
            titles.map(
              (title) =>
                '(' + ['is:issue', branch, 'milestone:' + JSON.stringify(title), ...negatives].join(' ') + ')'
            )
          )
          .join(' OR ');
        if (query.length <= 256) {
          const url = new URL(base + '/issues');
          url.searchParams.set('q', query);
          destination(
            cell,
            url,
            'Campagne GitHub actuelle, types et milestones sources ; les EPIC configurées sont exclues. Done reste un statut Project, pas Closed.'
          );
        }
      }
    }
  }
  distributionLinks(snapshot, tables, rules, settings);
}

/** Construit les liens des répartitions à partir des labels de leur dimension et des parents explicites. */
function distributionLinks(
  snapshot: Snapshot,
  tables: SimpleTable[],
  rules: GithubProcessingConfig,
  settings?: ProjectLinkSettings
): void {
  const issues = new Map((snapshot.normalizedData.issues ?? []).map((issue) => [issue.issueId, issue]));
  const criticalities: Record<string, string> = { blocking: 'Bloquante', major: 'Majeure', minor: 'Mineure' };
  for (const table of tables.filter((item) => item.populationColumns)) {
    for (const row of table.rows) {
      const base = repositoryBase(snapshot, row.repository);
      if (!base) continue;
      const all = (row.cells[3]?.refs ?? []).flatMap((id) => (issues.get(id) ? [issues.get(id)!] : []));
      if (!all.length) continue;
      const dimension = String(row.cells[2]?.value);
      const labels = [...new Set(all.flatMap((issue) => issue.labels))].filter((label) => {
        if (table.id === 'audit-criticality') {
          const prefix = rules.labels.accessibilityCriticalityPrefix;
          const value = label.startsWith(prefix) ? label.slice(prefix.length).trim().toLowerCase() : '';
          return criticalities[rules.labels.criticalityValues[value] ?? value] === dimension;
        }
        const prefix =
          table.id === 'audit-category'
            ? rules.labels.accessibilityCategoryPrefix
            : rules.labels.componentPrefix;
        return (
          (label.startsWith(prefix) && label.slice(prefix.length).trim() === dimension) ||
          (table.id === 'audit-component' && rules.issuePolicy?.componentLabels?.[label] === dimension)
        );
      });
      const parents = [
        ...new Set(
          all.flatMap((issue) => {
            const parent = issue.parentIssueId ? issues.get(issue.parentIssueId) : undefined;
            if (!parent || !/^https:\/\/[^/]+\/[\w.-]+\/[\w.-]+\/issues\/[1-9]\d*$/.test(parent.url))
              return [];
            const url = new URL(parent.url);
            if (url.origin !== new URL(base).origin) return [];
            return [url.pathname.replace(/^\//, '').replace('/issues/', '#')];
          })
        )
      ];
      for (const cell of row.cells.slice(3)) {
        if (!cell.refs?.length) continue;
        let url = new URL(base + '/issues');
        url.searchParams.set(
          'q',
          [
            'is:issue',
            ...(labels.length ? ['label:' + labels.map((label) => JSON.stringify(label)).join(',')] : [])
          ].join(' ')
        );
        if (
          settings &&
          parents.length &&
          parents.length === new Set(all.map((issue) => issue.parentIssueId)).size &&
          all.every((issue) => issue.parentIssueId && issues.has(issue.parentIssueId))
        ) {
          const project = new URL(settings.url);
          const repository =
            settings.repositories?.[row.repository] ??
            (settings.repositoryOwner
              ? settings.repositoryOwner + '/' + row.repository.split('/').at(-1)
              : row.repository);
          const query = [
            'repo:' + repository,
            'parent-issue:' + parents.map((parent) => JSON.stringify(parent)).join(','),
            ...(labels.length ? ['label:' + labels.map((label) => JSON.stringify(label)).join(',')] : [])
          ].join(' ');
          if (query.length <= 256) {
            project.searchParams.set('filterQuery', query);
            url = project;
          }
        }
        destination(
          cell,
          url,
          'Parents de la version sélectionnés localement ; aucun filtre milestone du parent appliqué aux enfants. Traitement et preuves exactes dans cette liste.'
        );
      }
    }
  }
}
