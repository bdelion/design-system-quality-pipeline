# Pull Requests

## 1. Rôle

Une Pull Request représente la proposition et la revue d'une
modification de code.

Elle ne doit pas être considérée comme obligatoire pour toute Issue sans
tenir compte du profil de workflow.

---

## 2. Profil STANDARD

Pour un travail de réalisation STANDARD impliquant du code, la Pull
Request est un élément central du traitement.

La source décrit notamment :

- PR éventuellement `Draft` avant la phase de revue ;
- PR ouverte/non Draft lorsque les Issues associées sont en
    `In review` ;
- assignee ;
- reviewers pendant la revue ;
- approbation ;
- discussions résolues ;
- checks réussis avant merge.

Le modèle RAW actuel ne conserve pas toutes ces informations.

Toutes ces règles ne peuvent donc pas encore être contrôlées par le
pipeline.

---

## 3. In review

Pour une Issue STANDARD de code :

```text
In review
→ Pull Request attendue
```

La Pull Request constitue le support de la revue.

Cette relation ne doit pas être appliquée universellement aux profils
sans PR propre.

---

## 4. Done

Pour une Issue STANDARD de code, le merge de la Pull Request fait partie
du processus de finalisation décrit.

Pour une Anomalie d'Audit, le merge constitue un événement technique de
fin de correction, distinct de la validation métier attendue de
l'auditeur.

Il ne faut donc pas assimiler automatiquement :

```text
PR merged
=
Issue métier terminée
```

sans vérifier les autres conditions du profil.

---

## 5. EPIC

Une Epic n'a pas de branche ou de Pull Request propre selon la source.

Ses sous-Issues portent les réalisations techniques.

```text
EPIC
└── PR propre : NON
```

---

## 6. AUDIT

Une Issue d'Audit n'est pas une modification de code.

```text
AUDIT
└── PR propre : NON
```

Les Anomalies issues de l'Audit suivent leur propre processus de
correction et peuvent posséder leurs propres Pull Requests.

---

## 7. RELEASE

Le profil RELEASE manipule explicitement :

- une branche source `release/*` ou `hotfix/*` ;
- une branche cible ;
- une Pull Request d'intégration/publication.

Ses règles ne doivent pas être confondues avec celles d'une Issue
STANDARD.

---

## 8. CONCEPTION

La source ne permet pas d'imposer une Pull Request propre à toute Issue
de Conception.

**Statut : À FORMALISER.**

---

## 9. Matrice

  Profil             PR propre
  ------------------ ------------------------------
  STANDARD de code   attendue dans le nominal
  EPIC               non
  AUDIT              non
  RELEASE            oui dans le processus décrit
  CONCEPTION         non établi

Cette matrice explique pourquoi `Q-021` doit être résolue par profil
plutôt que par une règle globale.

---

## 10. Limitation des données actuelles

Le RAW observé conserve seulement un sous-ensemble des informations de
Pull Request, notamment l'état, la date de merge et les relations vers
les Issues.

Il ne permet pas à lui seul de contrôler exhaustivement :

- assignee ;
- reviewers ;
- approvals ;
- discussions résolues ;
- checks CI.

Ces contrôles ne doivent pas être annoncés comme implémentés tant que
les données nécessaires ne sont pas collectées.
