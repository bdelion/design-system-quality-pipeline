import type { Audit, Anomaly, NormalizedData, Version, VersionStateProjection, VersionStateView } from '../domain/types.js';

function completedAuditAt(audit: Audit, cutoff?: number): boolean {
  if (!audit.realized || !audit.completedAt) return false;
  const completed = Date.parse(audit.completedAt);
  return Number.isFinite(completed) && (cutoff === undefined || completed <= cutoff);
}

function effectiveVerdict(audit: Audit, anomalies: Anomaly[], cutoff?: number): Audit['verdict'] {
  if (audit.verdict === 'UNKNOWN') return 'UNKNOWN';
  if (cutoff === undefined) return audit.verdict;
  const linked = anomalies.filter((anomaly) =>
    anomaly.origin === 'AUDIT'
    && anomaly.auditId === audit.auditId
    && Number.isFinite(Date.parse(anomaly.detectedAt))
    && (cutoff === undefined || Date.parse(anomaly.detectedAt) <= cutoff)
  );
  return linked.length > 0 ? 'NON_CONFORM' : 'CONFORM';
}

function latestAudit(audits: Audit[]): Audit | undefined {
  if (audits.length === 0) return undefined;
  const latestAt = Math.max(...audits.map((audit) => Date.parse(audit.completedAt ?? '')));
  const latest = audits.filter((audit) => Date.parse(audit.completedAt ?? '') === latestAt);
  if (latest.length === 1) return latest[0];
  return latest.every((audit) => audit.verdict === latest[0]?.verdict) ? latest[0] : undefined;
}

function projectView(
  version: Version,
  data: NormalizedData,
  cutoff?: number
): VersionStateView {
  const members = data.componentVersions.filter((item) => item.versionId === version.versionId);
  const auditedComponentIds = new Set<string>();
  const conformComponentIds = new Set<string>();
  const nonConformComponentIds = new Set<string>();
  const unknownComponentIds = new Set<string>();

  for (const member of members) {
    const audits = data.audits.filter((audit) =>
      audit.componentId === member.componentId
      && audit.versionId === version.versionId
      && completedAuditAt(audit, cutoff)
    );
    const latest = latestAudit(audits);
    if (!latest) continue;
    auditedComponentIds.add(member.componentId);
    const verdict = effectiveVerdict(latest, data.anomalies, cutoff);
    if (verdict === 'CONFORM') conformComponentIds.add(member.componentId);
    else if (verdict === 'NON_CONFORM') nonConformComponentIds.add(member.componentId);
    else unknownComponentIds.add(member.componentId);
  }

  const componentIds = new Set(members.map((member) => member.componentId));
  const anomalies = data.anomalies.filter((anomaly) => {
    const detection = Date.parse(anomaly.detectedAt);
    return Number.isFinite(detection)
      && (cutoff === undefined || detection <= cutoff)
      && anomaly.componentIds.some((componentId) => componentIds.has(componentId));
  });

  return {
    catalogueStatus: version.catalogueStatus === 'known' && version.published ? 'known' : 'unknown',
    auditedComponentIds: [...auditedComponentIds].sort(),
    conformComponentIds: [...conformComponentIds].sort(),
    nonConformComponentIds: [...nonConformComponentIds].sort(),
    unknownComponentIds: [...unknownComponentIds].sort(),
    uncoveredComponentIds: version.catalogueStatus === 'known' && version.published
      ? [...componentIds].filter((componentId) => !auditedComponentIds.has(componentId)).sort()
      : [],
    anomalyIds: anomalies.map((anomaly) => anomaly.anomalyId).sort(),
    undeterminedOriginAnomalyIds: anomalies
      .filter((anomaly) => anomaly.origin === 'UNDETERMINED')
      .map((anomaly) => anomaly.anomalyId)
      .sort()
  };
}

/** Materializes state at release and current knowledge without using observation time as business time. */
export function projectVersionStates(data: NormalizedData): VersionStateProjection[] {
  return data.versions.map((version) => {
    const releasedTimestamp = version.releasedAt ? Date.parse(version.releasedAt) : Number.NaN;
    const result = {
      versionId: version.versionId,
      ...(version.releasedAt ? { releasedAt: version.releasedAt } : {}),
      current: projectView(version, data)
    };
    return Number.isFinite(releasedTimestamp)
      ? { ...result, atRelease: projectView(version, data, releasedTimestamp) }
      : result;
  });
}
