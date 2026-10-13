/** Déclare les quatre commandes du parcours autonome, sans résolution implicite de profils. */
import { Command, InvalidArgumentError } from 'commander';
import { collectRepositories, prepareDataset, readDatasetJson } from './datasets.js';
import { runPipeline, pipelineStatus } from './pipeline.js';
import { pipelineSummary } from './lib/cli-output.js';
import { validateGithubQuotaOptions, type GithubQuotaOptions } from './collectors/github-requests.js';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** Analyse un entier de quota sans troncature ni valeur négative. */
function quotaInteger(value: string): number {
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)))
    throw new InvalidArgumentError('Un entier positif ou nul est requis.');
  return Number(value);
}

const program = new Command()
  .name('design-system-quality')
  .description('Collecter, préparer, vérifier et rejouer un dataset autonome DSQ.')
  .version('0.1.0');
program
  .command('collect')
  .requiredOption('--repositories <file>', 'fichier JSON contenant une liste owner/repository')
  .requiredOption('--output <file>', 'nouveau fichier RAW local')
  .option('--wait-for-quota', 'attendre le reset des quotas')
  .option('--rest-quota-reserve <points>', 'réserve REST', quotaInteger, 100)
  .option('--graphql-quota-reserve <points>', 'réserve GraphQL', quotaInteger, 100)
  .option('--quota-max-wait <seconds>', 'attente cumulée maximale', quotaInteger, 7200)
  .action(async (options: GithubQuotaOptions & { repositories: string; output: string }) => {
    validateGithubQuotaOptions(options);
    const list = await readDatasetJson(options.repositories);
    if (!Array.isArray(list) || !list.every((name) => typeof name === 'string'))
      throw new Error('La liste des repositories doit être un tableau JSON de noms owner/repository.');
    const raw = await collectRepositories(list, options.output, options);
    console.log(
      `Collecte terminée : ${raw.repositories.length} repositories ; ${raw.repositories.reduce((n, repo) => n + repo.issues.length, 0)} issues.\nFichier RAW : ${options.output}`
    );
  });
program
  .command('fixture:prepare')
  .requiredOption('--input <file>', 'RAW local collecté ou dataset.json d’une fixture existante')
  .requiredOption('--output <directory>', 'nouveau dossier du dataset autonome')
  .option('--seed <seed>', 'remplacer la graine locale de la capture', process.env.ANONYMIZATION_SEED)
  .option('--catalogue <file>', 'enrichissement métier facultatif YAML')
  .option('--historical-catalogue <file...>', 'référentiels historiques YAML, un par dépôt')
  .option('--anonymize-components', 'pseudonymiser aussi les composants et leurs labels préfixés')
  .action(
    async (options: {
      input: string;
      output: string;
      seed?: string;
      catalogue?: string;
      historicalCatalogue?: string[];
      anonymizeComponents?: boolean;
    }) => {
      const dataset = await prepareDataset(
        options.input,
        options.output,
        options.seed ?? '',
        options.catalogue,
        options.anonymizeComponents ?? false,
        options.historicalCatalogue ?? []
      );
      console.log(
        `Dataset préparé : ${dataset.rawData.repositories.length} repositories.\nDataset : ${options.output}\n${dataset.historicalComponents?.length ? `Historiques embarqués : ${dataset.historicalComponents.length}.\n` : ''}${options.catalogue || options.input.endsWith('dataset.json') ? '' : `Brouillon de catalogue (créé ou conservé) : ${options.input}.catalogue.draft.yaml\nBrouillon privé à compléter ; refusé tant que draft: true.\n`}Revue humaine requise avant partage.`
      );
    }
  );
program
  .command('fixture:validate')
  .requiredOption('--dataset <path>', 'dossier autonome ou dataset de démonstration')
  .action(async (options: { dataset: string }) => {
    const temporary = await mkdtemp(join(tmpdir(), 'dsq-check-dataset-'));
    try {
      const snapshot = await runPipeline(options.dataset, temporary);
      console.log(
        `Dataset valide : schéma, périmètre et relations contrôlés ; pipeline exécuté hors réseau.\nQualité des données : ${snapshot.dataQuality.summary.ERROR} erreur(s), ${snapshot.dataQuality.summary.WARNING} avertissement(s).`
      );
    } finally {
      await rm(temporary, { recursive: true, force: true });
    }
  });
program
  .command('pipeline')
  .option('--dataset <path>', 'dataset autonome à rejouer', 'examples/demo/dataset.json')
  .option('--output <directory>', 'sorties isolées du dataset', 'data/output/demo')
  .option('--historical-catalogue <file...>', 'référentiels historiques ou fichiers d’identités locaux')
  .option(
    '--historical-repository <owner/repository>',
    'affectation explicite du seul historique au dépôt réel du RAW'
  )
  .action(
    async (options: {
      dataset: string;
      output: string;
      historicalCatalogue?: string[];
      historicalRepository?: string;
    }) => {
      const snapshot = await runPipeline(
        options.dataset,
        options.output,
        options.historicalCatalogue ?? [],
        options.historicalRepository
      );
      console.log(pipelineSummary(snapshot, 'Pipeline', pipelineStatus(snapshot), options.output));
    }
  );
await program.parseAsync().catch((error: unknown) => {
  console.error('Erreur : ' + (error instanceof Error ? error.message : 'traitement interrompu.'));
  process.exitCode = 1;
});
