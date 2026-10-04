# Audits

## 1. Objectif

Ce document décrit les concepts métier liés aux Audits du Design System.

Les Audits constituent un domaine distinct :

- du cycle de développement ;
- du cycle de publication ;
- du traitement des Anomalies résultant éventuellement de l'Audit.

Le premier domaine d'Audit identifié dans le projet est l'accessibilité.

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

## 3. Issue d'Audit

Le fonctionnement souhaité repose sur une **Issue d'Audit par Composant à auditer**.

Conceptuellement :

```text
Composant
    │
    └── Issue d'Audit
          │
          └── Audit du Composant
```

L'Issue d'Audit représente le travail consistant à auditer le Composant.

Elle doit être distinguée des éventuelles Anomalies découvertes pendant cet Audit.

---

## 4. Fonctionnement cible des Audits

Le comportement cible est de réaliser les Audits avant la création de la Version PROD finale.

Les Issues d'Audit des Composants évoluent au sein de la Milestone correspondant à la future Version PROD.

Exemple :

```text
Milestone 1.1.0
    │
    ├── Issue Audit composant A
    ├── Issue Audit composant B
    └── Issue Audit composant C
```

L'Audit est réalisé sur une Release Candidate de cette future Version.

Exemple :

```text
Version de base 1.1.0
        │
        ▼
Release Candidate
1.1.0-rc.n
        │
        ▼
Audits des composants
        │
        ├── Issue Audit composant A
        ├── Issue Audit composant B
        └── Issue Audit composant C
        │
        ▼
Version PROD finale 1.1.0
```

L'objectif est de pouvoir produire, si possible, une Version PROD finale conforme.

---

## 5. Audit pré-PROD

Un **Audit pré-PROD** est réalisé sur une Release Candidate avant la publication de la Version PROD finale.

La Version auditée techniquement est donc une Release Candidate :

```text
M.m.r-rc.n
```

L'Audit contribue à préparer la Version PROD :

```text
M.m.r
```

Exemple :

```text
1.1.0-rc.n
    │
    ▼
Audit
    │
    ▼
Version PROD cible : 1.1.0
```

La Milestone utilisée par les Issues d'Audit est la Milestone de la Version cible :

```text
1.1.0
```

---

## 6. Audit de rattrapage

Une Milestone spécifique de forme :

```text
M.m.r-Audit
```

correspond à un mécanisme de **rattrapage**.

Elle est utilisée lorsque les Audits n'ont pas été réalisés avant la création du Tag et du Package de la Version PROD.

Exemple :

```text
Version PROD 1.1.0
    │
    ├── Tag Git 1.1.0
    ├── Package 1.1.0 publié dans Nexus PROD
    │
    ▼
Audit de rattrapage
    │
    └── Milestone 1.1.0-Audit
```

`1.1.0-Audit` ne représente donc pas une nouvelle Version du Package.

Il s'agit du contexte de rattrapage de l'Audit de la Version PROD `1.1.0`.

---

## 7. Contenu d'une Milestone de rattrapage

Une Milestone telle que :

```text
1.1.0-Audit
```

contient uniquement les **Issues d'Audit des Composants**.

Le principe est :

```text
Milestone 1.1.0-Audit
    │
    ├── Issue Audit composant A
    ├── Issue Audit composant B
    └── Issue Audit composant C
```

Il existe une Issue d'Audit par Composant à auditer.

Les Anomalies découvertes à la suite de ces Audits ne doivent pas être confondues avec ces Issues d'Audit.

---

## 8. Anomalies découvertes pendant un Audit

Lorsqu'un Audit identifie une Anomalie, celle-ci suit ensuite le processus de traitement des Anomalies.

Elle n'est pas conservée dans la Milestone `M.m.r-Audit` au titre du travail d'Audit.

Le fonctionnement établi est :

```text
Issue d'Audit
    │
    ▼
Audit du Composant
    │
    ├── aucune Anomalie
    │
    └── Anomalie détectée
              │
              ▼
           Grooming
              │
              ├── qualification
              └── pesée
                    │
                    ▼
            planification ultérieure
                    │
                    ├── Milestone
                    └── Sprint / Iteration
```

La Milestone et le Sprint de traitement de l'Anomalie sont donc déterminés après le Grooming.

---

## 9. Séparation entre Audit et correction

Le processus d'Audit et le processus de correction d'une Anomalie sont deux processus distincts.

```text
AUDIT
Issue Audit
    │
    ▼
Détection éventuelle d'une Anomalie

TRAITEMENT
Anomalie
    │
    ▼
Grooming
    │
    ▼
Pesée
    │
    ▼
Planification
    │
    ├── Milestone
    └── Sprint
    │
    ▼
Correction
```

Cette séparation doit être conservée dans le modèle métier et dans les indicateurs.

---

## 10. Deux contextes d'Audit

Le modèle doit désormais distinguer au minimum deux contextes.

### Audit pré-PROD

```text
Release Candidate M.m.r-rc.n
        │
        ▼
Audit
        │
        ▼
Version PROD cible M.m.r
```

Les Issues d'Audit sont rattachées à :

```text
Milestone M.m.r
```

### Audit de rattrapage

```text
Version PROD M.m.r
        │
        ▼
Audit
```

Les Issues d'Audit sont rattachées à :

```text
Milestone M.m.r-Audit
```

Ces deux situations ne doivent pas être confondues lors de l'analyse de la qualité d'une Version.

---

## 11. Version auditée et Version cible

Le modèle devra être capable de distinguer deux notions.

### Version effectivement auditée

Dans un Audit pré-PROD :

```text
M.m.r-rc.n
```

### Version PROD cible

La Version que l'on prépare à publier :

```text
M.m.r
```

Dans un Audit de rattrapage, la Version auditée est directement la Version PROD déjà publiée :

```text
M.m.r
```

Cette distinction sera importante pour la traçabilité de la conformité.

---

## 12. Milestone et contexte d'Audit

La Milestone fournit une information de contexte.

### Fonctionnement cible

```text
Milestone : M.m.r
Contexte  : préparation de la Version PROD
Audit     : réalisé sur une Release Candidate
```

### Rattrapage

```text
Milestone : M.m.r-Audit
Contexte  : Audit postérieur à la publication PROD
Audit     : réalisé sur la Version PROD
```

Le suffixe `-Audit` doit rester configurable.

---

## 13. Temporalité

La temporalité est une propriété importante du domaine des Audits.

Le modèle doit permettre de distinguer :

```text
Audit pré-PROD
    │
    ├── Release Candidate disponible
    ├── Audit
    └── Version PROD finale
```

de :

```text
Audit de rattrapage
    │
    ├── Version PROD disponible
    └── Audit postérieur
```

Les définitions précises des dates utilisées pour représenter ces événements restent à instruire.

---

## 14. Conséquence sur la conformité

La temporalité de l'Audit modifie l'interprétation de la conformité.

Dans le fonctionnement cible, l'Audit d'une Release Candidate vise à permettre la production d'une Version PROD finale conforme, si possible.

Dans le fonctionnement de rattrapage, la Version PROD existe déjà au moment où l'Audit est effectué.

Il faut donc pouvoir distinguer :

```text
conformité évaluée avant publication PROD
```

et :

```text
conformité évaluée après publication PROD
```

Cette distinction devra être conservée dans les indicateurs et dans l'historique.

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

La couverture mesure la part du périmètre ayant effectivement été auditée.

```text
Couverture d'Audit
=
nombre de Composants audités
/
nombre total de Composants du périmètre
```

Le périmètre exact utilisé comme dénominateur devra être explicitement défini.

---

## 17. Taux de conformité

Le taux de conformité doit être calculé sur les éléments effectivement audités.

```text
Taux de conformité
=
nombre de Composants conformes
/
nombre de Composants audités
```

Il ne doit pas utiliser automatiquement tous les Composants comme dénominateur.

---

## 18. Traçabilité des Anomalies d'Audit

Une Anomalie découverte lors d'un Audit doit pouvoir conserver une relation avec son origine.

Le modèle devra permettre de retrouver au minimum :

```text
Anomalie
    │
    └── découverte lors de
          │
          └── Issue d'Audit
                │
                └── Composant audité
```

Cette relation est distincte de la Milestone et du Sprint dans lesquels l'Anomalie sera ensuite planifiée pour correction.

---

## 19. Campagne d'Audit

Une **Campagne d'Audit** représente un ensemble cohérent d'Audits.

Elle doit permettre de suivre notamment :

- le périmètre prévu ;
- les Composants à auditer ;
- les Composants audités ;
- les Composants conformes ;
- les Composants non conformes ;
- l'avancement global.

La manière exacte dont une Campagne est représentée dans les données sources reste à préciser.

---

## 20. Historisation

L'historisation doit permettre de différencier :

```text
Version auditée avant sa publication PROD
```

de :

```text
Version auditée après sa publication PROD
```

Elle doit également permettre de répondre à des questions telles que :

```text
La Version avait-elle été auditée avant sa mise en PROD ?
```

```text
Quel était son niveau de conformité avant la PROD ?
```

```text
Un Audit de rattrapage a-t-il été nécessaire ?
```

```text
Quelles Anomalies ont été découvertes par cet Audit ?
```

```text
Quand ces Anomalies ont-elles ensuite été planifiées et corrigées ?
```

---

## 21. Principes retenus

### Principe 1 — Une Issue d'Audit correspond à un Composant à auditer

Le fonctionnement établi prévoit une Issue d'Audit par Composant.

### Principe 2 — Le fonctionnement cible est l'Audit pré-PROD

L'objectif est d'auditer une Release Candidate avant la création de la Version PROD finale.

### Principe 3 — La Milestone standard est utilisée dans le fonctionnement cible

Les Issues d'Audit évoluent dans la Milestone `M.m.r` de la future Version PROD.

### Principe 4 — `M.m.r-Audit` est un mécanisme de rattrapage

Cette Milestone est utilisée lorsque l'Audit n'a pas été réalisé avant la publication PROD.

### Principe 5 — Une Milestone d'Audit ne contient que les Issues d'Audit

Les Anomalies découvertes suivent ensuite leur propre workflow.

### Principe 6 — Une Anomalie découverte passe par le Grooming

Elle est qualifiée et pesée avant d'être inscrite dans une Milestone et un Sprint.

### Principe 7 — Audit et correction sont deux processus différents

Le travail d'Audit ne doit pas être confondu avec le travail de correction des Anomalies détectées.

### Principe 8 — Conserver la relation d'origine

Une Anomalie doit pouvoir rester reliée à l'Issue d'Audit qui a permis sa détection.

### Principe 9 — Pré-PROD et rattrapage doivent être distingués

Cette distinction est nécessaire pour interpréter correctement la qualité d'une Version.

---

## 22. Points restant à préciser

Les points suivants restent à instruire :

- comment reconnaître précisément une Issue d'Audit ;
- comment une Issue d'Audit référence son Composant ;
- comment une Anomalie est reliée à l'Issue d'Audit qui l'a détectée ;
- comment déterminer qu'une Issue d'Audit est terminée ;
- comment déterminer qu'un Composant est conforme ou non conforme ;
- comment représenter la Release Candidate effectivement auditée ;
- comment une Campagne d'Audit est identifiée ;
- comment gérer plusieurs Audits successifs d'un même Composant ;
- quelle date représente le début d'un Audit ;
- quelle date représente la fin d'un Audit ;
- quelle date représente la détection d'une Anomalie ;
- comment calculer la conformité globale d'une Version.

Ces éléments doivent être établis avant de définir les règles de qualité correspondantes.