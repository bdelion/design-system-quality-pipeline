const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const GITHUB_TOKEN = /(?:gh[pousr]|github_pat)_[A-Za-z0-9_]{20,}/g;
const URL = /https?:\/\/[^\s)]+/gi;
const BEARER = /Bearer\s+[A-Za-z0-9._-]+/gi;
const PHONE = /(?:\+?\d[\d .-]{7,}\d)/g;
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:?\d{2})$/;

export interface SanitizeOptions { strictText: boolean; preserveComponentNames: boolean; }

function reset(re: RegExp): RegExp { re.lastIndex = 0; return re; }

/**
 * Phone detection is intentionally disabled for ISO timestamps. The generic
 * phone regexp also matches date/time separators (e.g. 2025-09-28T09:50:53).
 * Free-form text remains fully scanned for phone-like values.
 */
function containsPhone(value: string): boolean {
  if (ISO_TIMESTAMP.test(value.trim())) return false;
  return reset(PHONE).test(value);
}

export function sanitizeText(value: string, options: SanitizeOptions): { value: string; changed: boolean } {
  if (options.strictText) return { value: '[anonymized]', changed: value !== '[anonymized]' };
  let next = value
    .replace(reset(GITHUB_TOKEN), '[token-redacted]')
    .replace(reset(BEARER), 'Bearer [redacted]')
    .replace(reset(EMAIL), '[email-redacted]')
    .replace(reset(PHONE), '[phone-redacted]')
    .replace(reset(URL), '[url-redacted]');
  return { value: next, changed: next !== value };
}

export function findSuspiciousStrings(value: string): string[] {
  const findings: string[] = [];
  if (reset(EMAIL).test(value)) findings.push('email');
  if (reset(GITHUB_TOKEN).test(value)) findings.push('github-token');
  if (reset(BEARER).test(value)) findings.push('bearer-token');
  if (containsPhone(value)) findings.push('phone');
  if (reset(URL).test(value)) findings.push('url');
  return findings;
}
