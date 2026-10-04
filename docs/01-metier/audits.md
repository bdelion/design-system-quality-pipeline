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
- une Version ;
- un ou plusieurs Composants.

Il peut produire :

- un résultat de conformité ;
- des Anomalies ;
- des propositions d'Amélioration.

---

## 3. Audit d'une Version PROD

Dans le fonctionnement actuellement établi, les Audits concernés sont réalisés sur une Version PROD déjà publiée.

Exemple :

```text
Version PROD 1.1.0
    │
    ├── Tag Git 1.1.0
    ├── Package 1.1.0 publié dans Nexus PROD
    │
    ▼
Audit de la Version 1.1.0
```

L'Audit n'est donc pas, dans ce cas, une condition préalable à la publication de la Version.

---

## 4. Milestone d'Audit

Une Milestone spécifique permet d'identifier le contexte d'Audit d'une Version.

Exemple :

```text
1.1.0-Audit
```

Cette Milestone signifie :

> Audit de la Version PROD `1.1.0`.

Elle ne représente pas une nouvelle Version du Package.

La relation est :

```text
Package
    │
    └── Version PROD 1.1.0
          │
          ├── Milestone 1.1.0
          │
          └── Milestone 1.1.0-Audit
                    │
                    └── contexte d'Audit de 1.1.0
```

---

## 5. Version auditée

La Version auditée doit être distinguée de la valeur brute de la Milestone.

Pour :

```text
Milestone : 1.1.0-Audit
```

la Version auditée est :

```text
1.1.0
```

Le pipeline doit donc pouvoir représenter séparément :

- la Milestone source ;
- la Version auditée ;
- le contexte d'Audit.

Exemple conceptuel :

```text
Milestone source : 1.1.0-Audit
Version auditée  : 1.1.0
Contexte         : AUDIT
```

---

## 6. Temporalité

La temporalité est une propriété importante du domaine des Audits.

Pour le fonctionnement actuellement observé :

```text
Publication PROD
        │
        ▼
Version disponible
        │
        ▼
Audit
        │
        ▼
Résultats d'Audit
        │
        ├── conformité
        ├── Anomalies
        └── Améliorations
```

Il faut donc distinguer au minimum :

- la date de mise à disposition de la Version ;
- la période ou date de l'Audit ;
- la date de détection des Anomalies ;
- la date éventuelle de correction.

Les définitions précises de ces dates restent à instruire.

---

## 7. Conséquence sur la conformité

Un Audit réalisé après la publication ne permet pas d'affirmer que la Version était déjà connue comme conforme ou non conforme lors de sa publication.

Il faut distinguer :

```text
État de connaissance au moment de la publication
```

et :

```text
État de connaissance après l'Audit
```

Cette distinction est nécessaire pour construire correctement les indicateurs historiques.

---

## 8. États de conformité

Pour un Composant dans un contexte d'Audit donné, les états minimaux identifiés sont :

```text
NON AUDITÉ
AUDITÉ & CONFORME
AUDITÉ & NON CONFORME
```

Un Composant non audité ne doit pas être considéré automatiquement comme non conforme.

---

## 9. Couverture d'Audit

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

## 10. Taux de conformité

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

## 11. Anomalies issues d'un Audit

Un Audit peut conduire à l'identification d'Anomalies.

Une Anomalie d'Audit doit pouvoir conserver la traçabilité vers :

- l'Audit ;
- la Version auditée ;
- le Composant concerné ;
- son domaine ;
- sa criticité ;
- sa catégorie ;
- son traitement éventuel.

La définition exacte permettant de reconnaître une Anomalie d'Audit reste à formaliser.

---

## 12. Améliorations issues d'un Audit

Un Audit peut également produire des propositions d'Amélioration.

Une Amélioration ne doit pas être automatiquement assimilée :

- à une Anomalie ;
- à une non-conformité.

Le modèle doit conserver cette distinction.

---

## 13. Campagne d'Audit

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

## 14. Audit et Version

Une même Version PROD peut donc être observée selon plusieurs contextes :

```text
Version PROD 1.1.0
    │
    ├── contexte de publication
    │     └── Milestone 1.1.0
    │
    └── contexte d'Audit
          └── Milestone 1.1.0-Audit
```

Il s'agit toujours de la même Version du Package.

Le contexte ne doit pas être modélisé comme une nouvelle Version.

---

## 15. Normalisation

Le pipeline devra pouvoir normaliser les conventions de nommage des Milestones d'Audit.

Exemple actuel :

```text
1.1.0-Audit
```

devient conceptuellement :

```text
sourceMilestone = 1.1.0-Audit
version         = 1.1.0
context         = AUDIT
```

Ces noms de propriétés sont uniquement illustratifs.

Le modèle technique définitif sera établi ultérieurement.

Le suffixe `-Audit` doit être configurable.

---

## 16. Historisation des Audits

L'historisation devra permettre de répondre à des questions différentes :

```text
Que savait-on de la qualité de 1.1.0
au moment de sa publication ?
```

et :

```text
Que sait-on aujourd'hui de la qualité
de la Version 1.1.0 après son Audit ?
```

Ces deux questions ne doivent pas nécessairement produire le même résultat.

Le système devra donc conserver suffisamment de temporalité pour éviter de reconstruire artificiellement le passé à partir des connaissances actuelles.

---

## 17. Principes retenus

### Principe 1 — Un Audit porte sur une Version existante

Dans le fonctionnement actuellement observé, la Version PROD existe avant l'Audit.

### Principe 2 — Une Milestone d'Audit n'est pas une Version

`1.1.0-Audit` fait référence à la Version `1.1.0`.

### Principe 3 — Conserver le contexte

Le contexte `AUDIT` doit être distingué du contexte de publication de la Version.

### Principe 4 — Conserver la valeur source

La valeur `1.1.0-Audit` doit être conservée même si elle est normalisée vers la Version `1.1.0`.

### Principe 5 — Respecter la temporalité

Un résultat d'Audit obtenu après la publication ne doit pas être considéré comme connu au moment de cette publication.

### Principe 6 — Non audité n'est pas non conforme

L'absence d'Audit ne constitue pas une preuve de non-conformité.

### Principe 7 — Anomalie et Amélioration sont distinctes

Un Audit peut produire les deux types de résultats sans qu'ils soient assimilés.

---

## 18. Points restant à préciser

Les points suivants restent à instruire :

- comment une Campagne d'Audit est identifiée ;
- comment un Audit individuel est représenté ;
- comment les Issues GitHub participent à la représentation des Audits ;
- comment déterminer qu'un Composant a effectivement été audité ;
- comment déterminer qu'un Composant est conforme ;
- comment déterminer qu'un Composant est non conforme ;
- comment reconnaître une Anomalie issue d'un Audit ;
- comment reconnaître une proposition d'Amélioration ;
- quelle date représente le début d'un Audit ;
- quelle date représente la fin d'un Audit ;
- quelle date représente la détection d'une Anomalie ;
- comment calculer la conformité globale d'une Version ;
- comment traiter plusieurs Audits successifs d'une même Version ou d'un même Composant.

Ces éléments doivent être établis avant de définir les règles de qualité correspondantes.