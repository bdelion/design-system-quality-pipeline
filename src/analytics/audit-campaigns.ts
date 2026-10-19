import { auditProgress, issueBusinessState } from '../domain/business.js';
import type { DataQualityIssue, DataQualityStatus, NormalizedData } from '../domain/types.js';

/** Stocks d’audits pour un repository et une version cible, sans héritage ni couverture historique. */
export interface AuditCampaignSummary {
  libraryId: string;
  version: string;
  publication: 'prod' | 'unproven';
  components: number;
  audits: number;
  progress: Record<'completed' | 'ongoing' | 'pending' | 'cancelled', number>;
  results: Record<'conform' | 'non_conform' | 'conditional' | 'critical' | 'unknown', number>;
  anomalies: number;
  openAnomalies: number | 'unknown';
  improvements: number;
  quality: DataQualityStatus;
  sourceIssueIds: string[];
}

/** Agrège les audits par version cible et leurs seuls enfants explicites ; conserve les résultats incomplets sans verdict. */
export function auditCampaigns(
  data: NormalizedData,
  diagnostics: readonly DataQualityIssue[] = []
): AuditCampaignSummary[] {
  const groups = new Map<string, typeof data.audits>();
  for (const audit of data.audits) {
    const key = JSON.stringify([audit.libraryId, audit.version]);
    const group = groups.get(key) ?? [];
    group.push(audit);
    groups.set(key, group);
  }
  return [...groups.values()]
    .map((audits): AuditCampaignSummary => {
      const first = audits[0]!;
      const ids = new Set(audits.map((audit) => audit.auditId));
      const anomalies = [
        ...new Map(
          data.anomalies
            .filter(
              (item) =>
                item.origin === 'AUDIT' &&
                item.auditId &&
                ids.has(item.auditId) &&
                item.accessibility !== false &&
                (!data.issues?.find((issue) => issue.issueId === item.issueId)?.review ||
                  data.issues
                    ?.find((issue) => issue.issueId === item.issueId)
                    ?.componentIds.some((id) => audits.some((audit) => audit.componentId === id)))
            )
            .map((item) => [item.issueId, item])
        ).values()
      ];
      const improvements = (data.auditImprovements ?? []).filter((item) => ids.has(item.auditId));
      const progress: AuditCampaignSummary['progress'] = {
        completed: 0,
        ongoing: 0,
        pending: 0,
        cancelled: 0
      };
      const results: AuditCampaignSummary['results'] = {
        conform: 0,
        non_conform: 0,
        conditional: 0,
        critical: 0,
        unknown: 0
      };
      for (const audit of audits) {
        const state = auditProgress(audit, data.issues ?? []);
        progress[state]++;
        if (state === 'completed') {
          const result = audit.objectiveAuditResult;
          if (
            result === 'conform' ||
            result === 'non_conform' ||
            result === 'conditional' ||
            result === 'critical'
          )
            results[result]++;
          else results.unknown++;
        }
      }
      const sourceIssueIds = [
        ...new Set([...audits, ...anomalies, ...improvements].map((item) => item.issueId))
      ];
      const entities = new Set([
        ...sourceIssueIds,
        ...ids,
        ...anomalies.map((item) => item.anomalyId),
        ...improvements.map((item) => item.auditImprovementId)
      ]);
      const reserves = diagnostics.filter((item) => entities.has(item.entityId) && item.severity !== 'INFO');
      const qualities = [...audits, ...anomalies, ...improvements].map((item) => item.dataQualityStatus);
      const quality =
        qualities.includes('invalid') || reserves.some((item) => item.severity === 'ERROR')
          ? 'invalid'
          : qualities.includes('unknown') || first.version === 'unknown'
            ? 'unknown'
            : qualities.includes('partial') || reserves.length
              ? 'partial'
              : 'reliable';
      const issues = anomalies.map((item) => data.issues?.find((issue) => issue.issueId === item.issueId));
      return {
        libraryId: first.libraryId,
        version: first.version,
        publication: data.versions?.some(
          (version) =>
            version.libraryId === first.libraryId && version.number === first.version && version.prodTag
        )
          ? 'prod'
          : 'unproven',
        components: new Set(audits.map((audit) => audit.componentId)).size,
        audits: audits.length,
        progress,
        results,
        anomalies: anomalies.length,
        openAnomalies: issues.some((issue) => !issue)
          ? 'unknown'
          : issues.filter((issue) => issueBusinessState(issue!) === 'open').length,
        improvements: improvements.length,
        quality,
        sourceIssueIds
      };
    })
    .sort(
      (a, b) =>
        a.libraryId.localeCompare(b.libraryId) || a.version.localeCompare(b.version, 'fr', { numeric: true })
    );
}
