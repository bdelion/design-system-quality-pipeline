import { accessibilityQualification, type AccessibilityRecognition } from '../domain/accessibility.js';
import type { DataQualityIssue, Issue, Metric, NormalizedData } from '../domain/types.js';
import { issueBusinessState, issueClassification, lastDoneAt } from '../domain/business.js';
import { durationStatistics } from './statistics.js';
import { getMetricContract } from './catalog.js';
import { matchesMetricPattern } from '../lib/metric-impacts.js';

/** Lecture Analytics commune d'une issue, de sa population et de ses preuves. */
export interface IssueFact {
  review?: Issue['review'];
  id: string;
  key: string;
  repo: string;
  number: number;
  title: string;
  url: string;
  labels: string[];
  type: string;
  projectContexts: Issue['projectContexts'];
  family: ReturnType<typeof issueClassification>;
  familyLabel: string;
  status: 'open' | 'closed' | 'cancelled';
  githubState: Issue['state'];
  componentIds: string[];
  components: string[];
  versions: string[];
  versionIds: string[];
  auditIds: string[];
  anomalyIds: string[];
  prs: string[];
  createdAt: string;
  delay: number | null;
  source: 'done' | 'estimated' | 'unavailable';
  quality: Issue['dataQualityStatus'];
  dateReason: string;
}

/**
 * Projette le traitement et le délai d'une issue sans confondre statut métier et date estimée.
 * Une estimation Closed n'est admissible que si Done et Closed sont prouvés.
 * @param issue - Faits GitHub et Project normalisés.
 * @returns État exclusif, délai calculable et provenance de sa date.
 */
export function issueTreatment(issue: Issue) {
  const state = issueBusinessState(issue);
  const doneAt = lastDoneAt(issue);
  const completedAt = state === 'treated' ? (doneAt ?? issue.closedAt) : undefined;
  const elapsed = completedAt ? (Date.parse(completedAt) - Date.parse(issue.createdAt)) / 86400000 : NaN;
  const delay = Number.isFinite(elapsed) && elapsed >= 0 ? elapsed : null;
  const source =
    delay === null ? ('unavailable' as const) : doneAt ? ('done' as const) : ('estimated' as const);
  return { cancelled: state === 'cancelled', treated: state === 'treated', delay, source };
}

/** Construit les faits Analytics des issues distinctes ; seules les versions explicitement reliées sont attribuées. */
export function projectIssueFacts(
  data: NormalizedData,
  quality: readonly DataQualityIssue[] = [],
  recognition: AccessibilityRecognition = {}
): IssueFact[] {
  const libraries = new Map(data.libraries.map((item) => [item.libraryId, item]));
  const components = new Map(data.components.map((item) => [item.componentId, item.name]));
  return [...new Map((data.issues ?? []).map((issue) => [issue.issueId, issue])).values()].map((issue) => {
    const treatment = issueTreatment(issue);
    const exclusion = quality.find(
      (diagnostic) =>
        diagnostic.entityId === issue.issueId &&
        diagnostic.impacts.some(
          (impact) => impact.action === 'exclude' && impact.metricId.startsWith('issue.treatmentDelay.')
        )
    );
    if (exclusion) {
      treatment.delay = null;
      treatment.source = 'unavailable';
    }
    const anomalies = data.anomalies.filter((item) => item.issueId === issue.issueId);
    const audits = data.audits.filter(
      (audit) =>
        audit.issueId === issue.issueId ||
        anomalies.some((anomaly) => anomaly.auditId === audit.auditId) ||
        data.auditImprovements?.some(
          (item) => item.issueId === issue.issueId && item.auditId === audit.auditId
        )
    );
    const versionIds = [...new Set(audits.flatMap((audit) => (audit.versionId ? [audit.versionId] : [])))];
    const versions = (data.versions ?? []).filter(
      (version) =>
        version.libraryId === issue.libraryId &&
        (versionIds.includes(version.versionId) ||
          (issue.milestoneId !== undefined && issue.milestoneId === version.milestoneId))
    );
    const repo = libraries.get(issue.libraryId)?.repository ?? issue.repositoryId;
    const qualification = accessibilityQualification(
      issue.labels,
      issue.accessibilityCategories,
      issue.criticalities,
      anomalies.some((anomaly) => anomaly.origin === 'AUDIT' && Boolean(anomaly.auditId)),
      recognition.repositories?.[repo] ?? recognition.labelAllOf
    );
    return {
      id: issue.issueId,
      ...(issue.review ? { review: issue.review } : {}),
      key: `${repo}#${issue.number}`,
      repo,
      number: issue.number,
      title: issue.title,
      url: issue.url,
      labels: issue.labels,
      type:
        issue.rawIssueType ??
        issue.issueType ??
        (issue.review?.typeSource === 'unconfirmed' ? 'Type non confirmé' : 'Non renseigné'),
      projectContexts: issue.projectContexts,
      family: issueClassification(issue, data),
      familyLabel:
        issue.review && anomalies.length
          ? issue.review.kinds.includes('accessibility')
            ? anomalies[0]?.origin === 'AUDIT'
              ? 'Anomalie d’accessibilité liée à un audit'
              : 'Bug d’accessibilité sans audit rattaché'
            : issue.review.kinds.includes('functional')
              ? 'Bug fonctionnel'
              : 'Bug — nature non renseignée'
          : issue.futureVersion
            ? 'Version future · activité conservée, hors analyses accessibilité'
            : anomalies.length && qualification.status === 'qualified' && anomalies[0]?.origin !== 'AUDIT'
              ? 'Anomalie d’accessibilité qualifiée · origine ' + anomalies[0]?.origin
              : (
                  {
                    audit: 'Audit',
                    audit_anomaly: 'Anomalie d’accessibilité liée à un audit',
                    anomaly:
                      anomalies[0]?.origin === 'HORS_AUDIT'
                        ? anomalies[0].criticality || anomalies[0].categories.length
                          ? 'Anomalie d’accessibilité présumée hors audit · à examiner'
                          : 'Bug hors audit · qualification RGAA non prouvée'
                        : 'Anomalie (origine indéterminée)',
                    improvement: 'Improvement d’audit',
                    other: 'Autre issue'
                  } as const
                )[issueClassification(issue, data)],
      status: treatment.cancelled ? 'cancelled' : treatment.treated ? 'closed' : 'open',
      githubState: issue.state,
      componentIds: [...new Set(issue.componentIds)],
      components: issue.componentIds.map((id) => components.get(id) ?? id),
      versions: versions.map((item) => item.number),
      versionIds: versions.map((item) => item.versionId),
      auditIds: audits.map((audit) => audit.auditId),
      anomalyIds: anomalies.map((item) => item.anomalyId),
      prs: [...new Set(issue.linkedPullRequestIds)],
      createdAt: issue.createdAt,
      delay: treatment.delay,
      source: treatment.source,
      quality: issue.dataQualityStatus,
      dateReason:
        treatment.source === 'estimated'
          ? 'Done et Closed prouvés, date Done absente : estimation Closed.'
          : treatment.source === 'done'
            ? 'Dernière transition Done datée.'
            : 'Traitement non prouvé ou date non calculable.'
    };
  });
}

/** Calcule les stocks et délais génériques dans Analytics, avec effectifs, sources et réserves DQ. */
export function calculateIssueMetrics(
  data: NormalizedData,
  quality: DataQualityIssue[]
): Record<string, Metric> {
  const facts = projectIssueFacts(data, quality);
  const metrics: Record<string, Metric> = {};
  /** Construit une métrique contractuelle traçable et conserve les exclusions de sa population. */
  const store = (id: string, population: IssueFact[], value: number | 'unknown', denominator: number) => {
    const contract = getMetricContract(id);
    if (!contract) throw new Error(`Contrat Analytics absent : ${id}`);
    const relevant = quality.filter(
      (issue) =>
        issue.impacts.some((impact) => matchesMetricPattern(impact.metricId, id)) &&
        facts.some(
          (fact) =>
            fact.id === issue.entityId ||
            fact.anomalyIds.includes(issue.entityId) ||
            fact.auditIds.includes(issue.entityId)
        )
    );
    metrics[id] = {
      id,
      value,
      unit: contract.unit,
      scope: contract.scope,
      definition: contract.definition,
      numerator: population.length,
      denominator,
      sourceEntityIds: population.map((fact) => fact.id),
      reliability: {
        status:
          relevant.length ||
          population.some((fact) => fact.quality !== 'reliable' || fact.source === 'estimated')
            ? 'partial'
            : 'reliable',
        issueIds: relevant.map((issue) => issue.id)
      },
      exclusions: quality.flatMap((issue) =>
        issue.impacts
          .filter((impact) => matchesMetricPattern(impact.metricId, id) && impact.action === 'exclude')
          .map(() => ({ entityId: issue.entityId, ruleId: issue.ruleId }))
      )
    };
  };
  store('issue.total', facts, facts.length, facts.length);
  for (const [name, status] of Object.entries({ open: 'open', treated: 'closed', cancelled: 'cancelled' })) {
    const population = facts.filter((fact) => fact.status === status);
    store(`issue.${name}`, population, population.length, facts.length);
  }
  const statistics = durationStatistics(facts);
  for (const [cohort, values] of Object.entries(statistics)) {
    const population = facts.filter(
      (fact) => fact.delay !== null && (cohort === 'global' || fact.source === cohort)
    );
    for (const statistic of ['average', 'median', 'p90'] as const) {
      const id = `issue.treatmentDelay.${cohort}.${statistic}`;
      store(
        id,
        population,
        values[statistic] === null ? 'unknown' : Number(values[statistic].toFixed(1)),
        facts.length
      );
    }
  }
  return metrics;
}
