# Questions ouvertes et décisions à instruire

## 1. Rôle de ce document

Ce document recense les sujets qui ne sont pas suffisamment définis pour être implémentés sans risque d'interprétation.

Une question présente dans ce document ne doit pas être considérée comme une décision.

Lorsqu'une question est tranchée, sa décision doit être reportée dans le document métier de référence concerné.

---

# 2. Positionnement du produit

## Q-001 — Organisation finale du produit

### Question

Les différents domaines doivent-ils constituer un seul produit avec plusieurs sections, ou plusieurs produits partageant un même référentiel ?

### État actuel

Une préférence existe pour :

* un point d'entrée unique ;
* plusieurs sections clairement identifiables ;
* une page d'accueil de synthèse destinée à l'entreprise.

### Décision

**À instruire.**

---

# 3. Librairies

## Q-002 — Définition métier d'une librairie

### Situation actuelle

Une librairie correspond principalement à un package distribuable.

### Évolution souhaitée

Le modèle doit pouvoir représenter une librairie fonctionnelle pouvant être distribuée par plusieurs packages.

### Question

Quelle définition métier doit être retenue pour une librairie indépendamment de son ou ses packages ?

### Décision

**À instruire.**

---

## Q-003 — Relation Librairie / Repository

### Situation actuelle

Le projet fonctionne actuellement selon :

```text
1 repository = 1 librairie
```

### Évolution souhaitée

Le modèle doit pouvoir représenter :

```text
1 repository = 1..n librairies
```

notamment pour les monorepos.

### Question

Comment identifier les différentes librairies présentes dans un même repository ?

### Décision

**À instruire.**

---

## Q-004 — Relation Librairie / Package

### Question

Une librairie peut-elle être distribuée par plusieurs packages ?

### État

Le besoin de permettre cette évolution est identifié.

### Décision

**Orientation : oui à terme.**

Les modalités précises restent à définir.

---

## Q-005 — Relation Composant / Librairie dans un monorepo

### Question

Lorsqu'un repository contient plusieurs librairies, comment déterminer à quelle librairie appartient un composant ?

### Décision

**À instruire.**

---

# 4. Versions et releases

## Q-006 — Définition d'une Version

### Question

Qu'est-ce qui constitue exactement une Version dans le modèle métier ?

### Décision

**À instruire.**

---

## Q-007 — Définition d'une Release

### Question

Une Release est-elle :

* un objet métier ;
* un événement de livraison ;
* une représentation technique ;
* autre chose ?

### Décision

**À instruire.**

---

## Q-008 — Relation Version / Release

### Question

Une Version peut-elle exister sans Release ?

Une Release peut-elle concerner plusieurs packages ?

### Décision

**À instruire.**

---

## Q-009 — Relation Milestone / Version

### Situation

Les Milestones peuvent représenter différents usages.

### Question

Comment déterminer qu'une Milestone représente une Version, un audit, un lot ou un autre objet ?

### Décision

**À instruire.**

---

## Q-010 — Normalisation des suffixes de version

### Situation

Les formes suivantes ont été explicitement identifiées :

```text
1.1.0
1.1.0-Audit
```

Elles doivent pouvoir être rapprochées.

### Question

Quelle règle complète de normalisation doit être appliquée ?

### Décision

Le rapprochement et le caractère configurable du suffixe `-Audit` sont établis.

Les règles complètes restent à préciser.

---

# 5. Anomalies

## Q-011 — Définition d'une anomalie

### Question

Qu'est-ce qui permet de déterminer qu'une Issue constitue une anomalie ?

### Situation actuelle

Le projet utilise notamment `Issue Type = BUG`.

### Problème identifié

Cette règle pourrait être trop restrictive pour constituer la définition métier définitive.

Des critères basés sur :

* Issue Type ;
* labels ;
* combinaison de critères ;
* règles propres à une librairie ou un repository

ont été envisagés.

### Décision

**À instruire.**

---

## Q-012 — Anomalie versus amélioration

### Question

Comment distinguer une anomalie d'une amélioration proposée ?

### Décision

**À instruire.**

---

## Q-013 — Anomalie issue d'un audit

### Question

Une anomalie détectée lors d'un audit possède-t-elle une qualification particulière permettant de la distinguer des autres anomalies ?

### Décision

**À instruire.**

---

# 6. Audits

## Q-014 — Types d'audit

### Question

Quels types d'audit doivent être officiellement supportés ?

Les échanges ont notamment fait apparaître les audits d'accessibilité.

D'autres types sont envisageables mais ne doivent pas être inventés.

### Décision

**À instruire.**

---

## Q-015 — Campagne d'audit

### Question

Une campagne d'audit est-elle un objet métier distinct d'un audit individuel ?

### Décision

**À instruire.**

---

## Q-016 — Résultat d'un audit

### Question

Quels sont les résultats possibles d'un audit ?

Par exemple :

* conforme ;
* non conforme ;
* autre.

La liste complète n'est pas définie.

### Décision

**À instruire.**

---

# 7. Consommateurs

## Q-017 — Source des données consommateurs

### Question

Quelle source permettra d'analyser les applications consommatrices ?

Possibilités à étudier :

* repositories des applications ;
* fichiers de dépendances ;
* analyse statique du code ;
* autre source.

### Décision

**À instruire.**

---

## Q-018 — Identification des applications

### Question

Comment identifier une application consommatrice et la rattacher à une Squad responsable ?

### Décision

**À instruire.**

---

## Q-019 — Identification des librairies utilisées

### Question

Comment détecter qu'une application utilise une librairie du Design System ?

### Décision

**À instruire.**

---

## Q-020 — Version utilisée

### Question

Comment déterminer précisément la version de la librairie utilisée par une application ?

### Décision

**À instruire.**

---

## Q-021 — Composants utilisés

### Question

Comment déterminer précisément les composants utilisés par une application ?

### Décision

**À instruire.**

---

## Q-022 — Nombre d'utilisations d'un composant

### Question

Que signifie exactement « nombre d'utilisations » ?

Il faut déterminer l'unité de comptage :

* occurrence dans le code ;
* fichier ;
* instance ;
* autre.

### Décision

**À instruire.**

---

## Q-023 — Composants les plus utilisés

### Question

Quel indicateur doit être utilisé pour déterminer les composants les plus utilisés ?

### Décision

**À instruire.**

---

# 8. Dette de version

## Q-024 — Version attendue

### Question

Comment déterminer qu'une application devrait utiliser une version donnée d'une librairie ?

### Décision

**À instruire.**

---

## Q-025 — Dette de version

### Question

Quelle règle transforme l'écart entre version utilisée et version attendue en dette ?

### Décision

**À instruire.**

---

## Q-026 — Priorité de la dette

### Question

La dette de version doit-elle avoir différents niveaux de priorité ?

### Décision

**À instruire.**

---

## Q-027 — Alertes

### Question

Quel mécanisme doit être utilisé pour informer les Squads responsables lorsqu'une montée de version est attendue ?

### Décision

**À instruire.**

---

# 9. Qualité RGAA/WAI-ARIA des consommateurs

## Q-028 — Note ou badge

### Question

Quelle forme doit prendre l'information synthétique ?

* note ;
* badge ;
* niveau ;
* plusieurs indicateurs ;
* autre.

### Décision

**À instruire.**

---

## Q-029 — Calcul de la qualité applicative

### Question

Comment calculer la qualité RGAA/WAI-ARIA d'une application ?

Les informations envisagées comprennent notamment :

* version de la librairie ;
* composants utilisés ;
* état de qualité des composants.

### Décision

**À instruire.**

---

## Q-030 — Relation qualité composant / qualité application

### Question

Une application utilisant un composant non conforme doit-elle nécessairement voir sa qualité RGAA/WAI-ARIA dégradée ?

### Décision

**À instruire.**

---

# 10. Architecture future

## Q-031 — Backend / base de données

### Question

À quel moment l'architecture actuelle basée sur fichiers et snapshots doit-elle évoluer vers un backend et une base de données ?

### Décision

**À instruire.**

---

## Q-032 — API

### Question

Quelle partie du modèle doit être exposée par une API lorsque l'architecture évoluera ?

### Décision

**À instruire.**

---

## Q-033 — Frontend

### Question

Le dashboard HTML actuel doit-il évoluer vers une application frontend complète ?

### Décision

**À instruire.**

---

# 11. Règle de gouvernance des décisions

Lorsqu'un sujet n'est pas suffisamment documenté par les sources disponibles ou par une décision explicite, il doit rester marqué :

> **À instruire**

Il ne doit pas être transformé en règle technique par supposition.

Lorsqu'une décision est prise :

1. elle est ajoutée à ce document ;
2. elle est reportée dans le document métier correspondant ;
3. son impact sur les indicateurs est examiné ;
4. son impact sur les règles de qualité des données est examiné ;
5. seulement ensuite son implémentation est envisagée.
