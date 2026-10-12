# Design System Quality Pipeline

Ce projet aide à suivre la qualité de plusieurs librairies de Design System à partir de leurs repositories GitHub : issues, PR, composants, versions et audits. Il lit GitHub sans le modifier.

Le pipeline collecte les données, les normalise, contrôle leur qualité, calcule les indicateurs et enregistre un snapshot. Un dashboard HTML permet ensuite de consulter les résultats. Une information inconnue reste signalée ; elle n’est pas remplacée par zéro ou par « conforme ».

## Première exécution, sans GitHub

Installer Node.js **22.15.0 minimum** (référence : **22.23.3**, dans `.nvmrc`) et npm, puis ouvrir un terminal à la racine du dépôt.

```powershell
npm.cmd ci
npm.cmd run pipeline -- --source fixture
npm.cmd run dashboard:serve
```

Ouvrir [le dashboard local](http://127.0.0.1:4174/). Arrêter le serveur avec `Ctrl+C`. La fixture de démonstration ne demande aucun token et ne fait aucun appel GitHub. Sous Linux/macOS, utiliser `npm` à la place de `npm.cmd`.

Le [guide débutant pas à pas](docs/08-implementation/guide-utilisation.md) explique l’installation, la configuration, les options, la collecte GitHub et les sorties.

## Choisir une commande

Les options npm passent après `--`. Exemple : `npm.cmd run collect -- --source fixture --output data/raw/demo.json`.

| Script                                 | Objectif et principales options                                                                           | Documentation                                                                                                |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `pipeline`                             | Collecter, analyser et générer toutes les sorties. `--source fixture\|github`, `--fixture <fichier>`      | [Exécuter](docs/08-implementation/guide-utilisation.md#3-exécuter-et-comprendre-les-sorties)                 |
| `collect`                              | Enregistrer seulement le RAW. `--source`, `--fixture`, **`--output <fichier>` obligatoire**               | [Collecter](docs/08-implementation/guide-utilisation.md#5-collecter-les-données-github)                      |
| `validate`                             | Vérifier une fixture et ses configurations. `--fixture`                                                   | [Configurer](docs/08-implementation/configurations-et-tests.md)                                              |
| `analyze`, `snapshot`, `dashboard`     | Rejouer le pipeline complet avec une synthèse adaptée. Mêmes options de source que `pipeline`             | [Comprendre ces commandes](docs/08-implementation/guide-utilisation.md#3-exécuter-et-comprendre-les-sorties) |
| `dashboard:serve`                      | Servir le dashboard local ; chemin facultatif après `--`                                                  | [Consulter](docs/08-implementation/guide-utilisation.md#4-consulter-le-dashboard)                            |
| `dashboard:preview`                    | Prévisualiser un snapshot dans un dossier isolé ; chemin du snapshot facultatif                           | [Prévisualiser](docs/08-implementation/guide-utilisation.md#4-consulter-le-dashboard)                        |
| `fixture:prepare`, `fixture:anonymize` | Anonymiser un RAW et générer ses profils. `--input`, `--output`, `--anonymize-components`                 | [Anonymiser](docs/08-implementation/guide-utilisation.md#6-anonymiser-et-valider-un-jeu-de-données)          |
| `fixture:validate`                     | Vérifier l’anonymisation. `--input`, `--report`, `--trace`                                                | [Valider](docs/08-implementation/fixtures.md)                                                                |
| `reference:prepare`                    | Préparer une référence et ses profils cohérents. `--input`, `--name`, `--anonymize-components`, `--force` | [Références](docs/08-implementation/preparation-references.md)                                               |
| `diagnose:history`                     | Diagnostiquer les historiques d’un RAW local. `--raw`, `--fixture`, `--live`, `--sample`                  | [Diagnostic](docs/08-implementation/diagnostic-historique-github.md)                                         |
| `test`, `check`, `check:dashboard`     | Vérifier le code ; `check:dashboard` ajoute navigateur, format et TypeDoc                                 | [Développer](docs/08-implementation/guide-developpement.md)                                                  |

Les commandes de collecte acceptent aussi `--system-config` et `--catalogue-config`, à fournir ensemble. Pour GitHub, elles acceptent `--wait-for-quota`, `--rest-quota-reserve`, `--graphql-quota-reserve` et `--quota-max-wait`. Par défaut, atteindre la réserve interrompt la collecte ; l’attente automatique est facultative. Voir la [gestion des quotas](docs/08-implementation/quotas-github.md).

## Résultats et limites

La console affiche une synthèse en français : statut, compteurs, réserves de qualité et chemins des fichiers. Les données détaillées sont enregistrées dans `data/current/snapshot.json`, l’historique dans `data/runs/` et les pages dans `data/dashboard/`.

Un statut **partiel** signifie que le traitement a terminé avec des réserves Data Quality. Un échec de collecte, notamment un quota insuffisant, produit un code de sortie non nul et ne génère pas de nouveau snapshot. Les sorties précédentes restent présentes : consulter le résultat de la commande avant de les considérer comme une nouvelle collecte.

Le dashboard comprend six espaces : Vue d’ensemble, Accessibilité, Activité des équipes, Composants et versions, Historique et Qualité des données. Les calculs sont faits dans le pipeline. Les bugs normalisés ne sont pas tous des anomalies d’accessibilité ; les données inconnues et les recherches GitHub approchées restent explicites. Voir les [populations et comportements des vues](docs/08-implementation/dashboard-role-refactor.md) et la [cohérence des statuts et délais](docs/08-implementation/dashboard-coherence.md).

## Aller plus loin

- [Index et gouvernance documentaire](docs/README.md) : décisions établies, implémentation et écarts.
- [Configurations, sources et jeux de test](docs/08-implementation/configurations-et-tests.md).
- [Audits et règles métier](docs/01-metier/audits.md), [indicateurs](docs/04-indicateurs/catalogue-indicateurs.md), [plan V1](docs/08-implementation/plan-implementation-v1.md).
- [Périmètre des versions](docs/08-implementation/perimetre-versions.md), [refonte visuelle](docs/08-implementation/dashboard-ui-redesign.md), [rapport de consolidation](docs/08-implementation/dashboard-consolidation-complete.md).
- [Consignes Codex/Copilot](docs/08-implementation/codex-copilot-vscode.md) et [releases automatiques](docs/08-implementation/releases-automatiques.md).

Les tokens, `.env`, RAW réels, graines privées et traces d’anonymisation restent locaux. Ne pas les versionner ni les partager. Le projet utilise Node.js, TypeScript strict et ESM ; les sources métier initiales sont conservées dans `specifications/`, distinctes de la documentation courante.
