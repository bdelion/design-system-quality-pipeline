import type { RawDataset } from '../domain/types.js';
import type { IntegrityFinding, ValidationResult } from './validator.js';
import type { TraceManifest } from './trace.js';

function md(value: unknown): string {
  return String(value).replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');
}

function json(value: unknown): string {
  return JSON.stringify(value, null, 2) ?? 'null';
}

export function buildValidationReport(
  dataset: RawDataset,
  validation: ValidationResult,
  integrity: IntegrityFinding[],
  inputPath: string,
  trace?: TraceManifest,
): string {
  const byKind = new Map<string, number>();
  for (const finding of validation.findings) byKind.set(finding.kind, (byKind.get(finding.kind) ?? 0) + 1);

  const lines: string[] = [
    '# Fixture validation report',
    '',
    `- **Source:** \`${inputPath}\``,
    `- **Repositories:** ${dataset.repositories.length}`,
    `- **Issues:** ${dataset.repositories.reduce((n, r) => n + r.issues.length, 0)}`,
    `- **Pull requests:** ${dataset.repositories.reduce((n, r) => n + r.pullRequests.length, 0)}`,
    `- **Suspicious strings:** ${validation.findings.length}`,
    `- **Integrity errors:** ${integrity.length}`,
    `- **Result:** ${validation.findings.length === 0 && integrity.length === 0 ? '✅ VALID' : '❌ INVALID'}`,
    ...(trace ? [`- **RAW trace manifest:** \`${trace.source.file}\``] : []),
    '',
    '## 1. Suspicious strings',
    '',
  ];

  if (byKind.size === 0) {
    lines.push('No suspicious strings detected.', '');
  } else {
    lines.push('| Type | Count |', '|---|---:|');
    for (const [kind, count] of [...byKind.entries()].sort(([a], [b]) => a.localeCompare(b))) lines.push(`| ${md(kind)} | ${count} |`);
    lines.push('', '### Detailed findings', '', '| # | Type | JSON path | Source value |', '|---:|---|---|---|');
    validation.findings.forEach((finding, index) => {
      lines.push(`| ${index + 1} | ${md(finding.kind)} | \`${md(finding.path)}\` | \`${md(finding.value)}\` |`);
    });
    lines.push('');
  }

  lines.push('## 2. Relational integrity', '');
  if (integrity.length === 0) {
    lines.push('No broken relations detected.', '');
  } else {
    lines.push('| # | Error | Repository | Scope | Source path | Reference |', '|---:|---|---|---|---|---|');
    integrity.forEach((error, index) => {
      const label = error.type === 'missing-issue' ? 'Missing issue' : 'Missing pull request';
      lines.push(`| ${index + 1} | ${label} | ${md(error.repository)} | ${md(error.scope)} | \`${md(error.sourcePath)}\` | \`${md(error.referenceId)}\` |`);
    });
    lines.push('');
    integrity.forEach((error, index) => {
      const label = error.type === 'missing-issue' ? 'missing issue' : 'missing pull request';
      lines.push(`### Integrity error ${index + 1}: ${label}`, '');
      lines.push(`- **Repository:** \`${error.repository}\``);
      lines.push(`- **Scope:** \`${error.scope}\``);
      lines.push(`- **Source entity:** \`${error.sourceId}\``);
      lines.push(`- **Source path:** \`${error.sourcePath}\``);
      lines.push(`- **Referenced ID:** \`${error.referenceId}\``);

      if (trace) {
        const sourceEntity = trace.entities.find(entity => entity.anonymizedId === error.sourceId);
        const relation = trace.relations.find(item => item.anonymizedSourceId === error.sourceId && item.anonymizedReferenceId === error.referenceId);
        lines.push('', '#### RAW traceability', '');
        lines.push(`- **RAW source file:** \`${trace.source.file}\``);
        lines.push(`- **RAW source path:** \`${sourceEntity?.sourcePath ?? 'not found in trace'}\``);
        lines.push(`- **RAW source entity ID:** \`${md(sourceEntity?.sourceId ?? 'not found in trace')}\``);
        lines.push(`- **RAW referenced ID:** \`${md(relation?.sourceReferenceId ?? 'not found in trace')}\``);
        lines.push(`- **Referenced entity in RAW:** ${relation?.targetStatus === 'present-in-source' ? 'present' : 'missing'}${relation?.targetSourceId ? ` (\`${md(relation.targetSourceId)}\`)` : ''}`);
      }

      lines.push('', '**Anonymized source object:**', '', '```json', json(error.source), '```', '');
    });
  }

  lines.push('## 3. Interpretation', '');
  lines.push(
    '- A **suspicious string** means the scanner found a URL, email, token, bearer token, or phone-like value in the fixture.',
    '- ISO timestamps are structured date values and are excluded from phone detection; phone-like values embedded in free-form text remain detectable.',
    '- An **integrity error** means a relationship points to an entity that is not present in the same repository scope. A `cross-repository` scope means the referenced entity exists elsewhere in the fixture.',
    '- The JSON path and source value above identify the exact fixture element that triggered each finding.',
    '- The optional RAW trace manifest maps anonymized entities to source-file paths and source IDs. It is intentionally local and must not be committed or distributed.'
  );

  return `${lines.join('\n')}\n`;
}
