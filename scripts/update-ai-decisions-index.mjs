import fs from 'node:fs/promises';
import process from 'node:process';
import { fileURLToPath, URL } from 'node:url';
import { format, resolveConfig } from 'prettier';
import { renderDecisionIndex } from './ai-config.mjs';

const source = fileURLToPath(new URL('../docs/00-cadrage/questions-ouvertes.md', import.meta.url));
const target = fileURLToPath(new URL('../docs/08-implementation/ai-decisions-index.md', import.meta.url));
const registry = await fs.readFile(source, 'utf8');
const content = await format(renderDecisionIndex(registry), {
  ...(await resolveConfig(target)),
  filepath: target
});
await fs.writeFile(target, content, 'utf8');
process.stdout.write('Index D/Q régénéré ; registre normatif inchangé.\n');
