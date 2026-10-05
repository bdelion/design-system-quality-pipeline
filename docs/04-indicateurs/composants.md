# Indicateurs par Component

## 1. Objectif

La vue Component doit permettre de comprendre simultanément :

-   l'activité qui concerne le Component ;
-   ses Audits ;
-   ses Anomalies ;
-   son état de traitement ;
-   son historique par Version.

------------------------------------------------------------------------

## 2. Issues concernant le Component

Une Issue qui concerne plusieurs Components compte une fois dans chaque
vue Component concernée.

Exemple :

``` text
Issue #42
├── Component:A
└── Component:B
```

Résultat :

``` text
Component A → +1
Component B → +1
Portfolio   → +1 Issue distincte
```

La somme des vues Component n'est donc pas égale au total global
distinct.

------------------------------------------------------------------------

## 3. Issues sans Component

Une Issue peut être légitimement transverse.

La vue globale doit donc distinguer :

``` text
Issues avec au moins un Component
Issues sans Component
```

L'absence de Component n'est pas automatiquement une erreur DQ.

------------------------------------------------------------------------

## 4. Audits du Component

Pour chaque contexte de Version, la vue doit pouvoir distinguer :

``` text
NON AUDITÉ
AUDITÉ & CONFORME
AUDITÉ & NON CONFORME
```

Un nouvel Audit en cours ne remplace pas le dernier verdict acquis tant
qu'il n'est pas réalisé.

------------------------------------------------------------------------

## 5. Anomalies

La vue Component peut présenter :

-   Anomalies détectées ;
-   Anomalies non traitées ;
-   Anomalies traitées ;
-   répartition par criticité RGAA lorsque applicable ;
-   répartition par catégorie a11y.

Pour une Anomalie d'Audit, le Component doit être le même que celui de
l'Audit parent.

------------------------------------------------------------------------

## 6. Traitement

Le taux de traitement du Component suit la définition commune :

``` text
Anomalies traitées
/
Anomalies détectées
```

Il ne doit pas être confondu avec le verdict de conformité.

------------------------------------------------------------------------

## 7. Évolution entre Versions

Le modèle prévoit à terme les états :

``` text
NEW
EVOLVED
UNCHANGED
DECOMMISSIONED
```

Un Component `EVOLVED` doit être réévalué quant au besoin d'Audit, mais
l'évolution ne rend pas automatiquement son dernier verdict invalide.

La construction technique de cette comparaison de Versions reste
différée.

------------------------------------------------------------------------

## 8. Utilisation par les Applications

Les indicateurs suivants sont futurs :

-   nombre d'Applications consommant le Component ;
-   nombre d'occurrences ;
-   Anomalies rapportées à l'usage ;
-   erreurs d'intégration rapportées à l'usage.

Ils nécessitent des sources supplémentaires.
