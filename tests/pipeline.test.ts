import { describe, expect, it } from 'vitest';
import { collectFixture } from '../src/collectors/fixture.js';
import { calculateKpis } from '../src/analytics/kpis.js';
import { normalizeGithub } from '../src/normalizers/github.js';
import { evaluateDataQuality } from '../src/quality/rules.js';
import { loadConfig } from '../src/config.js';
import { loadCatalogue, validateCatalogue } from '../src/catalogue.js';

const raw = await collectFixture();
const config = await loadConfig();
const normalized = normalizeGithub(raw, config.github);
const issues = evaluateDataQuality(raw, normalized, config.github);

// Les scénarios ci-dessous couvrent le flux métier et les réserves de qualité attendues.
 describe('quality pipeline', () => {
  // Vérifie que la normalisation reste indépendante de la forme GitHub.
  it('normalizes all configured repositories without coupling KPI code to GitHub shape', () => {
    expect(normalized.libraries).toHaveLength(3);
    expect(normalized.anomalies).toHaveLength(7);
    expect(normalized.anomalies.filter((anomaly) => anomaly.provenance.sourceId?.startsWith('issue-2')).length).toBe(2);
    expect(normalized.anomalies.filter((anomaly) => anomaly.provenance.sourceId?.startsWith('issue-3')).length).toBe(2);
    expect(normalized.anomalies.every((anomaly) => anomaly.provenance.source === 'github')).toBe(true);
    expect(normalized.audits.some((audit) => audit.objectiveAuditResult === 'conform')).toBe(true);
    expect(normalized.components.some((component) => component.name === 'Toast')).toBe(true);
    expect(normalized.anomalies.find((anomaly) => anomaly.provenance.sourceId === 'issue-101')?.criticality).toBe('major');
    expect(normalized.anomalies.find((anomaly) => anomaly.provenance.sourceId === 'issue-101')?.categories).toEqual(['focus']);
    expect(issues.some((issue) => issue.ruleId === 'DQ-004' && issue.entityId === normalized.anomalies.find((anomaly) => anomaly.provenance.sourceId === 'issue-101')?.anomalyId)).toBe(false);
  });

  // Le catalogue enrichit les composants connus sans changer la source des anomalies.
  it('loads the catalogue as the reference list of known components', async () => {
    const catalogue = await loadCatalogue();
    const catalogueRaw = { ...raw, catalogueComponents: catalogue.components.map((component) => component.name) };
    const catalogueNormalized = normalizeGithub(catalogueRaw, config.github, catalogue);

    expect(catalogue.components.map((component) => component.name)).toContain('Button');
    const button = catalogueNormalized.components.find((component) => component.name === 'Button');
    expect(button?.discoverySource).toBe('catalogue');
    expect(button).toMatchObject({
      owner: 'Communs du Dev',
      squad: 'Plume',
      tags: ['form', 'action'],
      rgaaLevel: 'AA',
      figmaUrl: 'https://figma.example.com/button',
      documentationUrl: 'https://plume.example.com/button',
      audit: { frequency: 'quarterly', lastAuditDate: '2026-08-12' }
    });
  });

  // Une entrée invalide doit interrompre le chargement plutôt que produire une référence incomplète.
  it('rejects invalid catalogue entries', () => {
    expect(() => validateCatalogue({
      version: '1.0',
      components: [{
        name: 'Button',
        stream: 'React',
        owner: 'Communs du Dev',
        squad: 'Plume',
        status: 'unknown',
        rgaaLevel: 'AA',
        tags: []
      }]
    })).toThrow('status is invalid');
  });

  // Les données invalides restent visibles, mais ne doivent pas gonfler les KPI.
  it('keeps invalid source data and excludes only the affected KPI object', () => {
    expect(normalized.anomalies).toHaveLength(7);
    expect(issues.some((issue) => issue.ruleId === 'DQ-001')).toBe(true);
    expect(calculateKpis(normalized, issues).anomaliesDeclared.value).toBe(6);
  });

  // Les avertissements dégradent la fiabilité sans empêcher le calcul des indicateurs.
  it('reports a partial reliability when DQ warnings or errors exist', () => {
    const analytics = calculateKpis(normalized, issues);
    expect(analytics.anomaliesCorrected.reliability).toBe('partial');
    expect(analytics.openAnomalies.value).toBe(3);
    expect(analytics.averageCorrectionDelayDays.value).toBeGreaterThan(0);
    expect(analytics.medianCorrectionDelayDays.value).toBeGreaterThan(0);
    expect(analytics.conformityRate.value).toBe(1);
  });

  it('excludes cancelled anomalies from KPI and reports forbidden relations', () => {
    const cancelledRaw = structuredClone(raw);
    const cancelledIssue = cancelledRaw.repositories[0]?.issues.find((issue) => issue.id === 'issue-101');
    if (!cancelledIssue) throw new Error('Fixture issue-101 is required for this test.');
    cancelledIssue.projectStatuses = [{ projectId: 'project-1', projectName: 'Quality', status: 'Cancelled' }];
    cancelledIssue.milestone = { id: 1, number: 1, title: 'Release 2.1' };

    const cancelledNormalized = normalizeGithub(cancelledRaw, config.github);
    const cancelledIssues = evaluateDataQuality(cancelledRaw, cancelledNormalized, config.github);
    const cancelledAnomaly = cancelledNormalized.anomalies.find((anomaly) => anomaly.provenance.sourceId === 'issue-101');
    const cancelledAnalytics = calculateKpis(cancelledNormalized, cancelledIssues);

    expect(cancelledAnomaly?.cancelled).toBe(true);
    expect(cancelledIssues.some((issue) => issue.ruleId === 'DQ-008' && issue.entityId === cancelledAnomaly?.anomalyId)).toBe(true);
    expect(cancelledIssues.some((issue) => issue.ruleId === 'DQ-010' && issue.entityId === cancelledAnomaly?.anomalyId)).toBe(true);
    expect(cancelledIssues.filter((issue) => issue.entityId === cancelledAnomaly?.anomalyId).map((issue) => issue.ruleId)).toEqual(['DQ-008', 'DQ-010']);
    expect(cancelledAnalytics.anomaliesDeclared.value).toBe(5);
  });
});
