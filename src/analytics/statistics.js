/**
 * Calcule un quantile interpolé sur une population finie, sans transformer une absence en zéro.
 * @param {number[]} values - Durées admissibles de la population.
 * @param {number} probability - Quantile compris entre zéro et un.
 * @returns {number|null} Quantile, ou absence de population.
 */
export function quantile(values, probability) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * probability;
  const lower = Math.floor(index);
  return sorted[lower] + (sorted[Math.ceil(index)] - sorted[lower]) * (index - lower);
}

/**
 * Agrège les faits Analytics déjà projetés ; aucune règle métier ni date n'est reconstruite côté navigateur.
 * @param {{id?: string, key?: string, delay: number|null, source: string}[]} facts - Issues de la sélection.
 * @returns {Record<string, {count: number, average: number|null, median: number|null, p90: number|null, maximum: number|null}>} Effectifs et statistiques par provenance.
 */
export function durationStatistics(facts) {
  const distinct = [...new Map(facts.map((fact) => [fact.id ?? fact.key, fact])).values()];
  const admissible = distinct.filter((fact) => Number.isFinite(fact.delay) && fact.delay >= 0);
  return Object.fromEntries(
    Object.entries({
      global: admissible,
      done: admissible.filter((fact) => fact.source === 'done'),
      estimated: admissible.filter((fact) => fact.source === 'estimated')
    }).map(([name, population]) => {
      const values = population.map((fact) => fact.delay);
      return [
        name,
        {
          count: values.length,
          average: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null,
          median: quantile(values, 0.5),
          p90: quantile(values, 0.9),
          maximum: values.length ? Math.max(...values) : null
        }
      ];
    })
  );
}
