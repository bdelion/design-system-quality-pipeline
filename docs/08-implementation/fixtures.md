# Fixtures

## Objectif

Les fixtures permettent d'exécuter le pipeline de manière déterministe
sans dépendre d'un accès GitHub en temps réel.

Elles servent notamment :

- aux tests ;
- à la démonstration ;
- à la validation des contrats ;
- à l'analyse contrôlée d'un jeu de données réel après anonymisation.

## Fixtures présentes

Le repository contient notamment :

- `fixtures/github.json` : fixture de démonstration ;
- `fixtures/my-real-dataset-anonymized.json` : fixture anonymisée
    issue d'un jeu réel ;
- un rapport de validation associé lorsqu'il a été généré.

Les fichiers exacts peuvent évoluer ; le principe important est de
distinguer une fixture partageable d'un RAW réel local.

## Exécution

La fixture par défaut peut être utilisée par les commandes du pipeline.

Lorsqu'une fixture spécifique est nécessaire, son chemin doit être
fourni explicitement :

```bash
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

```text
fixtures/my-real-dataset-anonymized.json
```

le workflow actuel peut produire des fichiers spécifiques tels que :

```text
config/system.my-real-dataset-anonymized.yaml
config/catalogue.my-real-dataset-anonymized.yaml
```

Le pipeline dérive les chemins de configuration à partir du nom de la
fixture.

Cela permet à plusieurs fixtures anonymisées de coexister sans partager
accidentellement des mappings de Repository obsolètes.

## Compatibilité historique

L'implémentation conserve un fallback vers :

```text
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

```text
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

```bash
npm run fixture:validate -- \
  --input fixtures/my-real-dataset-anonymized.json
```

Avec manifeste de traçabilité local :

```bash
npm run fixture:validate -- \
  --input fixtures/my-real-dataset-anonymized.json \
  --trace fixtures/my-real-dataset-anonymized.json.trace.json \
  --report fixtures/my-real-dataset-anonymized.json.validation.md
```

Le rapport `*.validation.md` peut être versionné lorsqu'il constitue un
artefact de validation utile.

Le manifeste `*.trace.json` reste local et ne doit pas être partagé.

## Règle de sécurité

```text
RAW réel
    → local uniquement

Fixture anonymisée validée
    → partageable / versionnable selon le besoin
```

Ne jamais utiliser un RAW réel comme fixture versionnée.

Voir [Anonymisation](anonymisation.md).

## Fixture de référence V1 (I9)

`fixtures/v1-reference.json` est le scénario de non-régression transversal de la V1. Sa configuration est isolée dans `config/system.v1-reference.yaml` et `config/catalogue.v1-reference.yaml` afin qu'elle ne dépende ni des repositories réels ni de leurs noms anonymisés.

Elle couvre notamment plusieurs repositories, un Component de Catalogue sans Issue, une Issue transverse, une Issue multi-Component, un Bug hors Audit, un Audit pré-PROD conforme, un Audit de rattrapage post-PROD non conforme, un Audit plus récent mais incomplet, une Anomalie corrigée avec transition `Done`, une Anomalie ouverte sans criticité, une PR mergée, deux Catalogues historiques différents et des preuves de Catalogue historique manquante/invalide.

Le contrat exécutable associé est `tests/v1-reference-scenario.test.ts`. Il asserte des cardinalités et KPI attendus, la distinction état à la Release / connaissance actuelle et la génération du dashboard. Cette fixture est synthétique : aucun nom de repository, Component, personne ou URL provenant des données GitHub réelles ne doit y être introduit.


### Consolidation I9 — scénarios #7, #8 et #13

La fixture contient un audit Modal pré-PROD non conforme (avec anomalie),
portant la RC explicite `1.1.0-rc.2` et son tag daté. Un audit Modal
post-PROD distinct permet de vérifier le rattrapage historique.

`bug-outside` représente volontairement l'incohérence `Done + OPEN`
attendue sous `DQ-013`. La criticité manquante reste testée sous `DQ-001`.

Le test I9 génère le dashboard dans un répertoire temporaire système unique
et le nettoie dans un bloc `finally` ; il ne partage plus la sortie de
`tests/dashboard.test.ts`. La présence des 19 scénarios dans la fixture
ne garantit pas à elle seule 19 assertions indépendantes.
