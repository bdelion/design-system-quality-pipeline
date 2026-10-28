# Anonymiseur de fixtures

L'anonymisation est exécutée **après la collecte GitHub et avant la normalisation** :

```text
GitHub → RawDataset réel → fixture:anonymize → RawDataset anonymisé → pipeline V2 → dashboard
```

Le principe est de conserver la structure analytique sans conserver les informations permettant d'identifier l'organisation, les personnes ou le contenu métier.

## Commandes

```bash
npm run fixture:anonymize -- --input data/raw/github.json --output fixtures/github-real-anonymized.json
npm run fixture:validate -- --input fixtures/github-real-anonymized.json
```

L'anonymisation est déterministe : même `--seed` + même source produisent le même résultat. Les dates sont décalées d'un nombre constant de jours afin de conserver les durées et l'ordre chronologique.

### Options

- `--seed` : seed stable des mappings.
- `--date-offset-days` : décalage uniforme des dates.
- mode strict par défaut : les titres et autres textes libres sont remplacés par `[anonymized]`.
- `--keep-text` : retire seulement les motifs évidents de PII/secrets ; à réserver aux données déjà contrôlées.
- `--anonymize-components` : remplace également les noms de composants.

## Conservé

- nombres de repositories, issues et PR ;
- types, états, criticités et catégories analytiques ;
- relations issue ↔ PR et issue ↔ parent ;
- dates relatives et durées ;
- disponibilité Nexus ;
- structure du catalogue.

## Anonymisé

- noms et IDs de repositories ;
- propriétaires ;
- IDs d'issues, PR, projets et milestones ;
- numéros d'issues/PR ;
- titres en mode strict ;
- noms de composants lorsque `--anonymize-components` est activé ;
- dates par décalage uniforme.

Le validateur recherche les emails, téléphones, URLs et formats de tokens GitHub, et vérifie les relations internes entre issues et PR.

Le mapping n'est jamais écrit dans la fixture. Le token GitHub utilisé pour la collecte doit rester hors du RAW et des fixtures ; GitHub recommande de traiter les tokens comme des mots de passe. citeturn0search1turn0search11

La collecte GitHub reste en lecture seule. L'API REST couvre les issues et PR et doit être paginée pour éviter les résultats tronqués. citeturn0search2turn0search0

## Workflow recommandé pour tes repositories

```bash
# 1. Collecte locale en lecture seule
npm run collect -- --source github --output data/raw/my-real-dataset.json

# 2. Anonymisation stricte et déterministe
npm run fixture:anonymize -- \
  --input data/raw/my-real-dataset.json \
  --output fixtures/my-anonymized-fixture.json \
  --seed my-fixture-v1 \
  --date-offset-days -500

# 3. Contrôle indépendant avant toute diffusion
npm run fixture:validate -- --input fixtures/my-anonymized-fixture.json

# 4. Analyse de la fixture anonymisée
npm run pipeline -- --source fixture --fixture fixtures/my-anonymized-fixture.json
```

Ne mets jamais le fichier `data/raw/my-real-dataset.json` dans Git. Le `.gitignore` doit couvrir `data/raw/`, et la fixture anonymisée doit être la seule donnée destinée à être partagée ou commitée.

## Cohérence avec les configurations versionnées

L'anonymisation ne porte pas uniquement sur `RawDataset`. Les noms d'identité présents dans `config/system.yaml` doivent utiliser exactement les mêmes mappings que les repositories du RAW anonymisé.

`fixture:anonymize` génère donc également :

- `config/system.fixture.yaml` : `githubOwner` et `repositories` sont mappés avec le même seed que le RAW ; les règles GitHub (`labels`, `issueTypes`, statuts, etc.) restent inchangées ;
- `config/catalogue.fixture.yaml` : les références `repository` utilisent les mêmes noms anonymisés et les noms de composants suivent l'option `--anonymize-components`.

Le pipeline `--source fixture` utilise ces fichiers lorsqu'ils existent. En leur absence, il conserve la compatibilité avec la fixture historique et utilise `system.yaml` / `catalogue.yaml`.

## Traçabilité locale RAW → fixture

La validation doit rester analysable sans exposer le RAW réel. `fixture:anonymize` génère donc par défaut un manifeste local :

```text
fixtures/my-anonymized-fixture.json.trace.json
```

Ce manifeste contient uniquement la traçabilité technique nécessaire : fichier RAW source, chemins JSON, IDs source et IDs anonymisés, ainsi que les relations et leur présence dans le RAW. Il ne recopie pas les objets RAW complets.

Le manifeste est explicitement ignoré par Git (`*.trace.json`) et ne doit pas être partagé avec la fixture.

Pour produire un rapport enrichi :

```bash
npm run fixture:validate -- \
  --input fixtures/my-anonymized-fixture.json \
  --trace fixtures/my-anonymized-fixture.json.trace.json \
  --report fixtures/my-anonymized-fixture.validation.md
```

Le rapport peut alors indiquer, pour une relation cassée, le `sourcePath` et l'ID de l'entité dans le RAW, ainsi que si la cible existait dans le RAW. Cela permet de distinguer une donnée non collectée d'un problème introduit lors de l'anonymisation.

## Scanner de confidentialité typé

Les timestamps ISO (`2025-09-28T09:50:53.739Z`) sont des données structurées et ne doivent pas être classés comme des téléphones. Le scanner les exclut du contrôle `phone`, tout en continuant à détecter les numéros présents dans du texte libre.

Les erreurs d'intégrité sont également distinguées entre :

- `repository` : la cible n'existe pas dans le dépôt source de la relation et n'est pas trouvée ailleurs dans la fixture ;
- `cross-repository` : la cible existe dans un autre dépôt de la fixture.

## 6. Exécuter une fixture précise

Le pipeline fixture utilise `fixtures/github.json` par défaut. Lorsqu'une fixture anonymisée porte un autre nom, préciser explicitement son chemin :

```bash
npm run pipeline -- --source fixture --fixture fixtures/my-anonymized-fixture.json
```

Le même principe s'applique à `collect`, `validate`, `analyze`, `snapshot` et `dashboard` avec l'option `--fixture`. La fixture, `config/system.fixture.yaml` et `config/catalogue.fixture.yaml` doivent provenir du même jeu de données et de la même seed d'anonymisation.

### Fixture-specific configuration

Each anonymized fixture can have its own generated configuration. For example:

```text
fixtures/my-real-dataset-anonymized.json
config/system.my-real-dataset-anonymized.yaml
config/catalogue.my-real-dataset-anonymized.yaml
```

The pipeline derives these configuration paths from `--fixture`, so multiple anonymized fixtures can coexist without sharing stale repository mappings. The legacy `system.fixture.yaml` / `catalogue.fixture.yaml` files remain supported as fallback for the default fixture workflow.

> Important : ne réutilisez pas `config/system.fixture.yaml` pour une autre fixture anonymisée. Relancez `fixture:anonymize` pour générer la configuration correspondant exactement au fichier fixture utilisé.
