/** Removes generated build and run artifacts without touching source datasets. */
import { rm } from 'node:fs/promises';

/** Paths exclusively owned by build/run commands. */
const generatedPaths = ['dist', 'data/runs'];

await Promise.all(generatedPaths.map((path) => rm(path, { recursive: true, force: true })));
