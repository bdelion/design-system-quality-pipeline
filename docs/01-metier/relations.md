# Relations métier

## 1. Objectif

Ce document constitue la carte de référence des relations et
cardinalités du modèle métier du **Design System Quality Pipeline**.

Il distingue quatre statuts :

- **ÉTABLI** : relation ou cardinalité validée par une décision métier
  ;
- **ACTUEL** : fonctionnement observé aujourd'hui, sans en faire
  nécessairement une contrainte cible ;
- **À CONFIRMER** : relation identifiée mais dont une cardinalité ou
  une sémantique reste ouverte ;
- **FUTUR** : relation volontairement hors du périmètre V1.

Aucune cardinalité absente de ce document ne doit être déduite
implicitement de la structure GitHub ou de l'implémentation actuelle.

---

## 2. Vue d'ensemble

```text
Design System
    │
    └── 1..n Librairies
              │
              ├── Repository
              │     ACTUEL : 1 Repository = 1 Librairie
              │     CIBLE  : 1 Repository = 1..n Librairies
              │
              ├── Packages
              │     ACTUEL : 1 Librairie = 1 Package
              │     CIBLE  : 1 Librairie = 1..n Packages
              │
              └── Composants
                    │
                    ├── Issues
                    └── Audits
                          ├── 0..n Anomalies
                          └── 0..n Improvements
```

Le rattachement futur exact `Composant ↔ Package` n'est pas encore
établi.

---

## 3. Design System → Librairie

```text
Design System 1 ── 1..n Librairies
```

**Statut : ÉTABLI au niveau conceptuel.**

Le Design System regroupe plusieurs Librairies.

La cardinalité inverse n'a pas besoin d'être généralisée à plusieurs
Design Systems dans le périmètre actuel : le projet suit un Design
System donné.

---

## 4. Repository ↔ Librairie

### Situation actuelle

```text
Repository 1 ── 1 Librairie
```

Aujourd'hui, un Repository correspond à une Librairie.

### Cible

```text
Repository 1 ── 1..n Librairies
```

Le modèle doit supporter un futur monorepo contenant plusieurs
Librairies.

**Statut : ÉTABLI pour l'actuel et l'orientation cible.**

### Reste ouvert

L'identification d'une Librairie à l'intérieur d'un futur monorepo n'est
pas définie.

**Référence ouverte : Q-003.**

---

## 5. Librairie → Package

### Situation actuelle

```text
Librairie 1 ── 1 Package
```

### Cible

```text
Librairie 1 ── 1..n Packages
```

**Statut : ÉTABLI pour l'actuel et l'orientation cible.**

Les cas métier justifiant plusieurs Packages et les propriétés
définitives d'un Package restent à instruire.

**Références ouvertes : Q-001, Q-002.**

---

## 6. Package → Version

Un Package possède des Versions publiées ou construites au cours de son
cycle de vie.

Conceptuellement :

```text
Package 1 ── 0..n Versions
```

Une Version appartient au contexte d'un Package : le numéro `M.m.r` seul
ne constitue pas un identifiant global suffisant.

**Statut : ÉTABLI conceptuellement.**

Les catégories actuellement connues comprennent :

```text
M.m.r-SNAPSHOT
M.m.r-rc.n
M.m.r-hc.n
M.m.r
```

La Version déclarée dans `package.json` et la Version d'artefact
produite par Jenkins sont deux notions distinctes.

---

## 7. Librairie → Composant

Un Composant appartient métierement à une Librairie.

```text
Librairie 1 ── 0..n Composants
Composant ── 1 Librairie
```

**Statut : ÉTABLI dans le modèle actuel.**

Le Catalogue constitue la référence des Composants connus.

### Relation avec Package

Dans le fonctionnement actuel `1 Librairie = 1 Package`, le rattachement
au Package est implicitement non ambigu.

Dans la cible `1 Librairie = 1..n Packages`, la cardinalité :

```text
Composant ↔ Package
```

n'est pas établie.

Un Composant pourrait appartenir :

- à la Librairie indépendamment des Packages ;
- à exactement un Package ;
- à plusieurs Packages.

**Statut : À CONFIRMER --- Q-004.**

Aucune de ces hypothèses ne doit être codée comme règle cible avant
décision.

---

## 8. Issue ↔ Composant

### Issue concernant un Composant

Toute Issue qui concerne effectivement un Composant doit porter le label
:

```text
🧩 Component:xxx
```

Une Issue classique peut concerner plusieurs Composants.

```text
Issue 1 ── 0..n Composants
```

`0` est valide pour une Issue réellement transverse.

**Statut : ÉTABLI.**

Une Issue multi-Composants est autorisée et doit porter tous les labels
Composant concernés.

La préférence de gouvernance est néanmoins de créer une Issue par
Composant lorsque le travail est réellement séparable.

### Comptage

Une Issue multi-Composants :

- compte une fois pour chaque Composant dans les analyses par
  Composant ;
- reste une seule Issue dans le total global de la Librairie.

La somme des compteurs par Composant ne doit donc pas servir à
reconstruire le nombre global d'Issues distinctes.

### Issue sans Composant

L'absence de label Composant n'est pas automatiquement une erreur.

Le pipeline ne doit pas déduire qu'un label manque sans signal
complémentaire fiable.

---

## 9. Issue d'Audit → Composant

Une Issue d'Audit concerne exactement un Composant.

```text
Issue d'Audit ── exactement 1 Composant
Composant ── 0..n Issues d'Audit
```

**Statut : ÉTABLI --- D-117.**

Sont invalides :

- aucun Composant ;
- plusieurs Composants.

Dans la représentation GitHub actuelle, le rattachement repose sur
exactement un label `🧩 Component:xxx`.

---

## 10. Audit ↔ Version

La conformité doit être interprétée pour un **Composant dans un contexte
de Version**.

Deux temporalités sont établies.

### Audit pré-PROD

```text
Release Candidate M.m.r-rc.n
        │
        ▼
Audit du Composant
        │
        ▼
Version PROD cible M.m.r
```

L'Audit porte effectivement sur une Release Candidate.

La Milestone de pilotage est la future Version PROD `M.m.r`.

L'identification exacte de la Release Candidate réellement auditée reste
à consolider.

**Statut : PARTIELLEMENT ÉTABLI --- Q-018.**

### Audit de rattrapage

```text
Version PROD M.m.r
        │
        ▼
Audit du Composant
```

La Version auditée est alors la Version PROD `M.m.r`.

Une Milestone `M.m.r-Audit` est un regroupement d'Audits de rattrapage
et non une Version supplémentaire.

**Statut : ÉTABLI.**

---

## 11. Audit → Anomalie

Pour une Anomalie provenant d'un Audit :

```text
Audit 1 ── 0..n Anomalies
Anomalie d'Audit ── exactement 1 Audit parent
```

**Statut : ÉTABLI --- D-121, D-135.**

La relation doit être explicite sous forme de sous-Issue GitHub.

Une Anomalie d'Audit :

- est une sous-Issue de son Audit ;
- a l'Issue Type `🐛 Bug` ;
- possède exactement un Composant ;
- possède le même Composant que l'Audit parent.

Une même Issue Anomalie ne peut pas être réutilisée comme enfant de
plusieurs Audits.

Lors d'une revalidation ultérieure, si le même problème est de nouveau
constaté, une nouvelle Issue Anomalie est créée pour le nouvel Audit.

---

## 12. Audit → Improvement

Pour une Improvement provenant d'un Audit :

```text
Audit 1 ── 0..n Improvements
Improvement d'Audit ── exactement 1 Audit parent
```

**Statut : ÉTABLI --- D-120, D-136.**

La relation doit être explicite sous forme de sous-Issue GitHub.

Une Improvement d'Audit :

- est une sous-Issue de son Audit ;
- a l'Issue Type `✨ Feature` ;
- possède exactement un Composant ;
- possède le même Composant que l'Audit parent.

Une même Issue Improvement ne peut pas être partagée entre plusieurs
Audits.

---

## 13. Anomalie / Improvement d'Audit → Composant

Les deux relations ont la même contrainte structurelle :

```text
Audit
└── exactement 1 Composant C
    │
    ├── Anomalie
    │   └── exactement 1 Composant C
    │
    └── Improvement
        └── exactement 1 Composant C
```

**Statut : ÉTABLI --- D-118, D-119, D-122.**

Une différence de Composant entre parent et enfant constitue une
incohérence de données.

---

## 14. Sous-Issues d'Audit

Les deux types métier actuellement connus sont :

```text
Audit
├── Anomalie
└── Improvement
```

Cette liste n'est pas fermée.

**Statut : ÉTABLI pour le périmètre actuel --- extensible.**

Une sous-Issue d'un type inconnu :

- ne doit pas être automatiquement assimilée à une Anomalie ;
- ne doit pas modifier automatiquement le verdict de conformité ;
- devra disposer de règles explicites avant intégration analytique.

---

## 15. Anomalie d'Audit Accessibilité → criticité RGAA

```text
Anomalie d'Audit Accessibilité
└── exactement 1 criticité RGAA
    ├── bloquante
    ├── majeure
    └── mineure
```

**Statut : ÉTABLI.**

Ces criticités sont strictement réservées aux Anomalies provenant d'un
Audit Accessibilité.

```text
Improvement d'Audit
└── 0 criticité RGAA
```

Une Issue hors Audit ne doit pas non plus porter ces criticités RGAA.

---

## 16. Issue ↔ catégorie a11y

Les labels :

```text
♿ a11y:xxx
```

sont transverses.

Ils peuvent qualifier :

- une Anomalie d'Audit ;
- une Improvement d'Audit ;
- une Issue hors Audit.

Ils n'identifient donc ni la nature ni l'origine de l'Issue.

### Anomalie d'Audit Accessibilité

```text
Anomalie d'Audit Accessibilité
└── exactement 1 ♿ a11y:xxx
```

**Statut : ÉTABLI.**

### Improvement d'Audit Accessibilité

```text
Improvement d'Audit Accessibilité
└── 0..n ♿ a11y:xxx
```

Le minimum `0` est établi.

La cardinalité maximale n'est pas encore connue ; plusieurs valeurs
doivent rester techniquement tolérées.

**Statut : À CONFIRMER pour le maximum --- D-130, D-131.**

### Autres Issues

L'hypothèse générale est actuellement « au plus un label a11y », mais
elle n'est pas suffisamment établie pour devenir une règle stricte.

**Statut : À CONFIRMER --- D-128.**

---

## 17. Issue ↔ Pull Request

Les Issues peuvent être liées à des Pull Requests.

Pour le workflow STANDARD, la Pull Request constitue un élément majeur
du traitement et de la clôture.

Des exceptions existent ou sont envisagées pour certains profils,
notamment Audit et Epic.

La cardinalité métier générale et les obligations exactes dépendent donc
du profil de workflow.

**Statut : À FORMALISER dans la matrice de workflow --- Q-020, Q-021.**

Aucune règle générale `Issue Done → exactement une PR` ne doit être
imposée avant cette consolidation.

---

## 18. Issue ↔ Issue

GitHub permet plusieurs relations utiles :

- parent / sous-Issue ;
- `Blocked by` ;
- `Blocking`.

Certaines relations sont déjà spécialisées métierement, notamment :

```text
Audit → sous-Issue Anomalie
Audit → sous-Issue Improvement
```

La relation Epic → sous-Issues existe dans le fonctionnement métier mais
ses cardinalités et règles complètes seront consolidées avec les profils
de workflow.

**Statut : PARTIELLEMENT ÉTABLI.**

---

## 19. Issue → Iteration / Milestone

Une Issue peut être rattachée à :

- une Iteration ;
- une Milestone.

La signification dépend du workflow et du contexte.

Une Milestone peut notamment représenter :

- une Version `M.m.r` ;
- un regroupement d'Audit de rattrapage `M.m.r-Audit` ;
- un horizon de planification ;
- un lot Design.

La présence d'une Milestone ne doit donc jamais être interprétée
automatiquement comme une Version sans classification préalable.

**Statut : ÉTABLI comme principe ; règles détaillées à consolider en M3
Workflow.**

---

## 20. Application → Package @ Version

À terme :

```text
Application
    └── consomme
        └── Package @ Version
```

Cette relation est conceptuellement établie.

La source permettant d'identifier les Applications, Packages et Versions
réellement utilisés n'est pas définie.

**Statut : FUTUR --- Q-023 à Q-026.**

---

## 21. Application ↔ Composant

À terme, le système pourra chercher à déterminer :

```text
Application
    └── utilise
        └── 0..n Composants
```

ainsi que le nombre d'occurrences d'utilisation.

La méthode de détection et la cardinalité analytique détaillée ne sont
pas définies.

**Statut : FUTUR --- Q-027.**

---

## 22. Audit métier ↔ Issue d'Audit GitHub

Il est établi qu'une Issue GitHub représente actuellement le travail
d'Audit d'un Composant.

Il n'est pas encore décidé si :

```text
Audit métier = Issue d'Audit GitHub
```

ou si `Audit` doit devenir un objet métier indépendant possédant une
relation vers l'Issue qui le matérialise.

**Statut : À CONFIRMER --- Q-015.**

Le modèle technique ne doit donc pas figer prématurément cette identité.

---

## 23. Campagne d'Audit

Une Milestone regroupe les Issues d'Audit d'une Version ou d'un
rattrapage.

Il n'est pas encore établi si :

```text
Campagne d'Audit = Milestone
```

ou si une Campagne doit devenir un objet métier autonome.

**Statut : À CONFIRMER --- Q-016.**

---

## 24. Matrice synthétique

---

Source Relation Cible Cardinalité / Statut
règle

---

Design System contient Librairie `1 → 1..n` ÉTABLI

Repository héberge Librairie actuel `1 → 1`, ÉTABLI
cible
`1 → 1..n`

Librairie distribue Package actuel `1 → 1`, ÉTABLI
cible
`1 → 1..n`

Package possède Version `1 → 0..n` ÉTABLI
conceptuellement

Librairie contient Composant `1 → 0..n` ÉTABLI

Composant appartient à Package non décidé en À CONFIRMER
multi-package

Issue concerne Composant `0..n` ÉTABLI
classique

Issue Audit concerne Composant exactement `1` ÉTABLI

Audit produit Anomalie `0..n` ÉTABLI
d'Audit

Anomalie appartient à Audit exactement `1` ÉTABLI
d'Audit

Audit produit Improvement `0..n` ÉTABLI
d'Audit

Improvement appartient à Audit exactement `1` ÉTABLI
d'Audit

Anomalie concerne Composant exactement `1`, ÉTABLI
d'Audit même que parent

Improvement concerne Composant exactement `1`, ÉTABLI
d'Audit même que parent

Anomalie Audit porte criticité RGAA exactement `1` ÉTABLI
A11y

Improvement porte criticité RGAA `0` ÉTABLI
Audit A11y

Anomalie Audit porte catégorie a11y exactement `1` ÉTABLI
A11y

Improvement porte catégorie a11y minimum `0`, À CONFIRMER
Audit A11y maximum inconnu

Issue liée à Pull Request dépend du À FORMALISER
profil

Issue appartient à Iteration dépend du À FORMALISER
workflow

Issue appartient à Milestone sémantique ÉTABLI / à
polymorphe classifier

Application consomme Package @ relation FUTUR
Version conceptuelle

Application utilise Composant à détecter FUTUR

Audit métier matérialisé Issue Audit identité exacte À CONFIRMER
par ouverte

Campagne regroupée par Milestone identité exacte À CONFIRMER
d'Audit ouverte
---

---

## 25. Conséquence pour la suite

Les relations suffisamment établies peuvent maintenant servir de base :

- aux règles d'intégrité ;
- au modèle normalisé cible ;
- aux indicateurs par Composant et Audit ;
- aux contrôles DQ.

Les points ouverts ne doivent pas bloquer la V1 lorsqu'ils relèvent du
futur multi-package, des consommateurs ou d'une abstraction métier qui
peut être ajoutée sans casser le modèle.

La prochaine consolidation doit porter sur la **matrice des profils de
workflow**, afin de déterminer précisément les obligations d'Iteration,
Milestone, Velocity, branche et Pull Request selon le type de travail.
