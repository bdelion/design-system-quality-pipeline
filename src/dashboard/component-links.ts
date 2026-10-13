import type { Issue, Snapshot } from '../domain/types.js';

/** Recherches GitHub approchées : les relations métier restent celles du snapshot. */
export interface ComponentGithubLinks {
  issues: string;
  open: string;
  treated: string;
  cancelled: string;
  prs: string;
  prSearches: string[];
  audits: string;
}

/**
 * Construit les recherches repository/composant avec les labels et types effectivement collectés.
 * @param snapshot - Sources RAW et normalisées pour résoudre le repository.
 * @param libraryId - Librairie du composant.
 * @param name - Nom du composant.
 * @param prefix - Préfixe configuré des labels de composant.
 * @param issues - Issues explicitement reliées au composant.
 * @param githubUrl - Base GitHub, éventuellement Enterprise.
 * @returns Recherches externes ; chaînes vides lorsque le repository est non résolu.
 */
export function componentGithubLinks(
  snapshot: Snapshot,
  libraryId: string,
  name: string,
  prefix: string,
  issues: Issue[],
  githubUrl = 'https://github.com'
): ComponentGithubLinks {
  const library = snapshot.normalizedData.libraries.find((item) => item.libraryId === libraryId);
  const repository = snapshot.rawData.repositories.find(
    (item) => item.id === issues[0]?.repositoryId || `${item.owner}/${item.name}` === library?.repository
  );
  if (!repository || !/^https:\/\/[^\s]+$/.test(githubUrl))
    return { issues: '', open: '', treated: '', cancelled: '', prs: '', prSearches: [], audits: '' };
  const base = `${githubUrl.replace(/\/+$/, '')}/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}`;
  /** Protège une valeur littérale utilisée dans une recherche GitHub. */
  const quote = (value: string): string => `"${value.replace(/["\\]/g, '\\$&')}"`;
  const labels = [
    ...new Set(
      issues
        .flatMap((issue) => issue.labels)
        .filter(
          (label) =>
            label.toLocaleLowerCase('fr').startsWith(prefix.trim().toLocaleLowerCase('fr')) &&
            label.slice(prefix.trim().length).trim().toLocaleLowerCase('fr') === name.toLocaleLowerCase('fr')
        )
    )
  ];
  const component = (labels.length ? labels : [`${prefix.trim()}${name}`])
    .map((label) => `label:${quote(label)}`)
    .join(' OR ');
  const query = `is:issue (${component})`;
  /** Encode une recherche dans la liste d'issues ou de PR du repository source. */
  const search = (value: string, kind = 'issues'): string => `${base}/${kind}?q=${encodeURIComponent(value)}`;
  const auditIds = new Set(snapshot.normalizedData.audits.map((audit) => audit.issueId));
  const types = [
    ...new Set(
      issues
        .filter((issue) => auditIds.has(issue.issueId))
        .map((issue) => issue.rawIssueType ?? issue.issueType)
        .filter((value): value is string => Boolean(value))
    )
  ];
  const auditQuery = types.length
    ? types.map((type) => `type:${quote(type)}`).join(' OR ')
    : `type:${quote('Audit')}`;
  const linkedIssueIds = new Set(snapshot.normalizedData.pullRequests.flatMap((pr) => pr.relatedIssueIds));
  const refs = [
    ...new Set(
      issues
        .filter((issue) => issue.linkedPullRequestIds.length > 0 || linkedIssueIds.has(issue.issueId))
        .flatMap((issue) => [
          quote(`#${issue.number}`),
          quote(`${repository.owner}/${repository.name}#${issue.number}`),
          quote(`${base}/issues/${issue.number}`)
        ])
    )
  ];
  const prSearches: string[] = [];
  let group: string[] = [];
  for (const reference of refs) {
    if (group.length && `is:pr in:body (${[...group, reference].join(' OR ')})`.length > 240) {
      prSearches.push(search(`is:pr in:body (${group.join(' OR ')})`, 'pulls'));
      group = [];
    }
    group.push(reference);
  }
  if (group.length) prSearches.push(search(`is:pr in:body (${group.join(' OR ')})`, 'pulls'));
  return {
    issues: search(query),
    open: search(`${query} is:open`),
    treated: search(`${query} is:closed reason:completed`),
    cancelled: search(`${query} is:closed reason:"not planned"`),
    prs: prSearches[0] ?? search(`is:pr (${component})`, 'pulls'),
    prSearches,
    audits: search(`${query} (${auditQuery})`)
  };
}
