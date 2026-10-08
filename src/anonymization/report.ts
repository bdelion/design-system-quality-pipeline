import type { AnonymizationReport } from './types.js';
export function formatAnonymizationReport(r: AnonymizationReport): string {
  return [
    'ANONYMIZATION REPORT',
    `repositories: ${r.repositories}`,
    `issues: ${r.issues}`,
    `pullRequests: ${r.pullRequests}`,
    `catalogue components: ${r.components}`,
    `owners anonymized: ${r.ownersAnonymized}`,
    `repository names anonymized: ${r.repositoryNamesAnonymized}`,
    `ids anonymized: ${r.idsAnonymized}`,
    `dates shifted: ${r.datesShifted}`,
    `texts sanitized: ${r.textsSanitized}`,
    `suspicious strings: ${r.suspiciousStrings}`,
    ...(r.warnings.length ? ['warnings:', ...r.warnings.map((x) => `- ${x}`)] : [])
  ].join('\n');
}
