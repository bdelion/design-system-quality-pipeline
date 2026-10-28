import type { Snapshot } from '../domain/types.js';
import { auditTrackingData } from '../domain/audit-tracking.js';
import { applyComponentVersionVerdicts } from './component-versions.js';
import { calculateKpis } from './kpis.js';

/** Prépare les indicateurs de la page détaillée d’audit sans modifier le snapshot ni l’historique global. */
export function auditScopeSnapshot(snapshot: Snapshot): Snapshot {
  if (snapshot.normalizedData.auditTracking === undefined) return snapshot;
  const data = structuredClone(auditTrackingData(snapshot.normalizedData));
  data.libraries = data.libraries.filter((library) => data.auditTracking![library.repository] !== undefined);
  const libraryIds = new Set(data.libraries.map((library) => library.libraryId));
  data.components = data.components.filter((component) => libraryIds.has(component.libraryId));
  if (data.issues) data.issues = data.issues.filter((issue) => libraryIds.has(issue.libraryId));
  const auditIds = new Set(data.audits.map((audit) => audit.auditId));
  data.anomalies = data.anomalies.filter((anomaly) => anomaly.auditId && auditIds.has(anomaly.auditId));
  if (data.auditImprovements)
    data.auditImprovements = data.auditImprovements.filter((item) => auditIds.has(item.auditId));
  applyComponentVersionVerdicts(data);
  return { ...snapshot, normalizedData: data, analytics: calculateKpis(data, snapshot.dataQuality.issues) };
}
