# Components

## 1. Rôle

Le Component est une entité métier du Design System.

Il est identifié par le Catalogue et relié aux Issues GitHub par les
labels configurés de type :

``` text
🧩 Component:xxx
```

Le Catalogue constitue la référence des Components connus du périmètre.

------------------------------------------------------------------------

## 2. Component actif

Un Component actif appartient au périmètre courant du Catalogue.

Les indicateurs courants peuvent notamment présenter :

-   Issues le concernant ;
-   Audits ;
-   conformité ;
-   Anomalies ;
-   traitement des Anomalies.

------------------------------------------------------------------------

## 3. Component historique

Un Component retiré du Catalogue courant ne doit pas disparaître de
l'histoire.

Il doit rester interprétable dans les Versions où il existait.

Principe :

``` text
Catalogue Version N
≠
Catalogue courant réappliqué rétroactivement à Version N
```

------------------------------------------------------------------------

## 4. États d'évolution

Le modèle futur prévoit les qualifications :

``` text
NEW
EVOLVED
UNCHANGED
DECOMMISSIONED
```

Le mécanisme technique permettant de les déterminer automatiquement
reste différé.

------------------------------------------------------------------------

## 5. NEW

Un nouveau Component est initialement qualifié :

``` text
AUDIT À FAIRE
```

Lorsqu'un Audit applicable est terminé, son état d'Audit devient celui
issu de cet Audit.

------------------------------------------------------------------------

## 6. EVOLVED

Un Component ayant évolué doit être qualifié :

``` text
À ÉVALUER
```

Cette évolution ne signifie pas automatiquement :

``` text
ancien verdict invalide
```

ni :

``` text
nouvel Audit obligatoire
```

La Squad décide si l'évolution nécessite un nouvel Audit.

------------------------------------------------------------------------

## 7. UNCHANGED

Un Component inchangé peut conserver l'applicabilité d'un verdict
antérieur.

Cette applicabilité doit être représentée comme un héritage et non comme
un nouvel Audit fictif.

------------------------------------------------------------------------

## 8. DECOMMISSIONED

Un Component décommissionné :

-   reste présent dans l'historique des Versions où il était applicable
    ;
-   est exclu du périmètre actif après sa décommission.

La date et la représentation technique exactes de la décommission
restent à formaliser.

------------------------------------------------------------------------

## 9. Réactivation

La réactivation d'un Component décommissionné est possible mais
exceptionnelle.

Elle doit être explicite.

La représentation exacte de cette réactivation reste à instruire et ne
doit pas être déduite automatiquement d'une simple réapparition.

------------------------------------------------------------------------

## 10. Catalogue historique

Les indicateurs de couverture et de conformité d'une ancienne Version
doivent utiliser le Catalogue applicable à cette Version.

Une modification actuelle du Catalogue ne doit pas changer :

-   le nombre historique de Components ;
-   la couverture historique ;
-   les verdicts historiques.

La méthode de construction ou de conservation de ce Catalogue par
Version reste à définir.

------------------------------------------------------------------------

## 11. Audit applicable

Pour un `Component × Version`, l'information d'Audit peut provenir :

``` text
Audit direct
```

ou, lorsque les règles le permettent :

``` text
verdict hérité
```

Le dashboard doit pouvoir distinguer l'origine du verdict.

La représentation UX exacte de cette origine reste à préciser.

------------------------------------------------------------------------

## 12. Relations avec les Issues

Une Issue peut concerner :

``` text
0 Component
1 Component
n Components
```

selon sa nature.

En revanche :

``` text
Issue d'Audit
Anomalie d'Audit
Improvement d'Audit
```

concernent exactement un Component, identique dans la relation Audit →
sous-Issue.
