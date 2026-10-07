import type { Audit, DataQualityIssue, Metric, MetricBreakdown, NormalizedData } from '../domain/types.js';
import { assertMetricContract, getMetricContract } from './catalog.js';
import { applyMetricImpacts, matchesMetricPattern } from '../lib/metric-impacts.js';

type CurrentAnomalyStatus = 'open' | 'in_progress' | 'done' | 'reopened';

function reliabilityFor(metricId: string, issues: DataQualityIssue[]): { status: Metric['reliability']['status']; issueIds: string[] } {
  const relevant = issues.filter((issue) => issue.impacts.some((impact) => matchesMetricPattern(impact.metricId, metricId)));
  const status = relevant.some((issue) => issue.impacts.some((impact) => matchesMetricPattern(impact.metricId, metricId) && impact.action === 'unknown'))
    ? 'unknown'
    : relevant.length > 0 ? 'partial' : 'reliable';
  return { status, issueIds: relevant.map((issue) => issue.id).filter(Boolean) };
}

function metric(metricId: string, value: number | 'unknown', numerator: number | 'unknown', denominator: number | 'unknown', sourceEntityIds: string[], issues: DataQualityIssue[], breakdowns?: MetricBreakdown[]): Metric {
  const spec = getMetricContract(metricId);
  if (!spec) throw new Error(`Missing V2 metric contract: ${metricId}`);
  const relevant = issues.filter((issue) => issue.impacts.some((impact) => matchesMetricPattern(impact.metricId, metricId)));
  const result: Metric = {
    id: metricId,
    value,
    unit: spec.unit,
    numerator,
    denominator,
    scope: spec.scope,
    definition: spec.definition,
    sourceEntityIds,
    reliability: reliabilityFor(metricId, issues),
    exclusions: relevant.flatMap((issue) => issue.impacts
      .filter((impact) => matchesMetricPattern(impact.metricId, metricId) && impact.action === 'exclude')
      .map(() => ({ entityId: issue.entityId, ruleId: issue.ruleId })))
  };
  if (breakdowns !== undefined) result.breakdowns = breakdowns;
  return result;
}

function median(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[middle] : ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
}

function percentile(values: number[], p: number): number | undefined {
  if (values.length === 0) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return (sorted[lower] ?? 0) + ((sorted[upper] ?? 0) - (sorted[lower] ?? 0)) * (index - lower);
}

function currentAnomalyStatus(issue: NormalizedData['issues'][number] | undefined): CurrentAnomalyStatus | undefined {
  if (!issue) return undefined;
  const values = [...new Set(issue.projectStatuses
    .map((project) => (project.status.canonicalValue ?? project.status.rawValue).trim().toLowerCase())
    .map((value) => ({
      'in progress': 'in_progress',
      'in-progress': 'in_progress'
    }[value] ?? value))
    .filter((value): value is CurrentAnomalyStatus =>
      ['open', 'in_progress', 'done', 'reopened'].includes(value)
    ))];
  return values.length === 1 ? values[0] : undefined;
}

function sourceIdForIssue(data: NormalizedData, issueId: string): string | undefined {
  return data.issues.find((issue) => issue.issueId === issueId)?.provenance.sourceId;
}

function excludedEntityIds(issues: DataQualityIssue[], metricId: string): Set<string> {
  return new Set(issues.flatMap((qualityIssue) => qualityIssue.impacts
    .filter((impact) => matchesMetricPattern(impact.metricId, metricId) && impact.action === 'exclude')
    .map(() => qualityIssue.entityId)));
}

function isExcluded(issue: DataQualityIssue[], metricId: string, entityIds: string[]): boolean {
  const excluded = excludedEntityIds(issue, metricId);
  return entityIds.some((entityId) => excluded.has(entityId));
}

function latestAudit(audits: Audit[]): Audit | undefined {
  const completed = audits.filter((audit) => audit.realized && audit.completedAt);
  const latestTime = completed.reduce((latest, audit) => Math.max(latest, Date.parse(audit.completedAt ?? '')), Number.NEGATIVE_INFINITY);
  if (!Number.isFinite(latestTime)) return undefined;
  const latest = completed.filter((audit) => Date.parse(audit.completedAt ?? '') === latestTime);
  if (latest.length === 1) return latest[0];
  const verdicts = new Set(latest.map((audit) => audit.verdict));
  return verdicts.size === 1 ? latest[0] : { ...(latest[0] as Audit), verdict: 'UNKNOWN' };
}

/** Calculates V1 metrics from business entities and historical Component x Version membership. */
export function calculateMetrics(
  data: NormalizedData,
  dqIssues: DataQualityIssue[],
  observedAt?: string
): Record<string, Metric> {
  const metricIds = [
    'portfolio.repositories', 'portfolio.libraries', 'portfolio.components', 'portfolio.componentsAudited', 'portfolio.auditCoverage',
    'version.auditCoverage.*', 'version.conformityRate.*',
    'audit.completed', 'audit.conform', 'audit.conditional', 'audit.nonConform', 'audit.critical', 'audit.conformityRate',
    'anomaly.total', 'anomaly.open', 'anomaly.inProgress', 'anomaly.done', 'anomaly.byCriticality.blocking', 'anomaly.byCriticality.major', 'anomaly.byCriticality.minor',
    'anomaly.criticalityCoverage', 'anomaly.byCategory.*', 'anomaly.byOrigin.*', 'anomaly.correctedEver', 'anomaly.reopened', 'anomaly.cancelled',
    'anomaly.correctionDelay.average', 'anomaly.correctionDelay.median', 'anomaly.correctionDelay.p90', 'anomaly.backlog.oldestAge'
  ];
  assertMetricContract(metricIds);

  const versionMetricIds = data.versions.flatMap((version) => [
    `version.auditCoverage.${version.versionId}`,
    `version.conformityRate.${version.versionId}`
  ]);
  const allMetricIds = [...metricIds, ...versionMetricIds];
  const issues = applyMetricImpacts(dqIssues, allMetricIds);
  const m: Record<string, Metric> = {};
  const repositoryIds = [...new Set(data.libraries.map((library) => library.repository))];
  const activeComponents = data.components.filter((component) => component.status === 'active' && !component.historicalOnly);
  const activeComponentIds = new Set(activeComponents.map((component) => component.componentId));
  const issueById = new Map(data.issues.map((issue) => [issue.issueId, issue]));
  const anomalies = data.anomalies.map((anomaly) => {
    const sourceIssueId = sourceIdForIssue(data, anomaly.issueId);
    const sourceIds = [anomaly.anomalyId, anomaly.issueId, ...(sourceIssueId ? [sourceIssueId] : [])];
    const excluded = (metricId: string) => isExcluded(issues, metricId, sourceIds);
    return {
      ...anomaly,
      status: currentAnomalyStatus(issueById.get(anomaly.issueId)),
      excluded
    };
  });
  const validAnomalies = anomalies.filter((anomaly) => !anomaly.excluded('anomaly.total'));
  const completedAudits = data.audits.filter((audit) =>
    audit.realized && Boolean(audit.completedAt)
      && !isExcluded(issues, 'audit.completed', [audit.auditId, audit.issueId, sourceIdForIssue(data, audit.issueId) ?? ''])
  );
  const knownCompletedAudits = completedAudits.filter((audit) => audit.verdict !== 'UNKNOWN');
  const knownVerdicts = knownCompletedAudits;
  const membershipsByVersion = new Map<string, NormalizedData['componentVersions']>();
  for (const version of data.versions) {
    membershipsByVersion.set(version.versionId, data.componentVersions.filter((item) => item.versionId === version.versionId));
  }
  const componentVersionsWithAudit = new Set<string>();
  let cataloguesComplete = data.versions.length > 0;

  for (const version of data.versions) {
    const memberships = membershipsByVersion.get(version.versionId) ?? [];
    const coverageId = `version.auditCoverage.${version.versionId}`;
    const conformityId = `version.conformityRate.${version.versionId}`;
    const auditedIds: string[] = [];
    const conformIds: string[] = [];
    const unknownVerdictIds: string[] = [];

    if (version.catalogueStatus !== 'known' || !version.published) cataloguesComplete = false;
    for (const membership of memberships) {
      const pairId = `${membership.componentId}:${membership.versionId}`;
      const audits = completedAudits.filter((audit) =>
        audit.componentId === membership.componentId && audit.versionId === membership.versionId
      );
      const applicable = latestAudit(audits);
      if (!applicable) continue;
      auditedIds.push(pairId);
      if (activeComponentIds.has(membership.componentId)) componentVersionsWithAudit.add(membership.componentId);
      if (applicable.verdict === 'CONFORM') {
        conformIds.push(pairId);
      } else if (applicable.verdict === 'UNKNOWN') {
        unknownVerdictIds.push(pairId);
      }
    }
    const isVersionCatalogueKnown = version.catalogueStatus === 'known' && version.published;
    const coverageValue = isVersionCatalogueKnown && memberships.length > 0
      ? Number(((auditedIds.length / memberships.length) * 100).toFixed(1))
      : 'unknown';
    const coveredCount = auditedIds.length;
    const conformityValue = isVersionCatalogueKnown && coveredCount > 0 && unknownVerdictIds.length === 0
      ? Number(((conformIds.length / coveredCount) * 100).toFixed(1))
      : 'unknown';
    m[coverageId] = metric(coverageId, coverageValue, auditedIds.length, isVersionCatalogueKnown ? memberships.length : 'unknown', auditedIds, issues);
    m[conformityId] = metric(conformityId, conformityValue, conformIds.length, unknownVerdictIds.length ? 'unknown' : coveredCount, conformIds, issues);
  }

  const allMemberships = data.componentVersions.filter((membership) =>
    data.versions.some((version) => version.versionId === membership.versionId
      && version.catalogueStatus === 'known' && version.published)
  );
  const coveredMemberships = allMemberships.filter((membership) =>
    completedAudits.some((audit) => audit.componentId === membership.componentId && audit.versionId === membership.versionId)
  );
  const coveredPairVerdicts = coveredMemberships.flatMap((membership) => {
    const latest = latestAudit(completedAudits.filter((audit) =>
      audit.componentId === membership.componentId && audit.versionId === membership.versionId
    ));
    return latest ? [{ membership, verdict: latest.verdict }] : [];
  });
  const portfolioCoverage = cataloguesComplete && allMemberships.length > 0
    ? Number(((coveredMemberships.length / allMemberships.length) * 100).toFixed(1))
    : 'unknown';
  m['portfolio.repositories'] = metric('portfolio.repositories', repositoryIds.length, repositoryIds.length, repositoryIds.length, repositoryIds, issues);
  m['portfolio.libraries'] = metric('portfolio.libraries', data.libraries.length, data.libraries.length, data.libraries.length, data.libraries.map((library) => library.libraryId), issues);
  m['portfolio.components'] = metric('portfolio.components', activeComponents.length, activeComponents.length, activeComponents.length, activeComponents.map((component) => component.componentId), issues);
  m['portfolio.componentsAudited'] = metric('portfolio.componentsAudited', componentVersionsWithAudit.size, componentVersionsWithAudit.size, activeComponents.length, [...componentVersionsWithAudit], issues);
  m['portfolio.auditCoverage'] = metric('portfolio.auditCoverage', portfolioCoverage, coveredMemberships.length, cataloguesComplete ? allMemberships.length : 'unknown', coveredMemberships.map((membership) => `${membership.componentId}:${membership.versionId}`), issues);

  m['audit.completed'] = metric('audit.completed', completedAudits.length, completedAudits.length, data.audits.length, completedAudits.map((audit) => audit.auditId), issues);
  m['audit.conform'] = metric('audit.conform', knownVerdicts.filter((audit) => audit.verdict === 'CONFORM').length, knownVerdicts.filter((audit) => audit.verdict === 'CONFORM').length, knownVerdicts.length, knownVerdicts.filter((audit) => audit.verdict === 'CONFORM').map((audit) => audit.auditId), issues);
  m['audit.conditional'] = metric('audit.conditional', 'unknown', 'unknown', 'unknown', [], issues);
  m['audit.nonConform'] = metric('audit.nonConform', knownVerdicts.filter((audit) => audit.verdict === 'NON_CONFORM').length, knownVerdicts.filter((audit) => audit.verdict === 'NON_CONFORM').length, knownVerdicts.length, knownVerdicts.filter((audit) => audit.verdict === 'NON_CONFORM').map((audit) => audit.auditId), issues);
  m['audit.critical'] = metric('audit.critical', 'unknown', 'unknown', 'unknown', [], issues);
  const conformPairIds = coveredPairVerdicts.filter((pair) => pair.verdict === 'CONFORM')
    .map(({ membership }) => `${membership.componentId}:${membership.versionId}`);
  const unknownPairVerdict = coveredPairVerdicts.some((pair) => pair.verdict === 'UNKNOWN');
  m['audit.conformityRate'] = metric('audit.conformityRate', coveredPairVerdicts.length && !unknownPairVerdict
    ? Number(((conformPairIds.length / coveredPairVerdicts.length) * 100).toFixed(1))
    : 'unknown', conformPairIds.length,
  unknownPairVerdict ? 'unknown' : coveredPairVerdicts.length,
  conformPairIds, issues);

  const anomalyIds = (metricId: string) => validAnomalies
    .filter((anomaly) => !anomaly.excluded(metricId))
    .map((anomaly) => anomaly.anomalyId);
  const totalIds = anomalyIds('anomaly.total');
  m['anomaly.total'] = metric('anomaly.total', totalIds.length, totalIds.length, data.anomalies.length, totalIds, issues);
  const anyUnknownStatus = validAnomalies.some((anomaly) => anomaly.status === undefined && !anomaly.excluded('anomaly.open'));
  const stateMetric = (metricId: string, status: CurrentAnomalyStatus) => {
    const ids = validAnomalies.filter((anomaly) => anomaly.status === status && !anomaly.excluded(metricId)).map((anomaly) => anomaly.anomalyId);
    return metric(metricId, anyUnknownStatus ? 'unknown' : ids.length, ids.length, anyUnknownStatus ? 'unknown' : totalIds.length, ids, issues);
  };
  m['anomaly.open'] = stateMetric('anomaly.open', 'open');
  m['anomaly.inProgress'] = stateMetric('anomaly.inProgress', 'in_progress');
  m['anomaly.done'] = stateMetric('anomaly.done', 'done');
  for (const criticality of ['blocking', 'major', 'minor'] as const) {
    const id = `anomaly.byCriticality.${criticality}`;
    const ids = validAnomalies.filter((anomaly) => anomaly.criticality === criticality && !anomaly.excluded(id)).map((anomaly) => anomaly.anomalyId);
    m[id] = metric(id, ids.length, ids.length, totalIds.length, ids, issues);
  }
  const classified = validAnomalies.filter((anomaly) => anomaly.criticality && !anomaly.excluded('anomaly.criticalityCoverage'));
  m['anomaly.criticalityCoverage'] = metric('anomaly.criticalityCoverage', totalIds.length
    ? Number(((classified.length / totalIds.length) * 100).toFixed(1))
    : 'unknown', classified.length, totalIds.length, classified.map((anomaly) => anomaly.anomalyId), issues);
  const categories = [...new Set(validAnomalies.flatMap((anomaly) => anomaly.categories))];
  for (const category of categories) {
    const id = `anomaly.byCategory.${category}`;
    const ids = validAnomalies.filter((anomaly) => anomaly.categories.includes(category) && !anomaly.excluded(id)).map((anomaly) => anomaly.anomalyId);
    m[id] = metric(id, ids.length, ids.length, totalIds.length, ids, issues);
  }
  for (const origin of ['AUDIT', 'HORS_AUDIT', 'UNDETERMINED'] as const) {
    const id = `anomaly.byOrigin.${origin}`;
    const ids = validAnomalies.filter((anomaly) => anomaly.origin === origin && !anomaly.excluded(id)).map((anomaly) => anomaly.anomalyId);
    const originUnknown = origin !== 'UNDETERMINED' && validAnomalies.some((anomaly) => anomaly.origin === 'UNDETERMINED');
    m[id] = metric(id, originUnknown ? 'unknown' : ids.length, ids.length, originUnknown ? 'unknown' : totalIds.length, ids, issues);
  }
  const corrected = validAnomalies.filter((anomaly) => Boolean(anomaly.correctedAt)
    && Number.isFinite(Date.parse(anomaly.correctedAt ?? ''))
    && Number.isFinite(Date.parse(anomaly.detectedAt))
    && Date.parse(anomaly.correctedAt ?? '') >= Date.parse(anomaly.detectedAt)
    && !anomaly.excluded('anomaly.correctionDelay.average'));
  const delays = corrected.flatMap((anomaly) => anomaly.correctedAt
    ? [(Date.parse(anomaly.correctedAt) - Date.parse(anomaly.detectedAt)) / 86_400_000]
    : []);
  m['anomaly.correctedEver'] = metric('anomaly.correctedEver', corrected.length, corrected.length, totalIds.length, corrected.map((anomaly) => anomaly.anomalyId), issues);
  const reopenedIds = validAnomalies.filter((anomaly) => anomaly.status === 'reopened' && !anomaly.excluded('anomaly.reopened')).map((anomaly) => anomaly.anomalyId);
  m['anomaly.reopened'] = metric('anomaly.reopened', anyUnknownStatus ? 'unknown' : reopenedIds.length, reopenedIds.length, anyUnknownStatus ? 'unknown' : totalIds.length, reopenedIds, issues);
  m['anomaly.cancelled'] = metric('anomaly.cancelled', 'unknown', 'unknown', 'unknown', [], issues);
  const average = delays.length ? Number((delays.reduce((sum, delay) => sum + delay, 0) / delays.length).toFixed(1)) : 'unknown';
  const med = median(delays);
  const p90 = percentile(delays, 0.9);
  m['anomaly.correctionDelay.average'] = metric('anomaly.correctionDelay.average', average, delays.length, delays.length, corrected.map((anomaly) => anomaly.anomalyId), issues);
  m['anomaly.correctionDelay.median'] = metric('anomaly.correctionDelay.median', med === undefined ? 'unknown' : Number(med.toFixed(1)), delays.length, delays.length, corrected.map((anomaly) => anomaly.anomalyId), issues);
  m['anomaly.correctionDelay.p90'] = metric('anomaly.correctionDelay.p90', p90 === undefined ? 'unknown' : Number(p90.toFixed(1)), delays.length, delays.length, corrected.map((anomaly) => anomaly.anomalyId), issues);
  const open = validAnomalies.filter((anomaly) => ['open', 'reopened'].includes(anomaly.status ?? '')
    && !anomaly.excluded('anomaly.backlog.oldestAge'));
  const observedTimestamp = observedAt ? Date.parse(observedAt) : Number.NaN;
  const oldest = open.length && Number.isFinite(observedTimestamp)
    ? Math.max(...open.map((anomaly) => observedTimestamp - Date.parse(anomaly.detectedAt))) / 86_400_000
    : undefined;
  m['anomaly.backlog.oldestAge'] = metric('anomaly.backlog.oldestAge', oldest === undefined ? 'unknown' : Number(oldest.toFixed(1)), open.length, open.length, open.map((anomaly) => anomaly.anomalyId), issues);
  return m;
}
