import { describe, expect, it } from 'vitest';
import { accessibilityQualification, validateAccessibilityRecognition } from '../src/domain/accessibility.js';
import { workspaceAnalytics, accessibilityReviewCsv } from '../src/analytics/workspaces.js';
import { workspaceCards, accessibilityContent } from '../src/dashboard/workspaces.js';
import { consolidationSnapshot } from './support/consolidation.js';

describe('qualification et populations des espaces métier', () => {
  it('distingue preuve de label, présomption RGAA et absence de preuve sans inventer un audit', () => {
    expect(accessibilityQualification(['Audit de conformité RGAA'], [], []).status).toBe('qualified');
    expect(accessibilityQualification(['rgaa:majeure'], [], ['major']).status).toBe('presumed');
    expect(accessibilityQualification(['a11y:contraste'], ['contraste'], []).status).toBe('presumed');
    expect(accessibilityQualification(['Audit fonctionnel'], [], []).status).toBe('unqualified');
    expect(accessibilityQualification(['Audit', 'RGAA'], [], []).status).toBe('presumed');
  });
  it('préserve le snapshot et distingue les défauts génériques des présomptions', () => {
    const snapshot = consolidationSnapshot();
    const original = JSON.stringify(snapshot);
    const model = workspaceAnalytics(snapshot.normalizedData, snapshot.dataQuality.issues);
    expect(model.rows.find((row) => row.id === 'bug-generic')?.qualification.status).toBe('unqualified');
    expect(model.rows.find((row) => row.id === 'anomaly-a')?.qualification.status).toBe('qualified');
    expect(JSON.stringify(snapshot)).toBe(original);
  });
  it('donne des agrégats distincts par périmètre et un verdict courant sans compter les non-audités comme non-conformes', () => {
    const snapshot = consolidationSnapshot();
    const model = workspaceAnalytics(snapshot.normalizedData, snapshot.dataQuality.issues);
    const current = model.scopes.find(
      (scope) => scope.repository === '' && scope.component === '' && scope.version === ''
    );
    expect(current?.summary.components).toBe(2);
    expect(current?.summary.covered).toBe(1);
    expect(current?.summary.nonCovered).toBe(1);
    expect(current?.summary.nonConform).toBe(1);
    expect(current?.summary.conformity).toBe(0);
    expect(model.review.every((row) => !row.qualification.reasons.includes('label Audit + RGAA'))).toBe(true);
  });
  it('compte une issue une seule fois malgré des anomalies legacy dupliquées', () => {
    const data = consolidationSnapshot().normalizedData;
    const before = workspaceAnalytics(data).scopes[0]!.summary.declared;
    data.anomalies.push(structuredClone(data.anomalies[0]!));
    expect(workspaceAnalytics(data).scopes[0]!.summary.declared).toBe(before);
  });
  it('agrège une version commune à deux repositories sans choisir arbitrairement le premier', () => {
    const data = consolidationSnapshot().normalizedData;
    const library = { ...data.libraries[0]!, libraryId: 'extra-library', repository: 'acme/extra' };
    const component = {
      ...data.components[0]!,
      componentId: 'extra-component',
      libraryId: library.libraryId,
      name: 'Extra'
    };
    const version = {
      ...data.versions!.find((item) => item.number === '2.0.0')!,
      versionId: 'extra-version',
      libraryId: library.libraryId
    };
    data.libraries.push(library);
    data.components.push(component);
    data.versions!.push(version);
    data.componentVersions!.push({
      componentVersionId: 'extra-relation',
      componentId: component.componentId,
      versionId: version.versionId,
      verdict: 'NON_COUVERT',
      provenance: component.provenance,
      dataQualityStatus: 'reliable'
    });
    const summary = workspaceAnalytics(data).scopes.find(
      (scope) => !scope.repository && !scope.component && scope.version === '2.0.0'
    )?.summary;
    expect(summary?.components).toBe(3);
    expect(summary?.nonCovered).toBe(2);
  });
  it('signale les populations indisponibles dans un ancien snapshot sans Issues', () => {
    const data = consolidationSnapshot().normalizedData;
    delete data.issues;
    expect(workspaceAnalytics(data).available).toBe(false);
  });
  it('sépare annulations, estimations et exclusions de dates, et protège les CSV de revue', () => {
    const snapshot = consolidationSnapshot();
    const model = workspaceAnalytics(snapshot.normalizedData);
    const issue = snapshot.normalizedData.issues!.find((item) => item.issueId === 'anomaly-a')!;
    issue.title = '=HYPERLINK("https://example.invalid")';
    const csv = accessibilityReviewCsv(workspaceAnalytics(snapshot.normalizedData).review);
    expect(csv).toContain("'=HYPERLINK");
    expect(model.scopes[0]!.summary.actual + model.scopes[0]!.summary.estimated).toBe(
      model.scopes[0]!.summary.measured
    );
    expect(model.scopes[0]!.summary.treated).toBeLessThanOrEqual(model.scopes[0]!.summary.declared);
  });
  it('accepte une convention explicite par repository et refuse les règles vides', () => {
    expect(() =>
      validateAccessibilityRecognition({
        labelAllOf: ['audit', 'rgaa'],
        repositories: { 'acme/test': ['controle', 'accessibilite'] }
      })
    ).not.toThrow();
    expect(() => validateAccessibilityRecognition({ labelAllOf: [''] })).toThrow('non vides');
    expect(
      accessibilityQualification(['Controle ACCESSIBILITE'], [], [], false, ['controle', 'accessibilite'])
        .status
    ).toBe('qualified');
    const data = consolidationSnapshot().normalizedData;
    const issue = data.issues!.find((item) => item.issueId === 'bug-generic')!;
    issue.labels.push('Controle ACCESSIBILITE');
    const repo = data.libraries.find((library) => library.libraryId === issue.libraryId)!.repository;
    expect(
      workspaceAnalytics(data, [], { repositories: { [repo]: ['controle', 'accessibilite'] } }).rows.find(
        (row) => row.id === issue.issueId
      )?.qualification.status
    ).toBe('qualified');
  });
});

/** Vérifie la restitution honnête des besoins sans source collectée. */
it('affiche les besoins consommateurs et Design comme indisponibles', () => {
  const content = accessibilityContent(consolidationSnapshot());
  expect(content).toContain('aucune source de consommation des applications');
  expect(content).toContain('Audits de maquettes Design');
  expect(content).toContain('les données actuelles ne distinguent pas');
});

/** Vérifie que l’absence de catalogue versionné ne devient pas un effectif nul de composants non couverts. */
it('présente les inconnues séparément des composants non couverts', () => {
  const snapshot = consolidationSnapshot();
  snapshot.normalizedData.componentVersions = [];
  delete snapshot.analytics.workspaces;
  const content = workspaceCards(snapshot);
  expect(content).toMatch(/data-workspace-kpi="nonCovered">Indisponible/);
  expect(content).toMatch(/data-workspace-kpi="unknown">2/);
});
