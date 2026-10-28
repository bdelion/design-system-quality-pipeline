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

**ÉTABLI — D-047 :** la date de réalisation est l'instant où la seconde condition nécessaire (`Done` et `Closed`) est satisfaite. Cette décision reste la référence métier du registre. D-238 concerne la cardinalité des composants des anomalies hors audit ; elle ne définit aucune date d'audit.

**IMPLÉMENTÉ — contrat V3 :** `auditCompletedAt` conserve la dernière transition Project `Done` connue, même si la fermeture GitHub intervient ensuite. Sans cette date, l'audit peut être terminé mais sa date de réalisation reste inconnue (DQ-012) ; `closedAt` ne la remplace jamais. Un audit annulé ne contribue ni aux résultats d'audits terminés ni aux cohortes applicables.

**ÉCART À ARBITRER :** lorsque la fermeture GitHub intervient après Done, le calcul actuel et D-047 ne désignent pas le même instant. Cette différence est documentée ; elle ne vaut ni amendement de D-047 ni autorisation de migration du code.

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

La date métier de fin d'un Audit est la date à laquelle l'Issue d'Audit passe au statut Project `Done`.

```text
Audit.completedAt = date du passage à Done
```

L'Issue doit également être `Closed` pour que l'Audit soit réalisé. Dans le fonctionnement nominal, `Done` et `Closed` sont cohérents.

À partir de `completedAt`, le Component est considéré comme audité dans la connaissance disponible à cet instant. Un Audit de rattrapage post-PROD ne doit donc pas être projeté rétroactivement sur la date de publication de la Version.

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

## Amendement de terminaison et restitution — D-244

**CLARIFICATION CONFIRMÉE le 28 octobre 2026 — D-223, D-227 et D-228 :** le
résultat de la cohorte d’audits terminés applicable au composant et à la version
prévaut. Les anomalies hors audit restent visibles mais ne remplacent pas ce
verdict, y compris si leur correction ou annulation manque de preuves. Sans
audit terminé applicable, le verdict reste NON_COUVERT ; un audit futur ou en
cours ne suffit pas à le rendre NON_CONFORME. Les anomalies pertinentes issues
des audits applicables restent prises en compte selon D-224 et D-226.

**DÉCIDÉ le 19 octobre 2026** : le statut Project Done suffit à considérer l’audit terminé ; Closed n’est plus une condition supplémentaire. Cet amendement de D-047 ne fabrique pas de date manquante. La synthèse privilégie la version auditée terminée la plus élevée. Un audit a un seul composant et les anomalies sont rattachées par leurs propres labels. Voir les [règles de vérification des corrections](../08-implementation/validation-metier-20261019.md).
