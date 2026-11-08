import { Command } from 'commander';
import { readdir, readFile, mkdir, writeFile, rename, rm, mkdtemp } from 'node:fs/promises';
import { resolve, join, dirname, basename } from 'node:path';
import { createHash } from 'node:crypto';
import { stringify } from 'yaml';
import { importComponentComparison } from '../src/component-comparison.js';

/** Génère un dossier neuf de référentiels historiques depuis les classeurs locaux. */
async function main(): Promise<void> {
  const program = new Command()
    .description('Convertir tous les exports des *_component_comparison.xlsx en historiques DSQ.')
    .option('--input <directory>', 'dossier des classeurs', '.tmp')
    .requiredOption('--output <directory>', 'nouveau dossier de sortie')
    .option('--dependency-catalogs <directory>', 'dossier des catalogues de graphe de dépendances')
    .option('--repositories <file>', 'objet JSON associant les noms de librairies aux owner/repository');
  program.parse();
  const options = program.opts<{
    input: string;
    output: string;
    repositories?: string;
    dependencyCatalogs?: string;
  }>();
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
  const dependencyFiles = options.dependencyCatalogs
    ? new Set(await readdir(options.dependencyCatalogs))
    : new Set<string>();
  const imports = await Promise.all(
    files.map(async (file) => {
      const library = file.slice(0, -'_component_comparison.xlsx'.length);
      const dependencyFile = `${library}-component-dependency-graph.dependencies.catalog.json`;
      const dependencyPath = options.dependencyCatalogs
        ? join(options.dependencyCatalogs, dependencyFile)
        : undefined;
      let dependencyKinds: Map<string, string> | undefined;
      let dependencyNodeCount = 0;
      let dependencyFingerprint: string | undefined;
      if (dependencyPath && dependencyFiles.has(dependencyFile)) {
        dependencyKinds = new Map<string, string>();
        const dependencyBuffer = await readFile(dependencyPath);
        dependencyFingerprint = createHash('sha256').update(dependencyBuffer).digest('hex');
        const parsed: unknown = JSON.parse(dependencyBuffer.toString('utf8'));
        if (!parsed || typeof parsed !== 'object' || !('nodes' in parsed) || !Array.isArray(parsed.nodes))
          throw new Error(`Catalogue de dépendances invalide : ${dependencyFile}`);
        for (const node of parsed.nodes) {
          if (
            !node ||
            typeof node !== 'object' ||
            !('name' in node) ||
            typeof node.name !== 'string' ||
            !('kind' in node) ||
            typeof node.kind !== 'string'
          )
            throw new Error(`Nœud invalide dans le catalogue de dépendances : ${dependencyFile}`);
          dependencyNodeCount++;
          const existing = dependencyKinds.get(node.name);
          if (existing && existing !== node.kind)
            throw new Error(`Nom ambigu dans le catalogue de dépendances : ${dependencyFile}`);
          dependencyKinds.set(node.name, node.kind);
        }
      }
      const result = await importComponentComparison(
        await readFile(join(options.input, file)),
        file,
        repositories[library] ?? library,
        dependencyKinds
      );
      if (options.dependencyCatalogs && !dependencyFiles.has(dependencyFile))
        result.warnings.push(`Catalogue de dépendances absent (${dependencyFile}) ; kind non renseigné.`);
      return {
        library,
        dependencyCatalogue: dependencyPath && dependencyFiles.has(dependencyFile),
        dependencyNodeCount,
        dependencyFile: dependencyFingerprint ? dependencyFile : undefined,
        dependencyFingerprint,
        unmatchedUiNames: dependencyKinds
          ? [...dependencyKinds]
              .filter(([, kind]) => kind === 'ui')
              .map(([name]) => name)
              .filter((name) => !result.exports.some((item) => item.publicNames.includes(name)))
          : [],
        result
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
        imports.map(
          ({
            library,
            result,
            dependencyCatalogue,
            dependencyNodeCount,
            dependencyFile,
            dependencyFingerprint,
            unmatchedUiNames
          }) => ({
            library,
            repository: result.catalogue.repository,
            components: result.catalogue.components.length,
            componentsByKind: Object.fromEntries(
              [
                ...new Set(
                  result.catalogue.components
                    .map((component) => component.kind)
                    .filter((kind): kind is string => typeof kind === 'string')
                )
              ].map((kind) => [
                kind,
                result.catalogue.components.filter((component) => component.kind === kind).length
              ])
            ),
            dependencyCatalogue: dependencyCatalogue ? 'available' : 'missing',
            dependencyNodes: dependencyNodeCount,
            unmatchedUiNames,
            ...(dependencyFile && dependencyFingerprint
              ? { dependencySource: { file: dependencyFile, sha256: dependencyFingerprint } }
              : {}),
            versions: result.catalogue.versions.length,
            source: result.source,
            warnings: result.warnings
          })
        ),
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
