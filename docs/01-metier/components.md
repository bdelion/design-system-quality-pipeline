# Composants et catalogue

## 1. Rôle métier

Un Composant représente un élément du Design System suivi par le
pipeline.

Le Catalogue constitue une référence séparée des données GitHub. Il
permet d'identifier les Composants connus et de leur associer des
métadonnées de référence.

Le Catalogue actuel est stocké dans :

``` text
config/catalogue.yaml
```

Cette représentation YAML décrit l'implémentation actuelle. Le futur
Catalogue historique par Version, établi dans le modèle métier, est plus
riche et n'est pas encore implémenté.

------------------------------------------------------------------------

## 2. Composant et Librairie

Un Composant appartient à une Librairie métier.

Dans l'organisation actuelle :

``` text
Repository
    ↓
Librairie
    ↓
Composants
```

Cette relation correspond au fonctionnement actuel dans lequel un
Repository représente une Librairie.

Le modèle doit cependant permettre à terme :

``` text
Repository
├── Librairie A
│   ├── Component A1
│   └── Component A2
│
└── Librairie B
    ├── Component B1
    └── Component B2
```

La Librairie doit donc posséder une identité indépendante du Repository.

Le Repository ne doit pas être utilisé comme identifiant métier
définitif du Composant.

------------------------------------------------------------------------

## 3. Métadonnées actuellement implémentées

Une entrée de Catalogue contient actuellement :

-   `name` ;
-   `repository`, facultatif ;
-   `stream` ;
-   `owner` ;
-   `squad` ;
-   `status` ;
-   `rgaaLevel` ;
-   `figmaUrl`, facultatif ;
-   `documentationUrl`, facultatif ;
-   `tags` ;
-   `audit`, facultatif.

Les statuts actuellement acceptés sont :

``` text
stable
experimental
deprecated
removed
```

L'objet `audit` actuellement implémenté accepte les fréquences :

``` text
monthly
quarterly
yearly
```

et une date facultative `lastAuditDate` au format `YYYY-MM-DD`.

Ces champs décrivent le schéma du Catalogue actuel. Ils ne préjugent pas
du futur modèle métier des Audits défini dans
`docs/01-metier/audits.md`.

------------------------------------------------------------------------

## 4. Validation actuelle du Catalogue

Le chargement refuse notamment :

-   une structure sans `version` ou sans tableau `components` ;
-   un champ obligatoire vide ;
-   un statut inconnu ;
-   une fréquence d'audit inconnue ;
-   des tags qui ne sont pas des chaînes non vides ;
-   une URL qui n'utilise pas HTTP ou HTTPS ;
-   une date d'audit invalide ;
-   deux Composants portant le même nom dans le Catalogue.

L'unicité actuelle par `name` est une contrainte de l'implémentation.
Elle devra être réévaluée avec le futur support de plusieurs Librairies
par Repository et l'identité métier consolidée des Composants.

------------------------------------------------------------------------

## 5. Composants catalogués et Composants découverts

L'implémentation actuelle distingue notamment :

-   un Composant connu du Catalogue ;
-   un Composant découvert dans les données GitHub mais absent du
    Catalogue.

Lorsqu'un label GitHub correspond à un nom du Catalogue, le Composant
normalisé reçoit les métadonnées de référence et :

``` text
discoverySource: catalogue
```

Lorsqu'un Composant est découvert dans GitHub mais absent du Catalogue,
l'implémentation actuelle le conserve avec :

``` text
discoverySource: suggested
```

et la règle actuelle `DQ-006` le signale.

Ce comportement est un **état implémenté**. La signification métier et
la future règle DQ seront réexaminées après consolidation de la matrice
de règles.

Les Composants présents uniquement dans le YAML ne sont pas
nécessairement équivalents à des Composants observés dans GitHub. Le
Catalogue est une référence ; la présence dans le Catalogue et
l'observation dans une source sont deux informations distinctes.

------------------------------------------------------------------------

## 6. Ajouter actuellement un Composant au Catalogue

Lorsqu'un Composant découvert doit être ajouté à la référence :

1.  relever son nom de référence ;
2.  vérifier l'absence de doublon dans `config/catalogue.yaml` ;
3.  ajouter une entrée sous `components` ;
4.  renseigner les champs requis et les métadonnées connues ;
5.  valider le projet ;
6.  relancer le pipeline.

Exemple correspondant au schéma actuellement implémenté :

``` yaml
- name: Tooltip
  stream: React
  owner: Front
  squad: eventail
  status: stable
  rgaaLevel: AA
  tags:
    - feedback
    - accessibility
```

Exemple avec liens et métadonnées d'audit historiques :

``` yaml
- name: Select
  stream: React
  owner: Front
  squad: eventail
  status: stable
  rgaaLevel: AA
  figmaUrl: https://figma.example.com/select
  documentationUrl: https://eventail.example.com/select
  tags:
    - form
    - selection
  audit:
    frequency: quarterly
    lastAuditDate: 2026-09-01
```

Puis :

``` bash
npm run typecheck
npm test
npm run pipeline
```

------------------------------------------------------------------------

## 7. Dashboard et Catalogue

Le dashboard actuel est statique et en lecture seule.

Pour une alerte `DQ-006`, l'implémentation historique peut proposer un
bouton de copie d'une structure YAML à compléter, mais elle n'écrit pas
directement dans `config/catalogue.yaml`.

Le flux reste donc :

``` text
Composant découvert
        ↓
signalement DQ actuel
        ↓
qualification humaine
        ↓
modification du Catalogue versionné
        ↓
validation / pipeline
        ↓
nouveau Snapshot / dashboard
```

Une édition directe depuis le navigateur nécessiterait une architecture
différente : backend sécurisé, validation, gestion des droits,
journalisation et mécanisme de commit ou de Pull Request.

------------------------------------------------------------------------

## 8. Relation future avec les Applications consommatrices

À terme, le Composant pourra être utilisé comme point de rapprochement
avec les Applications consommatrices.

Le futur modèle devra pouvoir représenter :

``` text
Application
    ↓ consomme
Package @ Version
    ↓ fournit
Composants
```

La méthode permettant de détecter cette utilisation à partir du code des
Applications n'est pas encore définie.

**Statut : Futur / à instruire.**

------------------------------------------------------------------------

## 9. Questions restant ouvertes

Restent notamment à consolider :

-   l'identité d'un Composant dans un contexte multi-Librairies ;
-   le rattachement d'un Composant à la bonne Librairie dans un monorepo
    ;
-   le cas éventuel d'un Composant partagé par plusieurs Librairies ;
-   la construction du Catalogue historique par Version ;
-   la représentation d'une réactivation exceptionnelle ;
-   la détection future de l'utilisation des Composants par les
    Applications.

Ces points doivent être traités dans le modèle métier avant d'être
transformés en contraintes TypeScript.
