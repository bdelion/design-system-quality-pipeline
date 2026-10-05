# RAW Dataset

## Objectif

Le `RawDataset` est le contrat d'entrée interne du pipeline.

Il conserve les données nécessaires aux traitements ultérieurs sans les
transformer prématurément en conclusions métier.

Le RAW doit rester suffisamment proche des sources pour permettre :

-   la traçabilité ;
-   la normalisation ;
-   les contrôles de qualité ;
-   l'explication d'un résultat ;
-   le rejeu du pipeline.

## Sources actuelles

Le pipeline peut actuellement produire un RAW depuis :

-   une fixture ;
-   GitHub.

Le catalogue YAML est chargé séparément puis ses références de
Components sont injectées dans le jeu de données avant la normalisation.

## Structure utile

### Repository

Le RAW conserve notamment :

-   `id` ;
-   `name` ;
-   `owner` ;
-   `defaultBranch` ;
-   Issues ;
-   Pull Requests.

### Issue

Le RAW conserve les informations structurées nécessaires au métier,
notamment :

-   `id` ;
-   `number` ;
-   `title` ;
-   `state` ;
-   `issueType` ;
-   labels ;
-   Component ou informations permettant son identification ;
-   criticités ;
-   relations parent ;
-   dates ;
-   Pull Requests liés ;
-   statuts GitHub Project ;
-   Milestone.

### Pull Request

Le RAW conserve notamment :

-   `id` ;
-   `number` ;
-   `state` ;
-   `mergedAt` ;
-   relations vers les Issues.

### Milestone

Le RAW conserve notamment :

-   `id` ;
-   `number` ;
-   `title` ;
-   `state`.

### Catalogue

Le champ `catalogueComponents` reçoit les noms de référence issus du
catalogue avant la normalisation.

## Conservation de la sémantique métier

L'anonymisation ne doit pas altérer les valeurs qui portent une
sémantique métier nécessaire au pipeline.

Les champs suivants doivent notamment être conservés tels quels :

-   labels ;
-   `state` ;
-   `issueType` ;
-   `projectStatuses[].status` ;
-   `milestone.title` ;
-   `milestone.state`.

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

-   le couplage aux schémas externes ;
-   la diffusion accidentelle de données inutiles ;
-   la dépendance à des champs non maîtrisés ;
-   les risques d'anonymisation incomplète.

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

``` text
RAW conservé
    +
DataQualityIssue
    +
impact éventuel sur les métriques
```

Cette séparation est nécessaire pour garder une explication vérifiable
des résultats.
