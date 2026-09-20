export type Source = 'github' | 'catalogue' | 'manual' | 'suggested';
export type DataQualityStatus = 'reliable' | 'partial' | 'unknown' | 'invalid';
export type Severity = 'INFO' | 'WARNING' | 'ERROR';
export type DqAction = 'include' | 'exclude' | 'block';
export type AuditStatus = 'not_evaluated' | 'in_progress' | 'conform' | 'conditional' | 'non_conform' | 'critical';
export type AnomalyStatus = 'open' | 'in_progress' | 'done' | 'reopened' | 'cancelled';

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
}

export interface RawPullRequest {
  id: string;
  number: number;
  state: 'OPEN' | 'CLOSED' | 'MERGED';
  mergedAt?: string | undefined;
  relatedIssueIds: string[];
}

export interface RawDataset {
  collectedAt: string;
  repositories: RawRepository[];
  catalogueComponents: string[];
  nexusAvailable: boolean;
}

export interface Library {
  libraryId: string;
  name: string;
  repository: string;
  status: 'active' | 'deprecated' | 'experimental' | 'removed';
  provenance: Provenance;
  dataQualityStatus: DataQualityStatus;
}

export interface Component {
  componentId: string;
  name: string;
  libraryId: string;
  status: 'active' | 'deprecated' | 'experimental' | 'removed';
  aliases: string[];
  discoverySource: 'catalogue' | 'github' | 'suggested';
  provenance: Provenance;
  dataQualityStatus: DataQualityStatus;
}

export interface PullRequest {
  pullRequestId: string;
  repository: string;
  state: 'open' | 'closed' | 'merged';
  mergedAt: string | undefined;
  relatedIssueIds: string[];
  provenance: Provenance;
  dataQualityStatus: DataQualityStatus;
}

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
}

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

export interface KpiValue {
  value: number | 'unknown';
  numerator: number | 'unknown';
  denominator: number | 'unknown';
  reliability: DataQualityStatus;
  definition: string;
  sourceEntityIds: string[];
}

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

export interface NormalizedData {
  libraries: Library[];
  components: Component[];
  audits: Audit[];
  anomalies: Anomaly[];
  pullRequests: PullRequest[];
}

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
