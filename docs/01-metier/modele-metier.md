# Modèle métier

## 1. Objectif

Le **Design System Quality Pipeline** construit une représentation
métier du Design System afin de mesurer sa qualité, piloter son activité
et, à terme, analyser son utilisation par les Applications
consommatrices.

Le modèle métier constitue la référence conceptuelle du pipeline.

Il doit rester indépendant :

- de la représentation GitHub ;
- de l'implémentation TypeScript ;
- de la structure actuelle des Repositories ;
- du moteur de métriques ;
- de la présentation du dashboard.

Les objets sont détaillés dans `objets-metier.md` et leurs cardinalités
dans `relations.md`.

---

## 2. Statuts de consolidation

Les éléments du modèle utilisent quatre statuts :

- **ÉTABLI** : validé et utilisable comme base de spécification ;
- **ACTUEL** : fonctionnement observé aujourd'hui ;
- **À CONFIRMER** : décision encore nécessaire ;
- **FUTUR** : volontairement hors V1.

Une contrainte technique actuelle ne devient pas automatiquement une
règle métier cible.

---

## 3. Domaines couverts

### 3.1 Qualité du Design System

Domaine prioritaire :

- Catalogue des Composants ;
- Audits ;
- conformité ;
- Anomalies ;
- Improvements ;
- criticités ;
- catégories d'accessibilité ;
- traitement des Anomalies ;
- qualité par Composant et Version ;
- historique.

### 3.2 Pilotage opérationnel

Le système doit également exploiter :

- Issues ;
- workflow ;
- Pull Requests ;
- Iterations ;
- Milestones ;
- Versions ;
- Releases ;
- Velocity ;
- délais et flux.

### 3.3 Consommateurs

À terme :

- Applications ;
- Packages utilisés ;
- Versions utilisées ;
- Composants utilisés ;
- fréquence d'utilisation ;
- dette de montée de Version ;
- qualité du Design System effectivement consommé.

Ce domaine est **FUTUR** et nécessite des sources complémentaires.

---

## 4. Carte consolidée

```text
Design System
    │
    └── Librairie
          │
          ├── Repository
          │     ACTUEL : 1 Repository = 1 Librairie
          │     CIBLE  : 1 Repository = 1..n Librairies
          │
          ├── Package
          │     ACTUEL : 1 Librairie = 1 Package
          │     CIBLE  : 1 Librairie = 1..n Packages
          │       │
          │       └── Version
          │
          └── Composant
                │
                ├── Issues
                │
                └── Audits
                      │
                      ├── 0..n Anomalies
                      │      └── chaque Anomalie → exactement 1 Audit
                      │
                      └── 0..n Improvements
                             └── chaque Improvement → exactement 1 Audit
```

À terme :

```text
Application
    └── consomme
        └── Package @ Version
              └── fournit / expose des Composants
```

La relation future exacte `Composant ↔ Package` n'est pas encore
décidée.

---

## 5. Axe structurel : Repository, Librairie, Package

### Actuel

```text
Repository 1 ── 1 Librairie
Librairie  1 ── 1 Package
```

### Cible

```text
Repository 1 ── 1..n Librairies
Librairie  1 ── 1..n Packages
```

Ces orientations sont établies.

Restent ouverts :

- les propriétés définitives du Package ;
- l'identification des Librairies dans un monorepo ;
- les cas justifiant plusieurs Packages ;
- le rattachement des Composants dans une Librairie multi-Packages.

Ces sujets ne doivent pas être résolus implicitement par le modèle
technique.

---

## 6. Axe Version

Le Package possède des Versions.

Les catégories établies sont :

```text
SNAPSHOT : M.m.r-SNAPSHOT
RC       : M.m.r-rc.n
HC       : M.m.r-hc.n
PROD     : M.m.r
```

Le modèle distingue :

```text
Version déclarée dans package.json
        ≠
Version d'artefact Jenkins
```

Une Version PROD nominale est caractérisée par plusieurs signaux
concordants :

- forme `M.m.r` ;
- publication Nexus PROD ;
- Tag Git `M.m.r` ;
- Milestone `M.m.r` ;
- Release GitHub normalement présente, mais obligation à confirmer.

La présence dans Nexus seule ne suffit pas à qualifier une Version de
PROD.

---

## 7. Axe Composant

Le Composant est une unité fonctionnelle de la Librairie.

Le Catalogue est la référence des Composants connus.

Les analyses doivent pouvoir rattacher les Issues aux Composants.

Pour une Issue classique :

```text
Issue ── 0..n Composants
```

`0` peut être légitime pour une Issue transverse.

Pour une Issue d'Audit :

```text
Issue d'Audit ── exactement 1 Composant
```

Cette différence de cardinalité est établie et doit être conservée.

---

## 8. Axe Audit

L'Audit évalue un Composant dans un contexte de Version.

Deux temporalités doivent être distinguées.

### Pré-PROD

```text
Release Candidate M.m.r-rc.n
        ↓
Audit du Composant
        ↓
Version PROD cible M.m.r
```

### Rattrapage

```text
Version PROD M.m.r
        ↓
Audit du Composant
```

La Milestone `M.m.r-Audit` sert au rattrapage et ne représente pas une
nouvelle Version.

Une Issue d'Audit est considérée comme réalisée lorsque :

```text
Project Status = Done
ET
GitHub Issue State = Closed
```

La date métier exacte de fin reste à consolider.

---

## 9. Résultats d'Audit

Les deux résultats métier actuellement connus sous forme de sous-Issues
sont :

```text
Audit
├── Anomalies
└── Improvements
```

La liste reste extensible.

### Anomalie

```text
Audit 1 ── 0..n Anomalies
Anomalie d'Audit ── exactement 1 Audit
```

Une Anomalie d'Audit :

- est une sous-Issue ;
- est un `🐛 Bug` ;
- porte exactement le même Composant que l'Audit ;
- participe au verdict de conformité.

### Improvement

```text
Audit 1 ── 0..n Improvements
Improvement d'Audit ── exactement 1 Audit
```

Une Improvement :

- est une sous-Issue ;
- est une `✨ Feature` ;
- porte exactement le même Composant que l'Audit ;
- ne participe pas au verdict de conformité.

---

## 10. Conformité

Un Composant non audité n'est pas non conforme.

Il faut distinguer :

```text
NON AUDITÉ
AUDITÉ & CONFORME
AUDITÉ & NON CONFORME
```

Pour un Audit Accessibilité terminé :

```text
0 Anomalie
→ AUDITÉ & CONFORME

>= 1 Anomalie
→ AUDITÉ & NON CONFORME
```

La correction ultérieure des Anomalies ne transforme pas automatiquement
le verdict de l'Audit historique.

Une nouvelle conformité nécessite une revalidation par un nouvel Audit.

La conformité doit être interprétée pour un **Composant × Version** et
dans sa temporalité réelle.

---

## 11. Revalidation

Lorsqu'un Composant précédemment non conforme est corrigé :

```text
Anomalies corrigées
        ↓
traitement terminé
        ↓
revalidation nécessaire
        ↓
nouvel Audit
```

Le nouvel Audit possède ses propres sous-Issues.

Si le même problème est de nouveau constaté, une nouvelle Issue Anomalie
est créée ; l'ancienne Issue n'est pas réutilisée comme enfant du nouvel
Audit.

Il n'existe pas de relation directe obligatoire entre les Anomalies
successives.

---

## 12. Accessibilité

Pour une Anomalie d'Audit Accessibilité :

```text
exactement 1 criticité RGAA
+
exactement 1 catégorie ♿ a11y:xxx
```

Les criticités RGAA :

```text
bloquante
majeure
mineure
```

sont réservées à ce contexte.

Les catégories `a11y` sont au contraire transverses et peuvent également
qualifier des Improvements ou des Issues hors Audit.

Pour une Improvement d'Audit Accessibilité :

```text
criticité RGAA = 0
catégorie a11y = facultative
```

La cardinalité maximale a11y d'une Improvement reste ouverte.

---

## 13. Unité de comptage des Anomalies

Pour les indicateurs :

```text
1 Issue GitHub qualifiée comme Anomalie
=
1 Anomalie comptabilisée
```

Une Issue peut regrouper plusieurs occurrences techniques d'un même
problème.

Le pipeline ne doit pas :

- extraire un nombre d'occurrences du texte ;
- estimer ces occurrences ;
- fusionner automatiquement des Issues qui semblent similaires.

Le nombre d'Issues Anomalie n'est donc pas le nombre exact d'occurrences
techniques.

---

## 14. Historique de conformité

Une nouvelle Version ne signifie pas que tous les Composants sont
automatiquement ré-audités.

Le modèle doit pouvoir distinguer :

- Composant non audité ;
- Audit direct sur la Version ;
- verdict éventuellement applicable par héritage ;
- Composant nouveau ;
- Composant évolué ;
- Composant inchangé ;
- Composant décommissionné.

Le Catalogue historique d'une Version ne doit pas être recalculé
rétroactivement à partir du Catalogue actuel.

Les règles exactes de construction de ce Catalogue historique restent à
consolider.

---

## 15. Traitement des Anomalies

La conformité d'un Audit et le traitement opérationnel de ses Anomalies
sont deux dimensions différentes.

Une Anomalie est considérée traitée lorsque :

```text
Project Status = Done
ET
GitHub Issue State = Closed
```

Le suivi peut donc distinguer :

- Anomalies détectées ;
- Anomalies restant à traiter ;
- Anomalies traitées ;
- attente de revalidation.

Une conformité historique ne doit pas être modifiée simplement parce que
toutes les Anomalies ont été corrigées.

---

## 16. Issues hors Audit

Toutes les Issues `🐛 Bug` ne sont pas des Anomalies d'Audit.

Les Issues hors Audit peuvent notamment représenter :

- défauts du Design System ;
- incidents remontés par des consommateurs ;
- erreurs d'intégration côté Application ;
- autres travaux.

La définition générale configurable d'une Anomalie hors Audit reste à
consolider.

Une erreur d'intégration strictement côté client peut être annulée sans
devenir une Anomalie intrinsèque du Design System.

---

## 17. Workflow

Les objets métier sont soumis à des workflows différents.

Les profils candidats sont :

```text
STANDARD
EPIC
AUDIT
RELEASE
CONCEPTION
```

Leur formalisation complète n'est pas encore terminée.

Il est déjà établi qu'une règle telle que :

```text
Done → Pull Request obligatoire
```

ne peut pas être appliquée indistinctement à tous les profils.

La prochaine étape M3 doit produire la matrice :

```text
Profil × Status
→ Velocity
→ Grooming
→ Iteration
→ Milestone
→ branche
→ Pull Request
→ Issue State
```

---

## 18. Applications consommatrices

Le futur modèle doit pouvoir représenter :

```text
Application
    ↓
Package @ Version
    ↓
Composants utilisés
```

Les sources permettant d'établir ces relations ne sont pas encore
définies.

Ce domaine est volontairement **FUTUR** et ne bloque pas le modèle V1 de
qualité du Design System.

---

## 19. Sources externes

Les principales sources identifiées sont :

- GitHub ;
- Jenkins ;
- Nexus ;
- Catalogue versionné ;
- futures sources d'Applications consommatrices.

Le modèle métier ne doit pas être confondu avec ces sources.

Un même fait métier peut nécessiter plusieurs signaux pour être établi.

---

## 20. Points structurels encore ouverts

Après consolidation des relations, les principaux points ouverts sont :

### Potentiellement structurants V1

- identité exacte `Audit métier` versus `Issue d'Audit GitHub` ;
- définition générale d'une Anomalie hors Audit ;
- profils de workflow et leurs exceptions ;
- dates métier de détection et de correction ;
- construction du Catalogue historique par Version.

### À confirmer sans bloquer le noyau

- représentation de la famille d'Audit ;
- objet Campagne d'Audit ;
- cardinalité maximale a11y des Improvements ;
- caractère obligatoire de la Release GitHub.

### Futur

- multi-Package détaillé ;
- identification des Librairies dans un monorepo ;
- consommation par les Applications ;
- détection de l'usage des Composants.

---

## 21. Règle de conception

Le modèle doit suivre l'ordre :

```text
fait métier établi
        ↓
objet / relation
        ↓
règle
        ↓
contrôle Data Quality
        ↓
métrique
        ↓
implémentation
        ↓
dashboard
```

Une règle ne doit pas être créée pour faire correspondre
artificiellement le métier à l'état actuel du code.
