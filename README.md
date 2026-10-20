# Design System Quality Pipeline

Collecter des repositories GitHub, préparer un dataset autonome et rejouer son dashboard hors réseau. GitHub reste en lecture seule. Les conventions DSQ sont livrées dans `config/profiles/dsq.json` ; les informations absentes restent inconnues.

Le **[guide d’utilisation unique](docs/08-implementation/guide-utilisation.md)** regroupe les commandes, toutes leurs options, les fichiers requis et les recettes : dashboard GitHub à jour, rejeu privé, jeu anonymisé, catalogues et historiques.

## Démarrer sans GitHub

Le [diagnostic des calculs d’audit (#49)](docs/08-implementation/issue-49-audit-diagnostic.md) distingue la campagne courante, les relations parent collectées et les preuves historiques nécessaires aux verdicts par version.

Les [conventions d’affichage du dashboard](docs/08-implementation/dashboard-coherence.md#référentiel-commun) précisent notamment les tris des tableaux et répartitions.

Node.js >= 22.15.0, référence 22.23.3 dans `.nvmrc`.

```powershell
npm.cmd ci
npm.cmd run pipeline
npm.cmd run dashboard:serve
```

Ouvrir [le dashboard local](http://127.0.0.1:4174/). La démonstration utilise uniquement `examples/demo/dataset.json` et écrit dans `data/output/demo/`. Elle est distincte des références de tests et de vos collectes.

Chaque génération produit désormais **les deux présentations**, sans option supplémentaire : une [vue synthétique et une vue détaillée](docs/08-implementation/dashboard-double-presentation.md). L’accueil permet de choisir et de changer de vue. Les données et les verdicts sont communs.

## Partir d’une liste de dépôts

Créer `repositories.json` :

```json
["mon-organisation/librairie-react", "mon-organisation/librairie-web"]
```

Fournir `GITHUB_TOKEN` dans le shell ou dans `.env`, puis :

Pour GitHub Enterprise, consulter la [configuration des endpoints et des liens web](docs/08-implementation/guide-utilisation.md#3-collecter-vos-repositories) avant la collecte.

Les appels GitHub utilisent le transport Octokit ; la pagination, les quotas et les reprises restent pilotés par le pipeline. Le [bilan de l’intégration (#72)](docs/08-implementation/octokit.md) explique ses bénéfices et les limites concernant les performances et la consommation de quota.

```powershell
npm.cmd run collect -- --repositories repositories.json --output data/local/mon-jeu/raw.json
npm.cmd run fixture:prepare -- --input data/local/mon-jeu/raw.json --output datasets/mon-jeu
npm.cmd run fixture:validate -- --dataset datasets/mon-jeu
npm.cmd run pipeline -- --dataset datasets/mon-jeu --output data/output/mon-jeu
npm.cmd run dashboard:serve -- data/output/mon-jeu/dashboard
```

Pour consulter les identités réelles et leurs liens GitHub, le RAW contextualisé est également rejouable hors réseau : `npm.cmd run pipeline -- --dataset data/local/mon-jeu/raw.json --output data/output/mon-jeu-local`. Ces sorties restent privées ; la graine locale n’est pas copiée dans le snapshot ou le dashboard.

Aucun `system.yaml`, `catalogue.yaml` ou fichier V1 n’est à fabriquer. La capture conserve une graine privée générée localement, utilisée automatiquement par la préparation et exclue du dataset partageable. `ANONYMIZATION_SEED` permet de choisir une graine stable pour plusieurs collectes. La préparation produit `dataset.json` et `manifest.json` dans un dossier autonome, contrôle les relations avant publication et refuse une destination existante. Sans `--catalogue`, elle crée aussi `<chemin-du-RAW>.catalogue.draft.yaml`, un brouillon privé à compléter ; les métadonnées métier ne sont pas inventées. Après revue et retrait de `draft: true`, fournir ce catalogue avec `--catalogue` pour préparer un nouveau dataset enrichi. Voir [les étapes et précautions](docs/08-implementation/datasets.md#enrichissements-facultatifs).

## Commandes

| Script                             | Fonction                                                                                                                                           |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `collect`                          | Capturer GitHub depuis une liste JSON de repositories, avec le profil DSQ livré et les [options de quota](docs/08-implementation/quotas-github.md) |
| `fixture:prepare`                  | Préparer depuis un RAW ou enrichir une fixture ; `--input` et `--output` requis ; catalogues facultatifs                                           |
| `fixture:validate`                 | Contrôler le dataset et exécuter son pipeline dans un dossier temporaire ; `--dataset`                                                             |
| `pipeline`                         | Rejouer le dataset hors réseau ; `--dataset`, `--output` ; démonstration par défaut                                                                |
| `dashboard:serve`                  | Consulter le dashboard local ; dossier facultatif après `--`                                                                                       |
| `test`, `check`, `check:dashboard` | Vérifier le code avec des scénarios versionnés dans `tests/fixtures`, sans collecte préalable                                                      |

`analyze`, `snapshot`, `dashboard`, `validate`, `fixture:anonymize`, `reference:prepare`, `catalogue:generate` et `system:generate` sont supprimés. Le [guide de migration et le contrat des datasets](docs/08-implementation/datasets.md) décrivent le nouveau parcours.

Pour suivre la présence et la qualité des composants par version, `fixture:prepare --historical-catalogue <fichier.yaml>` embarque un référentiel historique. Une fixture existante peut être enrichie en fournissant son `dataset.json` avec `--input`, vers un nouveau dossier, sans réanonymiser ses faits. Voir le [parcours historique et ses règles d'identité](docs/08-implementation/datasets.md#historique-des-composants-par-version).

## Données et tests

Les cartes d’accessibilité affichent l’unité, la population et les réserves près de chaque KPI, y compris après filtrage. Voir le [contrat de présentation](docs/08-implementation/dashboard-coherence.md#présentation-des-kpi-daccessibilité-79).

Le bandeau des versions indique les PROD réellement démontrées par repository pour la couverture/conformité et précise le périmètre des anomalies. Sans tag PROD exact, les ratios courants restent indisponibles ; une sélection explicite distingue développement et publication non démontrée. Voir le [contrat des versions PROD](docs/08-implementation/dashboard-coherence.md#versions-prod-réellement-évaluées-80).

Dans « Composants et versions », les compteurs distinguent composants visibles, sélection et issues distinctes. Les règles de filtrage et les états sans données sont décrits dans le [contrat des compteurs](docs/08-implementation/dashboard-coherence.md#compteurs-de-lexplorateur-composants-78).

Le [parcours Composants](docs/08-implementation/components-workflow.md) utilise un seul périmètre repository/composant/version. La recherche locale affine ce résultat ; « Réinitialiser la vue » efface aussi la sélection et les filtres. Le tableau précède les délais et l’aide détaillée, dépliables au clavier.

Le [contrat des populations](docs/08-implementation/component-populations.md) distingue identités historiques, actifs, présences par version, couples couverts et conformes. Le détail nominatif dans Audits et conformité expose les identités, alias, preuves et exclusions ; les effectifs et formules restent inchangés.

Le dashboard est destiné aux PC. Les tests navigateur couvrent l’usage desktop, l’accessibilité et les interactions au clavier et à la souris ; les scénarios mobiles ont été retirés (#74). Voir le [périmètre des validations](docs/08-implementation/tests.md#validation-intégrale-du-dashboard).

Les tableaux utilisent une typographie courante, des nombres alignés et un défilement au clavier. Voir la [revue de lisibilité PC et ses captures à 200 %](docs/08-implementation/dashboard-table-readability.md).

`npm run benchmark:dashboard -- --scenario control --runs 3 --output data/output/benchmarks/control-before` mesure un jeu entièrement synthétique (parent à créer, sortie neuve). Le scénario `load`, les rapports par page et les budgets validés sans croissance sont décrits dans le [protocole de benchmark PC](docs/08-implementation/dashboard-benchmark.md).

Le dashboard embarque un [JSON versionné propre à chaque page](docs/07-decisions/ADR-005-modeles-lecture-dashboard.md), sans snapshot complet ni RAW. Les filtres et CSV conservent leurs faits et qualifications ; les anciennes captures compatibles sont projetées sans réécriture. Distribuer le dossier complet avec ses assets et le servir en HTTP ; une erreur de contrat est signalée explicitement.

Activité et Qualité des données affichent 50 lignes par page. Filtres, tris et CSV portent sur tous les résultats ; la sélection d’Activité sert aux KPI et couvre les issues distinctes de toutes les pages filtrées. Voir le [contrat de pagination et ses mesures](docs/08-implementation/dashboard-pagination.md).

Qualité des données regroupe les occurrences par cause, sévérité et impacts, avec une prochaine vérification lorsqu'elle est documentée et une source résolue. Chaque groupe ouvre ses occurrences et leur export complet ; ces décomptes décrivent la fiabilité des données. Voir le [contrat des causes DQ](docs/08-implementation/dashboard-quality-causes.md).

Près du titre, la capture est datée en UTC, le périmètre partagé suit les filtres et la fiabilité globale donne accès aux diagnostics et à leurs preuves. Une capture récente peut être partielle ; un résultat non conforme peut être fiable. Voir le [contrat du résumé de capture](docs/08-implementation/dashboard-coherence.md#résumé-de-capture-près-du-titre-89).

Pour un RAW non anonymisé, `pipeline --dataset <raw.json> --historical-catalogue <identites.yaml> --historical-repository <owner/repository>` importe l'historique local sans passer par `fixture:prepare`. Le fichier d'identités désigne son référentiel de présences via `historicalCatalogue`. Voir le [parcours local détaillé](docs/08-implementation/datasets.md#collecte-non-anonymisée--historique-local-et-fichier-didentités).

Le dashboard propose **Activité des équipes → Suivi des Epics** : choix d'une Epic, durées calendaires par composant/issue et export CSV. Une nouvelle collecte est nécessaire pour récupérer les mentions présentes dans les descriptions. Voir [le contrat et les limites du suivi](docs/08-implementation/dashboard-coherence.md#suivi-des-epics-69).

Les tests utilisent leurs propres références stables ; modifier une collecte ou la démonstration ne les remplace pas. `fixture:validate` contrôle votre dataset, tandis que `npm test` vérifie le logiciel. Une réserve Data Quality peut rendre le dashboard partiel sans invalider la structure du dataset. Les sorties sont écrites dans le dossier choisi, avec un historique limité aux scopes et versions compatibles. Les faits RAW ne sont pas réécrits par le pipeline.

Les tokens, graines, captures et correspondances restent locaux. Les dossiers `data/local/`, `data/output/` et `datasets/` sont ignorés par Git. Une fixture préparée nécessite une revue avant partage : labels, types, statuts et tags métier peuvent conserver des informations sensibles.

- [Guide débutant](docs/08-implementation/guide-utilisation.md)
- [Datasets et migration](docs/08-implementation/datasets.md)
- [Tests et configurations](docs/08-implementation/configurations-et-tests.md)
- [Documentation métier et gouvernance](docs/README.md)
- [Développer](docs/08-implementation/guide-developpement.md)

Les compteurs restent figés à la date du snapshot. Dans les tableaux de repositories et de composants, « GitHub actuel ≈ » ouvre une recherche actuelle et approchée : son résultat peut différer du compteur et ne le justifie pas. Les [liens d’entités résolues](docs/08-implementation/dashboard-links.md) ouvrent leur issue ou PR ; une référence non résolue reste du texte.

## Revue métier des bugs et corrections

Les [décisions et conventions de labels du 19 octobre 2026](docs/08-implementation/validation-metier-20261019.md) distinguent bugs fonctionnels, accessibilité, améliorations, corrections confirmées et vérification par audit. Le rejeu accepte `--issue-policy config/issue-policy.example.json`, sans modifier les JSON sources. Les filtres de la page Activité permettent notamment de retrouver les issues sans Project, sans audit, sans composant ou demandant un avis auditeur.
