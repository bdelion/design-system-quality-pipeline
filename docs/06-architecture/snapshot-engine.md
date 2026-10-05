# Snapshot Engine

## Statut

**ÉTAT IMPLÉMENTÉ**, sauf mention explicite d'une cible.

## Rôle

Le Snapshot Engine assemble les résultats d'une exécution dans une
enveloppe stable destinée aux consommateurs.

``` text
RAW
+ NormalizedData
+ Data Quality
+ Analytics
+ versions
      ↓
Snapshot Engine
      ↓
Snapshot
```

## Construction

`buildSnapshot` reçoit actuellement :

-   RAW ;
-   données normalisées ;
-   alertes DQ ;
-   analytics ;
-   `modelVersion` ;
-   `ruleVersion` ;
-   `scope`.

Il génère :

-   `snapshotId` ;
-   `capturedAt` ;
-   synthèse DQ ;
-   fiabilité globale ;
-   copie structurée des données et résultats.

## Immutabilité

Les structures reçues sont clonées avec `structuredClone`.

Cette protection empêche une mutation ultérieure des objets de calcul de
modifier silencieusement le Snapshot déjà construit.

## Fiabilité globale

L'implémentation actuelle marque le Snapshot `partial` dès qu'une alerte
DQ existe, quelle que soit sa sévérité.

Cette logique est plus grossière que la fiabilité métrique-spécifique du
Metric Engine.

Il s'agit donc d'un **écart connu entre l'implémentation actuelle et le
principe analytique cible**, à examiner lors de la gap analysis.

## Versionnement

Le Snapshot conserve :

``` text
modelVersion
ruleVersion
```

Leur présence permet d'identifier avec quelles conventions une exécution
a été produite.

## Diff

`diffSnapshots` compare deux Snapshots ordonnés et produit uniquement
des faits observables entre les deux états.

Il fournit notamment :

-   entités ajoutées et retirées ;
-   transitions d'Anomalies ;
-   Anomalies créées ;
-   premières corrections observées ;
-   réouvertures ;
-   annulations.

Le diff ne modifie pas les Snapshots.

## Limites de comparaison

La comparaison actuelle repose sur :

-   `capturedAt` ;
-   les identifiants normalisés.

La compatibilité de `scope`, `modelVersion`, `ruleVersion` et la
complétude des sources devront être mieux formalisées avant de
considérer toute paire de Snapshots comme comparable.

## Consommateurs

Le Snapshot peut alimenter :

-   dashboard ;
-   historique ;
-   exports ;
-   futurs consommateurs.

Cette architecture doit permettre de faire évoluer la restitution sans
déplacer les règles dans le frontend.
