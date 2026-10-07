# Règles

## Objectif

Ce dossier organise les règles utilisées par le Design System Quality
Pipeline sans confondre :

- une règle métier validée ;
- une règle de workflow dépendante d'un profil ;
- une règle de cohérence entre relations ;
- une règle de référentiel ;
- une règle de qualité de données ;
- une règle liée à la disponibilité d'une source ;
- une règle actuellement implémentée mais encore discutable au regard
    du modèle cible.

Cette distinction est indispensable avant toute refonte de `DQ-001` à
`DQ-010`.

## Familles de règles

### Règles métier

Elles définissent la signification des objets du domaine.

Exemples :

- ce qui constitue un Audit réalisé ;
- ce qui constitue une Anomalie traitée ;
- la cardinalité Audit → Anomalie ;
- la différence entre Anomalie et Improvement.

Voir [Règles métier](regles-metier.md).

### Règles workflow

Elles contrôlent la cohérence entre le profil de workflow, le statut
Project et les propriétés attendues.

Une règle workflow ne doit pas être évaluée uniquement à partir du
statut.

Voir [Règles workflow](regles-workflow.md).

### Règles relationnelles

Elles portent sur les cardinalités et la cohérence des liens entre
objets.

Voir [Règles relationnelles](regles-relations.md).

### Règles référentielles

Elles portent sur les référentiels tels que le Catalogue des Components
et la normalisation des Versions.

Voir [Règles référentielles](regles-referentiel.md).

### Règles de qualité des données

Elles signalent une donnée absente, contradictoire, ambiguë ou
insuffisante pour un calcul.

Voir [Règles de qualité des données](regles-qualite-donnees.md).

### Disponibilité des sources

Elles décrivent les conséquences d'une source externe indisponible.

Voir [Règles de disponibilité des sources](regles-sources.md).

## Ordre d'évaluation cible

```text
Données sources
    ↓
Normalisation
    ↓
Identification du profil / contexte métier
    ↓
Règles métier et relationnelles
    ↓
Règles workflow
    ↓
Règles référentielles
    ↓
Qualité / disponibilité des sources
    ↓
Impacts métrique par métrique
```

Cet ordre est une organisation conceptuelle. Il ne prétend pas décrire
exactement l'ordre d'exécution du code actuel.

## Data Quality actuelle

Le code dispose actuellement des règles `DQ-001` à `DQ-011`.

Elles constituent un **état implémenté à préserver et analyser**, pas
automatiquement le référentiel métier cible.

Aucune règle existante ne doit être supprimée ou réécrite uniquement
parce que la documentation métier a évolué.

La démarche est :

1. documenter ce que la règle fait aujourd'hui ;
2. identifier le besoin métier qu'elle cherche à protéger ;
3. confronter ce besoin aux décisions consolidées ;
4. identifier les divergences ;
5. décider ensuite de conserver, spécialiser, remplacer ou retirer la
    règle ;
6. seulement alors modifier le code et les tests.

## Fiabilité

Une alerte DQ ne doit pas rendre automatiquement toutes les métriques du
Snapshot non fiables.

Le modèle cible doit raisonner au niveau de la métrique :

```text
DQ
  ↓
métriques réellement concernées
  ↓
include / exclude / unknown
  ↓
reliability de ces métriques
```

Le statut global du Snapshot reste utile pour la traçabilité mais ne
doit pas remplacer cette analyse fine.
