# Règles workflow

## Principe

Une règle workflow doit être évaluée dans son contexte.

Le minimum conceptuel est :

``` text
profil de workflow
+ Issue Type
+ Project Status
+ Labels
+ Iteration
+ Milestone
+ Velocity
+ relations
+ branche / Pull Request lorsque applicable
```

Le statut seul ne suffit pas.

## Profils utilisés pour la consolidation

Les profils candidats sont :

-   `STANDARD` ;
-   `EPIC` ;
-   `AUDIT` ;
-   `RELEASE` ;
-   `CONCEPTION`.

Leur formalisation définitive reste suivie par `Q-020`.

## STANDARD

Le nominal actuellement documenté est :

``` text
Backlog
→ Ready
→ In progress
→ In review
→ Done
```

`Blocked` est transversal.

`Cancelled` est une sortie terminale alternative.

### Backlog

Dans le nominal STANDARD :

-   `Grooming` présent ;
-   Velocity absente ;
-   pas d'Iteration ;
-   pas de Milestone ;
-   pas de branche ;
-   pas de PR.

### Ready

Dans le nominal STANDARD :

-   `Grooming` absent ;
-   Velocity `> 0` ;
-   pas encore de branche ;
-   pas encore de PR.

### In progress

Dans le nominal STANDARD :

-   Velocity `> 0` ;
-   Iteration attendue ;
-   Milestone attendue ;
-   assignee attendu ;
-   branche attendue lorsque le travail modifie le code.

### In review

Pour un travail STANDARD de code :

``` text
PR attendue
```

### Done

Pour un travail STANDARD de code, une PR mergée fait partie du processus
nominal de finalisation.

Cette règle ne doit pas être appliquée aux profils sans PR propre.

## EPIC

Les propriétés certaines ou explicitement décrites sont :

``` text
branche propre = non
PR propre      = non
Velocity       = non pesée dans la source
```

Les conditions exactes des transitions `Ready`, `In progress`,
`In review` et `Done` restent à formaliser.

## AUDIT

Un Audit ne correspond pas à une modification de code.

``` text
branche propre = non
PR propre      = non
```

Un Audit réalisé nécessite :

``` text
Done + Closed
```

La règle STANDARD `Done → PR` ne s'applique donc pas.

## RELEASE

Le workflow Release utilise des branches `release/*` ou `hotfix/*` et
une intégration vers une branche cible.

Ses transitions exactes ne sont pas encore suffisamment stabilisées pour
devenir des règles DQ strictes.

## CONCEPTION

Le profil Conception ne dispose pas encore d'une matrice normative
suffisamment complète.

Les règles STANDARD ne doivent pas lui être appliquées par défaut.

## Blocked

`Blocked` est transversal.

Une relation `Blocked by` vers une Issue non terminée peut justifier ce
statut.

La machine à états exacte reste à formaliser.

## Cancelled

Les propriétés génériques d'une Issue Cancelled restent ouvertes dans
`Q-022`.

Les DQ actuelles qui interdisent certaines relations doivent donc être
considérées comme des règles implémentées à réévaluer, pas comme des
invariants déjà validés.

## Conséquence pour la Data Quality

Une future règle workflow devrait expliciter au minimum :

``` text
ruleId
workflowProfile
status
condition
severity
metricImpact
```

Le profil doit être déterminé avant d'évaluer les contraintes
spécifiques au statut.
