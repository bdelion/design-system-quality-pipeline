import { Command } from 'commander';
import { readdir, readFile, mkdir, writeFile, rename, rm, mkdtemp } from 'node:fs/promises';
import { resolve, join, dirname, basename } from 'node:path';
import { stringify } from 'yaml';
import { importComponentComparison } from '../src/component-comparison.js';

/** Génère un dossier neuf de référentiels historiques depuis les classeurs locaux. */
async function main(): Promise<void> {
  const program = new Command()
    .description('Convertir tous les exports des *_component_comparison.xlsx en historiques DSQ.')
    .option('--input <directory>', 'dossier des classeurs', '.tmp')
    .requiredOption('--output <directory>', 'nouveau dossier de sortie')
    .option('--repositories <file>', 'objet JSON associant les noms de librairies aux owner/repository');
  program.parse();
  const options = program.opts<{ input: string; output: string; repositories?: string }>();
  const mapping: unknown = options.repositories
    ? JSON.parse(await readFile(options.repositories, 'utf8'))
    : {};
  if (
    !mapping ||
    typeof mapping !== 'object' ||
    Array.isArray(mapping) ||
    Object.values(mapping).some((value) => typeof value !== 'string' || !value.trim())
  )
    throw new Error('Mapping repositories invalide : objet de chaînes non vides attendu.');
  const repositories = mapping as Record<string, string>;
  const files = (await readdir(options.input))
    .filter((file) => file.endsWith('_component_comparison.xlsx'))
    .sort();
  if (!files.length) throw new Error('Aucun fichier *_component_comparison.xlsx trouvé.');
  const imports = await Promise.all(
    files.map(async (file) => {
      const library = file.slice(0, -'_component_comparison.xlsx'.length);
      return {
        library,
        result: await importComponentComparison(
          await readFile(join(options.input, file)),
          file,
          repositories[library] ?? library
        )
      };
    })
  );
  if (new Set(imports.map(({ result }) => result.catalogue.repository)).size !== imports.length)
    throw new Error('Plusieurs classeurs affectés au même repository.');
  const destination = resolve(options.output);
  await mkdir(dirname(destination), { recursive: true });
  const temporary = await mkdtemp(join(dirname(destination), `.${basename(destination)}-`));
  try {
    for (const { library, result } of imports) {
      await writeFile(
        join(temporary, `${library}-historique-composants.yaml`),
        stringify({
          ...result.catalogue,
          source: result.source,
          exports: result.exports,
          importWarnings: result.warnings
        }),
        { flag: 'wx' }
      );
    }
    await writeFile(
      join(temporary, 'rapport.json'),
      JSON.stringify(
        imports.map(({ library, result }) => ({
          library,
          repository: result.catalogue.repository,
          components: result.catalogue.components.length,
          versions: result.catalogue.versions.length,
          source: result.source,
          warnings: result.warnings
        })),
        null,
        2
      ) + '\n'
    );
    // mkdir exclusif protège aussi une destination vide contre un écrasement accidentel.
    await mkdir(destination);
    try {
      for (const file of await readdir(temporary))
        await rename(join(temporary, file), join(destination, file));
    } catch (error) {
      throw new Error('Publication interrompue ; conserver le dossier de sortie pour diagnostic.', {
        cause: error
      });
    }
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
  console.log(
    `${imports.length} référentiels générés dans ${destination}. Consulter rapport.json avant import.`
  );
}

await main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Import interrompu.');
  process.exitCode = 1;
});
