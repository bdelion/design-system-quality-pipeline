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
npm run pipeline -- --source fixture
```

Ne mets jamais le fichier `data/raw/my-real-dataset.json` dans Git. Le `.gitignore` doit couvrir `data/raw/`, et la fixture anonymisée doit être la seule donnée destinée à être partagée ou commitée.
