import type { Audit, ComponentVersion, Issue, Snapshot } from '../domain/types.js';
import { anomaliesForAudit, auditVersionLabel } from './audit-relations.js';
import { latestCompletedAudit } from './audit-selection.js';
import { auditProgress, issueClassification } from '../domain/business.js';

/** Familles métier exclusives pour la lecture des issues du dashboard. */
export type IssueFamily = 'audit' | 'anomaly' | 'other';

/** Synthèse par couple composant/version, avec héritage explicitement calculé par Analytics. */
export interface ComponentVersionAuditSummary {
  componentId: string;
  versionId: string;
  completedAuditId?: string;
  ongoingAuditIds: string[];
  pendingAuditIds: string[];
  verdict: Audit['objectiveAuditResult'] | null;
  coverage: 'not_audited' | 'ongoing' | 'completed';
  /** Indique si le verdict provient d'une campagne sur une version antérieure. */
  inherited: boolean;
  /** Cohorte exacte ayant produit le verdict Analytics. */
  applicableAuditIds: string[];
}

/** Classe une issue à partir de son identité normalisée, sans assimiler BUG à anomalie RGAA. */
export function classifyIssue(issue: Issue, snapshot: Pick<Snapshot, 'normalizedData'>): IssueFamily {
  const family = issueClassification(issue, snapshot.normalizedData);
  return family === 'audit' ? 'audit' : ['audit_anomaly', 'anomaly'].includes(family) ? 'anomaly' : 'other';
}

/** Distingue l'avancement d'un audit de son résultat de conformité. */
export function auditLifecycle(
  audit: Audit,
  issues: readonly Issue[] = []
): { progress: ReturnType<typeof auditProgress>; verdict: Audit['objectiveAuditResult'] | null } {
  const progress = auditProgress(audit, issues);
  return { progress, verdict: progress === 'completed' ? audit.objectiveAuditResult : null };
}

/** Vue partagée, traçable et stable des audits, par composant et version canonique. */
export function auditReadModel(snapshot: Snapshot) {
  const { audits, issues, anomalies, versions } = snapshot.normalizedData;
  const versionById = new Map((versions ?? []).map((version) => [version.versionId, version]));
  return audits.map((audit) => {
    const relation = anomaliesForAudit(audit, anomalies, issues ?? []);
    const lifecycle = auditLifecycle(audit, issues ?? []);
    return {
      auditId: audit.auditId,
      issueId: audit.issueId,
      componentId: audit.componentId,
      libraryId: audit.libraryId,
      versionId: audit.versionId,
      version: auditVersionLabel(audit, snapshot),
      auditedArtifact: audit.auditedReleaseCandidate ?? null,
      versionKnown: Boolean(audit.versionId && versionById.has(audit.versionId)),
      ...lifecycle,
      completedAt: lifecycle.progress === 'completed' ? audit.completedAt : undefined,
      linkedAnomalyIds: relation.linked.map((anomaly) => anomaly.anomalyId),
      unresolvedAnomalyIds: relation.unresolved.map((anomaly) => anomaly.anomalyId),
      openAnomalyIds: relation.linked
        .filter((anomaly) => ['open', 'reopened', 'in_progress'].includes(anomaly.status))
        .map((anomaly) => anomaly.anomalyId),
      quality: audit.dataQualityStatus
    };
  });
}

/** Dernier audit terminé strictement associé au couple composant/version. */
export function latestAuditForComponentVersion(
  audits: readonly Audit[],
  relation: Pick<ComponentVersion, 'componentId' | 'versionId'>
): Audit | undefined {
  return latestCompletedAudit(
    audits.filter(
      (audit) => audit.componentId === relation.componentId && audit.versionId === relation.versionId
    )
  );
}

/**
 * Construit le référentiel d'audit des couples composant/version effectivement matérialisés.
 * Un audit sans version canonique ne peut pas justifier la conformité d'une version.
 * Une campagne en cours ne masque pas le dernier verdict terminé.
 */
export function componentVersionAuditSummaries(snapshot: Snapshot): ComponentVersionAuditSummary[] {
  const { componentVersions = [], audits } = snapshot.normalizedData;
  const auditsById = new Map(audits.map((audit) => [audit.auditId, audit]));
  return componentVersions.map((relation) => {
    const matching = audits.filter(
      (audit) => audit.componentId === relation.componentId && audit.versionId === relation.versionId
    );
    const completed = latestCompletedAudit(matching, snapshot.normalizedData.issues ?? []);
    const ongoingAuditIds = matching
      .filter((audit) => audit.status === 'in_progress')
      .map((audit) => audit.auditId);
    const pendingAuditIds = matching
      .filter((audit) => audit.status === 'not_evaluated')
      .map((audit) => audit.auditId);
    // La couche de présentation n'invente pas un verdict : elle reprend le calcul
    // Analytics D-220..D-228, y compris son héritage historique explicite.
    const applicableAuditIds = relation.applicableAuditIds ?? [];
    const inherited = applicableAuditIds.some((id) => auditsById.get(id)?.versionId !== relation.versionId);
    return {
      componentId: relation.componentId,
      versionId: relation.versionId,
      ...(completed ? { completedAuditId: completed.auditId } : {}),
      ongoingAuditIds,
      pendingAuditIds,
      verdict:
        relation.verdict === 'CONFORME'
          ? 'conform'
          : relation.verdict === 'NON_CONFORME'
            ? 'non_conform'
            : null,
      coverage: applicableAuditIds.length ? 'completed' : ongoingAuditIds.length ? 'ongoing' : 'not_audited',
      inherited,
      applicableAuditIds
    };
  });
}
