import type { Snapshot } from '../domain/types.js';
import type { SimpleTable } from '../analytics/simplified-dashboard.js';

import 'dotenv/config';

/** Paramètres locaux de navigation vers une vue GitHub Projects. */
export interface ProjectLinkSettings {
  url: string;
  keywords: Record<string, string[]>;
  repositoryOwner?: string;
  repositories?: Record<string, string>;
}

/** Lit uniquement les paramètres de liens Projects ; les secrets ne sont jamais sérialisés. */
export function projectLinkSettings(
  keywords: Record<string, string[]>,
  env: Record<string, string | undefined> = process.env
): ProjectLinkSettings | undefined {
  const names = [
    'GITHUB_PROJECT_OWNER_TYPE',
    'GITHUB_PROJECT_OWNER',
    'GITHUB_PROJECT_NUMBER',
    'GITHUB_PROJECT_VIEW_NUMBER',
    'GITHUB_PROJECT_REPOSITORY_OWNER',
    'GITHUB_PROJECT_REPOSITORIES'
  ];
  if (!names.some((name) => env[name]?.trim())) return undefined;
  const kind = env.GITHUB_PROJECT_OWNER_TYPE?.trim();
  const owner = env.GITHUB_PROJECT_OWNER?.trim();
  const project = env.GITHUB_PROJECT_NUMBER?.trim();
  const view = env.GITHUB_PROJECT_VIEW_NUMBER?.trim();
  const repositoryOwner = env.GITHUB_PROJECT_REPOSITORY_OWNER?.trim();
  if (
    !['orgs', 'users'].includes(kind ?? '') ||
    !owner ||
    ['.', '..'].includes(owner) ||
    !/^[\w.-]+$/.test(owner) ||
    !/^[1-9]\d*$/.test(project ?? '') ||
    !/^[1-9]\d*$/.test(view ?? '') ||
    (repositoryOwner && !/^[\w.-]+$/.test(repositoryOwner))
  ) {
    throw new Error(
      'Liens Projects : renseigner GITHUB_PROJECT_OWNER_TYPE (orgs/users), GITHUB_PROJECT_OWNER, GITHUB_PROJECT_NUMBER et GITHUB_PROJECT_VIEW_NUMBER ; les numéros doivent être positifs.'
    );
  }
  let repositories: Record<string, string> | undefined;
  if (env.GITHUB_PROJECT_REPOSITORIES?.trim()) {
    try {
      repositories = JSON.parse(env.GITHUB_PROJECT_REPOSITORIES) as Record<string, string>;
    } catch {
      throw new Error(
        'GITHUB_PROJECT_REPOSITORIES doit être un objet JSON de correspondances owner/repository.'
      );
    }
    if (
      !repositories ||
      typeof repositories !== 'object' ||
      Array.isArray(repositories) ||
      Object.entries(repositories).some(
        ([key, value]) =>
          !/^[\w.-]+\/[\w.-]+$/.test(key) || typeof value !== 'string' || !/^[\w.-]+\/[\w.-]+$/.test(value)
      )
    )
      throw new Error('GITHUB_PROJECT_REPOSITORIES : correspondance owner/repository invalide.');
  }
  const base = new URL(env.GITHUB_URL?.trim() || 'https://github.com');
  if (
    base.protocol !== 'https:' ||
    base.username ||
    base.password ||
    base.search ||
    base.hash ||
    !['', '/'].includes(base.pathname)
  )
    throw new Error(
      'Liens Projects : GITHUB_URL doit être une origine HTTPS sans identifiants, chemin ni paramètres.'
    );
  return {
    url: `${base.origin}/${kind}/${owner}/projects/${project}/views/${view}`,
    keywords,
    ...(repositories ? { repositories } : {}),
    ...(repositoryOwner ? { repositoryOwner } : {})
  };
}

/** Résout les labels de composant réellement collectés, selon le préfixe configuré et les alias explicites. */
export function componentProjectLabels(snapshot: Snapshot, prefix: string): Record<string, string[]> {
  return Object.fromEntries(
    snapshot.normalizedData.components.map((component) => {
      const names = new Set(
        [component.name, ...component.aliases].map((name) => name.toLocaleLowerCase('fr'))
      );
      const labels = (snapshot.normalizedData.issues ?? [])
        .filter(
          (issue) =>
            issue.libraryId === component.libraryId && issue.componentIds.includes(component.componentId)
        )
        .flatMap((issue) => issue.labels)
        .filter(
          (label) =>
            label.toLocaleLowerCase('fr').startsWith(prefix.toLocaleLowerCase('fr')) &&
            names.has(label.slice(prefix.length).trim().toLocaleLowerCase('fr'))
        );
      return [component.componentId, [...new Set(labels)]];
    })
  );
}

/** Prépare les seuls liens de cohortes Project, sans modifier les métriques ni les références sources. */
export function applyProjectLinks(
  tables: SimpleTable[],
  settings: ProjectLinkSettings,
  componentLabels: Record<string, string[]>
): void {
  const table = tables.find((item) => item.id === 'component-activity');
  if (!table) return;
  for (const row of table.rows) {
    const labels = componentLabels[row.reviewKey] ?? [];
    for (const [index, status] of [
      [4, 'DONE'],
      [5, 'CANCELLED']
    ] as const) {
      const values = [...new Set(settings.keywords[status] ?? [])].filter((value) => value.trim());
      if (!values.length || !labels.length) continue;
      const repository =
        settings.repositories?.[row.repository] ??
        (settings.repositoryOwner
          ? settings.repositoryOwner + '/' + row.repository.split('/').at(-1)
          : row.repository);
      if (!/^[\w.-]+\/[\w.-]+$/.test(repository ?? '')) continue;
      const url = new URL(settings.url);
      url.searchParams.set(
        'filterQuery',
        'status:' +
          values.map((value) => JSON.stringify(value)).join(',') +
          ' repo:' +
          repository +
          ' label:' +
          labels.map((label) => JSON.stringify(label)).join(',')
      );
      const cell = row.cells[index];
      if (!cell) continue;
      cell.url = url.href;
      cell.note =
        (cell.note ? cell.note + ' ' : '') +
        'La vue Project configurée est filtrée sur les statuts du profil et le repository ; elle conserve les labels sources du composant. La liste locale reste la preuve exacte du snapshot.';
    }
  }
}
