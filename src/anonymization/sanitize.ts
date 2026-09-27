const EMAIL=/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const GITHUB_TOKEN=/(?:gh[pousr]|github_pat)_[A-Za-z0-9_]{20,}/g;
const URL=/https?:\/\/[^\s)]+/gi;
const BEARER=/Bearer\s+[A-Za-z0-9._-]+/gi;
const PHONE=/(?:\+?\d[\d .-]{7,}\d)/g;
export interface SanitizeOptions { strictText:boolean; preserveComponentNames:boolean; }
export function sanitizeText(value:string,options:SanitizeOptions):{value:string;changed:boolean} { if(options.strictText) return {value:'[anonymized]',changed:value!=='[anonymized]'}; let next=value.replace(GITHUB_TOKEN,'[token-redacted]').replace(BEARER,'Bearer [redacted]').replace(EMAIL,'[email-redacted]').replace(PHONE,'[phone-redacted]').replace(URL,'[url-redacted]'); return {value:next,changed:next!==value}; }
export function findSuspiciousStrings(value:string):string[] { const f:string[]=[]; if(EMAIL.test(value))f.push('email'); EMAIL.lastIndex=0; if(GITHUB_TOKEN.test(value))f.push('github-token'); GITHUB_TOKEN.lastIndex=0; if(BEARER.test(value))f.push('bearer-token'); BEARER.lastIndex=0; if(PHONE.test(value))f.push('phone'); PHONE.lastIndex=0; if(URL.test(value))f.push('url'); URL.lastIndex=0; return f; }
