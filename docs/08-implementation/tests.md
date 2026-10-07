# Tests et validation

## Objectif

Les tests protègent les contrats du pipeline et permettent de faire
évoluer l'implémentation sans transformer implicitement une hypothèse
technique en règle métier.

Toute modification d'un contrat RAW, normalisé, DQ, métrique, Snapshot
ou dashboard doit être accompagnée des tests ciblés nécessaires.

## Commandes principales

```bash
npm run typecheck
npm run lint
npm test
```

Ces commandes constituent le contrôle standard avant commit lorsque les
dépendances sont installées.

## Suites présentes dans le repository audité

Le ZIP de référence contient notamment :

- `analytics-v2-fixture.test.ts` ;
- `anonymization-config.test.ts` ;
- `anonymization.test.ts` ;
- `dashboard.test.ts` ;
- `fixture-collector.test.ts` ;
- `fixture-config.test.ts` ;
- `flow-contract.test.ts` ;
- `github-collector.test.ts` ;
- `metric-catalog.test.ts` ;
- `pipeline.test.ts` ;
- `snapshot-diff.test.ts` ;
- `snapshot.test.ts`.

Cette liste décrit les fichiers observés ; elle ne garantit pas à elle
seule que tous les tests passent dans une révision donnée.

## Couverture fonctionnelle

### Pipeline

Les tests du pipeline vérifient notamment l'enchaînement des couches et
les contrats attendus entre collecte, normalisation, qualité, analytics
et Snapshot.

### Collecteur GitHub

Les tests du collecteur couvrent notamment :

- pagination ;
- séparation Issues / Pull Requests ;
- relations textuelles ;
- données GraphQL ;
- comportements de collecte contrôlés.

Les appels réseau sont simulés afin de garder des tests déterministes et
indépendants d'un accès GitHub réel.

### Fixtures

Les tests de fixture couvrent le chargement des données et la cohérence
entre fixture et configuration associée.

### Anonymisation

Les tests doivent protéger :

- déterminisme des mappings ;
- conservation des relations ;
- anonymisation des identités ;
- conservation des sémantiques métier autorisées ;
- génération des configurations associées ;
- comportement du scanner de confidentialité.

L'incident historique des timestamps ISO détectés comme téléphones doit
rester couvert afin d'éviter sa réintroduction.

### Analytics et métriques

Les tests vérifient les calculs actuellement implémentés et le catalogue
de métriques.

Une évolution de définition métier doit d'abord être documentée avant de
modifier l'attendu d'un test.

### Snapshot

Les tests couvrent le contrat du Snapshot et sa comparaison.

Une disparition d'entité entre deux Snapshots ne doit pas être
interprétée comme une suppression métier sans que le contrat de
complétude le permette.

### Dashboard

Les tests vérifient notamment :

- génération des pages ;
- liens ;
- libellés ;
- présence des éléments attendus.

Ils ne doivent pas dupliquer les règles métier du moteur de métriques.

## Tests de contrat

Les frontières suivantes méritent des tests ciblés :

```text
Source → RAW
RAW → NormalizedData
NormalizedData + DQ → Metrics
Metrics → Snapshot
Snapshot → Dashboard
```

L'objectif est de détecter rapidement un changement incompatible de
contrat.

## Fixtures déterministes

Les fixtures permettent de tester le pipeline sans accès réseau.

Une fixture anonymisée issue de données réelles peut compléter la
fixture de démonstration pour détecter des cas que les données
synthétiques ne couvrent pas.

Elle doit avoir été validée selon `anonymisation.md`.

## État des tests et documentation

La documentation ne doit jamais affirmer qu'une suite est verte
uniquement parce que les fichiers de test existent.

Lorsqu'une livraison ou une revue doit attester l'état des tests,
exécuter réellement :

```bash
npm run typecheck
npm run lint
npm test
```

et conserver le résultat approprié dans le contexte de livraison ou de
CI.

## Évolution après consolidation métier

Les décisions D-001 à D-136 devront progressivement être transformées en
tests lorsqu'elles deviennent des règles exécutables.

Exemple de démarche :

```text
Décision métier
    ↓
règle formalisée
    ↓
fixture représentative
    ↓
test
    ↓
implémentation
```

La documentation métier reste la source de la décision ; le test protège
ensuite son implémentation.
