/** Origine d'une donnée et statut de fiabilité associé. */
export type Source = 'github' | 'catalogue' | 'manual' | 'suggested';
export type DataQualityStatus = 'reliable' | 'partial' | 'unknown' | 'invalid';
export type Severity = 'INFO' | 'WARNING' | 'ERROR';
export type DqAction = 'include' | 'exclude' | 'block';
export type MetricUnit = 'count' | 'percentage' | 'days';
export type MetricScope = 'portfolio' | 'library' | 'component' | 'audit' | 'anomaly';
export type MetricReliabilityStatus = DataQualityStatus;
export type AuditStatus = 'not_evaluated' | 'in_progress' | 'conform' | 'conditional' | 'non_conform' | 'critical';
export type AnomalyStatus = 'open' | 'in_progress' | 'done' | 'reopened' | 'cancelled';
export type CanonicalIssueType = 'EPIC' | 'AUDIT' | 'BUG' | 'NEW_COMPONENT' | 'FEATURE';
export type CanonicalProjectStatus = 'BACKLOG' | 'READY' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED' | 'CANCELLED';
export type AnomalyOrigin = 'AUDIT' | 'HORS_AUDIT' | 'UNDETERMINED';
export type ComponentVersionVerdict = 'NON_COUVERT' | 'CONFORME' | 'NON_CONFORME';

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
  /** Git tags collected from the repository. Legacy fixtures may omit them. */
  gitTags?: RawGitTag[];
}

/** Git tag evidence used to establish PROD publication dates. */
export interface RawGitTag {
  name: string;
  /** Present only when GitHub exposes a trustworthy annotated-tag date. */
  createdAt?: string;
}

/** Issue GitHub conservée dans le modèle RAW avant normalisation. */
export interface RawIssue {
  id: string;
  number: number;
  title: string;
  state: 'OPEN' | 'CLOSED';
  /** Legacy canonicalized value kept until all fixtures are migrated. */
  issueType: 'EPIC' | 'AUDIT' | 'BUG' | 'NEW_COMPONENT' | 'FEATURE' | 'OTHER' | 'UNKNOWN';
  /** Raw GitHub Issue Type, when GitHub provides one. */
  rawIssueType?: string;
  /** Canonical web URL collected from GitHub. Legacy fixtures may omit it. */
  url?: string;
  labels: string[];
  component?: string;
  criticities: string[];
  parents: string[];
  createdAt: string;
  closedAt?: string;
  firstDoneAt?: string;
  auditStatus?: AuditStatus;
  auditResult?: AuditStatus;
  linkedPullRequestIds: string[];
  projectStatuses: RawProjectStatus[];
  milestone?: RawMilestone;
}

/** Transition historique du statut d'une issue dans un GitHub Project. */
export interface RawProjectStatusTransition {
  previousStatus?: string;
  status: string;
  transitionedAt: string;
}

/** Statut d'une issue dans un GitHub Project. */
export interface RawProjectStatus {
  projectId: string;
  projectName: string;
  status: string;
  iteration?: ProjectIteration;
  rawVelocity?: string | number;
  rawScheduling?: string | number;
  statusHistory?: RawProjectStatusTransition[];
}

/** Milestone GitHub rattachée à une issue. */
export interface RawMilestone {
  id: number;
  number: number;
  title: string;
  state?: 'open' | 'closed';
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

/** Valeur d'Iteration conservée dans le contexte du GitHub Project source. */
export interface ProjectIteration {
  iterationId: string;
  title: string;
  startDate?: string;
  durationDays?: number;
  endDate?: string;
}

/** Transition de statut observée dans un GitHub Project. */
export interface ProjectStatusTransition {
  previousRawStatus?: string;
  previousStatus?: CanonicalProjectStatus;
  previousCandidateStatuses?: CanonicalProjectStatus[];
  rawStatus: string;
  status?: CanonicalProjectStatus;
  candidateStatuses?: CanonicalProjectStatus[];
  transitionedAt: string;
}

/** Données d'une Issue contextualisées par le GitHub Project qui les porte. */
export interface IssueProjectContext {
  projectId: string;
  projectName: string;
  rawStatus?: string;
  status?: CanonicalProjectStatus;
  candidateStatuses?: CanonicalProjectStatus[];
  iteration?: ProjectIteration;
  rawVelocity?: string | number;
  velocity?: number;
  rawScheduling?: string | number;
  statusHistory: ProjectStatusTransition[];
}

/** Issue GitHub générique conservée exhaustivement dans le modèle normalisé. */
export interface Issue {
  issueId: string;
  repositoryId: string;
  libraryId: string;
  number: number;
  title: string;
  url: string;
  state: 'OPEN' | 'CLOSED';
  createdAt: string;
  closedAt?: string;
  labels: string[];
  milestoneId?: string;
  rawIssueType?: string;
  issueType?: CanonicalIssueType;
  candidateIssueTypes?: CanonicalIssueType[];
  componentIds: string[];
  criticalities: string[];
  accessibilityCategories: string[];
  parentIssueId?: string;
  subIssueIds: string[];
  linkedPullRequestIds: string[];
  projectContexts: IssueProjectContext[];
  provenance: Provenance;
  dataQualityStatus: DataQualityStatus;
}

/** Version PROD canonique et faits Git associés. */
export interface Version {
  versionId: string;
  libraryId: string;
  number: string;
  releasedAt?: string;
  milestoneId?: string;
  prodTag?: { name: string; createdAt?: string };
  provenance: Provenance;
  dataQualityStatus: DataQualityStatus;
}

/** Présence historique explicite d'un Component dans une Version. */
export interface ComponentVersion {
  componentVersionId: string;
  componentId: string;
  versionId: string;
  verdict: ComponentVersionVerdict;
  applicableAuditIds: string[];
  provenance: Provenance;
  dataQualityStatus: DataQualityStatus;
}

/** Amélioration rattachée de manière univoque à un Audit valide. */
export interface AuditImprovement {
  auditImprovementId: string;
  issueId: string;
  auditId: string;
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
export interface Anomaly {
  anomalyId: string;
  issueId?: string;
  origin?: AnomalyOrigin;
  /** @deprecated I1 migration compatibility. AUDIT anomalies will ultimately use the optional relation below. */
  auditId?: string;
  /** @deprecated I1 migration compatibility. Source Component relations are carried by Issue.componentIds. */
  componentId?: string;
  criticality: 'blocking' | 'major' | 'minor' | undefined;
  categories: string[];
  status: AnomalyStatus;
  /** Date métier de détection : date de création de l'Issue source. */
  detectedAt: string;
  /** Date métier de correction : transition Project canonique unique vers DONE. */
  correctedAt?: string;
  /** @deprecated I3 migration compatibility. Use detectedAt. */
  createdAt: string;
  /** @deprecated I3 migration compatibility. Use correctedAt. */
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
export interface Audit {
  auditId: string;
  issueId?: string;
  libraryId: string;
  componentId: string;
  versionId?: string;
  auditedReleaseCandidate?: string;
  auditedReleaseCandidateTag?: { name: string; createdAt?: string };
  completedAt?: string;
  /** @deprecated I1 migration compatibility. Use versionId and Version.number. */
  version: string;
  status: AuditStatus;
  /** @deprecated I1 migration compatibility. Use issueId. */
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

/** Données métier après collecte et normalisation. */
export interface NormalizedData {
  libraries: Library[];
  components: Component[];
  /** I1 target collection. Optional only during the staged migration of existing normalizers. */
  issues?: Issue[];
  /** I1 target collection. Optional only during the staged migration of existing normalizers. */
  versions?: Version[];
  /** I1 target collection. Optional only during the staged migration of existing normalizers. */
  componentVersions?: ComponentVersion[];
  audits: Audit[];
  anomalies: Anomaly[];
  /** I1 target collection. Optional only during the staged migration of existing normalizers. */
  auditImprovements?: AuditImprovement[];
  pullRequests: PullRequest[];
}

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
