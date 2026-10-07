import { describe, expect, it } from 'vitest';
import type { NormalizedData } from '../src/domain/types.js';
import { projectVersionStates } from '../src/analytics/version-state.js';

const data: NormalizedData = {
  libraries: [],
  components: [],
  issues: [],
  milestones: [],
  versions: [{
    versionId: 'version-ui-1',
    libraryId: 'library-ui',
    number: '1.0.0',
    tag: '1.0.0',
    releasedAt: '2026-09-05T00:00:00Z',
    published: true,
    catalogueStatus: 'known',
    catalogueComponents: ['Button'],
    catalogueSource: {
      repository: 'design-system/ui',
      ref: '1.0.0',
      path: 'config/catalogue.yaml',
      collectedAt: '2026-09-10T00:00:00Z'
    }
  }],
  componentVersions: [{ componentId: 'component-button', versionId: 'version-ui-1' }],
  audits: [
    {
      auditId: 'audit-before-release',
      issueId: 'issue-audit-before',
      componentId: 'component-button',
      versionId: 'version-ui-1',
      completedAt: '2026-09-04T00:00:00Z',
      realized: true,
      verdict: 'NON_CONFORM',
      timing: 'PRE_PROD'
    },
    {
      auditId: 'audit-catch-up',
      issueId: 'issue-audit-catch-up',
      componentId: 'component-button',
      versionId: 'version-ui-1',
      completedAt: '2026-09-08T00:00:00Z',
      realized: true,
      verdict: 'NON_CONFORM',
      timing: 'CATCH_UP'
    }
  ],
  anomalies: [
    {
      anomalyId: 'anomaly-before-release',
      issueId: 'issue-anomaly-before',
      componentIds: ['component-button'],
      origin: 'AUDIT',
      auditId: 'audit-before-release',
      componentId: 'component-button',
      categories: ['focus'],
      detectedAt: '2026-09-06T00:00:00Z',
      correctedAt: '2026-09-09T00:00:00Z'
    },
    {
      anomalyId: 'anomaly-after-release',
      issueId: 'issue-anomaly-after',
      componentIds: ['component-button'],
      origin: 'AUDIT',
      auditId: 'audit-catch-up',
      componentId: 'component-button',
      categories: ['name'],
      detectedAt: '2026-09-07T00:00:00Z'
    }
  ],
  auditImprovements: [],
  legacyAudits: [],
  legacyAnomalies: [],
  pullRequests: []
};

describe('Version historical state', () => {
  it('keeps the Release state separate from catch-up knowledge and later anomalies', () => {
    const [projection] = projectVersionStates(data);

    expect(projection?.atRelease).toMatchObject({
      auditedComponentIds: ['component-button'],
      conformComponentIds: ['component-button'],
      anomalyIds: []
    });
    expect(projection?.current).toMatchObject({
      auditedComponentIds: ['component-button'],
      nonConformComponentIds: ['component-button'],
      anomalyIds: ['anomaly-after-release', 'anomaly-before-release']
    });
  });

  it('does not invent an at-Release view when the Version has no release timestamp', () => {
    const withoutRelease = structuredClone(data);
    delete withoutRelease.versions[0]?.releasedAt;

    expect(projectVersionStates(withoutRelease)[0]).not.toHaveProperty('atRelease');
  });
});
