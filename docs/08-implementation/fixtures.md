# Fixtures

## Objectif

Les fixtures permettent d'exécuter le pipeline de manière déterministe
sans dépendre d'un accès GitHub en temps réel.

Elles servent notamment :

-   aux tests ;
-   à la démonstration ;
-   à la validation des contrats ;
-   à l'analyse contrôlée d'un jeu de données réel après anonymisation.

## Fixtures présentes

Le repository contient notamment :

-   `fixtures/github.json` : fixture de démonstration ;
-   `fixtures/my-real-dataset-anonymized.json` : fixture anonymisée
    issue d'un jeu réel ;
-   un rapport de validation associé lorsqu'il a été généré.

Les fichiers exacts peuvent évoluer ; le principe important est de
distinguer une fixture partageable d'un RAW réel local.

## Exécution

La fixture par défaut peut être utilisée par les commandes du pipeline.

Lorsqu'une fixture spécifique est nécessaire, son chemin doit être
fourni explicitement :

``` bash
npm run pipeline -- \
  --source fixture \
  --fixture fixtures/my-real-dataset-anonymized.json
```

Le même principe s'applique aux commandes qui acceptent l'option
`--fixture`.

## Configuration associée à une fixture

Une fixture anonymisée peut disposer de configurations générées qui
utilisent exactement les mêmes mappings d'identité.

Pour une fixture :

``` text
fixtures/my-real-dataset-anonymized.json
```

le workflow actuel peut produire des fichiers spécifiques tels que :

``` text
config/system.my-real-dataset-anonymized.yaml
config/catalogue.my-real-dataset-anonymized.yaml
```

Le pipeline dérive les chemins de configuration à partir du nom de la
fixture.

Cela permet à plusieurs fixtures anonymisées de coexister sans partager
accidentellement des mappings de Repository obsolètes.

## Compatibilité historique

L'implémentation conserve un fallback vers :

``` text
config/system.fixture.yaml
config/catalogue.fixture.yaml
```

pour le workflow historique.

Ce fallback est une compatibilité technique, pas une recommandation pour
partager une même configuration entre plusieurs fixtures anonymisées.

Pour une nouvelle fixture, il faut régénérer la configuration
correspondant exactement au même jeu de données et à la même seed.

## Cohérence

Une fixture et ses configurations doivent provenir du même processus
d'anonymisation.

En particulier :

``` text
Fixture
+ system fixture config
+ catalogue fixture config
```

doivent partager les mêmes mappings de Repository et, lorsque l'option
est activée, de Composants.

Le pipeline et les tests doivent détecter autant que possible les
incohérences de configuration plutôt que de produire silencieusement des
résultats partiels.

## Validation

Une fixture anonymisée doit être validée avant d'être partagée ou
utilisée comme référence.

Exemple :

``` bash
npm run fixture:validate -- \
  --input fixtures/my-real-dataset-anonymized.json
```

Avec manifeste de traçabilité local :

``` bash
npm run fixture:validate -- \
  --input fixtures/my-real-dataset-anonymized.json \
  --trace fixtures/my-real-dataset-anonymized.json.trace.json \
  --report fixtures/my-real-dataset-anonymized.json.validation.md
```

Le rapport `*.validation.md` peut être versionné lorsqu'il constitue un
artefact de validation utile.

Le manifeste `*.trace.json` reste local et ne doit pas être partagé.

## Règle de sécurité

``` text
RAW réel
    → local uniquement

Fixture anonymisée validée
    → partageable / versionnable selon le besoin
```

Ne jamais utiliser un RAW réel comme fixture versionnée.

Voir [Anonymisation](anonymisation.md).
