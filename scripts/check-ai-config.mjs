import process from 'node:process';
import { fileURLToPath, URL } from 'node:url';
import { checkAiConfiguration } from './ai-config.mjs';

const errors = checkAiConfiguration(fileURLToPath(new URL('../', import.meta.url)));
if (errors.length) {
  process.stderr.write(errors.join('\n') + '\n');
  process.exitCode = 1;
} else {
  process.stdout.write('Kit IA valide : métadonnées, tâches, chemins, liens et index D/Q.\n');
}
