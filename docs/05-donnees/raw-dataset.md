# RAW Dataset

## Objectif

Le `RawDataset` est le contrat d'entrée interne du pipeline.

Il conserve les faits nécessaires aux traitements ultérieurs sans les
transformer prématurément en conclusions métier.

Le RAW doit rester suffisamment proche des sources pour permettre :

- la traçabilité ;
- la normalisation ;
- les contrôles de qualité ;
- l'explication d'un résultat ;
- le rejeu du pipeline.

## Sources actuelles

Le pipeline peut actuellement produire un RAW depuis :

- une fixture ;
- GitHub.

Le Catalogue YAML est chargé séparément puis ses références de
Composants sont injectées dans le jeu de données avant la normalisation.

## Collecte GitHub actuelle

Le collecteur GitHub fonctionne en lecture seule.

Pour chaque Repository configuré, l'implémentation collecte notamment :

1. les métadonnées du Repository ;
2. les Issues paginées ;
3. les Pull Requests paginées ;
4. la timeline des Issues ;
5. les relations Development et les statuts Projects v2 via GraphQL
    lorsqu'une URL GraphQL est configurée ;
6. les informations de Projects classiques via REST lorsque
    disponibles.

Les Pull Requests apparaissant dans l'endpoint REST des Issues sont
filtrées pour éviter les doublons.

Les appels sont projetés vers le contrat RAW minimal du projet : les
objets riches des API GitHub ne sont pas propagés arbitrairement dans le
pipeline.

## Relations Issue / Pull Request

L'implémentation actuelle recherche les relations Issue/PR à partir de
plusieurs signaux structurés ou textuels :

- mots-clés de fermeture configurés tels que `Closes`, `Fixes` ou
    `Resolves` ;
- titre ou corps selon le traitement concerné ;
- timeline GitHub ;
- références Development récupérées via GraphQL.

Les numéros détectés sont ensuite résolus contre les Pull Requests
effectivement collectées.

Une référence textuelle ne doit donc pas être confondue avec une
relation valide tant que la cible n'a pas été résolue dans le jeu de
données collecté.

## Projects

Les statuts Project associés aux Issues sont conservés dans le RAW.

L'implémentation actuelle peut combiner :

- Projects v2 via GraphQL ;
- Projects classiques via REST lorsque l'API les expose.

La configuration peut définir des valeurs de statut considérées comme
annulées par les traitements actuels. Cette interprétation appartient à
la configuration et aux couches métier, pas au contrat brut de l'API.

## Retries GitHub

Le collecteur implémente des retries pour certaines erreurs
transitoires.

Les statuts HTTP actuellement considérés comme réessayables comprennent
notamment :

```text
429
502
503
504
```

ainsi que certains `403` associés aux limites de taux.

Les erreurs réseau transitoires utilisent également un mécanisme de
retry avec attente. Une erreur considérée permanente est remontée au
pipeline.

Le token provient de l'environnement et ne doit jamais être copié dans
le RAW, les fixtures ou les Snapshots.

## Structure utile

### Repository

Le RAW conserve notamment :

- `id` ;
- `name` ;
- `owner` ;
- `defaultBranch` ;
- Issues ;
- Pull Requests.

### Issue

Le RAW conserve notamment :

- `id` ;
- `number` ;
- `title` ;
- `state` ;
- `issueType` ;
- labels ;
- informations de Composant disponibles ;
- criticités disponibles ;
- relations parent disponibles ;
- dates ;
- Pull Requests liés ;
- statuts GitHub Project ;
- Milestone.

### Pull Request

Le RAW conserve notamment :

- `id` ;
- `number` ;
- `state` ;
- `mergedAt` ;
- relations vers les Issues.

### Milestone

Le RAW conserve notamment :

- `id` ;
- `number` ;
- `title` ;
- `state`.

### Catalogue

Le champ `catalogueComponents` reçoit les noms de référence issus du
Catalogue avant la normalisation.

## Conservation de la sémantique métier

L'anonymisation ne doit pas altérer les valeurs qui portent une
sémantique métier nécessaire au pipeline.

Les champs suivants doivent notamment être conservés tels quels :

- labels ;
- `state` ;
- `issueType` ;
- `projectStatuses[].status` ;
- `milestone.title` ;
- `milestone.state`.

À l'inverse, les identifiants, utilisateurs, URLs, titres ou textes
libres peuvent relever de la politique d'anonymisation selon leur
nature.

Voir `docs/08-implementation/anonymisation.md`.

## Projection minimale

Le collecteur ne doit pas recopier arbitrairement des objets riches
provenant des API GitHub.

Il doit projeter les réponses externes vers le contrat RAW minimal
attendu par le pipeline.

Cette règle limite :

- le couplage aux schémas externes ;
- la diffusion accidentelle de données inutiles ;
- la dépendance à des champs non maîtrisés ;
- les risques d'anonymisation incomplète.

## RAW et conclusions métier

Le RAW conserve des faits sources. Il ne doit pas porter des conclusions
qui appartiennent à la normalisation, aux règles métier ou à la Data
Quality.

Par exemple, la présence d'un label, d'un statut ou d'une relation est
une donnée RAW ; son interprétation comme Anomalie, Audit conforme ou
incohérence relève d'une couche ultérieure.

## Immutabilité logique

Les règles de qualité ne corrigent pas silencieusement le RAW.

Lorsqu'une donnée est absente, incohérente ou invalide :

```text
RAW conservé
    +
DataQualityIssue
    +
impact éventuel sur les métriques
```

Cette séparation est nécessaire pour garder une explication vérifiable
des résultats.
