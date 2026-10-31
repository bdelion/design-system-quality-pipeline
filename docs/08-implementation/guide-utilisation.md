# Guide d’utilisation : commandes, fichiers et recettes

Ce guide est le point d’entrée pour utiliser la CLI depuis la racine du projet. Il décrit le comportement implémenté ; les détails techniques restent dans [Datasets autonomes](datasets.md).

| Je veux…                                                      | Parcours                                                                                                                 |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Essayer sans GitHub                                           | [Installer](#1-installer-et-vérifier-le-projet), puis [ouvrir la démonstration](#2-voir-la-démonstration)                |
| Afficher mes données GitHub récentes avec leurs vrais noms    | [Collecter](#3-collecter-vos-repositories), puis [rejouer le RAW privé](#7-afficher-un-dashboard-récent-sans-anonymiser) |
| Créer un jeu anonymisé à jour                                 | [Préparer](#4-préparer-le-dataset-hors-réseau), puis [valider et consulter](#5-contrôler-et-consulter-votre-jeu)         |
| Ajouter des métadonnées métier ou un historique de composants | [Enrichir le jeu](#8-enrichir-un-jeu-avec-un-catalogue-ou-un-historique)                                                 |
| Choisir mes fichiers et options                               | [Fichiers requis](#9-fichiers-et-configuration), puis [commandes](#10-référence-des-commandes-et-options)                |
| Comprendre une erreur                                         | [Dépannage](#11-dépannage)                                                                                               |

Les exemples utilisent `mon-jeu`. Pour chaque nouvelle collecte ou préparation, choisir un **nouveau nom** et le reporter dans toutes les commandes du parcours. Les fichiers RAW collectés et dossiers de préparation existants sont refusés, pas remplacés. Sous PowerShell, entourer de guillemets les chemins contenant des espaces. Le séparateur `--` transmet les arguments au script npm.

## 1. Installer et vérifier le projet

Installer Node.js 22.15.0 minimum, référence 22.23.3. Depuis la racine du checkout complet :

```powershell
npm.cmd ci
npm.cmd test
```

Les tests n’ont besoin ni de token ni de collecte. Leurs scénarios et configurations sont versionnés dans `tests/fixtures` ; ne pas les supprimer pour renouveler un dataset personnel. Sous Linux/macOS, remplacer `npm.cmd` par `npm`.

## 2. Voir la démonstration

```powershell
npm.cmd run pipeline
npm.cmd run dashboard:serve
```

Ouvrir http://127.0.0.1:4174/ et arrêter le serveur avec Ctrl+C. La démonstration est `examples/demo/dataset.json`, entièrement autonome ; ses sorties se trouvent dans `data/output/demo`. Elle ne fait aucun appel GitHub.

Chaque génération fournit automatiquement un accueil de choix et deux présentations : `dashboard/classic/` (détaillée) et `dashboard/simplified/` (synthétique). Voir [les parcours, filtres, délais et limites](dashboard-double-presentation.md). Aucun argument supplémentaire n’est requis.

## 3. Collecter vos repositories

Créer une liste JSON de noms complets :

```json
["mon-organisation/librairie-react", "mon-organisation/librairie-web"]
```

Le périmètre doit avoir un unique owner ; préparer un jeu par owner. Renseigner `GITHUB_TOKEN` dans le shell ou `.env`. Les conventions DSQ sont déjà livrées : aucun fichier métier supplémentaire n’est nécessaire à la première collecte.

```powershell
npm.cmd run collect -- --repositories repositories.json --output data/local/mon-jeu/raw.json
```

La capture conserve les faits et le profil réellement appliqué. Pour attendre automatiquement le reset : ajouter `--wait-for-quota`. Voir [les quotas](quotas-github.md). Les URLs d’une instance GitHub Enterprise peuvent être fournies via `GITHUB_API_URL`, `GITHUB_GRAPHQL_URL` et `GITHUB_URL`.

`GITHUB_URL` est la base web (par exemple `https://github.mon-organisation.fr`), distincte des endpoints REST et GraphQL. Elle est enregistrée lors de la collecte et utilisée au rejeu pour les liens construits vers les dépôts, issues et PR, y compris les preuves de traçabilité (#60). Une URL d’issue fournie par GitHub reste une preuve source et n’est pas remplacée. Modifier `.env` après la capture ne modifie pas son contexte : refaire une collecte pour changer la base. Sans base configurée, GitHub public reste la valeur par défaut ; les fixtures anonymisées ne conservent pas l’adresse de l’instance privée.

## 4. Préparer le dataset hors réseau

La capture contient déjà une graine privée locale ; la préparation la réutilise sans autre saisie. Le token n’est plus nécessaire. Pour garder les mêmes alias entre plusieurs collectes, définir `ANONYMIZATION_SEED` avant la collecte. Un ancien RAW sans graine locale demande cette variable ou l’option `--seed`.

```powershell
npm.cmd run fixture:prepare -- --input data/local/mon-jeu/raw.json --output datasets/mon-jeu
```

Le dossier contient `dataset.json` et `manifest.json`. Les données, conventions, périmètre et enrichissements éventuels voyagent ensemble ; aucun profil n’est recherché ailleurs selon le nom du fichier. Le RAW reste intact, et un dossier existant n’est pas remplacé. Choisir un nouveau nom pour une nouvelle préparation.

Si un catalogue métier approuvé existe, fournir `--catalogue config/local/mon-catalogue.yaml`. Son absence ne bloque pas le démarrage : les métadonnées non démontrées et le cycle de vie des composants restent inconnus. Les informations requérant un patrimoine actif complet ne sont pas remplacées par des zéros.

## 5. Contrôler et consulter votre jeu

```powershell
npm.cmd run fixture:validate -- --dataset datasets/mon-jeu
npm.cmd run pipeline -- --dataset datasets/mon-jeu --output data/output/mon-jeu
npm.cmd run dashboard:serve -- data/output/mon-jeu/dashboard
```

La validation contrôle manifeste, schéma, périmètre, anonymisation et relations ; elle exécute le pipeline dans un espace temporaire. Les réserves Data Quality sont annoncées, sans exiger que votre collecte contienne tous les scénarios métier de la suite de tests.

Le pipeline enregistre le snapshot courant, l’historique et les pages dans la sortie choisie. Les inconnues et réserves restent visibles. Un dataset peut être structurellement valide et fournir un dashboard partiel. La validation automatique ne certifie ni les métadonnées métier ni l’absence de toute information sensible ; revoir les artefacts avant partage.

## 6. Tester après une modification

```powershell
npm.cmd run check
npm.cmd run check:dashboard
```

`check` vérifie types, lint, TSDoc, tests et build. `check:dashboard` ajoute les tests navigateur, le format et TypeDoc. Ces vérifications utilisent les références de tests et leurs sorties dédiées, pas votre dashboard personnel.

Voir [le contrat et la migration](datasets.md), [l’isolation des tests](configurations-et-tests.md) et [le développement](guide-developpement.md).

## 7. Afficher un dashboard récent sans anonymiser

Après avoir créé `repositories.json` et configuré le token comme dans la section 3 :

```powershell
npm.cmd run collect -- --repositories repositories.json --output data/local/mon-jeu/raw.json
npm.cmd run pipeline -- --dataset data/local/mon-jeu/raw.json --output data/output/mon-jeu-local
npm.cmd run dashboard:serve -- data/output/mon-jeu-local/dashboard
```

Ouvrir http://127.0.0.1:4174/. Les noms, dates et liens réels sont conservés : RAW, snapshot et dashboard restent privés. Aucun catalogue n’est obligatoire pour démarrer ; les informations absentes restent inconnues. Un ancien RAW sans contexte capturé doit passer par `fixture:prepare` avant rejeu.

Si le RAW existe déjà, commencer directement par `pipeline` : aucun appel GitHub supplémentaire. Pour **actualiser** le dashboard, refaire `collect` vers un nouveau RAW, puis rejouer celui-ci. Relancer uniquement `pipeline`, rafraîchir la page ou ouvrir une recherche GitHub ne recollecte pas les données.

Pour créer un **jeu anonymisé complet et à jour**, suivre la collecte de la section 3 puis les quatre commandes des sections 4 et 5 : `fixture:prepare`, `fixture:validate`, `pipeline`, `dashboard:serve`. Ajouter `--anonymize-components` à la préparation si les noms des composants doivent également être pseudonymisés. Un jeu autonome contient ses données et conventions ; « complet » ne garantit pas l’absence de réserves DQ. Les labels et valeurs métier conservées demandent une revue humaine avant partage.

Un serveur déjà démarré continue de servir son dossier initial. Pour consulter une autre sortie, arrêter avec Ctrl+C et relancer `dashboard:serve` avec son dossier `dashboard`. Le serveur ne génère ni ne recollecte rien ; recharger le navigateur après génération.

## 8. Enrichir un jeu avec un catalogue ou un historique

Pour identifier les sources lues à chaque étape, consulter
[Catalogues de composants : collecte, anonymisation et rejeu](catalogues-et-commandes.md).

Pour générer les référentiels depuis des fichiers `*_component_comparison.xlsx`,
voir [`components:import` et ses options](import-comparaisons-excel.md).

### Compléter le catalogue métier courant

Une première préparation sans `--catalogue` depuis un RAW crée ou conserve `data/local/mon-jeu/raw.json.catalogue.draft.yaml`, à côté du RAW. Ce brouillon garde les noms réels : le conserver privé. Compléter les valeurs « À remplacer », les dépôts et les champs `null` avec des informations vérifiées, puis retirer `draft: true` après revue.

```powershell
npm.cmd run fixture:prepare -- --input data/local/mon-jeu/raw.json --output datasets/mon-jeu-enrichi --catalogue data/local/mon-jeu/raw.json.catalogue.draft.yaml
npm.cmd run fixture:validate -- --dataset datasets/mon-jeu-enrichi
npm.cmd run pipeline -- --dataset datasets/mon-jeu-enrichi --output data/output/mon-jeu-enrichi
npm.cmd run dashboard:serve -- data/output/mon-jeu-enrichi/dashboard
```

Le catalogue courant décrit les métadonnées métier ; il ne prouve pas la présence historique à chaque version. Le suffixe `.draft.yaml` du nom de fichier peut rester : c’est le contenu, notamment `draft: true`, qui est contrôlé pour ce catalogue.

### Ajouter un historique à une fixture existante — parcours #62

Préparer un référentiel conforme au [contrat des identités et présences](datasets.md#historique-des-composants-par-version). Les chemins suivants désignent des fichiers **locaux à fournir**, non livrés avec le dépôt. Choisir un autre suffixe si la destination existe déjà.

```powershell
npm.cmd run fixture:prepare -- --input datasets/issue-49/dataset.json --output datasets/issue-49-historique-v2 --historical-catalogue config/local/demo-react-historique-composants.yaml
npm.cmd run fixture:validate -- --dataset datasets/issue-49-historique-v2
npm.cmd run pipeline -- --dataset datasets/issue-49-historique-v2 --output data/output/issue-49-historique-v2
npm.cmd run dashboard:serve -- data/output/issue-49-historique-v2/dashboard
```

Le `dataset.json` d’entrée doit être accompagné de son `manifest.json`. L’enrichissement conserve ses faits déjà anonymisés, son catalogue et sa configuration, sans nouvelle anonymisation. Il remplace l’historique du dépôt fourni et préserve ceux des autres dépôts. Aucun `--seed`, `--catalogue` ou `--anonymize-components` n’est nécessaire pour ce parcours. Pour conserver un enrichissement antérieur, utiliser le `dataset.json` du jeu enrichi comme entrée. Ne pas modifier ce fichier manuellement : son manifeste ne correspondrait plus.

### Ajouter un historique au rejeu privé

```powershell
npm.cmd run pipeline -- --dataset data/local/mon-jeu/raw.json --output data/output/mon-jeu-historique --historical-catalogue config/local/mon-historique.yaml --historical-repository mon-organisation/librairie-react
npm.cmd run dashboard:serve -- data/output/mon-jeu-historique/dashboard
```

`--historical-repository` affecte explicitement **un seul référentiel** au dépôt réel présent dans le RAW ; l’utiliser si son alias diffère. Pour plusieurs dépôts, fournir plusieurs chemins après `--historical-catalogue`, avec leurs dépôts correctement déclarés, sans cette affectation unique. Un fichier d’identités peut référencer le document de présences via `historicalCatalogue`, résolu relativement à ce fichier. Ce document diffère du brouillon de catalogue courant. Les historiques externes sont relus à chaque rejeu ; la fixture enrichie les embarque pour rester autonome.

## 9. Fichiers et configuration

Le dossier de sortie du pipeline doit être extérieur au dossier d’entrée, jamais identique ni placé dans un de ses sous-dossiers. Pour un RAW passé comme fichier, cette règle porte sur le dossier contenant le RAW. La séparation `data/local/`, `datasets/` et `data/output/` des exemples respecte cette contrainte.

| Fichier                                           | À fournir pour                      | Contenu et résultat                                                                                        |
| ------------------------------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `repositories.json`                               | `collect`                           | Tableau JSON de `owner/repository` ; un owner par collecte                                                 |
| `.env` ou variables du shell                      | Accès GitHub                        | Token et endpoints éventuels ; partir de [`.env.example`](../../.env.example), sans versionner les secrets |
| `config/profiles/dsq.json`                        | Lu automatiquement à la collecte    | Conventions DSQ livrées ; pas de `system.yaml` à fabriquer                                                 |
| `data/local/mon-jeu/raw.json`                     | Rejeu privé ou préparation          | Capture réelle et contexte ; contient la graine privée, à conserver localement                             |
| `datasets/mon-jeu/dataset.json` + `manifest.json` | Validation et rejeu d’une fixture   | Dossier autonome produit par `fixture:prepare` ; chemin du dossier ou de `dataset.json` accepté            |
| Catalogue YAML approuvé                           | `--catalogue` facultatif            | Métadonnées vérifiées ; pas de statut ou niveau RGAA inventé                                               |
| Référentiel historique YAML                       | `--historical-catalogue` facultatif | Identités et preuves par version ; voir section 8                                                          |
| `data/output/mon-jeu/`                            | Produit par `pipeline`              | Snapshot sous `current/`, historique et `dashboard/` ; destination distincte du dataset source             |

| Variable                                         | Usage courant                                                                                  |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `GITHUB_TOKEN`                                   | Lecture GitHub pour `collect` et `diagnose:history --live` ; inutile pour le rejeu hors réseau |
| `GITHUB_API_URL`                                 | Endpoint REST, défaut `https://api.github.com`                                                 |
| `GITHUB_GRAPHQL_URL`                             | Endpoint GraphQL, défaut `https://api.github.com/graphql`                                      |
| `GITHUB_URL`                                     | Base web des liens, défaut `https://github.com` ; distincte des endpoints API                  |
| `ANONYMIZATION_SEED`                             | Graine privée stable entre collectes ; peut remplacer la graine du RAW à la préparation        |
| `ANON_GITHUB_OWNER`, `ANON_REPO_<NOM_NORMALISE>` | Alias facultatifs ; exemple du nom normalisé dans `.env.example`                               |

Le parcours actuel décale les dates de **365 jours vers le passé** ; il ne lit pas `ANON_DATE_OFFSET_DAYS`. Modifier `.env` après collecte ne remplace pas rétroactivement les conventions capturées. Voir [l’anonymisation](datasets.md#anonymisation).

## 10. Référence des commandes et options

Les syntaxes `<fichier>`, `<dossier>` et `<valeur>` désignent des emplacements à remplacer. Les quatre commandes CLI proposent `--help`. L’aide générale et la version sont accessibles avec `npx.cmd tsx src/cli.ts --help` et `npx.cmd tsx src/cli.ts --version`.

### Commandes utilisateur

| Commande                                   | Options ou arguments                                                                                                          | Fichiers et comportement                                                                                     |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `npm.cmd run collect -- …`                 | **Requis** : `--repositories <fichier>`, `--output <fichier>`                                                                 | Liste JSON et token ; nouveau RAW privé, collecte distante                                                   |
|                                            | `--wait-for-quota`                                                                                                            | Attend le reset dans la limite cumulée autorisée                                                             |
|                                            | `--rest-quota-reserve <entier>` : `100` ; `--graphql-quota-reserve <entier>` : `100` ; `--quota-max-wait <secondes>` : `7200` | Entiers positifs ou nuls ; [réserves et limites des quotas](quotas-github.md)                                |
| `npm.cmd run fixture:prepare -- …`         | **Requis** : `--input <fichier>`, `--output <dossier>`                                                                        | RAW ou `dataset.json` d’une fixture existante ; destination neuve                                            |
|                                            | `--seed <valeur>`                                                                                                             | Priorité sur `ANONYMIZATION_SEED`, puis sur la graine du RAW                                                 |
|                                            | `--catalogue <fichier>`                                                                                                       | Catalogue courant YAML facultatif depuis un RAW                                                              |
|                                            | `--historical-catalogue <fichier...>`                                                                                         | Un ou plusieurs référentiels historiques YAML, un par dépôt                                                  |
|                                            | `--anonymize-components`                                                                                                      | Pseudonymise aussi les noms/labels de composants et leurs preuves historiques depuis un RAW                  |
| `npm.cmd run fixture:validate -- …`        | **Requis** : `--dataset <chemin>`                                                                                             | Dossier autonome ou fichier dataset ; pipeline temporaire hors réseau, réserves DQ annoncées                 |
| `npm.cmd run pipeline -- …`                | `--dataset <chemin>` : `examples/demo/dataset.json`                                                                           | Dataset autonome ou RAW contextualisé ; aucune collecte                                                      |
|                                            | `--output <dossier>` : `data/output/demo`                                                                                     | Sorties isolées ; historique compatible lu dans cette destination                                            |
|                                            | `--historical-catalogue <fichier...>` ; `--historical-repository <owner/repository>`                                          | Historiques externes et affectation unique facultative ; voir section 8                                      |
| `npm.cmd run dashboard:serve -- <dossier>` | Dossier facultatif : `data/output/demo/dashboard`                                                                             | Contient `index.html` et ses assets ; sert `127.0.0.1:4174` ; Ctrl+C pour arrêter ; pas d’option CLI de port |

Pour enrichir une fixture existante, `--seed` n’a aucun effet et les options `--catalogue` et `--anonymize-components` sont refusées ; repartir du RAW pour refaire l’anonymisation ou changer le catalogue courant. Exemples d’aide :

```powershell
npm.cmd run collect -- --help
npm.cmd run fixture:prepare -- --help
npm.cmd run fixture:validate -- --help
npm.cmd run pipeline -- --help
```

`dashboard:serve` prend un chemin positionnel : ne pas lui passer `--help` comme s’il s’agissait d’une commande Commander.

### Outils complémentaires

| Script npm                                              | Arguments et usage                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `dashboard:preview`                                     | Snapshot positionnel facultatif, défaut `data/output/demo/current/snapshot.json` ; écrit dans `data/dashboard-refactor-preview/`, puis servir son sous-dossier `dashboard/` ; aperçu, pas nouvelle collecte                                                                                                                                                                    |
| `diagnose:history`                                      | `--raw <fichier>` (défaut `data/raw/my-real-dataset.json`, fournir son propre chemin) ; `--fixture <fichier>` ; `--output <dossier>` (défaut `data/diagnostics`) ; `--sample <1..1000>` (défaut `20`) ; `--live` active les appels GraphQL avec token ; `--collected-at <date ISO avec fuseau>` ; `--help`. Voir le [diagnostic d’historique](diagnostic-historique-github.md) |
| `benchmark:dashboard`                                   | `--output <dossier>` requis, destination neuve avec parent existant ; `--scenario control` ou `load` (défaut `control`), `--seed 81`, `--runs 3`, `--compare <rapport.json>`, `--budgets <fichier>` (exige `--compare`), `--screenshots`, `--channel <nom>` (défaut `msedge` sous Windows, `chromium` ailleurs), `--help`. Voir le [protocole PC](dashboard-benchmark.md)      |
| `test`, `test:watch`, `test:browser`                    | Tests unitaires, surveillance et navigateur PC ; jeux versionnés, sans collecte réelle                                                                                                                                                                                                                                                                                         |
| `typecheck`, `lint`, `check:tsdoc`, `check:ai`, `build` | Types, lint, commentaires de fonctions, configuration IA et compilation                                                                                                                                                                                                                                                                                                        |
| `check`, `check:dashboard`                              | Vérifications regroupées de la section 6                                                                                                                                                                                                                                                                                                                                       |
| `format`, `format:check`, `docs:api`                    | Formatage avec modification, contrôle sans modification, génération TypeDoc                                                                                                                                                                                                                                                                                                    |
| `ai:index:update`                                       | Régénère l’index des décisions après modification du registre ; usage développement                                                                                                                                                                                                                                                                                            |
| `clean`                                                 | Supprime uniquement le build `dist/` ; usage développement                                                                                                                                                                                                                                                                                                                     |

`npm.cmd run` liste les scripts. Les anciennes commandes `analyze`, `snapshot`, `dashboard`, `validate`, `fixture:anonymize`, `reference:prepare`, `catalogue:generate` et `system:generate` sont supprimées : utiliser les parcours de ce guide.

## 11. Dépannage

| Situation                                | Vérification ou action                                                                                                                                                                      |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Destination déjà existante               | Choisir un nouveau nom pour le RAW ou le dataset ; conserver les précédents pour comparaison                                                                                                |
| `index.html` introuvable                 | Exécuter `pipeline`, puis servir son dossier **`dashboard`**, pas son parent ni le dataset                                                                                                  |
| Port 4174 occupé                         | Arrêter le précédent serveur avec Ctrl+C avant d’en démarrer un autre                                                                                                                       |
| Page en `file:` et filtres indisponibles | Servir le dossier complet avec `dashboard:serve`, puis ouvrir l’URL HTTP locale                                                                                                             |
| Ancienne capture encore affichée         | Vérifier l’entrée de `pipeline`, sa sortie, le dossier servi et la date de capture ; recharger la page                                                                                      |
| RAW ancien sans graine                   | Fournir `ANONYMIZATION_SEED` ou `--seed` à `fixture:prepare`                                                                                                                                |
| Catalogue courant en brouillon           | Compléter les données vérifiées puis retirer `draft: true`, sans inventer de statut                                                                                                         |
| Relations manquantes à la préparation    | Ouvrir le rapport privé `fixture-diagnostics-…/relations.json` annoncé ; vérifier périmètre et accès, puis recollecter si nécessaire ; ne pas supprimer les relations pour masquer l’erreur |
| Manifeste invalide                       | Retrouver le couple `dataset.json`/`manifest.json` d’origine ou repréparer une destination neuve ; ne pas modifier les faits à la main                                                      |
| Dataset valide mais résultats partiels   | Consulter les diagnostics et preuves des KPI ; validité structurelle et conformité/accessibilité sont distinctes                                                                            |

## Liens vers les vues GitHub Projects

Pour les fenêtres Done/Cancelled de la vue synthétique, compléter le groupe suivant dans `.env`, puis relancer `pipeline` pour régénérer le dashboard. Les paramètres sont locaux, distincts du contexte de collecte enregistré ; les fichiers du dataset restent inchangés.

```dotenv
GITHUB_URL=https://github.com
GITHUB_PROJECT_OWNER_TYPE=orgs
GITHUB_PROJECT_OWNER=mon-organisation
GITHUB_PROJECT_NUMBER=12
GITHUB_PROJECT_VIEW_NUMBER=3
```

Utiliser `users` au lieu de `orgs` pour un Project personnel. Les numéros se lisent dans l’URL `/orgs/mon-organisation/projects/12/views/3`. Tous les champs du groupe sont requis lorsqu’il est activé ; une configuration partielle ou une base non HTTPS est refusée. Le champ `Status` est filtré avec les variantes `DONE` ou `CANCELLED` de `github.projectStatuses.keywords` du profil du dataset, sans déduire ces statuts de Closed.

Par défaut, `repo:` utilise le repository de chaque ligne. Si seul son owner diffère, renseigner `GITHUB_PROJECT_REPOSITORY_OWNER`. Si les noms ont aussi été anonymisés, fournir les correspondances explicitement, par exemple :

```dotenv
GITHUB_PROJECT_REPOSITORIES='{"demo/demo-react":"mon-organisation/design-system-react"}'
```

Ce mapping est prioritaire sur l’owner facultatif. Aucun nom réel n’est deviné et les liens individuels des sources ne sont pas réécrits. Les URL configurées sont présentes dans le dashboard généré : conserver cette sortie dans votre espace privé si elle révèle vos identités réelles. Le token n’est jamais embarqué. La vue Project couvre le repository entier, avec un avertissement de recherche élargie ; le CSV et la liste locale restent propres au composant sélectionné.
