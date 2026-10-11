/** Fait minimal requis pour les statistiques partagées. */
export interface DurationFact {
  id?: string;
  key?: string;
  delay: number | null;
  source: string;
}
/** Statistiques d'une population distincte. */
export interface DurationStatistics {
  count: number;
  average: number | null;
  median: number | null;
  p90: number | null;
  maximum: number | null;
}
/** Calcule un quantile interpolé sur les durées admissibles. */
export function quantile(values: number[], probability: number): number | null;
/** Agrège les faits Analytics filtrés et dédupliqués, par provenance. */
export function durationStatistics(
  facts: readonly DurationFact[]
): Record<'global' | 'done' | 'estimated', DurationStatistics>;
