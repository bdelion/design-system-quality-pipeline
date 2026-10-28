import type { Snapshot, DataQualityIssue } from '../domain/types.js';
import { issueFacts } from './read-model.js';

/** Diagnostic de présentation et preuves résolues, sans RAW ni recalcul de qualification. */
export interface QualityRow extends Pick<
  DataQualityIssue,
  'id' | 'ruleId' | 'severity' | 'entityType' | 'entityId' | 'message' | 'action' | 'impacts'
> {
  repositories: string[];
  sourceUrl: string;
  issueId: string;
}

/** Projette les diagnostics et leurs relations explicites pour le tableau et son export intégral. */
export function qualityReadModel(snapshot: Snapshot, githubUrl?: string): QualityRow[] {
  const repositories = new Map<string, Set<string>>();
  /** Associe une identité explicite à un repository sans déduire une origine du texte du diagnostic. */
  function associate(id: string, repo: string): void {
    if (!repo) return;
    const values = repositories.get(id) ?? new Set<string>();
    values.add(repo);
    repositories.set(id, values);
  }
  for (const fact of issueFacts(snapshot))
    for (const id of [
      fact.id,
      ...fact.auditIds,
      ...fact.anomalyIds,
      ...fact.componentIds,
      ...fact.versionIds,
      ...fact.prs
    ])
      associate(id, fact.repo);
  const data = snapshot.normalizedData;
  const sources = new Map<string, string>();
  const baseUrl = (githubUrl ?? 'https://github.com').replace(/\/+$/, '');
  for (const repository of snapshot.rawData.repositories) {
    const repoUrl = `${baseUrl}/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}`;
    for (const issue of repository.issues) sources.set(issue.id, `${repoUrl}/issues/${issue.number}`);
    for (const pr of repository.pullRequests) sources.set(pr.id, `${repoUrl}/pull/${pr.number}`);
  }
  for (const issue of data.issues ?? []) {
    const url = sources.get(issue.provenance.sourceId ?? issue.issueId) ?? issue.url;
    if (/^https:\/\/[^\s]+$/.test(url)) sources.set(issue.issueId, url);
  }
  for (const entity of [...data.anomalies, ...data.audits]) {
    const url = sources.get(entity.issueId) ?? sources.get(entity.provenance.sourceId ?? '');
    if (url) sources.set('auditId' in entity ? entity.auditId : entity.anomalyId, url);
  }
  for (const entity of [...data.components, ...(data.versions ?? []), ...data.pullRequests]) {
    const url = sources.get(entity.provenance.sourceId ?? '');
    if (url)
      sources.set(
        'componentId' in entity
          ? entity.componentId
          : 'versionId' in entity
            ? entity.versionId
            : entity.pullRequestId,
        url
      );
  }
  for (const library of data.libraries) {
    associate(library.libraryId, library.repository);
    for (const entity of [...data.components, ...(data.versions ?? [])].filter(
      (item) => item.libraryId === library.libraryId
    )) {
      associate('componentId' in entity ? entity.componentId : entity.versionId, library.repository);
      if (entity.provenance.sourceId) associate(entity.provenance.sourceId, library.repository);
    }
  }
  for (const relation of data.componentVersions ?? [])
    for (const repo of repositories.get(relation.componentId) ?? [])
      associate(relation.componentVersionId, repo);
  return snapshot.dataQuality.issues.map((item) => {
    const fact = issueFacts(snapshot).find(
      (row) =>
        row.id === item.entityId ||
        row.auditIds.includes(item.entityId) ||
        row.anomalyIds.includes(item.entityId)
    );
    return {
      id: item.id,
      ruleId: item.ruleId,
      severity: item.severity,
      entityType: item.entityType,
      entityId: item.entityId,
      message: item.message,
      action: item.action,
      impacts: item.impacts,
      repositories: [...(repositories.get(item.entityId) ?? [])],
      sourceUrl: sources.get(item.entityId) ?? '',
      issueId: fact?.id ?? ''
    };
  });
}
