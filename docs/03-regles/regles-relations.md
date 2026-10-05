# Règles relationnelles

## Objectif

Les règles relationnelles contrôlent les liens et cardinalités entre
objets.

Elles ne doivent pas être confondues avec les règles de statut.

## Audit → Component

``` text
Audit
└── exactement 1 Component
```

Un Audit sans Component ou avec plusieurs Components est incohérent avec
le modèle établi.

## Audit → Anomaly

``` text
Audit
└── 0..n Anomalies

Anomaly
└── exactement 1 Audit parent
```

Cette relation est normative pour une Anomalie issue d'un Audit.

## Audit → Improvement

``` text
Audit
└── 0..n Improvements

Improvement
└── exactement 1 Audit parent
```

Cette relation est normative pour une Improvement issue d'un Audit.

## Cohérence du Component

Une Anomalie ou Improvement d'Audit doit porter le même Component que
son Audit parent.

## Issue → Component

Une Issue qui concerne un ou plusieurs Components doit porter les labels
Component correspondants.

Une Issue transverse peut légitimement n'avoir aucun Component.

L'absence de Component n'est donc pas, à elle seule, une erreur de
qualité.

## Issue multi-Component

Une Issue peut concerner plusieurs Components.

Elle est comptée :

-   une fois dans le total global distinct des Issues ;
-   une fois dans chacun des indicateurs Component concernés.

La somme des comptes par Component peut donc dépasser le nombre global
d'Issues distinctes.

## Issue → Pull Request

La présence d'une PR dépend du profil de workflow.

### STANDARD de code

Une PR est attendue dans le processus nominal de réalisation.

### EPIC

Pas de PR propre.

### AUDIT

Pas de PR propre.

### RELEASE

Une PR appartient au processus de publication décrit.

### CONCEPTION

Règle non établie.

La relation `Done → PR` ne doit donc pas être codée comme une
cardinalité universelle.

## Epic → sous-Issues

La source historique décrit des Epics contenant plusieurs sous-Issues et
propose une cardinalité `2..n`.

Cette cardinalité générale n'a pas encore été consolidée comme invariant
métier.

Elle reste une propriété de la source à instruire avant création d'une
règle DQ stricte.

## Relations absentes d'une fixture

Le validateur actuel peut détecter une référence vers une entité absente
du jeu de données.

Il faut distinguer deux cas :

``` text
référence réellement invalide
```

et :

``` text
référence valide mais entité hors périmètre de collecte
```

La politique générique entre erreur, warning et relation externe valide
reste à formaliser.

## Principe de traçabilité

Une relation incohérente ne doit pas être supprimée silencieusement du
RAW.

Le pipeline doit conserver les faits collectés et produire l'information
de qualité correspondante.
