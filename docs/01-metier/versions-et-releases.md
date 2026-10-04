# Versions et releases

## Statut

**BASE DE TRAVAIL — PARTIELLEMENT DÉFINIE**

Les échanges ont établi plusieurs besoins concernant les versions, les releases et les Milestones.

La relation exacte entre ces concepts n'est pas encore entièrement définie.

---

## 1. Version

Une Version représente un état versionné identifiable d'une librairie ou d'un package.

Elle doit permettre notamment de répondre à des questions telles que :

* quelle version est actuellement suivie ?
* quelles anomalies sont associées à une version ?
* quels composants ont été audités dans une version ?
* quelle version est utilisée par une application consommatrice ?

---

## 2. Situation actuelle

Le projet actuel utilise notamment les données GitHub pour déterminer ou rapprocher des informations de version.

Les Milestones constituent une source possible de cette information.

Cependant, les Milestones sont utilisées pour plusieurs finalités métier.

Il n'est donc pas correct de considérer systématiquement :

```text
Milestone = Version
```

---

## 3. Usages identifiés des Milestones

Les échanges ont identifié plusieurs usages possibles :

* version de librairie ;
* version d'audit ;
* horizon de planification ;
* lot de travail ;
* autre contexte métier.

Par exemple, les formes suivantes ont été explicitement évoquées :

```text
1.1.0
1.1.0-Audit
```

Il a été indiqué que :

```text
1.1.0-Audit
```

doit pouvoir être rapproché de :

```text
1.1.0
```

avec un suffixe configurable.

La règle exacte de normalisation reste à formaliser.

---

## 4. Version et audit

Les audits peuvent être associés à une version.

Un audit peut notamment permettre de connaître :

* les composants prévus ;
* les composants audités ;
* les composants conformes ;
* les composants non conformes ;
* les anomalies issues de l'audit.

La relation exacte entre campagne d'audit, version et Milestone reste à définir.

---

## 5. Version et composant

Une version peut être importante pour déterminer l'état d'un composant à un moment donné.

Les besoins identifiés comprennent notamment :

* composants présents dans une version ;
* composants audités dans une version ;
* composants conformes dans une version ;
* composants non conformes dans une version ;
* anomalies associées à une version.

La définition exacte de l'état d'un composant « dans une version » reste à préciser.

---

## 6. Version et application consommatrice

Dans le futur domaine consommateurs, une application pourra utiliser une version donnée d'une librairie.

Le modèle cible devra donc pouvoir représenter :

```text
Application
    │
    └── utilise
          └── Librairie
                └── Version
```

Cette relation permettra notamment d'étudier :

* les versions réellement utilisées ;
* les versions attendues ;
* les écarts ;
* la dette de version.

---

## 7. Dette de version

Le besoin de suivre la dette de version a été identifié.

À terme, il devra être possible de comparer :

```text
Version utilisée
        vs
Version attendue
```

pour une application consommatrice.

Cependant, les règles permettant de déterminer :

* la version attendue ;
* la version recommandée ;
* la version obsolète ;
* le niveau de dette ;
* la priorité d'une montée de version

ne sont pas encore définies.

**À instruire.**

---

## 8. Release

Le terme Release est utilisé dans le contexte des versions et de la livraison.

Cependant, les sources actuellement disponibles ne permettent pas de déterminer précisément si une Release doit être modélisée comme :

* un objet métier indépendant ;
* un événement de livraison d'une Version ;
* un objet issu d'un système de gestion de versions ;
* une représentation GitHub ;
* une autre notion.

**À instruire.**

---

## 9. Distinction Version / Release / Milestone

À ce stade, il convient de conserver les trois concepts séparés :

```text
Version
    ≠
Release
    ≠
Milestone
```

Une relation entre eux pourra être définie ultérieurement.

Cette séparation évite de créer une règle technique incorrecte à partir d'un usage actuel de GitHub.

---

## 10. Informations nécessaires pour la suite

Avant l'implémentation d'un modèle complet des versions et releases, il faudra déterminer notamment :

1. ce qui définit une Version ;
2. ce qui définit une Release ;
3. comment une Version est identifiée ;
4. comment une Release est identifiée ;
5. si une Version peut exister sans Release ;
6. si une Release peut contenir plusieurs packages ;
7. comment les Milestones sont classifiées ;
8. comment `1.1.0-Audit` doit être représenté ;
9. comment une application indique la version utilisée ;
10. comment une version attendue est déterminée.

Ces questions seront traitées progressivement.

---

## 11. Principe pour l'implémentation actuelle

Tant que les relations précédentes ne sont pas décidées, l'implémentation ne doit pas introduire de modèle métier artificiel assimilant automatiquement :

```text
Milestone → Version → Release
```

Les données sources doivent conserver suffisamment d'informations pour permettre une classification ultérieure.

---

## 12. État

**Décidé :**

* les versions constituent un concept métier important ;
* les applications consommatrices devront pouvoir être associées à une version utilisée ;
* les Milestones peuvent servir de source d'information de version ;
* `1.1.0` et `1.1.0-Audit` doivent pouvoir être rapprochés ;
* le suffixe de type `-Audit` doit être configurable.

**À instruire :**

* définition exacte d'une Version ;
* définition exacte d'une Release ;
* relations Version / Package / Release / Milestone ;
* règles complètes de normalisation ;
* règles de dette de version.
