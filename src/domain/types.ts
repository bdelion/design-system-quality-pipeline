/** Origine d'une donnée et statut de fiabilité associé. */
export type Source = 'github' | 'catalogue' | 'manual' | 'suggested';
export type DataQualityStatus = 'reliable' | 'partial' | 'unknown' | 'invalid';
export type Severity = 'INFO' | 'WARNING' | 'ERROR';
export type DqAction = 'include' | 'exclude' | 'block';
export type MetricUnit = 'count' | 'percentage' | 'days';
export type MetricScope = 'portfolio' | 'library' | 'component' | 'audit' | 'anomaly' | 'version';
export type MetricReliabilityStatus = DataQualityStatus;
export type AuditStatus = 'not_evaluated' | 'in_progress' | 'conform' | 'conditional' | 'non_conform' | 'critical';
export type AnomalyStatus = 'open' | 'in_progress' | 'done' | 'reopened' | 'cancelled';

/** Trace l'origine technique d'une entité normalisée. */
export interface Provenance {
  source: Source;
  sourceId?: string;
  collectedAt: string;
}

export interface RawRepository {
  id: string;
  name: string;
  owner: string;
  defaultBranch: string;
  issues: RawIssue[];
  pullRequests: RawPullRequest[];
  tags?: RawTag[];
}

/** Git tag reference facts; lightweight tags have no tag-object creation date. */
export interface RawTag {
  name: string;
  ref: string;
  referenceSha: string;
  referenceObjectType: 'commit' | 'tag' | 'tree' | 'blob';
  targetSha: string;
  targetType: 'commit' | 'tag' | 'tree' | 'blob';
  createdAt?: string;
}

/** Issue GitHub conservée dans le modèle RAW avant normalisation. */
export interface RawIssue {
  id: string;
  number: number;
  title: string;
  state: 'OPEN' | 'CLOSED';
  issueType?: string;
  labels: string[];
  /** Collection target; `component` remains temporarily for existing fixtures. */
  components?: string[];
  component?: string;
  criticities: string[];
  parents: string[];
  createdAt: string;
  closedAt?: string;
  url?: string;
  firstDoneAt?: string;
  auditStatus?: AuditStatus;
  auditResult?: AuditStatus;
  linkedPullRequestIds: string[];
  projectStatuses: RawProjectStatus[];
  projectFields?: RawProjectField[];
  milestone?: RawMilestone;
}

export interface RawProjectField {
  projectId: string;
  projectName: string;
  fieldName: string;
  value: string | number | null;
}

/** Statut d'une issue dans un GitHub Project. */
export interface RawProjectStatus {
  projectId: string;
  projectName: string;
  /** Raw source value retained for compatibility with the current collector. */
  status: string;
  iteration?: RawProjectIteration;
  velocity?: string | number | null;
  scheduling?: string | null;
  transitions?: RawProjectStatusTransition[];
}

/** Facts about a GitHub Projects iteration, without inferred values. */
export interface RawProjectIteration {
  id: string;
  title: string;
  startDate?: string;
  duration?: number;
  endDate?: string;
}

/** A source transition; previous status is absent when GitHub does not provide it. */
export interface RawProjectStatusTransition {
  previousStatus?: string;
  newStatus: string;
  changedAt?: string;
}

/** Milestone GitHub rattachée à une issue. */
export interface RawMilestone {
  id: number;
  number: number;
  title: string;
  state?: 'open' | 'closed';
}

/**
 * V1 domain contract. Canonical values are optional because source values
 * may be missing, unrecognized, or ambiguous.
 */
export type CanonicalIssueType = string;
export type CanonicalProjectStatus = string;
export type AnomalyOrigin = 'AUDIT' | 'HORS_AUDIT' | 'UNDETERMINED';
export type AuditVerdict = 'CONFORM' | 'NON_CONFORM' | 'UNKNOWN';
export type AuditTiming = 'PRE_PROD' | 'CATCH_UP' | 'UNKNOWN';

export interface CanonicalProjectValue {
  rawValue: string;
  canonicalValue?: string;
  candidates?: string[];
}

export interface ProjectStatusTransition {
  previousStatus?: CanonicalProjectValue;
  newStatus: CanonicalProjectValue;
  changedAt?: string;
}

export interface ProjectContext {
  projectId: string;
  projectName: string;
  status: CanonicalProjectValue;
  fields: Array<{ fieldName: string; value: string | number | null }>;
  iteration?: RawProjectIteration;
  velocity?: {
    rawValue: string | number | null;
    numericValue?: number;
  };
  scheduling?: {
    rawValue: string | null;
  };
  transitions: ProjectStatusTransition[];
}

export interface Milestone {
  milestoneId: string;
  repositoryId: string;
  number: number;
  title: string;
  state?: 'open' | 'closed';
}

/** Generic normalized GitHub issue, preserved independently of specialization. */
export interface Issue {
  issueId: string;
  number: number;
  title: string;
  rawIssueType?: string;
  issueType?: CanonicalIssueType;
  state: 'OPEN' | 'CLOSED';
  createdAt: string;
  closedAt?: string;
  labels: string[];
  repositoryId: string;
  libraryId: string;
  /** Temporarily optional until I2 adds this fact to all RAW sources. */
  url?: string;
  milestoneId?: string;
  projectStatuses: ProjectContext[];
  parentIssueId?: string;
  subIssueIds: string[];
  linkedPullRequestIds: string[];
  componentIds: string[];
  criticities: string[];
  accessibilityCategories: string[];
  provenance: Provenance;
  dataQualityStatus: DataQualityStatus;
}

export interface GitTagReference {
  name: string;
  taggedAt?: string;
}

export interface Version {
  versionId: string;
  libraryId: string;
  number: string;
  tag?: string;
  releasedAt?: string;
  milestoneId?: string;
  published: boolean;
  catalogueStatus: 'known' | 'unknown';
  catalogueComponents?: string[];
  catalogueSource?: {
    repository: string;
    ref: string;
    path: string;
    collectedAt: string;
  };
  catalogueIssue?: string;
}

/** Explicit membership in a historical Component x Version catalogue. */
export interface ComponentVersion {
  componentId: string;
  versionId: string;
}

/** V1 Audit specialization; shared GitHub facts remain on the source Issue. */
export interface Audit {
  auditId: string;
  issueId: string;
  componentId: string;
  versionId: string;
  auditedReleaseCandidate?: string;
  auditedReleaseCandidateTag?: GitTagReference;
  completedAt?: string;
  realized: boolean;
  verdict: AuditVerdict;
  timing: AuditTiming;
}

interface AnomalyBase {
  anomalyId: string;
  issueId: string;
  componentIds: string[];
  criticality?: 'blocking' | 'major' | 'minor';
  categories: string[];
  detectedAt: string;
  correctedAt?: string;
}

export type Anomaly =
  | (AnomalyBase & {
      origin: 'AUDIT';
      auditId: string;
      componentId: string;
    })
  | (AnomalyBase & {
      origin: 'HORS_AUDIT';
      auditId?: never;
      componentId?: never;
    })
  | (AnomalyBase & {
      origin: 'UNDETERMINED';
      auditId?: never;
      componentId?: never;
    });

export interface AuditImprovement {
  auditImprovementId: string;
  issueId: string;
  auditId: string;
}

/** Pull request GitHub conservée dans le modèle RAW. */
export interface RawPullRequest {
  id: string;
  number: number;
  state: 'OPEN' | 'CLOSED' | 'MERGED';
  mergedAt?: string | undefined;
  relatedIssueIds: string[];
}

/** Ensemble brut produit par un collecteur. */
export interface RawDataset {
  collectedAt: string;
  repositories: RawRepository[];
  catalogueComponents: string[];
  nexusAvailable: boolean;
}

/** Représente une bibliothèque ou un dépôt analysé. */
export interface Library {
  libraryId: string;
  name: string;
  repository: string;
  status: 'active' | 'deprecated' | 'experimental' | 'removed';
  provenance: Provenance;
  dataQualityStatus: DataQualityStatus;
}

/** Composant normalisé, éventuellement enrichi par le catalogue. */
export interface Component {
  componentId: string;
  name: string;
  libraryId: string;
  status: 'active' | 'deprecated' | 'experimental' | 'removed';
  historicalOnly?: boolean;
  aliases: string[];
  discoverySource: 'catalogue' | 'github' | 'suggested';
  stream?: string;
  owner?: string;
  squad?: string;
  rgaaLevel?: string;
  figmaUrl?: string;
  documentationUrl?: string;
  tags: string[];
  audit?: { frequency: 'monthly' | 'quarterly' | 'yearly'; lastAuditDate?: string };
  provenance: Provenance;
  dataQualityStatus: DataQualityStatus;
}

/** Pull request indépendante du format de l'API GitHub. */
export interface PullRequest {
  pullRequestId: string;
  repository: string;
  state: 'open' | 'closed' | 'merged';
  mergedAt: string | undefined;
  relatedIssueIds: string[];
  provenance: Provenance;
  dataQualityStatus: DataQualityStatus;
}

/** Anomalie qualité rattachée à un composant et à un audit. */
export interface LegacyAnomaly {
  anomalyId: string;
  auditId: string;
  componentId: string;
  criticality: 'blocking' | 'major' | 'minor' | undefined;
  categories: string[];
  status: AnomalyStatus;
  createdAt: string;
  firstDoneAt: string | undefined;
  technicalCorrectedAt?: string;
  everCorrected: boolean;
  pullRequestRefs: string[];
  parentRefs: string[];
  provenance: Provenance;
  dataQualityStatus: DataQualityStatus;
  cancelled: boolean;
  cancelledProjectStatuses: RawProjectStatus[];
}

/** Audit normalisé à partir des données disponibles. */
export interface LegacyAudit {
  auditId: string;
  libraryId: string;
  componentId: string;
  version: string;
  status: AuditStatus;
  sourceIssueId: string;
  objectiveAuditResult: AuditStatus;
  provenance: Provenance;
  dataQualityStatus: DataQualityStatus;
}

/** Décision de qualité produite par une règle DQ. */
export interface DataQualityIssue {
  id: string;
  ruleId: string;
  severity: Severity;
  action: DqAction;
  entityType: string;
  entityId: string;
  message: string;
  detectedAt: string;
  impacts: DataQualityImpact[];
}

/** Décrit l'effet d'une réserve DQ sur une métrique précise. */
export interface DataQualityImpact {
  metricId: string;
  action: 'include' | 'exclude' | 'unknown';
  reason: string;
}

export interface MetricPeriod {
  from?: string;
  to?: string;
}

export interface MetricReliability {
  status: MetricReliabilityStatus;
  issueIds: string[];
}

export interface MetricBreakdown {
  dimension: string;
  values: Record<string, number>;
}

/** Métrique auto-documentée utilisée par le dashboard V2. */
export interface Metric {
  id: string;
  value: number | 'unknown';
  unit: MetricUnit;
  numerator?: number | 'unknown';
  denominator?: number | 'unknown';
  scope: MetricScope;
  period?: MetricPeriod;
  definition: string;
  sourceEntityIds: string[];
  reliability: MetricReliability;
  exclusions: { entityId: string; ruleId: string }[];
  breakdowns?: MetricBreakdown[];
}

/** Valeur d'un KPI avec son périmètre et son niveau de fiabilité. */
export interface KpiValue {
  value: number | 'unknown';
  numerator: number | 'unknown';
  denominator: number | 'unknown';
  reliability: DataQualityStatus;
  definition: string;
  sourceEntityIds: string[];
}

/** Ensemble des indicateurs calculés à partir des données normalisées. */
export interface Analytics {
  /** V2 contract: all dashboard analytics must consume this map. */
  metrics: Record<string, Metric>;
  /** Materialized release-time and current projections; presentation must not recalculate them. */
  versionStates?: VersionStateProjection[];
  /** Flux temporels présents lorsque deux snapshots sont comparables. */
  flows?: Record<string, Metric>;
  /** @deprecated Compatibility projection of anomaly.total. */
  anomaliesDeclared: KpiValue;
  /** @deprecated Compatibility projection of anomaly.correctedEver. */
  anomaliesCorrected: KpiValue;
  /** @deprecated Compatibility projection of anomaly.open. */
  openAnomalies: KpiValue;
  anomaliesByCriticality: Record<string, number | 'unknown'>;
  anomaliesByCategory: Record<string, number | 'unknown'>;
  /** @deprecated Compatibility projection of portfolio.auditCoverage. */
  auditsCoverage: KpiValue;
  /** @deprecated Compatibility projection of audit.conformityRate. */
  conformityRate: KpiValue;
  /** @deprecated Compatibility projection of anomaly.correctionDelay.average. */
  averageCorrectionDelayDays: KpiValue;
  /** @deprecated Compatibility projection of anomaly.correctionDelay.median. */
  medianCorrectionDelayDays: KpiValue;
}

export interface VersionStateView {
  catalogueStatus: 'known' | 'unknown';
  auditedComponentIds: string[];
  conformComponentIds: string[];
  nonConformComponentIds: string[];
  unknownComponentIds: string[];
  uncoveredComponentIds: string[];
  anomalyIds: string[];
  undeterminedOriginAnomalyIds: string[];
}

export interface VersionStateProjection {
  versionId: string;
  releasedAt?: string;
  atRelease?: VersionStateView;
  current: VersionStateView;
}

/** Données métier après collecte et normalisation. */
export interface NormalizedData {
  libraries: Library[];
  components: Component[];
  issues: Issue[];
  milestones: Milestone[];
  versions: Version[];
  componentVersions: ComponentVersion[];
  audits: Audit[];
  anomalies: Anomaly[];
  auditImprovements: AuditImprovement[];
  /** @deprecated Temporary compatibility projection; migrate consumers to V1 audits. */
  legacyAudits: LegacyAudit[];
  /** @deprecated Temporary compatibility projection; migrate consumers to V1 anomalies. */
  legacyAnomalies: LegacyAnomaly[];
  pullRequests: PullRequest[];
}

export type NormalizedDataV1 = NormalizedData;

/** Snapshot immuable regroupant sources, résultats et décisions de qualité. */
export interface Snapshot {
  snapshotId: string;
  capturedAt: string;
  scope: string;
  rawData: RawDataset;
  normalizedData: NormalizedData;
  dataQuality: { issues: DataQualityIssue[]; summary: Record<Severity, number> };
  analytics: Analytics;
  ruleVersion: string;
  modelVersion: string;
  reliability: DataQualityStatus;
}
