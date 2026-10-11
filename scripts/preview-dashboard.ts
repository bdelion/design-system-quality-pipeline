/** Génère une prévisualisation isolée sans réécrire le snapshot ou le dashboard opérationnel. */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Snapshot } from '../src/domain/types.js';
import { rootPath } from '../src/lib/paths.js';
import { generateDashboard } from '../src/dashboard/generate.js';
import { workspaceModel } from '../src/dashboard/workspaces.js';
import { accessibilityReviewCsv } from '../src/analytics/workspaces.js';

const input = resolve(process.argv[2] ?? resolve(rootPath, 'data/current/snapshot.json'));
const output = resolve(rootPath, 'data/dashboard-refactor-preview');
const snapshot = JSON.parse(await readFile(input, 'utf8')) as Snapshot;
await generateDashboard(snapshot, output);
const model = workspaceModel(snapshot);
await writeFile(resolve(output, 'accessibility-review.csv'), accessibilityReviewCsv(model.review), 'utf8');
console.log(`PREVIEW ${resolve(output, 'dashboard/index.html')}`);
console.log(
  `REVIEW ${model.review.length} issues sans label combiné à examiner ; ${model.rows.filter((row) => row.qualification.status === 'presumed').length} présomptions.`
);
