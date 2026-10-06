# Audits

## 1. Principe

Un Audit évalue un Component dans un contexte de Version.

Le modèle doit conserver :

```text
Component
Version concernée
Version effectivement auditée
famille d'Audit
Issue d'Audit
résultat
temporalité
```

`Audit` est une spécialisation métier distincte qui référence l'`Issue`
générique par `issueId`. Les faits GitHub communs restent portés par
`Issue` et ne sont pas dupliqués dans `Audit`.

---

## 2. Cardinalité Component

Une Issue d'Audit concerne exactement un Component.

Les Anomalies et Improvements rattachés à cet Audit concernent le même
Component.

---

## 3. Audit réalisé

Une Issue d'Audit est considérée comme terminée lorsque :

```text
Project Status = Done
ET
GitHub Issue State = Closed
```

Le seul `Done` ou le seul `Closed` ne suffit pas.

La date métier de réalisation correspond à l'instant où la seconde
condition nécessaire (`Done` et `Closed`) devient satisfaite. Cette date
de réalisation reste distincte de `completedAt`, qui correspond à la
date du passage à `Done` conformément à D-141. Si l'historique Project
disponible ne permet pas de déterminer une date requise, aucune date
n'est inventée et une réserve Data Quality est produite.

---

## 4. Résultat

Pour un Audit réalisé :

```text
0 Anomalie
→ AUDITÉ & CONFORME

1..n Anomalies
→ AUDITÉ & NON CONFORME
```

Les Improvements n'affectent pas le verdict.

---

## 5. Audit pré-PROD

Dans le fonctionnement cible :

```text
Version effectivement auditée = M.m.r-rc.n
Version PROD cible            = M.m.r
```

L'Issue d'Audit évolue dans la Milestone `M.m.r`.

La RC réellement auditée est conservée séparément de la Version PROD
cible. Si elle ne peut pas être déterminée, elle reste absente et une
réserve Data Quality est produite ; aucune RC n'est inventée.

---

## 6. Audit de rattrapage

Après publication :

```text
Version effectivement auditée = M.m.r
Milestone possible            = M.m.r-Audit
```

Le résultat concerne la Version `M.m.r`, mais il a été obtenu après sa
publication.

Cette temporalité doit rester visible.

---

## 7. Plusieurs Audits pour Component × Version

Le verdict courant d'un couple `Component × Version` est calculé à
partir de **l'ensemble des Audits terminés applicables**.

Un Audit non terminé ne contribue pas à ce verdict et ne modifie pas le
verdict acquis.

La correction ou la fermeture d'une anomalie issue d'un Audit ne
rétablit pas à elle seule la conformité : un nouvel Audit terminé
applicable doit valider la conformité.

La présence de plusieurs Audits simultanément non terminés pour le même
`Component × Version` reste une situation anormale ; sa sévérité et son
traitement DQ seront formalisés dans le lot Data Quality.

---

## 8. Revalidation

La correction de toutes les Anomalies ne change pas automatiquement le
verdict de conformité.

```text
Anomalies toutes traitées
        ↓
revalidation attendue
        ↓
nouvel Audit terminé
        ↓
nouveau verdict
```

Le mécanisme opérationnel de déclenchement de cette revalidation reste à
préciser.

---

## 9. Héritage d'un verdict

Une nouvelle Version ne provoque pas automatiquement un nouvel Audit de
tous les Components.

Un verdict antérieur peut rester applicable selon la qualification du
Component et la décision de la Squad.

Il faut alors distinguer :

```text
Audit direct sur la Version
```

de :

```text
verdict hérité d'un Audit antérieur
```

L'héritage ne doit pas créer fictivement un Audit sur la nouvelle
Version.

---

## 10. Historique

Un Audit de rattrapage ou une revalidation enrichit la connaissance
actuelle.

Il ne modifie pas rétroactivement :

- les Audits réellement réalisés avant une Release ;
- la couverture connue à la Release ;
- le verdict connu à la Release.

---

## 11. Questions encore ouvertes

Restent notamment à instruire :

- notion de Campagne d'Audit ;
- représentation technique de la famille d'Audit ;
- mécanisme opérationnel de revalidation ;
- sévérité DQ de plusieurs Audits non terminés simultanés.

---

## Date de fin et effet historique

La date métier `completedAt` d'un Audit est la date à laquelle l'Issue d'Audit passe au statut Project `Done`, conformément à D-141.

```text
Audit.completedAt = date du passage à Done
```

L'Issue doit également être `Closed` pour que l'Audit soit réalisé. Dans le fonctionnement nominal, `Done` et `Closed` sont cohérents.

La réalisation métier de l'Audit exige également que l'Issue soit `Closed`. La réalisation n'est acquise qu'une fois les deux conditions satisfaites ; `completedAt` reste la date du passage à `Done`. Un Audit de rattrapage post-PROD ne doit pas être projeté rétroactivement sur la date de publication de la Version.

La date de début de l'Audit reste distincte et n'est pas définie par cette décision.

---

## Release Candidate auditée

Pour un Audit pré-PROD, deux informations complémentaires doivent être conservées :

```text
Milestone de l'Issue d'Audit
→ Version PROD cible M.m.r

Champ explicite de l'Issue d'Audit
→ Release Candidate réellement auditée M.m.r-rc.n
```

Exemple :

```text
Milestone              = 1.8.0
Release Candidate auditée = 1.8.0-rc.13
```

La Milestone fait partie du contexte de l'Audit et doit être prise en compte, mais elle ne permet pas à elle seule d'identifier la RC effectivement auditée.

La RC ne doit donc pas être déduite implicitement de la dernière RC Jenkins disponible ou de la seule Milestone.

Pour un Audit de rattrapage post-PROD, la Version auditée reste la Version PROD `M.m.r`; le besoin du champ RC concerne l'Audit pré-PROD.
