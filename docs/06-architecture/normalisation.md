# Normalisation

## Statut

**ÉTAT IMPLÉMENTÉ** pour les mécanismes décrits comme actuels.

Le modèle cible sera enrichi après consolidation métier.

## Rôle

La normalisation transforme les données RAW en objets indépendants du
format des API GitHub.

Elle constitue la frontière entre les faits collectés et les objets
utilisés par les règles, les métriques et les restitutions.

```text
RawDataset
   +
Catalogue
   +
Configuration
      ↓
Normalisation
      ↓
NormalizedData
```

## Modèle actuel

L'implémentation normalise principalement :

- `Library` ;
- `Component` ;
- `Audit` ;
- `Anomaly` ;
- `PullRequest`.

Cette liste décrit le code actuel et non la limite du domaine métier.

## Enrichissement depuis le catalogue

Les Components issus des données collectées peuvent être rapprochés du
catalogue de référence.

La normalisation peut ainsi distinguer les informations observées dans
GitHub des informations de référence provenant du catalogue.

La provenance doit rester identifiable.

## Identifiants

Les entités normalisées utilisent des identifiants déterministes
produits par `stableId(prefix, value)`.

Ces identifiants servent à établir les relations entre objets et à
faciliter les comparaisons de Snapshots.

Ils ne doivent pas être confondus avec une définition métier de
l'identité d'un objet.

## Provenance

Les entités normalisées conservent des informations permettant de
remonter à leur origine, notamment :

- source ;
- identifiant source ;
- date de collecte.

Cette provenance est nécessaire pour expliquer une métrique ou une
alerte.

## Qualité initiale

Le normaliseur peut porter un premier état de qualité sur les objets
qu'il produit.

Le contrat actuel connaît :

```text
reliable
partial
unknown
invalid
```

Une donnée incomplète ne doit pas être remplacée par une valeur métier
inventée.

## Valeurs inconnues

Lorsqu'une information ne peut pas être déterminée, le modèle doit
conserver explicitement cette incertitude.

Exemple de principe :

```text
date absente
    ↓
délai inconnu

et non

date absente
    ↓
délai = 0
```

## Ce que la normalisation ne doit pas faire

La normalisation ne doit pas :

- corriger silencieusement le RAW ;
- déduire une décision métier non établie ;
- transformer une absence d'information en résultat négatif ;
- intégrer des règles de présentation propres au dashboard ;
- figer les cardinalités du domaine à partir des seules structures
  TypeScript actuelles.

## Évolution cible

Les décisions métier D-001 à D-136 introduisent un domaine plus riche
que l'implémentation actuelle.

Avant d'ajouter de nouvelles entités au modèle TypeScript, il faut
consolider :

1. les objets métier ;
2. leurs identités ;
3. leurs cardinalités ;
4. leurs règles ;
5. leurs sources ;
6. leur temporalité.

Ce travail précédera la gap analysis et l'implémentation.
