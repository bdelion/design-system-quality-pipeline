import { describe, it, expect } from 'vitest';
import { evaluateAnalyticsV2 } from '../src/analytics/v2/evaluator';
import { NormalizedData, DataQualityIssue } from '../src/domain/types';

describe('Analytics Engine V2', () => {
  const mockData: NormalizedData = {
    components: [
      { id: 'btn', name: 'Button', repository: 'core' },
      { id: 'card', name: 'Card', repository: 'core' },
    ],
    audits: [
      { id: 'a1', componentId: 'btn', status: 'completed', result: 'compliant', isConformal: true },
      { id: 'a2', componentId: 'btn', status: 'completed', result: 'compliant', isConformal: true }, // 2ème audit sur le même composant
    ],
    anomalies: [
      {
        id: 'ano-1',
        title: 'Bouton non accessible',
        status: 'open',
        severity: 'high',
        repository: 'core',
        categories: ['accessibility'],
        createdAt: '2026-01-01',
      },
      {
        id: 'ano-2',
        title: 'Couleur hors token',
        status: 'closed',
        severity: 'low',
        repository: 'core',
        categories: ['theme'],
        createdAt: '2026-01-01',
        closedAt: '2026-01-11', // 10 jours
      },
    ],
  };

  it('ne doit pas dépasser 100% de couverture de patrimoine même avec plusieurs audits par composant', () => {
    const analytics = evaluateAnalyticsV2(mockData, []);
    const coverage = analytics.metrics['patrimony.audits.coverage'];

    expect(coverage.value).toBe(50); // 1 composant audité sur 2
    expect(coverage.numerator).toBe(1);
    expect(coverage.denominator).toBe(2);
  });

  it('doit calculer le délai P90 et la médiane correctement', () => {
    const analytics = evaluateAnalyticsV2(mockData, []);
    const median = analytics.metrics['performance.anomalies.resolution_time_median'];
    const p90 = analytics.metrics['performance.anomalies.resolution_time_p90'];

    expect(median.value).toBe(10);
    expect(p90.value).toBe(10);
  });

  it('ne doit altérer que la fiabilité des métriques concernées par une DQ spécifique', () => {
    const dqIssues: DataQualityIssue[] = [
      { id: 'i1', ruleId: 'DQ-001', message: 'Criticité manquante', entityId: 'ano-1' },
    ];

    const analytics = evaluateAnalyticsV2(mockData, dqIssues);

    // DQ-001 affecte les anomalies
    expect(analytics.metrics['quality_state.anomalies.open_stock'].reliability.status).toBe('partial');
    
    // N'affecte PAS la conformité des audits
    expect(analytics.metrics['quality_state.audits.compliance_rate'].reliability.status).toBe('reliable');
  });
});