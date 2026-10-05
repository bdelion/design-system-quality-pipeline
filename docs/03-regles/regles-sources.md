# Règles de disponibilité des sources

## Principe

Une source externe indisponible ne signifie pas que toutes les données
du Snapshot sont invalides.

La conséquence dépend des métriques qui nécessitent réellement cette
source.

``` text
source indisponible
    ↓
capacités devenues inconnues
    ↓
métriques concernées
```

## GitHub

GitHub fournit actuellement l'essentiel des données opérationnelles :

-   repositories ;
-   Issues ;
-   labels ;
-   relations ;
-   statuts Project ;
-   Milestones ;
-   Pull Requests.

Une collecte GitHub incomplète doit être distinguée d'une absence métier
réelle.

Par exemple :

``` text
entité non collectée
≠
entité inexistante
```

## Catalogue

Le Catalogue est une source de référence distincte de GitHub.

Son indisponibilité ou son incomplétude affecte principalement les
usages qui dépendent de la liste de référence des Components et de leur
historique.

## Nexus

Le modèle RAW actuel contient :

``` text
nexusAvailable
```

`DQ-009` est produit lorsque cette valeur vaut `false`.

### Comportement actuel

``` text
severity = WARNING
action   = include
```

La règle cherche à rendre visible l'absence de preuve externe liée aux
releases.

### Divergence technique actuelle

La table d'impacts associe `DQ-009` à :

``` text
portfolio.release.*
```

mais ce préfixe n'est pas présent dans le catalogue V2 observé.

Il existe donc une intention d'impact sur des métriques de release sans
correspondance démontrée dans le catalogue actuel.

Ce constat n'est pas une décision de refonte.

## Jenkins

Jenkins produit les artefacts et suffixes de Version selon le type de
branche.

Les données Jenkins sont utiles pour établir précisément certains
événements de build ou de publication, mais leur mode de collecte par le
pipeline reste à définir lorsque ces informations ne sont pas présentes
dans GitHub.

## Release GitHub

Une Release GitHub est normalement créée pour une Version PROD selon les
informations recueillies.

Son caractère obligatoire et son rôle exact comme source de vérité
restent à confirmer.

Elle ne doit donc pas être utilisée seule comme preuve universelle de
PROD à ce stade.

## Règle cible

Une règle de disponibilité de source devrait indiquer explicitement :

``` text
source
capacité affectée
métriques concernées
conséquence : include / exclude / unknown
```

Elle ne doit pas dégrader des métriques indépendantes de cette source.
