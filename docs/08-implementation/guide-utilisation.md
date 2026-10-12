# Utiliser le pipeline pas à pas

Ce guide s’adresse à une personne qui découvre le projet. Les exemples utilisent PowerShell sous Windows. Sous Linux/macOS, remplacer `npm.cmd` par `npm` et adapter la définition des variables d’environnement.

## 1. Installer et ouvrir le projet

Installer Git, Node.js et npm. Node.js doit être au moins en version **22.15.0** ; le dépôt utilise **22.23.3** comme référence. Avec nvm-windows déjà installé :

```powershell
nvm install 22.23.3
nvm use 22.23.3
node --version
npm.cmd --version
```

Cloner le dépôt, puis se placer dans le dossier qui contient `package.json` :

```powershell
git clone https://github.com/bdelion/design-system-quality-pipeline.git
Set-Location design-system-quality-pipeline
npm.cmd ci
```

`npm ci` installe les dépendances exactes du lockfile. `npm.cmd` évite le blocage éventuel de `npm.ps1` par PowerShell. Aucun token n’est nécessaire à cette étape.

## 2. Comprendre les fichiers de configuration

- `system` déclare le propriétaire GitHub, les repositories à lire et les conventions de labels, types, statuts et versions.
- `catalogue` décrit les composants et leurs métadonnées.
- Une fixture est un fichier de données local utilisé pour exécuter le pipeline sans appeler GitHub.

La démonstration utilise `fixtures/github.json` et les profils `config/system.fixture.yaml` et `config/catalogue.fixture.yaml`. Une fixture nommée `fixtures/<nom>.json` peut avoir sa paire `config/system.<nom>.yaml` et `config/catalogue.<nom>.yaml`. Une paire spécifique incomplète est refusée. Ne pas associer au hasard un dataset et les profils d’un autre jeu de données.

Pour choisir explicitement les profils, fournir **les deux** options ensemble :

```powershell
npm.cmd run validate -- --fixture fixtures/v1-reference.json --system-config config/system.v1-reference.yaml --catalogue-config config/catalogue.v1-reference.yaml
```

Les [configurations et sources](configurations-et-tests.md) expliquent précisément la sélection des profils. La [référence métier V1](plan-implementation-v1.md) reste distincte de la fixture réaliste anonymisée `fixtures/my-real-dataset-anonymized.json`, utile pour les tests d’intégration et de non-régression.

## 3. Exécuter et comprendre les sorties

Commencer sans accès GitHub :

```powershell
npm.cmd run validate
npm.cmd run pipeline -- --source fixture
```

`validate` vérifie le périmètre et les profils. `pipeline` lit la fixture, normalise les données, applique les contrôles Data Quality, calcule les indicateurs et génère les sorties. La console affiche une synthèse française, sans dump JSON ni identifiant technique de snapshot.

| Sortie                       | Objectif                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------ |
| `data/current/snapshot.json` | Résultat détaillé courant : RAW, données normalisées, contrôles et indicateurs |
| `data/runs/`                 | Snapshots historiques utilisés pour les comparaisons                           |
| `data/dashboard/`            | Pages HTML et ressources du dashboard                                          |

Le statut **complet** signifie qu’aucune réserve ERROR/WARNING n’a été détectée. **Partiel** signifie que le traitement a terminé avec des réserves de données ; consulter Qualité des données pour les comprendre. Ces statuts ne prouvent pas que tous les composants sont conformes. Une erreur de collecte interrompt la commande avec un code de sortie non nul avant de produire de nouvelles sorties.

Pour un autre fichier local :

```powershell
npm.cmd run pipeline -- --source fixture --fixture fixtures/v1-reference.json
```

Les commandes `analyze`, `snapshot` et `dashboard` rejouent **actuellement le pipeline complet**, avec une synthèse adaptée à leur nom. Elles ne consomment pas automatiquement un RAW écrit par `collect` et ne sont pas des étapes indépendantes. Pour refaire uniquement la présentation d’un snapshot enregistré, utiliser `dashboard:preview`.

## 4. Consulter le dashboard

```powershell
npm.cmd run dashboard:serve
```

Ouvrir [http://127.0.0.1:4174/](http://127.0.0.1:4174/). Le serveur reste actif jusqu’à `Ctrl+C`. Ouvrir directement le HTML en `file:///` bloque les modules JavaScript ; les filtres sont alors désactivés et un message explique la procédure HTTP.

La Vue d’ensemble est globale. Elle présente les stocks et délais par repository, puis huit cartes. Les autres espaces distinguent accessibilité, activité des équipes, composants/versions, historique et qualité des données. Les nombres inconnus, la qualification des bugs et les recherches GitHub approchées restent visibles. Voir [les populations et filtres](dashboard-role-refactor.md), [les statuts et délais](dashboard-coherence.md) et [les références visuelles](dashboard-ui-redesign.md).

Une prévisualisation ne réécrit pas le snapshot ni le dashboard opérationnel :

```powershell
npm.cmd run dashboard:preview -- data/current/snapshot.json
npm.cmd run dashboard:serve -- data/dashboard-refactor-preview/dashboard
```

Elle produit aussi `data/dashboard-refactor-preview/accessibility-review.csv`, une liste de cas à examiner. Ces fichiers peuvent contenir les identités de la source locale : les relire avant partage.

## 5. Collecter les données GitHub

Si un RAW est déjà disponible, [générer un brouillon système](generation-systeme.md) permet d’extraire son périmètre et les valeurs observées avant de confirmer les conventions de traitement. Cette commande complète `catalogue:generate` ; les deux brouillons nécessitent une revue avant utilisation.

Configurer d’abord le propriétaire, les repositories et les conventions dans `config/system.yaml`, puis les composants dans `config/catalogue.yaml`. Ces fichiers définissent ce qui sera lu et comment les données seront interprétées.

Si un RAW est déjà disponible, `npm.cmd run catalogue:generate -- --input data/raw/collecte.json --output config/local/catalogue.brouillon.yaml` permet de préparer les noms de composants sans catalogue source. Compléter les métadonnées laissées à `null` avant utilisation ; voir [la génération du catalogue](generation-catalogue.md).

Créer un token GitHub autorisé à lire les repositories, contenus, issues, PR et Projects nécessaires. Les permissions exactes dépendent du type de token et du propriétaire des Projects ; voir [la documentation des tokens GitHub](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens). Le programme ne fait aucune mutation GitHub.

Copier `.env.example` vers `.env`, puis renseigner localement `GITHUB_TOKEN` dans un éditeur. `.env` ne doit jamais être committé. Pour GitHub Enterprise, les variables facultatives sont `GITHUB_API_URL`, `GITHUB_GRAPHQL_URL` et `GITHUB_URL`. Si les variables sont déjà fournies par le shell ou la CI, `.env` n’est pas nécessaire.

Pour conserver uniquement un RAW local :

```powershell
npm.cmd run collect -- --source github --output data/raw/collecte.json
```

`--output` est obligatoire pour GitHub **et** les fixtures. Le dossier parent est créé automatiquement. Le chemin du fichier enregistré est affiché après une écriture réussie. Le RAW réel reste local.

Pour collecter et générer les indicateurs et le dashboard en une commande :

```powershell
npm.cmd run pipeline -- --source github
```

Cette commande fait une nouvelle collecte ; elle ne lit pas implicitement `data/raw/collecte.json`. Pour rejouer un RAW réel local sans appels GitHub, utiliser la source `fixture` et ses profils explicites cohérents :

```powershell
npm.cmd run pipeline -- --source fixture --fixture data/raw/collecte.json --system-config config/system.yaml --catalogue-config config/catalogue.yaml
```

Le pré-check protège les quotas REST/GraphQL. Par défaut, la réserve est de 100 points chacun et la collecte s’arrête si elle serait franchie. Pour attendre le reset avec un décompte :

```powershell
npm.cmd run collect -- --source github --output data/raw/collecte.json --wait-for-quota --rest-quota-reserve 100 --graphql-quota-reserve 100 --quota-max-wait 7200
```

La progression reste en mémoire ; fermer le programme impose de recommencer. Les sorties précédentes ne sont pas effacées lors d’un arrêt pour quota : ne pas les confondre avec une nouvelle collecte. Voir [la gestion des quotas et des retries](quotas-github.md).

## 6. Anonymiser et valider un jeu de données

Pour partager une référence, partir d’un RAW local et conserver une graine privée reproductible dans `ANONYMIZATION_SEED`. Ne pas afficher ni partager cette graine. Puis :

```powershell
npm.cmd run fixture:prepare -- --input data/raw/collecte.json --output fixtures/collecte-anonymized.json --anonymize-components
npm.cmd run fixture:validate -- --input fixtures/collecte-anonymized.json
npm.cmd run validate -- --fixture fixtures/collecte-anonymized.json
```

`fixture:prepare` et `fixture:anonymize` sont deux noms de la même commande. Elle transforme les identités, les textes et les dates, et génère les profils associés. `--anonymize-components` pseudonymise aussi les composants. Les paramètres `--seed`, `--date-offset-days`, `--keep-text`, `--config-output` et `--catalogue-output` sont décrits dans [l’anonymisation](anonymisation.md) et [les fixtures](fixtures.md). Une graine passée en argument peut rester dans l’historique du shell : préférer l’environnement.

Le manifeste `.manifest.json` conserve la traçabilité des transformations. La trace `.trace.json` est locale et peut contenir des références réelles ; `--no-trace` désactive sa création et `--trace-output` choisit sa destination. `fixture:validate --report <fichier>` choisit le rapport Markdown ; `--trace <fichier>` enrichit ce rapport. La validation automatisée ne remplace pas une relecture avant partage.

Pour préparer ensemble une référence et ses profils GitHub/fixture, utiliser `reference:prepare --input <raw> --name <nom>`. Les options `--system-config`, `--catalogue-config`, `--anonymize-components` et `--force` sont détaillées dans [la préparation des références](preparation-references.md). `--force` autorise explicitement le remplacement d’artefacts existants.

## 7. Diagnostiquer et vérifier le projet

Le diagnostic d’historique est facultatif :

```powershell
npm.cmd run diagnose:history -- --raw data/raw/collecte.json
```

Il écrit des fichiers sous `data/diagnostics/` et affiche une synthèse, sans dump JSON. `--fixture <fichier>` compare les agrégats locaux ; `--live --sample 20` ajoute un échantillon API. Ce dernier mode effectue de vraies lectures GitHub et utilise le token. Ses limites et fichiers partageables sont précisés dans [le diagnostic d’historique](diagnostic-historique-github.md).

| Script de développement            | Objectif et options principales                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------- |
| `test`                             | Tests automatiques ; un fichier peut être sélectionné après `--`                      |
| `test:watch`                       | Relancer les tests pendant les modifications                                          |
| `typecheck`, `lint`, `check:tsdoc` | Types stricts, règles ESLint et documentation des fonctions                           |
| `build`                            | Compiler TypeScript vers `dist/`                                                      |
| `check`                            | Contrôles IA, types, lint, TSDoc, tests et build                                      |
| `test:browser`                     | Parcours navigateur et accessibilité ; sélection possible avec les options Playwright |
| `format`, `format:check`           | Réécrire le format ou vérifier sans réécriture                                        |
| `docs:api`                         | Générer la documentation TypeDoc sous `docs/api/`                                     |
| `check:dashboard`                  | Ajouter navigateur, format et TypeDoc au contrôle complet                             |
| `check:ai`, `ai:index:update`      | Vérifier le kit IA ; régénérer seulement l’index après modification du registre       |
| `clean`                            | Supprimer les sorties `dist/` et `data/runs/` ; conserver les sources et datasets     |

Les consignes de contribution sont dans le [guide de développement](guide-developpement.md), le [guide Codex/Copilot](codex-copilot-vscode.md) et les `AGENTS.md`. Le [registre métier](../00-cadrage/questions-ouvertes.md) distingue les décisions établies des comportements implémentés. Le [plan V1](plan-implementation-v1.md) et le [rapport de consolidation](dashboard-consolidation-complete.md) donnent le contexte technique ; ils ne remplacent pas les décisions métier. Les [releases automatiques](releases-automatiques.md) décrivent la publication après merge.

## 8. Résoudre les problèmes courants

| Symptôme                        | Action                                                                             |
| ------------------------------- | ---------------------------------------------------------------------------------- |
| `npm.ps1` bloqué                | Utiliser `npm.cmd`                                                                 |
| Module introuvable              | Vérifier le dossier courant, la version Node, puis relancer `npm.cmd ci`           |
| Profil spécifique incomplet     | Générer ou fournir les deux profils du dataset                                     |
| Token absent ou accès refusé    | Vérifier localement l’environnement et les permissions, sans afficher le token     |
| Arrêt pour quota                | Lire la date de reset, relancer ensuite ou utiliser `--wait-for-quota`             |
| Dashboard ancien après un échec | Vérifier la synthèse et la date de capture ; les anciennes sorties sont conservées |
| Filtres inactifs                | Servir le dashboard sur HTTP avec `dashboard:serve`                                |
| Statut partiel                  | Consulter les réserves Data Quality ; ne pas assimiler les inconnues à zéro        |

Ne pas versionner `.env`, les tokens, les RAW réels, les graines privées ou les traces. Les dossiers `config/`, `fixtures/`, `src/`, `tests/`, `docs/`, `specifications/` et `presentation/` restent les principales sources maintenues ; `data/` et `dist/` contiennent les sorties de travail.
