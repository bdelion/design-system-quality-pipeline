# Audits

## 1. Objectif

Ce document décrit les concepts métier liés aux Audits du Design System.

Les Audits constituent un domaine distinct :

- du cycle de développement ;
- du cycle de publication ;
- du traitement des Anomalies résultant éventuellement de l'Audit.

Le premier domaine d'Audit actuellement identifié est l'accessibilité, avec les Audits RGAA.

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

```text
Issue Type = 🔍 Audit
```

### Famille d'Audit

La famille indique quel type d'évaluation est réalisé.

La première famille actuellement identifiée est :

```text
RGAA
```

Le modèle cible est donc conceptuellement :

```text
Issue
├── nature : Audit
├── famille d'Audit : RGAA
└── Composant : xxx
```

Cette séparation permet de ne pas confondre la nature du travail avec la taxonomie des Audits.

---

## 4. Identification actuelle d'une Issue d'Audit

Aujourd'hui, une Issue d'Audit RGAA est identifiée par le label :

```text
Audit RGAA
```

Le Composant concerné est identifié par un label :

```text
🧩 Component:xxx
```

Exemple conceptuel :

```text
Issue
├── label : Audit RGAA
└── label : 🧩 Component:Button
```

Le label `Audit RGAA` représente actuellement à la fois :

- le fait qu'il s'agit d'un Audit ;
- la famille d'Audit RGAA.

Cette représentation est amenée à évoluer.

---

## 5. Identification cible d'une Issue d'Audit

La cible souhaitée est d'utiliser un Issue Type :

```text
🔍 Audit
```

Conceptuellement :

```text
Issue
├── Issue Type : 🔍 Audit
├── famille d'Audit : RGAA
└── label : 🧩 Component:xxx
```

Le mécanisme technique permettant de représenter la famille d'Audit n'est pas encore décidé.

Il pourrait être porté par différents mécanismes GitHub, mais cette décision reste à instruire.

Il ne faut donc pas encore imposer une représentation technique particulière de la famille d'Audit.

---

## 6. Pourquoi séparer Audit et famille d'Audit

Un Issue Type spécifique à chaque famille conduirait potentiellement à multiplier les Issue Types :

```text
Audit RGAA
Audit WAI-ARIA
Audit ...
```

La cible envisagée préfère séparer :

```text
Nature
└── 🔍 Audit

Famille
├── RGAA
├── WAI-ARIA
└── ...
```

Cette approche permet d'ajouter de nouvelles familles sans nécessairement modifier la taxonomie principale des Issue Types.

La liste définitive des familles d'Audit reste à établir.

---

## 7. Issue d'Audit et Composant

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

Exemple :

```text
🧩 Component:Button
```

La règle exacte concernant le nombre de labels Component autorisés sur une Issue d'Audit reste à formaliser.

---

## 8. Fonctionnement cible des Audits

Le comportement cible est de réaliser les Audits avant la création de la Version PROD finale.

Les Issues d'Audit des Composants évoluent dans la Milestone correspondant à la future Version PROD.

```text
Milestone 1.1.0
    │
    ├── Issue Audit composant A
    ├── Issue Audit composant B
    └── Issue Audit composant C
```

L'Audit est réalisé sur une Release Candidate de cette future Version.

```text
Release Candidate 1.1.0-rc.n
        │
        ▼
Audits des composants
        │
        ▼
Version PROD finale 1.1.0
```

L'objectif est de pouvoir produire, si possible, une Version PROD finale conforme.

---

## 9. Audit pré-PROD

Un Audit pré-PROD est réalisé sur une Release Candidate avant la publication de la Version PROD finale.

La Version auditée techniquement est :

```text
M.m.r-rc.n
```

La Version PROD cible est :

```text
M.m.r
```

Les Issues d'Audit sont rattachées à la Milestone :

```text
M.m.r
```

---

## 10. Audit de rattrapage

Une Milestone :

```text
M.m.r-Audit
```

correspond à un mécanisme de rattrapage.

Elle est utilisée lorsque les Audits n'ont pas été réalisés avant la publication de la Version PROD.

```text
Version PROD 1.1.0
        │
        ▼
Audit de rattrapage
        │
        └── Milestone 1.1.0-Audit
```

`1.1.0-Audit` ne représente pas une nouvelle Version.

---

## 11. Contenu d'une Milestone de rattrapage

Une Milestone `M.m.r-Audit` contient uniquement les Issues d'Audit des Composants.

```text
Milestone 1.1.0-Audit
    ├── Issue Audit composant A
    ├── Issue Audit composant B
    └── Issue Audit composant C
```

Les Anomalies découvertes pendant les Audits suivent ensuite leur propre workflow.

---

## 12. Anomalies découvertes pendant un Audit

Une Anomalie découverte pendant un Audit passe ensuite par :

```text
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

Le travail d'Audit et le travail de correction sont donc deux processus distincts.

L'Anomalie doit néanmoins pouvoir conserver une relation avec l'Issue d'Audit à l'origine de sa détection.

---

## 13. Contextes d'Audit

Le modèle doit distinguer au minimum deux contextes.

### Audit pré-PROD

```text
Release Candidate M.m.r-rc.n
        ↓
Audit
        ↓
Version PROD cible M.m.r
```

Les Issues d'Audit sont rattachées à :

```text
Milestone M.m.r
```

### Audit de rattrapage

```text
Version PROD M.m.r
        ↓
Audit
```

Les Issues d'Audit sont rattachées à :

```text
Milestone M.m.r-Audit
```

---

## 14. Version auditée et Version cible

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

Cette distinction est nécessaire pour la traçabilité de la conformité.

---

## 15. États de conformité

Pour un Composant dans un contexte d'Audit donné, les états minimaux identifiés sont :

```text
NON AUDITÉ
AUDITÉ & CONFORME
AUDITÉ & NON CONFORME
```

Un Composant non audité ne doit pas être considéré automatiquement comme non conforme.

---

## 16. Couverture d'Audit

```text
Couverture d'Audit
=
nombre de Composants audités
/
nombre total de Composants du périmètre
```

Le périmètre exact du dénominateur reste à définir.

---

## 17. Taux de conformité

```text
Taux de conformité
=
nombre de Composants conformes
/
nombre de Composants audités
```

Les Composants non audités ne doivent pas être automatiquement comptabilisés comme non conformes.

---

## 18. Traçabilité des Anomalies

Une Anomalie découverte lors d'un Audit doit pouvoir conserver sa provenance :

```text
Anomalie
    │
    └── découverte lors de
          │
          └── Issue d'Audit
                │
                └── Composant
```

Cette relation est indépendante de la Milestone et du Sprint dans lesquels l'Anomalie sera ensuite planifiée.

---

## 19. Historisation

L'historisation doit permettre de distinguer :

- Audit réalisé avant la PROD ;
- Audit de rattrapage ;
- Version ou Release Candidate effectivement auditée ;
- famille d'Audit ;
- Composant audité ;
- résultat connu à un instant donné ;
- Anomalies découvertes.

---

## 20. Principes retenus

1. Une Issue d'Audit correspond à un Composant à auditer.
2. Aujourd'hui, une Issue d'Audit RGAA est identifiée par le label `Audit RGAA`.
3. Aujourd'hui, le Composant est identifié par `🧩 Component:xxx`.
4. La cible souhaitée est `Issue Type = 🔍 Audit`.
5. La nature `Audit` et la famille d'Audit sont deux notions distinctes.
6. La représentation technique cible de la famille d'Audit reste à décider.
7. Le fonctionnement cible est l'Audit pré-PROD sur une Release Candidate.
8. Les Issues d'Audit pré-PROD évoluent dans la Milestone `M.m.r`.
9. `M.m.r-Audit` constitue un mécanisme de rattrapage.
10. Une Milestone de rattrapage contient les Issues d'Audit, pas les Anomalies découvertes.
11. Les Anomalies passent ensuite par Grooming, pesée et planification.
12. Pré-PROD et rattrapage doivent rester distingués analytiquement.

---

## 21. Points restant à préciser

Les points suivants restent à instruire :

- quelles familles d'Audit doivent être supportées ;
- comment représenter techniquement la famille d'Audit ;
- si une Issue d'Audit peut avoir plusieurs familles ;
- si une Issue d'Audit doit obligatoirement avoir exactement un Composant ;
- comment déterminer qu'une Issue d'Audit est terminée ;
- comment déterminer qu'un Composant est conforme ou non conforme ;
- comment identifier la Release Candidate effectivement auditée ;
- comment relier techniquement une Anomalie à l'Issue d'Audit qui l'a détectée ;
- comment identifier une Campagne d'Audit ;
- comment gérer plusieurs Audits successifs du même Composant.