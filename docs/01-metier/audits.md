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

Un Audit peut produire :

- un résultat de conformité ;
- des Anomalies ;
- des propositions d'Amélioration.

---

## 3. Nature de l'Issue et famille d'Audit

Deux notions doivent être distinguées.

### Nature de l'Issue

La nature indique que l'Issue représente un travail d'Audit.

La cible souhaitée est :

```text id="8zvwgy"
Issue Type = 🔍 Audit
```

### Famille d'Audit

La famille indique le domaine évalué par l'Audit.

La seule famille actuellement pratiquée est :

```text id="7ek56v"
Accessibilité
```

Le modèle cible est donc conceptuellement :

```text id="cw5lao"
Issue
├── nature         : Audit
├── famille d'Audit: Accessibilité
└── Composant      : xxx
```

Cette séparation permet de ne pas confondre la nature du travail avec le domaine évalué.

---

## 4. RGAA, WCAG et WAI-ARIA

Lors des Audits d'Accessibilité actuels, l'auditeur traite a priori ensemble les problématiques relatives :

- au RGAA ;
- aux WCAG ;
- à WAI-ARIA.

Il n'est pas établi aujourd'hui que ces trois notions doivent constituer des familles d'Audit distinctes.

Au contraire, le fonctionnement observé conduit pour l'instant à les regrouper sous la famille métier :

```text id="25h1y9"
Accessibilité
```

Le détail exact :

- des référentiels utilisés ;
- des versions de ces référentiels ;
- des critères contrôlés ;
- de la méthode de contrôle ;

reste à confirmer avec l'auditeur.

Le modèle ne doit donc pas encore imposer une structure détaillée RGAA / WCAG / WAI-ARIA.

---

## 5. Identification actuelle d'une Issue d'Audit

Aujourd'hui, une Issue d'Audit d'Accessibilité est identifiée par le label :

```text id="2ijmo1"
Audit RGAA
```

Le Composant concerné est identifié par :

```text id="c4bg17"
🧩 Component:xxx
```

Exemple :

```text id="m2f9nx"
Issue
├── label : Audit RGAA
└── label : 🧩 Component:Button
```

Le nom actuel du label ne signifie pas que l'Audit se limite nécessairement au seul RGAA.

L'auditeur traite a priori l'Accessibilité de manière plus globale.

---

## 6. Identification cible d'une Issue d'Audit

La cible souhaitée est d'utiliser :

```text id="xztl8c"
Issue Type = 🔍 Audit
```

Conceptuellement :

```text id="20xi7x"
Issue
├── Issue Type     : 🔍 Audit
├── famille        : Accessibilité
└── Composant      : 🧩 Component:xxx
```

Le mécanisme technique permettant de représenter la famille d'Audit n'est pas encore décidé.

---

## 7. Pourquoi séparer Audit et famille d'Audit

Un Issue Type spécifique à chaque domaine conduirait potentiellement à multiplier les Issue Types :

```text id="zz8kes"
Audit Accessibilité
Audit Performance
Audit Sécurité
Audit ...
```

La cible envisagée préfère séparer :

```text id="boz88j"
Nature
└── 🔍 Audit

Famille
├── Accessibilité
└── autres familles futures éventuelles
```

À ce jour, aucune autre famille que l'Accessibilité n'est réellement pratiquée.

Des Audits de Sécurité, Performance, Qualité UI ou autres pourraient éventuellement être envisagés ultérieurement, mais ils ne constituent pas actuellement des besoins métier établis.

---

## 8. Grille d'Audit

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

Il ne faut pas reproduire cette grille dans le modèle sans l'avoir étudiée.

---

## 9. Template d'Issue d'Audit

À terme, il est souhaité de mettre en place un template d'Issue pour les Audits.

L'objectif de ce template est de fournir le **minimum vital** nécessaire :

- au pilotage ;
- à la traçabilité ;
- à la compréhension de l'Audit ;
- à l'exploitation des données par le dashboard.

Le template n'a pas nécessairement vocation à remplacer la grille complète utilisée par l'auditeur.

Conceptuellement :

```text id="48v0lc"
Grille / checklist de l'auditeur
        │
        └── détail des contrôles
                  │
                  ▼
          réalisation de l'Audit
                  │
                  ▼
Issue GitHub d'Audit
        │
        └── informations minimales
            de pilotage et traçabilité
```

Le contenu exact du template reste à définir.

---

## 10. Issue d'Audit et Composant

Le fonctionnement souhaité repose sur une Issue d'Audit par Composant à auditer.

```text id="quq2jo"
Composant
    │
    └── Issue d'Audit
```

Aujourd'hui, le Composant est identifié par :

```text id="1n4fqv"
🧩 Component:xxx
```

La règle exacte concernant le nombre de labels Component autorisés reste à formaliser.

---

## 11. Fonctionnement cible des Audits

Le comportement cible est de réaliser les Audits avant la création de la Version PROD finale.

Les Issues d'Audit des Composants évoluent dans la Milestone correspondant à la future Version PROD.

```text id="7bjzhx"
Milestone 1.1.0
    │
    ├── Issue Audit composant A
    ├── Issue Audit composant B
    └── Issue Audit composant C
```

L'Audit est réalisé sur une Release Candidate de cette future Version.

```text id="ilzhvu"
Release Candidate 1.1.0-rc.n
        │
        ▼
Audits des composants
        │
        ▼
Version PROD finale 1.1.0
```

---

## 12. Audit pré-PROD

Un Audit pré-PROD est réalisé sur une Release Candidate avant la publication de la Version PROD finale.

```text id="chfuse"
Version auditée : M.m.r-rc.n
Version cible   : M.m.r
Milestone       : M.m.r
```

---

## 13. Audit de rattrapage

Une Milestone :

```text id="y9agmy"
M.m.r-Audit
```

correspond à un mécanisme de rattrapage.

Elle est utilisée lorsque les Audits n'ont pas été réalisés avant la publication de la Version PROD.

`M.m.r-Audit` ne représente pas une nouvelle Version.

---

## 14. Contenu d'une Milestone de rattrapage

Une Milestone `M.m.r-Audit` contient uniquement les Issues d'Audit des Composants.

Les Anomalies découvertes pendant les Audits suivent ensuite leur propre workflow.

---

## 15. Anomalies découvertes pendant un Audit

Une Anomalie découverte pendant un Audit passe ensuite par :

```text id="og1sgn"
Audit
    ↓
Anomalie détectée
    ↓
Grooming
    ↓
Pesée
    ↓
Planification
    ├── Milestone
    └── Sprint
```

Le travail d'Audit et le travail de correction sont deux processus distincts.

---

## 16. Version auditée et Version cible

Dans un Audit pré-PROD :

```text id="x6q1ct"
Version effectivement auditée : M.m.r-rc.n
Version PROD cible             : M.m.r
```

Dans un Audit de rattrapage :

```text id="ojjren"
Version effectivement auditée : M.m.r
Version PROD concernée         : M.m.r
```

---

## 17. États de conformité

Pour un Composant dans un contexte d'Audit donné, les états minimaux identifiés sont :

```text id="hbxyn8"
NON AUDITÉ
AUDITÉ & CONFORME
AUDITÉ & NON CONFORME
```

Un Composant non audité ne doit pas être considéré automatiquement comme non conforme.

---

## 18. Couverture d'Audit

```text id="07veth"
Couverture d'Audit
=
nombre de Composants audités
/
nombre total de Composants du périmètre
```

Le périmètre exact du dénominateur reste à définir.

---

## 19. Taux de conformité

```text id="oas808"
Taux de conformité
=
nombre de Composants conformes
/
nombre de Composants audités
```

---

## 20. Traçabilité des Anomalies

Une Anomalie découverte lors d'un Audit doit pouvoir conserver sa provenance :

```text id="heihu5"
Anomalie
    │
    └── découverte lors de
          │
          └── Issue d'Audit
                │
                └── Composant
```

---

## 21. Historisation

L'historisation doit permettre de distinguer :

- Audit réalisé avant la PROD ;
- Audit de rattrapage ;
- Version ou Release Candidate effectivement auditée ;
- famille d'Audit ;
- Composant audité ;
- résultat connu à un instant donné ;
- Anomalies découvertes.

---

## 22. Principes retenus

1. Une Issue d'Audit correspond à un Composant à auditer.
2. Aujourd'hui, une Issue d'Audit d'Accessibilité est identifiée par le label `Audit RGAA`.
3. Aujourd'hui, le Composant est identifié par `🧩 Component:xxx`.
4. La cible souhaitée est `Issue Type = 🔍 Audit`.
5. `Audit` et `Accessibilité` représentent deux dimensions distinctes.
6. L'Accessibilité est la seule famille d'Audit actuellement pratiquée.
7. RGAA, WCAG et WAI-ARIA sont actuellement traités ensemble par l'auditeur dans le cadre de l'Audit d'Accessibilité.
8. Leur modélisation détaillée reste à instruire.
9. L'auditeur dispose probablement d'une grille de contrôle qui reste à identifier.
10. Un template GitHub minimal d'Issue d'Audit est souhaité à terme.
11. Ce template n'a pas nécessairement vocation à remplacer la grille détaillée de l'auditeur.
12. Le fonctionnement cible est l'Audit pré-PROD sur une Release Candidate.
13. `M.m.r-Audit` constitue un mécanisme de rattrapage.
14. Audit et correction des Anomalies sont des processus distincts.

---

## 23. Points restant à préciser

Les points suivants restent à instruire :

- le contenu réel de la grille utilisée par l'auditeur ;
- la distinction éventuelle entre RGAA, WCAG et WAI-ARIA dans cette grille ;
- les versions des référentiels applicables ;
- le minimum d'informations à intégrer au template d'Issue ;
- le mécanisme GitHub de représentation de la famille d'Audit ;
- si une Issue d'Audit doit obligatoirement avoir exactement un Composant ;
- comment identifier la Release Candidate auditée ;
- comment déterminer la fin d'un Audit ;
- comment déterminer le résultat de conformité ;
- comment relier une Anomalie à l'Issue d'Audit qui l'a détectée ;
- comment identifier une Campagne d'Audit ;
- comment gérer plusieurs Audits successifs du même Composant.