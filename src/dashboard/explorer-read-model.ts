import type { Snapshot } from '../domain/types.js';
import { issueFacts } from './read-model.js';
import { componentGithubLinks } from './component-links.js';
import { latestCompletedAudit, isCompletedAudit } from './audit-selection.js';
import { auditVersionLabel } from './audit-relations.js';
import { auditStatusLabel } from './audit-presentation.js';

/** Projette les faits nécessaires à cet explorateur sans transporter le snapshot. */
export function issuesExplorerModel(snapshot: Snapshot, githubUrl?: string, componentPrefix = 'Component:') {
  const repositories = new Map(snapshot.rawData.repositories.map((item) => [item.id, item]));
  const items = issueFacts(snapshot).map((fact) => {
    const issue = snapshot.normalizedData.issues?.find((item) => item.issueId === fact.id);
    const repository = issue ? repositories.get(issue.repositoryId) : undefined;
    const url = /^https:\/\/[^\s]+$/.test(fact.url)
      ? fact.url
      : repository
        ? `${(githubUrl ?? 'https://github.com').replace(/\/+$/, '')}/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/issues/${fact.number}`
        : '';
    const pullRequestLinks =
      issue?.review && repository
        ? repository.pullRequests
            .filter((pr) => issue.linkedPullRequestIds.includes(pr.id))
            .map((pr) => ({
              number: pr.number,
              state: pr.state,
              url: `${(githubUrl ?? 'https://github.com').replace(/\/+$/, '')}/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/pull/${pr.number}`
            }))
        : undefined;
    return { ...fact, url, ...(pullRequestLinks ? { pullRequestLinks } : {}) };
  });
  return { items, componentPrefix };
}

/** Projette les faits nécessaires à cet explorateur sans transporter le snapshot. */
export function componentsExplorerModel(
  snapshot: Snapshot,
  githubUrl?: string,
  componentPrefix = 'Component:'
) {
  const libraries = new Map(snapshot.normalizedData.libraries.map((library) => [library.libraryId, library]));
  const issues = snapshot.normalizedData.issues ?? [];
  // Les labels des issues sont la source de vérité pour découvrir les composants.
  const facts = issueFacts(snapshot);
  const factById = new Map(facts.map((fact) => [fact.id, fact]));
  // Le catalogue normalisé enrichit ces entrées, mais ne limite pas leur périmètre.
  const prefix = componentPrefix.trim().toLocaleLowerCase('fr');
  const discovered = new Map<
    string,
    { libraryId: string; name: string; componentId?: string; componentIds: string[] }
  >();
  for (const issue of issues) {
    for (const label of issue.labels) {
      if (!prefix || !label.toLocaleLowerCase('fr').startsWith(prefix)) continue;
      const rawName = label.slice(componentPrefix.trim().length).trim();
      const resolved = snapshot.normalizedData.components.filter((c) =>
        issue.componentIds.includes(c.componentId)
      );
      const name = resolved.find((c) => c.name === rawName || c.aliases.includes(rawName))?.name ?? rawName;
      if (!name) continue;
      const key = `${issue.libraryId}::${name.toLocaleLowerCase('fr')}`;
      if (!discovered.has(key)) discovered.set(key, { libraryId: issue.libraryId, name, componentIds: [] });
    }
  }
  for (const component of snapshot.normalizedData.components) {
    const key = `${component.libraryId}::${component.name.toLocaleLowerCase('fr')}`;
    const found = discovered.get(key);
    if (found) {
      found.componentIds.push(component.componentId);
      if (!found.componentId || component.status === 'active') found.componentId = component.componentId;
    } else if (!found)
      discovered.set(key, {
        libraryId: component.libraryId,
        name: component.name,
        componentId: component.componentId,
        componentIds: [component.componentId]
      });
  }
  const rows = [...discovered.values()].map((component) => {
    const library = libraries.get(component.libraryId);
    const matchingLabel = `${componentPrefix.trim()}${component.name}`.toLocaleLowerCase('fr');
    const related = issues.filter(
      (issue) =>
        issue.libraryId === component.libraryId &&
        (issue.componentIds.some((id) => component.componentIds.includes(id)) ||
          (!component.componentId &&
            issue.labels.some((label) => label.toLocaleLowerCase('fr') === matchingLabel)))
    );
    const audits = snapshot.normalizedData.audits.filter(
      (audit) =>
        component.componentIds.includes(audit.componentId) ||
        related.some((issue) => issue.issueId === audit.issueId)
    );
    const latest =
      latestCompletedAudit(audits, snapshot.normalizedData.issues ?? []) ??
      audits.find((audit) => !isCompletedAudit(audit, snapshot.normalizedData.issues ?? []));
    const items = related.map((issue) => {
      const fact = factById.get(issue.issueId)!;
      return {
        ...fact,
        open: fact.status === 'open',
        cancelled: fact.status === 'cancelled',
        treated: fact.status === 'closed'
      };
    });
    const versionSummaries = (snapshot.normalizedData.componentVersions ?? [])
      .filter((relation) => component.componentIds.includes(relation.componentId))
      .map((relation) => ({
        version:
          snapshot.normalizedData.versions?.find((version) => version.versionId === relation.versionId)
            ?.number ?? '',
        versionId: relation.versionId,
        componentId: relation.componentId,
        channel:
          snapshot.normalizedData.versions?.find((version) => version.versionId === relation.versionId)
            ?.channel ?? '',
        publication: snapshot.normalizedData.versions?.find(
          (version) => version.versionId === relation.versionId
        )?.prodTag
          ? 'PROD'
          : 'publication non prouvée',
        provenance: relation.provenance.sourceId ?? '',
        conformity: relation.verdict ?? 'INDETERMINE',
        auditIds: relation.applicableAuditIds ?? [],
        auditSources: (relation.applicableAuditIds ?? []).flatMap((id) => {
          const audit = snapshot.normalizedData.audits.find((a) => a.auditId === id);
          return audit ? [{ id, url: factById.get(audit.issueId)?.url ?? '' }] : [];
        })
      }))
      .sort((a, b) => a.version.localeCompare(b.version, undefined, { numeric: true }));
    const current = versionSummaries.at(-1);
    const auditSources = audits
      .map((audit) => ({
        id: audit.auditId,
        url: facts.find((fact) => fact.id === audit.issueId)?.url ?? '',
        version: auditVersionLabel(audit, snapshot),
        versionId: audit.versionId ?? '',
        publication: snapshot.normalizedData.versions?.find(
          (version) => version.versionId === audit.versionId
        )?.prodTag
          ? 'PROD'
          : 'publication non prouvée',
        status: audit.lifecycle ?? audit.status,
        result: isCompletedAudit(audit, snapshot.normalizedData.issues ?? [])
          ? auditStatusLabel(audit.status)
          : '',
        completedAt: audit.completedAt ?? ''
      }))
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
    return {
      id: `${component.libraryId}:${component.name.toLocaleLowerCase('fr')}`,
      componentId: component.componentId,
      componentIds: component.componentIds,
      repository: library?.repository ?? component.libraryId,
      name: component.name,
      audits: audits.length,
      version: current?.version ?? '',
      auditStatus: latest?.lifecycle ?? latest?.status ?? 'non audité',
      conformity:
        latest && isCompletedAudit(latest, snapshot.normalizedData.issues ?? [])
          ? auditStatusLabel(latest.status)
          : 'Aucun résultat définitif',
      versionSummaries,
      githubLinks: componentGithubLinks(
        snapshot,
        component.libraryId,
        component.name,
        componentPrefix,
        related,
        githubUrl
      ),
      latestAuditUrl: facts.find((fact) => fact.id === latest?.issueId)?.url ?? '',
      latestAuditId: latest?.auditId ?? '',
      auditSources,
      items
    };
  });
  return rows;
}
