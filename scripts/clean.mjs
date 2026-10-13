/** Nettoie uniquement le build ; conserve les captures, datasets et historiques personnels. */
import { rm } from 'node:fs/promises';

/** Répertoire exclusivement produit par la compilation. */
const generatedPaths = ['dist'];

await Promise.all(generatedPaths.map((path) => rm(path, { recursive: true, force: true })));
