# Audits

## 1. Objectif

Ce document décrit les concepts métier liés aux Audits du Design System.

Les Audits constituent un domaine distinct :

- du cycle de développement ;
- du cycle de publication ;
- du traitement des Anomalies résultant éventuellement de l'Audit.

La seule famille d'Audit actuellement pratiquée et identifiée est l'**Accessibilité**.

---

## 2. Audit

Un **Audit** est une opération structurée d'évaluation d'un périmètre du Design System.

Un Audit peut notamment porter sur :

- une Librairie ;
- une Version ou une Release Candidate ;
- un ou plusieurs Composants.

Dans le fonctionnement actuel, une Issue d'Audit est créée pour chaque Composant à auditer.

Un Audit peut produire :

- aucune Anomalie ;
- une ou plusieurs Anomalies ;
- éventuellement des propositions d'Amélioration.

---

## 3. Nature de l'Issue et famille d'Audit

Deux notions doivent être distinguées.

### Nature de l'Issue

La nature indique que l'Issue représente un travail d'Audit.

La cible souhaitée est :

```text
Issue Type = 🔍 Audit
```

### Famille d'Audit

La famille indique le domaine évalué par l'Audit.

La seule famille actuellement pratiquée est :

```text
Accessibilité
```

Le modèle cible est donc conceptuellement :

```text
Issue
├── nature          : Audit
├── famille d'Audit : Accessibilité
└── Composant       : xxx
```

---

## 4. RGAA, WCAG et WAI-ARIA

Lors des Audits d'Accessibilité actuels, l'auditeur traite a priori ensemble les problématiques relatives :

- au RGAA ;
- aux WCAG ;
- à WAI-ARIA.

Il n'est pas établi aujourd'hui que ces trois notions doivent constituer des familles d'Audit distinctes.

Le fonctionnement observé conduit pour l'instant à les regrouper sous la famille métier :

```text
Accessibilité
```

Le détail exact :

- des référentiels utilisés ;
- des versions de ces référentiels ;
- des critères contrôlés ;
- de la méthode de contrôle ;

reste à confirmer avec l'auditeur.

---

## 5. Identification actuelle d'une Issue d'Audit

Aujourd'hui, une Issue d'Audit d'Accessibilité est identifiée par le label :

```text
Audit RGAA
```

Le Composant concerné est identifié par :

```text
🧩 Component:xxx
```

Exemple :

```text
Issue
├── label : Audit RGAA
└── label : 🧩 Component:Button
```

Le nom actuel du label ne signifie pas que l'Audit se limite nécessairement au seul RGAA.

---

## 6. Identification cible d'une Issue d'Audit

La cible souhaitée est d'utiliser :

```text
Issue Type = 🔍 Audit
```

Conceptuellement :

```text
Issue
├── Issue Type : 🔍 Audit
├── famille    : Accessibilité
└── Composant  : 🧩 Component:xxx
```

Le mécanisme technique permettant de représenter la famille d'Audit n'est pas encore décidé.

---

## 7. Grille d'Audit

L'auditeur dispose probablement d'une grille ou checklist de critères à contrôler.

Cette grille n'est actuellement :

- pas connue précisément ;
- pas documentée dans le présent modèle ;
- pas identifiée comme source du pipeline.

Il reste notamment à déterminer :

- son format ;
- son emplacement ;
- son contenu ;
- les référentiels qu'elle couvre ;
- les informations qui doivent éventuellement être remontées dans GitHub.

---

## 8. Template d'Issue d'Audit

À terme, il est souhaité de mettre en place un template d'Issue pour les Audits.

L'objectif est de fournir le minimum vital nécessaire :

- au pilotage ;
- à la traçabilité ;
- à la compréhension de l'Audit ;
- à l'exploitation des données par le dashboard.

Le template n'a pas nécessairement vocation à remplacer la grille complète utilisée par l'auditeur.

---

## 9. Issue d'Audit et Composant

Le fonctionnement souhaité repose sur une Issue d'Audit par Composant à auditer.

```text
Composant
    │
    └── Issue d'Audit
```

Aujourd'hui, le Composant est identifié par :

```text
🧩 Component:xxx
```

La règle exacte concernant le nombre de labels Component autorisés reste à formaliser.

---

## 10. Fin d'un Audit

Dans le fonctionnement actuel, l'Audit d'un Composant est considéré comme réalisé lorsque les deux conditions suivantes sont satisfaites :

```text
Project Status = Done
ET
GitHub Issue State = Closed
```

Conceptuellement :

```text
Issue d'Audit
├── status = Done
└── state  = Closed
        │
        ▼
AUDIT RÉALISÉ
```

Le seul statut `Done` n'est donc pas suffisant.

Le seul état GitHub `Closed` n'est pas suffisant non plus.

Les deux informations sont combinées.

---

## 11. Résultat de conformité

Le résultat de conformité n'est actuellement pas déclaré explicitement par l'auditeur dans un champ dédié.

Il est déduit des relations entre l'Issue d'Audit et ses sub-Issues d'Anomalie.

Lorsque l'Audit est réalisé :

```text
Issue d'Audit
├── Done
├── Closed
└── aucune sub-Issue d'Anomalie
        │
        ▼
COMPOSANT CONFORME
```

Lorsque l'Audit est réalisé et qu'au moins une sub-Issue d'Anomalie existe :

```text
Issue d'Audit
├── Done
├── Closed
└── ≥ 1 sub-Issue d'Anomalie
        │
        ▼
COMPOSANT NON CONFORME
```

La conformité est donc actuellement **calculée** et non explicitement déclarée.

---

## 12. États de conformité

Les états minimaux sont :

```text
NON AUDITÉ
AUDITÉ & CONFORME
AUDITÉ & NON CONFORME
```

La règle actuelle peut être représentée ainsi :

| Audit Done | Issue Closed | Sub-Issue d'Anomalie | État |
|---|---|---|---|
| non | peu importe | peu importe | NON AUDITÉ |
| oui | non | peu importe | NON AUDITÉ |
| oui | oui | aucune | AUDITÉ & CONFORME |
| oui | oui | au moins une | AUDITÉ & NON CONFORME |

Cette table représente le fonctionnement actuellement établi.

Des états intermédiaires ou incohérents pourront éventuellement être introduits ultérieurement par le moteur de qualité des données.

---

## 13. Nature des sub-Issues

La règle de conformité dépend de la présence de **sub-Issues d'Anomalie**.

Il reste donc nécessaire de définir précisément comment une sub-Issue est reconnue comme une Anomalie.

Une simple présence de sub-Issue ne doit pas être assimilée automatiquement à une non-conformité tant qu'il n'est pas établi que toutes les sub-Issues d'une Issue d'Audit représentent nécessairement des Anomalies.

Ce point doit être instruit avant l'implémentation de la règle de calcul.

---

## 14. Fonctionnement cible des Audits

Le comportement cible est de réaliser les Audits avant la création de la Version PROD finale.

Les Issues d'Audit des Composants évoluent dans la Milestone correspondant à la future Version PROD.

```text
Milestone 1.1.0
    ├── Issue Audit composant A
    ├── Issue Audit composant B
    └── Issue Audit composant C
```

L'Audit est réalisé sur une Release Candidate :

```text
Release Candidate 1.1.0-rc.n
        ↓
Audits
        ↓
Version PROD 1.1.0
```

---

## 15. Audit pré-PROD

Un Audit pré-PROD est réalisé sur une Release Candidate avant la publication de la Version PROD finale.

```text
Version auditée : M.m.r-rc.n
Version cible   : M.m.r
Milestone       : M.m.r
```

---

## 16. Audit de rattrapage

Une Milestone :

```text
M.m.r-Audit
```

correspond à un mécanisme de rattrapage lorsque les Audits n'ont pas été réalisés avant la publication de la Version PROD.

`M.m.r-Audit` ne représente pas une nouvelle Version.

---

## 17. Anomalies découvertes pendant un Audit

Les Anomalies découvertes pendant l'Audit sont représentées comme des sub-Issues liées à l'Issue d'Audit.

Conceptuellement :

```text
Issue d'Audit
    │
    ├── Sub-Issue Anomalie A
    ├── Sub-Issue Anomalie B
    └── ...
```

Ces Anomalies suivent ensuite leur propre cycle :

```text
Anomalie
    ↓
Grooming
    ↓
Pesée
    ↓
Planification
    ├── Milestone
    └── Sprint
```

La relation de sub-Issue permet de conserver l'origine de l'Anomalie même lorsque celle-ci est ensuite planifiée dans une autre Milestone.

---

## 18. Version auditée et Version cible

Dans un Audit pré-PROD :

```text
Version effectivement auditée : M.m.r-rc.n
Version PROD cible             : M.m.r
```

Dans un Audit de rattrapage :

```text
Version effectivement auditée : M.m.r
Version PROD concernée         : M.m.r
```

---

## 19. Couverture d'Audit

```text
Couverture d'Audit
=
nombre de Composants audités
/
nombre total de Composants du périmètre
```

Un Composant est considéré comme audité lorsque son Issue d'Audit est à la fois :

```text
Done + Closed
```

Le périmètre exact du dénominateur reste à définir.

---

## 20. Taux de conformité

```text
Taux de conformité
=
nombre de Composants conformes
/
nombre de Composants audités
```

Un Composant audité est actuellement considéré comme conforme lorsqu'aucune sub-Issue d'Anomalie n'est liée à son Issue d'Audit.

Un Composant non audité ne doit pas être comptabilisé comme non conforme.

---

## 21. Historisation

L'historisation doit permettre de distinguer :

- Audit réalisé avant la PROD ;
- Audit de rattrapage ;
- Version ou Release Candidate effectivement auditée ;
- famille d'Audit ;
- Composant audité ;
- date à laquelle l'Audit est devenu Done et Closed ;
- résultat de conformité calculé ;
- Anomalies découvertes ;
- évolution ultérieure de ces Anomalies.

Le résultat connu à un instant donné ne doit pas être réécrit rétroactivement à partir d'informations apparues plus tard.

---

## 22. Principes retenus

1. Une Issue d'Audit correspond à un Composant à auditer.
2. Aujourd'hui, une Issue d'Audit d'Accessibilité est identifiée par `Audit RGAA`.
3. Le Composant est identifié par `🧩 Component:xxx`.
4. La cible souhaitée est `Issue Type = 🔍 Audit`.
5. L'Accessibilité est la seule famille d'Audit actuellement pratiquée.
6. RGAA, WCAG et WAI-ARIA sont actuellement traités ensemble par l'auditeur.
7. Un Audit est considéré comme réalisé lorsque l'Issue d'Audit est `Done` et `Closed`.
8. La conformité n'est actuellement pas explicitement déclarée.
9. Un Composant audité sans sub-Issue d'Anomalie est considéré comme conforme.
10. Un Composant audité avec au moins une sub-Issue d'Anomalie est considéré comme non conforme.
11. Les Anomalies découvertes sont reliées à l'Issue d'Audit sous forme de sub-Issues.
12. Ces Anomalies suivent ensuite leur propre workflow de Grooming, pesée et planification.
13. Un template GitHub minimal d'Issue d'Audit est souhaité à terme.
14. Le fonctionnement cible est l'Audit pré-PROD sur une Release Candidate.
15. `M.m.r-Audit` constitue un mécanisme de rattrapage.

---

## 23. Points restant à préciser

Les points suivants restent à instruire :

- le contenu réel de la grille utilisée par l'auditeur ;
- le minimum d'informations du futur template ;
- comment reconnaître précisément une sub-Issue comme Anomalie ;
- si toutes les sub-Issues d'une Issue d'Audit sont nécessairement des Anomalies ;
- si une Issue d'Audit doit obligatoirement avoir exactement un Composant ;
- comment identifier la Release Candidate auditée ;
- quelle date exacte représente la fin de l'Audit ;
- comment traiter les incohérences entre `Done` et `Closed` ;
- comment gérer plusieurs Audits successifs du même Composant ;
- comment la correction ultérieure des Anomalies influence l'état de conformité historique ou courant du Composant.