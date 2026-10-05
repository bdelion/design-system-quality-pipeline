# Anonymisation

## Objectif

L'anonymisation permet de transformer un `RawDataset` réel en fixture
exploitable pour le développement et les tests sans diffuser les
informations permettant d'identifier l'organisation, les personnes ou le
contenu métier.

Elle intervient entre collecte et analyse :

``` text
GitHub
  ↓
RawDataset réel local
  ↓
fixture:anonymize
  ↓
Fixture anonymisée
  ↓
pipeline
```

## Commandes

Exemple :

``` bash
npm run fixture:anonymize -- \
  --input data/raw/my-real-dataset.json \
  --output fixtures/my-real-dataset-anonymized.json
```

Puis :

``` bash
npm run fixture:validate -- \
  --input fixtures/my-real-dataset-anonymized.json
```

## Déterminisme

L'anonymisation est déterministe à partir d'une seed.

À source et seed équivalentes, les mappings doivent rester cohérents.

Les dates sont décalées uniformément afin de préserver autant que
possible :

-   l'ordre chronologique ;
-   les écarts de temps ;
-   les durées utiles aux métriques.

## Options actuellement prévues

Le CLI expose notamment :

-   `--seed` ;
-   `--date-offset-days` ;
-   `--anonymize-components` ;
-   le mode strict par défaut pour les textes libres ;
-   `--keep-text` pour des données déjà contrôlées.

`--keep-text` doit être utilisé avec prudence : conserver davantage de
texte augmente le risque de fuite d'informations.

## Sémantique à préserver

L'anonymisation doit préserver les valeurs structurées nécessaires à
l'analyse métier.

Doivent notamment rester inchangés :

-   labels ;
-   `state` ;
-   `issueType` ;
-   `projectStatuses[].status` ;
-   `milestone.title` ;
-   `milestone.state`.

Elle doit également préserver la structure des relations :

-   Issue ↔ Pull Request ;
-   Issue ↔ parent ;
-   appartenance au Repository ;
-   relations dépendant des identifiants anonymisés.

## Données à anonymiser

Selon le contrat actuel, sont notamment concernés :

-   noms et identifiants de Repositories ;
-   owners ;
-   identifiants d'Issues, Pull Requests, Projects et Milestones ;
-   numéros d'Issues et de Pull Requests ;
-   utilisateurs ;
-   URLs ;
-   textes libres en mode strict ;
-   dates par décalage uniforme ;
-   noms de Composants lorsque `--anonymize-components` est activé.

Les mappings doivent rester cohérents dans tout le jeu de données.

## Configurations générées

L'anonymisation ne concerne pas uniquement le JSON RAW.

Les références d'identité présentes dans les configurations utilisées
avec la fixture doivent utiliser les mêmes mappings.

Le workflow actuel peut donc générer des fichiers spécifiques à la
fixture, par exemple :

``` text
fixtures/my-real-dataset-anonymized.json
config/system.my-real-dataset-anonymized.yaml
config/catalogue.my-real-dataset-anonymized.yaml
```

Les règles métier de configuration telles que labels, Issue Types ou
statuts ne doivent pas être anonymisées lorsqu'elles constituent
précisément la sémantique à tester.

Un fallback historique vers `system.fixture.yaml` et
`catalogue.fixture.yaml` reste supporté. Il ne faut pas réutiliser ces
fichiers génériques pour une autre fixture lorsque leurs mappings ne
correspondent pas.

## Manifeste de traçabilité

`fixture:anonymize` peut produire un manifeste local :

``` text
fixtures/my-real-dataset-anonymized.json.trace.json
```

Ce manifeste permet de relier techniquement :

-   chemins JSON ;
-   identifiants source ;
-   identifiants anonymisés ;
-   relations ;
-   présence ou absence de la cible dans le RAW.

Il ne doit pas recopier inutilement les objets RAW complets.

Le manifeste est explicitement ignoré par Git via :

``` text
*.trace.json
```

et ne doit pas être partagé avec la fixture.

## Rapport de validation

Le manifeste peut enrichir le rapport de validation :

``` bash
npm run fixture:validate -- \
  --input fixtures/my-real-dataset-anonymized.json \
  --trace fixtures/my-real-dataset-anonymized.json.trace.json \
  --report fixtures/my-real-dataset-anonymized.json.validation.md
```

Cela permet notamment de distinguer :

``` text
relation absente de la collecte
```

de :

``` text
relation cassée par l'anonymisation
```

## Contrôles de confidentialité

Le validateur recherche notamment des motifs susceptibles de révéler :

-   emails ;
-   téléphones ;
-   URLs ;
-   tokens ou secrets.

Le scanner doit tenir compte du type de donnée.

Un incident historique a montré que des timestamps ISO pouvaient être
classés à tort comme numéros de téléphone. Les timestamps structurés
doivent donc être exclus de cette détection sans affaiblir la recherche
de numéros présents dans les textes libres.

## Contrôles d'intégrité

Les relations doivent rester cohérentes après anonymisation.

Le validateur distingue notamment :

-   une cible absente du Repository attendu et introuvable ailleurs ;
-   une cible présente dans un autre Repository (`cross-repository`).

Cette distinction aide à identifier si l'incohérence provient de la
collecte, des données sources ou de l'anonymisation.

## Workflow recommandé

``` bash
# 1. Collecte locale
npm run collect -- \
  --source github \
  --output data/raw/my-real-dataset.json

# 2. Anonymisation déterministe
npm run fixture:anonymize -- \
  --input data/raw/my-real-dataset.json \
  --output fixtures/my-real-dataset-anonymized.json \
  --seed my-fixture-v1 \
  --date-offset-days -500

# 3. Validation avant diffusion
npm run fixture:validate -- \
  --input fixtures/my-real-dataset-anonymized.json

# 4. Analyse
npm run pipeline -- \
  --source fixture \
  --fixture fixtures/my-real-dataset-anonymized.json
```

## Politique Git

Le RAW réel ne doit jamais être commité.

L'état du repository audité confirme actuellement :

``` text
data/raw/     → ignoré
data/runs/    → ignoré
*.trace.json  → ignoré
```

Une fixture anonymisée validée peut être versionnée lorsqu'elle
constitue une donnée de test ou de démonstration maîtrisée.

## Principe de sécurité

L'anonymiseur doit reconstruire explicitement les objets autorisés
plutôt que propager aveuglément des objets sources riches.

L'objectif est double :

-   préserver la structure analytique nécessaire ;
-   réduire le risque qu'un nouveau champ sensible soit diffusé
    automatiquement parce qu'il a été ajouté en amont.
