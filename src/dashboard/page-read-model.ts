import type { Snapshot } from '../domain/types.js';
import type { WorkspaceAnalytics, WorkspaceSummary, AccessibilityRow } from '../analytics/workspaces.js';
import type { EpicActivity } from '../analytics/epic-activity.js';
import { workspaceModel } from './workspaces.js';
import { issuesExplorerModel, componentsExplorerModel } from './explorer-read-model.js';

/** Identités stables des parcours ; distinctes de leurs titres traduits. */
export const dashboardPages = [
  'index',
  'issues',
  'components',
  'accessibility',
  'audits',
  'anomalies',
  'graph',
  'history',
  'quality',
  'epics'
] as const;
export type DashboardPage = (typeof dashboardPages)[number];
/** Synthèses déjà calculées, sans les listes de preuves rendues côté serveur. */
export interface WorkspacePageModel {
  version: 1;
  available: boolean;
  scopes: {
    repository: string;
    component: string;
    version: string;
    summary: Omit<WorkspaceSummary, 'sourceIds'>;
  }[];
  rows?: AccessibilityRow[];
  review?: AccessibilityRow[];
}
/** Sections exclusives aux usages qui en ont besoin. */
export interface DashboardPageData {
  workspaces?: WorkspacePageModel;
  issues?: ReturnType<typeof issuesExplorerModel>;
  components?: ReturnType<typeof componentsExplorerModel>;
  epics?: EpicActivity;
}
/** Contrat de transport versionné ; aucun Snapshot ni RAW ne peut y être incorporé. */
export interface DashboardPageModel {
  schema: 'dsq-dashboard-page';
  version: 1;
  page: DashboardPage;
  snapshot: { id: string; capturedAt: string; modelVersion: string; ruleVersion: string };
  data: DashboardPageData;
}
/** Projette uniquement les synthèses consommées et, pour l'accessibilité, les faits nécessaires aux exports. */
function workspacePageModel(model: WorkspaceAnalytics, details: boolean): WorkspacePageModel {
  return {
    version: 1,
    available: model.available,
    scopes: model.scopes.map(({ summary, ...context }) => {
      const { sourceIds: _sources, ...presentation } = summary;
      void _sources;
      return { ...context, summary: presentation };
    }),
    ...(details ? { rows: model.rows, review: model.review } : {})
  };
}
/** Construit le modèle du parcours sans modifier les faits, qualifications ou captures anciennes. */
export function dashboardPageModel(
  snapshot: Snapshot,
  page: DashboardPage,
  githubUrl?: string,
  componentPrefix = 'Component:'
): DashboardPageModel {
  const data: DashboardPageData = {};
  if (page === 'issues') data.issues = issuesExplorerModel(snapshot, githubUrl, componentPrefix);
  if (page === 'components') data.components = componentsExplorerModel(snapshot, githubUrl, componentPrefix);
  if (page === 'epics') data.epics = snapshot.analytics.epicActivity ?? { version: 1, epics: [] };
  if (page === 'accessibility' || page === 'audits')
    data.workspaces = workspacePageModel(workspaceModel(snapshot), page === 'accessibility');
  return {
    schema: 'dsq-dashboard-page',
    version: 1,
    page,
    snapshot: {
      id: snapshot.snapshotId,
      capturedAt: snapshot.capturedAt,
      modelVersion: snapshot.modelVersion,
      ruleVersion: snapshot.ruleVersion
    },
    data
  };
}
