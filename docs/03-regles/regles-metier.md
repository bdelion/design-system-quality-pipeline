# Règles métier

## Objectif

Les règles métier décrivent le domaine indépendamment des détails
techniques de GitHub.

Elles doivent provenir des décisions établies et non être déduites
automatiquement du code actuel.

## Audit réalisé

Un Audit est réalisé lorsque les deux conditions sont vraies :

``` text
Project Status = Done
ET
GitHub Issue State = Closed
```

Le seul statut `Done` ne suffit pas.

## Anomalie traitée

Une Anomalie est considérée comme traitée lorsque :

``` text
Project Status = Done
ET
GitHub Issue State = Closed
```

Une Anomalie traitée sort du stock d'Anomalies non traitées mais reste
dans l'historique.

## Audit et Anomalies

Un Audit possède :

``` text
0..n Anomalies
```

Chaque Anomalie d'Audit appartient à :

``` text
exactement 1 Audit parent
```

Une Anomalie détectée lors d'un nouvel Audit constitue une nouvelle
Anomalie, même si un problème similaire avait été observé lors d'un
Audit antérieur.

## Audit et Improvements

Un Audit possède :

``` text
0..n Improvements
```

Chaque Improvement d'Audit appartient à :

``` text
exactement 1 Audit parent
```

Une Improvement ne modifie pas le verdict de conformité de l'Audit.

## Anomalie et occurrence

Le comptage retenu est :

``` text
1 Issue GitHub qualifiée comme Anomalie
=
1 Anomalie comptée
```

Le pipeline ne doit pas essayer d'extraire plusieurs occurrences d'une
Anomalie depuis le corps ou les commentaires de l'Issue.

## Composant d'un Audit

Un Audit concerne exactement un Component.

Les Anomalies et Improvements issus de cet Audit concernent le même
Component.

## Criticité RGAA

Pour une Anomalie d'un Audit Accessibilité :

-   exactement une criticité RGAA est attendue ;
-   la criticité RGAA est réservée aux Anomalies d'Audit Accessibilité.

Elle ne doit pas être confondue avec d'autres domaines de priorité ou
criticité.

## Catégorie a11y

Pour une Anomalie d'un Audit Accessibilité :

``` text
exactement 1 label a11y
```

Pour une Improvement d'Audit :

-   un label a11y est facultatif ;
-   plusieurs labels a11y sont actuellement tolérés ;
-   la cardinalité cible reste à préciser.

## Conformité d'un Audit

Pour un Audit Accessibilité réalisé :

``` text
0 Anomalie
→ conforme

1..n Anomalies
→ non conforme
```

Les Improvements n'entrent pas dans ce verdict.

## Revalidation

La correction de toutes les Anomalies d'un Audit ne transforme pas
rétroactivement son verdict en conforme.

Une nouvelle validation nécessite un nouvel Audit.

## Issues Cancelled

Une Issue `Cancelled` peut représenter plusieurs situations.

Un cas métier est établi : une remontée client analysée comme erreur
d'intégration exclusivement côté client est conservée pour le pilotage
mais ne constitue pas une Anomalie intrinsèque du Design System.

En revanche, les interdictions génériques telles que :

``` text
Cancelled → aucune PR
Cancelled → aucune Milestone
```

ne sont pas encore établies comme invariants métier.

Elles correspondent aujourd'hui à certaines règles DQ implémentées et
doivent être analysées séparément dans le cadre de `Q-022`.

## Workflow

Les règles suivantes ne sont pas des invariants métier universels :

``` text
Done → PR obligatoire
Grooming → Velocity absente
In progress → branche obligatoire
```

Elles dépendent du profil de workflow.

Voir `docs/02-workflow/` et [Règles workflow](regles-workflow.md).

------------------------------------------------------------------------

## Identification d'une Anomalie

### Hors Audit

``` text
Issue Type = 🐛 Bug
ET absence de relation de sub-Issue vers un Audit d'origine
→ Anomalie hors Audit
```

### Issue d'un Audit

``` text
Issue Type = 🐛 Bug
ET sub-Issue d'un Audit
→ Anomalie issue d'un Audit
```

La relation d'Audit qualifie l'origine de l'Anomalie ; elle ne crée pas
une autre nature d'objet.

Les contraintes spécifiques RGAA --- criticité, catégorie a11y et
Component identique à l'Audit --- s'appliquent aux Anomalies d'Audit
Accessibilité et ne doivent pas être imposées aux Anomalies hors Audit.

------------------------------------------------------------------------

## Origine d'une Anomalie

En V1 :

``` text
Issue Type = 🐛 Bug
ET sub-Issue d'un Audit
→ origine = AUDIT

Issue Type = 🐛 Bug
ET pas sub-Issue d'un Audit
→ origine = HORS_AUDIT
```

`HORS_AUDIT` est une origine terminale pour les règles V1 : aucune
sous-catégorie ne doit être inférée à partir de l'auteur, des labels, de
l'équipe ou du contenu de l'Issue.

Une classification plus fine est réservée à une évolution V2 après
définition explicite des dimensions métier et des sources fiables.

------------------------------------------------------------------------

## Date de détection d'une Anomalie

La date de détection utilisée par le modèle et les indicateurs est la
date de création GitHub de l'Issue `🐛 Bug` représentant l'Anomalie.

``` text
detectedAt = issue.createdAt
```

Aucune date antérieure supposée de constatation ne doit être inférée.

------------------------------------------------------------------------

## Date de correction d'une Anomalie

La date de correction utilisée par le modèle et les indicateurs est la
date du passage de l'Issue `🐛 Bug` au statut Project `Done`.

``` text
correctedAt = date du passage à Done
```

Dans le fonctionnement nominal, le passage à `Done`, la fermeture
GitHub (`Closed`) et le merge de la Pull Request de correction doivent
être cohérents.

La date de `Closed` et la date de merge ne se substituent pas à la date
de `Done` pour calculer `correctedAt`. Une incohérence entre ces
événements doit être signalée comme un problème de qualité des données.

------------------------------------------------------------------------

## Date de fin d'un Audit

Un Audit est réalisé lorsque son Issue est simultanément `Done` et `Closed`.

Sa date métier de fin est la date du passage au statut Project `Done` :

``` text
completedAt = date du passage à Done
```

La fermeture GitHub doit être cohérente avec cet événement, mais ne s'y substitue pas comme référence temporelle. À `completedAt`, le Component devient audité pour les indicateurs historiques. Un écart entre `Done` et `Closed` relève de la qualité des données.

Cette règle ne définit pas la date de début de l'Audit.

------------------------------------------------------------------------

## Identification de la Release Candidate auditée

Pour un Audit pré-PROD :

``` text
Version cible = Milestone de l'Issue d'Audit
RC auditée    = champ explicite de l'Issue d'Audit
```

La cohérence entre les deux doit être contrôlée. Par exemple :

``` text
Milestone = 1.8.0
RC auditée = 1.8.0-rc.13
→ cohérent
```

La RC auditée ne doit pas être inférée à partir de la dernière RC construite par Jenkins.

L'absence du champ explicite sur un Audit pré-PROD empêche d'identifier précisément l'artefact audité et doit être traitée comme une information manquante / un problème de qualité des données.

------------------------------------------------------------------------

## Catalogue historique d'une Version

Pour toute Version PROD `M.m.r`, le Catalogue historique de référence
est obtenu depuis le contenu du Repository au Git tag `M.m.r`.

``` text
historicalCatalogue(M.m.r)
= catalogue extrait du Repository au tag M.m.r
```

La présence ultérieure, la modification ou la suppression d'un
Component dans le Catalogue courant ne doit pas modifier le périmètre
historique d'une Version déjà publiée.

