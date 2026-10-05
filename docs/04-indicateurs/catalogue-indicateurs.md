# Catalogue des indicateurs

## 1. Rôle

Cette page décrit le **contrat analytique V2 actuellement implémenté**.

Elle ne constitue pas encore le catalogue métier V1 définitif. Les
besoins présents dans `specifications/indicateurs-souhaites.md` et les
décisions D-001 à D-136 seront consolidés en M3 avant d'être transformés
en nouvelles métriques.

La source exécutable du contrat actuel est :

``` text
src/analytics/catalog.ts
```

Chaque métrique produite doit être couverte par ce catalogue.

------------------------------------------------------------------------

## 2. Contrat d'une métrique

Le modèle actuel associe à une métrique :

``` text
id
value
unit
numerator
denominator
scope
period?
definition
sourceEntityIds
reliability
exclusions
breakdowns?
```

Les unités actuellement prévues sont :

``` text
count
percentage
days
```

Les périmètres prévus sont :

``` text
portfolio
library
component
audit
anomaly
```

Le catalogue qualifie également la nature analytique :

``` text
stock
ratio
duration
flow
```

------------------------------------------------------------------------

## 3. Portfolio

  -------------------------------------------------------------------------------
  Identifiant                     Nature                  Définition actuelle
  ------------------------------- ----------------------- -----------------------
  `portfolio.repositories`        stock                   nombre de Repositories
                                                          distincts effectivement
                                                          analysés

  `portfolio.libraries`           stock                   nombre de Librairies
                                                          analysées

  `portfolio.components`          stock                   nombre de Composants
                                                          actifs dans le
                                                          périmètre

  `portfolio.componentsAudited`   stock                   nombre de Composants
                                                          actifs disposant d'au
                                                          moins un Audit terminé

  `portfolio.auditCoverage`       ratio                   Composants actifs
                                                          disposant d'un Audit
                                                          terminé / Composants
                                                          actifs
  -------------------------------------------------------------------------------

La définition actuelle de `portfolio.auditCoverage` décrit le code
existant. Le modèle métier consolidé introduit une notion plus riche
d'Audit applicable et de Catalogue historique par Version ; la métrique
devra donc être réévaluée en M3 puis lors de la gap analysis.

------------------------------------------------------------------------

## 4. Audits

  ------------------------------------------------------------------------
  Identifiant              Nature                  Définition actuelle
  ------------------------ ----------------------- -----------------------
  `audit.completed`        stock                   Audits ayant atteint un
                                                   résultat exploitable

  `audit.conform`          stock                   Audits dont le résultat
                                                   objectif est conforme

  `audit.conditional`      stock                   Audits dont le résultat
                                                   objectif est
                                                   conditionnel

  `audit.nonConform`       stock                   Audits dont le résultat
                                                   objectif est non
                                                   conforme

  `audit.critical`         stock                   Audits dont le résultat
                                                   objectif est critique

  `audit.conformityRate`   ratio                   Audits conformes /
                                                   Audits terminés
  ------------------------------------------------------------------------

Les états `conditional` et `critical` appartiennent au modèle analytique
actuel. Ils ne doivent pas être confondus avec la définition métier
consolidée de la conformité d'un Composant × Version.

Le dashboard doit afficher numérateur et dénominateur avec un
pourcentage afin de rendre le ratio interprétable.

------------------------------------------------------------------------

## 5. Anomalies --- stocks

  ----------------------------------------------------------------------------------
  Identifiant                        Nature                  Définition actuelle
  ---------------------------------- ----------------------- -----------------------
  `anomaly.total`                    stock                   anomalies valides du
                                                             périmètre, hors
                                                             annulées

  `anomaly.open`                     stock                   anomalies actuellement
                                                             ouvertes ou rouvertes

  `anomaly.inProgress`               stock                   anomalies actuellement
                                                             en cours

  `anomaly.done`                     stock                   anomalies actuellement
                                                             terminées

  `anomaly.byCriticality.blocking`   stock                   anomalies de criticité
                                                             bloquante

  `anomaly.byCriticality.major`      stock                   anomalies de criticité
                                                             majeure

  `anomaly.byCriticality.minor`      stock                   anomalies de criticité
                                                             mineure

  `anomaly.criticalityCoverage`      ratio                   anomalies avec
                                                             criticité exploitable /
                                                             anomalies valides

  `anomaly.byCategory.*`             stock                   anomalies portant une
                                                             catégorie donnée

  `anomaly.correctedEver`            stock                   anomalies ayant déjà
                                                             atteint une première
                                                             correction métier

  `anomaly.reopened`                 stock                   anomalies actuellement
                                                             rouvertes

  `anomaly.cancelled`                stock                   anomalies annulées dans
                                                             les sources
  ----------------------------------------------------------------------------------

`anomaly.byCategory.*` est un contrat générique : chaque catégorie
concrète constitue une instance.

`anomaly.correctedEver` et `anomaly.reopened` sont des **états
observables dans un Snapshot**, pas des flux temporels.

------------------------------------------------------------------------

## 6. Anomalies --- délais

Les métriques actuellement déclarées sont :

``` text
anomaly.correctionDelay.average
anomaly.correctionDelay.median
anomaly.correctionDelay.p90
anomaly.backlog.oldestAge
```

Les trois premières utilisent actuellement le délai calendaire :

``` text
createdAt → firstDoneAt
```

Lorsqu'aucune observation exploitable n'est disponible, la valeur doit
être `unknown` et non `0`.

Cette définition décrit le code actuel. Les dates métier de détection et
de correction restent des sujets à consolider avant de considérer ces
délais comme les KPI métier définitifs.

------------------------------------------------------------------------

## 7. Anomalies --- flux

Les métriques de flux actuellement déclarées sont :

``` text
anomaly.flow.created
anomaly.flow.corrected
anomaly.flow.reopened
anomaly.flow.cancelled
```

Elles ne sont calculées que lorsqu'un Snapshot précédent comparable est
disponible.

Chaque flux porte une période :

``` text
period.from = capturedAt du Snapshot précédent
period.to   = capturedAt du Snapshot courant
```

Un flux représente donc une transition **observée entre deux états
collectés**. Il ne constitue pas automatiquement la date exacte de
l'événement GitHub.

------------------------------------------------------------------------

## 8. Stock et flux

La distinction est obligatoire :

``` text
stock
= état visible dans un Snapshot

flow
= changement observable entre deux Snapshots
```

Par exemple :

``` text
anomaly.correctedEver
```

signifie « déjà corrigée au moins une fois dans les données disponibles
».

À l'inverse :

``` text
anomaly.flow.corrected
```

signifie qu'une première correction est devenue observable entre deux
Snapshots comparables.

Le dashboard ne doit pas présenter un stock comme un flux sur une
période.

------------------------------------------------------------------------

## 9. Data Quality et fiabilité

Une règle DQ n'exclut pas automatiquement une entité de toutes les
métriques.

Les impacts sont appliqués métrique par métrique :

``` text
include
exclude
unknown
```

La métrique conserve :

-   son niveau de fiabilité ;
-   les identifiants des alertes qui la concernent ;
-   les exclusions appliquées.

Une incohérence portant sur une métrique ne doit donc pas, par principe
analytique, dégrader toutes les autres métriques.

Le Snapshot possède encore une fiabilité globale plus grossière dans
l'implémentation actuelle. Cette différence est documentée et sera
réévaluée lors de la gap analysis.

------------------------------------------------------------------------

## 10. Source de vérité analytique

Le contrat courant est :

``` text
Analytics.metrics
```

Les propriétés historiques telles que :

``` text
anomaliesDeclared
anomaliesCorrected
openAnomalies
auditsCoverage
conformityRate
averageCorrectionDelayDays
medianCorrectionDelayDays
```

sont des projections de compatibilité.

Elles sont marquées `deprecated` dans le modèle TypeScript et ne doivent
pas servir à implémenter de nouveaux calculs ou écrans.

------------------------------------------------------------------------

## 11. Besoin métier non couvert

Le catalogue actuel ne couvre qu'une partie du besoin exprimé.

Restent notamment à consolider :

-   métriques par Librairie et Composant ;
-   workflow et Sprint ;
-   Velocity ;
-   contributeurs ;
-   traitement des Anomalies d'Audit ;
-   couverture applicable et héritée ;
-   conformité Component × Version ;
-   qualité par Version ;
-   consommation des Packages et Components par les Applications ;
-   futurs indicateurs d'usage.

Ces éléments seront traités en M3 et ne doivent pas être inventés à
partir du catalogue technique actuel.
