import { describe, expect, it } from 'vitest';
import { collectFixture } from '../src/collectors/fixture.js';
import { calculateKpis } from '../src/analytics/kpis.js';
import { normalizeGithub } from '../src/normalizers/github.js';
import { evaluateDataQuality } from '../src/quality/rules.js';
import { loadConfig } from '../src/config.js';
import { loadCatalogue, validateCatalogue } from '../src/catalogue.js';

const raw = await collectFixture();
const config = await loadConfig();
const normalized = normalizeGithub(raw, config.github, undefined, config.auditVersion);
const issues = evaluateDataQuality(raw, normalized, config.github);

// Les scénarios ci-dessous couvrent le flux métier et les réserves de qualité attendues.
 describe('quality pipeline', () => {
  // Vérifie que la normalisation reste indépendante de la forme GitHub.
  it('normalizes all configured repositories without coupling KPI code to GitHub shape', () => {
    expect(normalized.libraries).toHaveLength(3);
    expect(normalized.legacyAnomalies).toHaveLength(7);
    expect(normalized.legacyAnomalies.filter((anomaly) => anomaly.provenance.sourceId?.startsWith('issue-2')).length).toBe(2);
    expect(normalized.legacyAnomalies.filter((anomaly) => anomaly.provenance.sourceId?.startsWith('issue-3')).length).toBe(2);
    expect(normalized.legacyAnomalies.every((anomaly) => anomaly.provenance.source === 'github')).toBe(true);
    expect(normalized.legacyAudits.some((audit) => audit.objectiveAuditResult === 'conform')).toBe(true);
    expect(normalized.components.some((component) => component.name === 'Toast')).toBe(true);
    expect(normalized.legacyAnomalies.find((anomaly) => anomaly.provenance.sourceId === 'issue-101')?.criticality).toBe('major');
    expect(normalized.legacyAnomalies.find((anomaly) => anomaly.provenance.sourceId === 'issue-101')?.categories).toEqual(['focus']);
    expect(issues.some((issue) => issue.ruleId === 'DQ-004' && issue.entityId === normalized.legacyAnomalies.find((anomaly) => anomaly.provenance.sourceId === 'issue-101')?.anomalyId)).toBe(false);
  });

  // Le catalogue enrichit les composants connus sans changer la source des anomalies.
  it('uses catalogue-only components as portfolio entities when the catalogue maps them to a repository', async () => {
    const catalogue = await loadCatalogue();
    const synthetic = structuredClone(raw);
    synthetic.repositories[1]!.issues = synthetic.repositories[1]!.issues.filter((issue) => issue.component !== 'Toast');
    const normalizedCatalogue = normalizeGithub(synthetic, config.github, catalogue, config.auditVersion);
    expect(normalizedCatalogue.components.some((component) => component.name === 'Toast' && component.discoverySource === 'catalogue')).toBe(true);
  });


  it('uses the configured audit version instead of a hard-coded normalizer version', () => {
    const versioned = normalizeGithub(raw, config.github, undefined, '2099.01');
    expect(versioned.legacyAudits.every((audit) => audit.version === '2099.01')).toBe(true);
  });

  it('detects multiple parents independently of criticality', () => {
    const synthetic = structuredClone(raw);
    const issue = synthetic.repositories[0]!.issues.find((candidate) => candidate.id === 'issue-101');
    if (!issue) throw new Error('Fixture issue-101 is required for this test.');
    issue.parents = ['parent-1', 'parent-2'];
    issue.criticities = [];
    const normalizedSynthetic = normalizeGithub(synthetic, config.github, undefined, config.auditVersion);
    const quality = evaluateDataQuality(synthetic, normalizedSynthetic, config.github);
    const anomaly = normalizedSynthetic.legacyAnomalies.find((candidate) => candidate.provenance.sourceId === 'issue-101');
    expect(quality.some((item) => item.ruleId === 'DQ-003' && item.entityId === anomaly?.anomalyId)).toBe(true);
  });

  it('loads the catalogue as the reference list of known components', async () => {
    const catalogue = await loadCatalogue();
    const catalogueRaw = { ...raw, catalogueComponents: catalogue.components.map((component) => component.name) };
    const catalogueNormalized = normalizeGithub(catalogueRaw, config.github, catalogue, config.auditVersion);

    expect(catalogue.components.map((component) => component.name)).toContain('Button');
    const button = catalogueNormalized.components.find((component) => component.name === 'Button');
    expect(button?.discoverySource).toBe('catalogue');
    expect(button).toMatchObject({
      owner: 'Front',
      squad: 'eventail',
      tags: ['form', 'action'],
      rgaaLevel: 'AA',
      figmaUrl: 'https://figma.example.com/button',
      documentationUrl: 'https://eventail.example.com/button',
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
        owner: 'Front',
        squad: 'eventail',
        status: 'unknown',
        rgaaLevel: 'AA',
        tags: []
      }]
    })).toThrow('status is invalid');
  });

  // Les données invalides restent visibles, mais ne doivent pas gonfler les KPI.
  it('keeps invalid source data and excludes only the affected KPI object', () => {
    expect(normalized.legacyAnomalies).toHaveLength(7);
    expect(issues.some((issue) => issue.ruleId === 'DQ-001')).toBe(true);
    expect(calculateKpis(normalized, issues).metrics['anomaly.total']?.value).toBe(7);
  });

  // Les avertissements dégradent la fiabilité sans empêcher le calcul des indicateurs.
  it('reports a partial reliability when DQ warnings or errors exist', () => {
    const analytics = calculateKpis(normalized, issues);
    expect(analytics.metrics['anomaly.correctedEver']?.reliability.status).toBe('partial');
    expect(analytics.openAnomalies.value).toBe(3);
    expect(analytics.averageCorrectionDelayDays.value).toBeGreaterThan(0);
    expect(analytics.medianCorrectionDelayDays.value).toBeGreaterThan(0);
    expect(analytics.metrics['audit.conformityRate']?.value).toBe(100);
  });

  it('excludes cancelled anomalies from KPI and reports forbidden relations', () => {
    const cancelledRaw = structuredClone(raw);
    const cancelledIssue = cancelledRaw.repositories[0]?.issues.find((issue) => issue.id === 'issue-101');
    if (!cancelledIssue) throw new Error('Fixture issue-101 is required for this test.');
    cancelledIssue.projectStatuses = [{ projectId: 'project-1', projectName: 'Quality', status: 'Cancelled' }];
    cancelledIssue.milestone = { id: 1, number: 1, title: 'Release 2.1' };

    const cancelledNormalized = normalizeGithub(cancelledRaw, config.github, undefined, config.auditVersion);
    const cancelledIssues = evaluateDataQuality(cancelledRaw, cancelledNormalized, config.github);
    const cancelledAnomaly = cancelledNormalized.legacyAnomalies.find((anomaly) => anomaly.provenance.sourceId === 'issue-101');
    const cancelledAnalytics = calculateKpis(cancelledNormalized, cancelledIssues);

    expect(cancelledAnomaly?.cancelled).toBe(true);
    expect(cancelledIssues.some((issue) => issue.ruleId === 'DQ-008' && issue.entityId === cancelledAnomaly?.anomalyId)).toBe(true);
    expect(cancelledIssues.some((issue) => issue.ruleId === 'DQ-010' && issue.entityId === cancelledAnomaly?.anomalyId)).toBe(true);
    expect(cancelledIssues.filter((issue) => issue.entityId === cancelledAnomaly?.anomalyId).map((issue) => issue.ruleId)).toEqual(['DQ-008', 'DQ-010']);
    expect(cancelledAnalytics.metrics['anomaly.total']?.value).toBe(6);
  });
});

it('builds self-explaining V2 metrics with metric-scoped DQ impacts', () => {
  const analytics = calculateKpis(normalized, issues);
  const metrics = analytics.metrics;

  expect(metrics['portfolio.auditCoverage']).toMatchObject({
    unit: 'percentage',
    numerator: expect.any(Number),
    denominator: expect.any(Number)
  });
  expect(metrics['portfolio.auditCoverage']?.definition).toContain('Composants actifs');
  expect(metrics['anomaly.byCriticality.major']?.unit).toBe('count');
  expect(metrics['anomaly.correctionDelay.p90']?.unit).toBe('days');

  const missingCriticality = issues.find((issue) => issue.ruleId === 'DQ-001');
  expect(missingCriticality?.impacts.some((impact) => impact.metricId === 'anomaly.byCriticality.major')).toBe(true);
  expect(metrics['anomaly.byCriticality.major']?.reliability.status).toBe('partial');
  expect(metrics['anomaly.correctionDelay.average']?.reliability.status).not.toBe('invalid');
});
