# Design System Quality Pipeline

Collecter des repositories GitHub, préparer un dataset autonome et rejouer son dashboard hors réseau. GitHub reste en lecture seule. Les conventions DSQ sont livrées dans `config/profiles/dsq.json` ; les informations absentes restent inconnues.

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

## Partir d’une liste de dépôts

Créer `repositories.json` :

```json
["mon-organisation/librairie-react", "mon-organisation/librairie-web"]
```

Fournir `GITHUB_TOKEN` dans le shell ou dans `.env`, puis :

Pour GitHub Enterprise, consulter la [configuration des endpoints et des liens web](docs/08-implementation/guide-utilisation.md#3-collecter-vos-repositories) avant la collecte.

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
| `fixture:prepare`                  | Préparer atomiquement le dataset depuis le RAW ; `--input`, `--output`, graine privée ; `--catalogue` facultatif                                   |
| `fixture:validate`                 | Contrôler le dataset et exécuter son pipeline dans un dossier temporaire ; `--dataset`                                                             |
| `pipeline`                         | Rejouer le dataset hors réseau ; `--dataset`, `--output` ; démonstration par défaut                                                                |
| `dashboard:serve`                  | Consulter le dashboard local ; dossier facultatif après `--`                                                                                       |
| `test`, `check`, `check:dashboard` | Vérifier le code avec des scénarios versionnés dans `tests/fixtures`, sans collecte préalable                                                      |

`analyze`, `snapshot`, `dashboard`, `validate`, `fixture:anonymize`, `reference:prepare`, `catalogue:generate` et `system:generate` sont supprimés. Le [guide de migration et le contrat des datasets](docs/08-implementation/datasets.md) décrivent le nouveau parcours.

## Données et tests

Les tests utilisent leurs propres références stables ; modifier une collecte ou la démonstration ne les remplace pas. `fixture:validate` contrôle votre dataset, tandis que `npm test` vérifie le logiciel. Une réserve Data Quality peut rendre le dashboard partiel sans invalider la structure du dataset. Les sorties sont écrites dans le dossier choisi, avec un historique limité aux scopes et versions compatibles. Les faits RAW ne sont pas réécrits par le pipeline.

Les tokens, graines, captures et correspondances restent locaux. Les dossiers `data/local/`, `data/output/` et `datasets/` sont ignorés par Git. Une fixture préparée nécessite une revue avant partage : labels, types, statuts et tags métier peuvent conserver des informations sensibles.

- [Guide débutant](docs/08-implementation/guide-utilisation.md)
- [Datasets et migration](docs/08-implementation/datasets.md)
- [Tests et configurations](docs/08-implementation/configurations-et-tests.md)
- [Documentation métier et gouvernance](docs/README.md)
- [Développer](docs/08-implementation/guide-developpement.md)
