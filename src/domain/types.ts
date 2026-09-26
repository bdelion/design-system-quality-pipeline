/** Origine d'une donnée et statut de fiabilité associé. */
export type Source = 'github' | 'catalogue' | 'manual' | 'suggested';
export type DataQualityStatus = 'reliable' | 'partial' | 'unknown' | 'invalid';
export type Severity = 'INFO' | 'WARNING' | 'ERROR';
export type DqAction = 'include' | 'exclude' | 'block';
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
}

/** Issue GitHub conservée dans le modèle RAW avant normalisation. */
export interface RawIssue {
  id: string;
  number: number;
  title: string;
  state: 'OPEN' | 'CLOSED';
  issueType: 'EPIC' | 'AUDIT' | 'BUG' | 'NEW_COMPONENT' | 'FEATURE' | 'OTHER' | 'UNKNOWN';
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

/** Statut d'une issue dans un GitHub Project. */
export interface RawProjectStatus {
  projectId: string;
  projectName: string;
  status: string;
}

/** Milestone GitHub rattachée à une issue. */
export interface RawMilestone {
  id: number;
  number: number;
  title: string;
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
export interface Audit {
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
  anomaliesDeclared: KpiValue;
  anomaliesCorrected: KpiValue;
  openAnomalies: KpiValue;
  anomaliesByCriticality: Record<string, number | 'unknown'>;
  anomaliesByCategory: Record<string, number | 'unknown'>;
  auditsCoverage: KpiValue;
  conformityRate: KpiValue;
  averageCorrectionDelayDays: KpiValue;
  medianCorrectionDelayDays: KpiValue;
}

/** Données métier après collecte et normalisation. */
export interface NormalizedData {
  libraries: Library[];
  components: Component[];
  audits: Audit[];
  anomalies: Anomaly[];
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
