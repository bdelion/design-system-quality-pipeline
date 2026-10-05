# Composants et catalogue

## 1. Rôle du catalogue

Le catalogue constitue une référence séparée des données GitHub.

Le pipeline charge actuellement le catalogue puis renseigne les composants déclarés avant la normalisation.

Le catalogue sert donc de référence pour identifier les composants connus du Design System.

---

## 2. Composant et librairie

Un composant appartient à une librairie métier.

Dans l'organisation actuelle :

```text
Repository
    ↓
Librairie
    ↓
Composants
```

Cette relation correspond au fonctionnement actuel dans lequel un repository représente une librairie.

---

## 3. Préparation au monorepo

Le modèle doit cependant être conçu pour permettre à terme :

```text
Repository
├── Librairie A
│   ├── Component A1
│   └── Component A2
│
└── Librairie B
    ├── Component B1
    └── Component B2
```

La librairie doit donc posséder une identité indépendante du repository.

Le repository ne doit pas être utilisé comme identifiant métier du composant.

---

## 4. Composants connus et composants découverts

Le modèle actuel distingue notamment :

* composant déclaré dans le catalogue ;
* composant découvert ou suggéré ailleurs ;
* statut du composant ;
* provenance de la découverte.

La règle actuelle DQ-006 signale notamment un composant dont la source de découverte vaut `suggested`.

La signification métier exacte de ces différents états devra être précisée lors de la révision des règles de qualité des données.

---

## 5. Relation avec les applications consommatrices

À terme, le composant pourra également être utilisé comme point de rapprochement avec les applications consommatrices.

Le futur modèle devra pouvoir représenter une relation de type :

```text
Application
    ↓ utilise
Librairie
    ↓ fournit
Composant
```

Il devra également pouvoir conserver la version de la librairie dans laquelle le composant est consommé.

La méthode permettant de détecter cette utilisation à partir du code des applications n'est pas encore définie.

**À instruire.**

---

## 6. Questions restant ouvertes

Les éléments suivants ne sont pas encore suffisamment définis :

* comment identifier plusieurs librairies dans un même repository ;
* comment rattacher un composant à la bonne librairie dans un monorepo ;
* comment gérer un composant partagé par plusieurs librairies, si ce cas existe ;
* comment identifier l'utilisation d'un composant dans une application consommatrice.

Ces questions devront être traitées avant l'implémentation du support monorepo et du domaine consommateurs.
