# Questions ouvertes et décisions à instruire

Ce document recense les sujets qui ne sont pas suffisamment définis pour être implémentés sans risque d'interprétation.

Un sujet présent ici ne doit pas être considéré comme décidé.

---

## 1. Positionnement fonctionnel

### Q-001 — Organisation finale du produit

**Question :**

Les différents domaines doivent-ils constituer un seul produit avec plusieurs sections, ou plusieurs produits partageant un même référentiel ?

**État :**

Orientation actuelle vers un point d'entrée unique avec des sections distinctes.

**Décision définitive :**

À instruire.

---

## 2. Consommateurs

### Q-002 — Source des données consommateurs

Quelle source permettra d'analyser les applications consommatrices ?

Possibilités à étudier notamment :

* analyse directe des repositories ;
* fichiers de dépendances ;
* analyse statique du code ;
* autre source.

**État :**

Besoin identifié, solution non définie.

**Décision :**

À instruire.

---

### Q-003 — Identification des composants utilisés

Comment déterminer précisément qu'une application utilise un composant d'une librairie ?

**État :**

Le besoin est identifié.

La méthode d'identification n'est pas définie.

**Décision :**

À instruire.

---

### Q-004 — Mesure de l'utilisation des composants

Que signifie exactement « nombre d'utilisations d'un composant » ?

Par exemple, il faudra déterminer si l'on compte :

* les occurrences dans le code ;
* les instances réellement rendues ;
* les fichiers utilisant le composant ;
* une autre unité.

**État :**

Besoin identifié mais définition non arrêtée.

**Décision :**

À instruire.

---

### Q-005 — Version attendue

Comment déterminer qu'une application devrait utiliser une version donnée d'une librairie ?

**État :**

Le besoin de suivre la dette de version est identifié.

La règle permettant de déterminer la version attendue n'est pas définie.

**Décision :**

À instruire.

---

### Q-006 — Dette de version

Quelle règle transforme un écart entre version utilisée et version attendue en dette ?

**État :**

Besoin identifié.

Règle non définie.

**Décision :**

À instruire.

---

### Q-007 — Alertes

Quel mécanisme doit être utilisé pour alerter les Squads responsables lorsqu'une montée de version est attendue ?

**État :**

Besoin identifié.

Mécanisme non défini.

**Décision :**

À instruire.

---

## 3. Qualité applicative

### Q-008 — Note ou badge RGAA/WAI-ARIA

Faut-il produire :

* une note ;
* un badge ;
* un niveau ;
* plusieurs indicateurs ;
* ou une autre représentation ?

**État :**

Le besoin d'une information synthétique est identifié.

La forme n'est pas décidée.

**Décision :**

À instruire.

---

### Q-009 — Calcul de la qualité applicative

Comment déterminer la qualité RGAA/WAI-ARIA d'une application à partir :

* des composants utilisés ;
* de leur version ;
* de leur qualité connue ?

**État :**

L'objectif est identifié.

Aucune formule de calcul n'est actuellement validée.

**Décision :**

À instruire.

---

### Q-010 — Relation entre qualité d'un composant et qualité d'une application

Une application utilisant un composant non conforme doit-elle nécessairement être considérée comme présentant une dégradation de sa qualité RGAA/WAI-ARIA ?

**État :**

Question métier non tranchée.

**Décision :**

À instruire.

---

## 4. Architecture

### Q-011 — Architecture fonctionnelle finale

Le produit doit-il rester un dashboard unique ou évoluer vers plusieurs applications/services partageant un référentiel commun ?

**État :**

Préférence actuelle pour un point d'entrée unique avec sections spécialisées.

**Décision :**

À instruire après clarification du domaine consommateurs.

---

### Q-012 — Backend et base de données

À quel moment les données doivent-elles passer du modèle actuel basé sur fichiers/snapshots à une architecture backend/base de données ?

**État :**

Une évolution future est souhaitée mais aucun calendrier ni seuil technique n'est défini.

**Décision :**

À instruire.

---

## 5. Règle générale

Lorsqu'une nouvelle information métier ne peut pas être déduite sans hypothèse, elle doit être ajoutée à ce document plutôt que transformée en règle technique implicite.
