# Règles référentielles

## Catalogue des Components

Le Catalogue constitue le référentiel des Components.

Un Component observé dans GitHub peut être rapproché de ce référentiel
pendant la normalisation.

Le modèle doit distinguer :

``` text
Component connu du Catalogue
```

de :

``` text
Component découvert mais absent du Catalogue
```

## DQ-006 actuelle

La règle `DQ-006` signale actuellement un Component dont :

``` text
discoverySource = suggested
```

avec :

``` text
severity = WARNING
action   = include
```

Cette règle décrit le comportement actuel du logiciel.

## Absence du Catalogue

La présence d'un Component absent du Catalogue ne doit pas être
interprétée automatiquement comme une donnée inutilisable.

Le Component reste visible et peut être exploité par certains
indicateurs.

En revanche, les indicateurs qui dépendent explicitement du Catalogue
peuvent avoir une fiabilité dégradée ou un périmètre incomplet.

L'impact doit donc être défini métrique par métrique.

## Catalogue historique

Pour les indicateurs historiques de couverture :

``` text
Version
→ Catalogue applicable à cette Version
→ dénominateur historique
```

Une modification ultérieure du Catalogue ne doit pas modifier
rétroactivement le dénominateur d'une ancienne Version.

Le mécanisme technique de construction de ce Catalogue historique reste
à instruire.

## Versions et Milestones

Le pipeline doit distinguer :

``` text
Milestone brute
```

de :

``` text
Version normalisée
```

Exemple :

``` text
1.1.0
1.1.0-Audit
```

peuvent désigner la même Version normalisée :

``` text
1.1.0
```

si le suffixe d'Audit est configuré comme tel.

`1.1.0-Audit` reste toutefois une Milestone différente dans GitHub.

## Suffixes

Le suffixe utilisé pour une Milestone d'Audit doit être configurable.

Il ne doit pas être codé en dur comme unique convention possible.

## Principe

Une règle référentielle doit préciser quel indicateur dépend réellement
du référentiel.

Une alerte sur le Catalogue ne doit pas dégrader automatiquement toutes
les métriques `portfolio.*`.
