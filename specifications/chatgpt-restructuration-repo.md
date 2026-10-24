Oui. À ce stade, je te conseille de **faire de la documentation du repository le référentiel du projet**, avant de continuer à modifier le modèle DQ ou les indicateurs.

Les deux documents que tu viens de partager montrent que le projet dépasse désormais largement un simple « dashboard GitHub » : ils décrivent un **modèle de fonctionnement du Design System**, avec workflow, audits, composants, accessibilité, versions, sprints, qualité et indicateurs. Le document workflow contient d'ailleurs encore explicitement des points « TODO », des choix à arbitrer et des questions ouvertes : il est donc important de ne pas le transformer brutalement en spécification figée.  

Je partirais donc sur une documentation **structurée, versionnée et évolutive**, avec une séparation très nette entre :

* ce que l'entreprise **fait aujourd'hui** ;
* ce que le projet **doit modéliser** ;
* les **règles métier** ;
* les **indicateurs** ;
* les décisions encore ouvertes ;
* la manière dont le logiciel **implémente** tout cela ;
* les supports de présentation.

---

# 1. L'arborescence que je te recommande

À terme, je viserais ceci :

```text
design-system-quality-pipeline/
│
├── README.md
├── CHANGELOG.md
├── CONTRIBUTING.md
│
├── docs/
│   │
│   ├── README.md
│   │
│   ├── 00-cadrage/
│   │   ├── vision.md
│   │   ├── objectifs.md
│   │   ├── perimetre.md
│   │   ├── hors-perimetre.md
│   │   └── glossaire.md
│   │
│   ├── 01-metier/
│   │   ├── modele-metier.md
│   │   ├── objets-metier.md
│   │   ├── relations.md
│   │   ├── composants.md
│   │   ├── audits.md
│   │   ├── anomalies.md
│   │   ├── versions-et-releases.md
│   │   └── sources-externes.md
│   │
│   ├── 02-workflow/
│   │   ├── README.md
│   │   ├── principes.md
│   │   ├── statuts.md
│   │   ├── issue-types.md
│   │   ├── labels.md
│   │   ├── projets.md
│   │   ├── iterations.md
│   │   ├── milestones.md
│   │   ├── pull-requests.md
│   │   ├── workflow-standard.md
│   │   ├── workflow-epic.md
│   │   ├── workflow-audit.md
│   │   ├── workflow-release.md
│   │   └── workflow-conception.md
│   │
│   ├── 03-regles/
│   │   ├── README.md
│   │   ├── regles-metier.md
│   │   ├── regles-workflow.md
│   │   ├── regles-relations.md
│   │   ├── regles-referentiel.md
│   │   ├── regles-qualite-donnees.md
│   │   └── regles-sources.md
│   │
│   ├── 04-indicateurs/
│   │   ├── README.md
│   │   ├── catalogue-indicateurs.md
│   │   ├── portfolio.md
│   │   ├── bibliotheque.md
│   │   ├── composants.md
│   │   ├── anomalies.md
│   │   ├── audits-accessibilite.md
│   │   ├── sprints.md
│   │   ├── versions.md
│   │   ├── qualite.md
│   │   └── indicateurs-futurs.md
│   │
│   ├── 05-donnees/
│   │   ├── architecture-donnees.md
│   │   ├── raw-dataset.md
│   │   ├── modele-normalise.md
│   │   ├── snapshots.md
│   │   ├── historique.md
│   │   ├── export-import.md
│   │   └── evolution-vers-backend.md
│   │
│   ├── 06-architecture/
│   │   ├── architecture.md
│   │   ├── pipeline.md
│   │   ├── normalisation.md
│   │   ├── quality-engine.md
│   │   ├── metric-engine.md
│   │   ├── snapshot-engine.md
│   │   ├── dashboard.md
│   │   └── architecture-cible.md
│   │
│   ├── 07-decisions/
│   │   ├── README.md
│   │   ├── ADR-001-snapshots.md
│   │   ├── ADR-002-modele-normalise.md
│   │   ├── ADR-003-separation-dq-metriques.md
│   │   └── ...
│   │
│   └── 08-implementation/
│       ├── guide-developpement.md
│       ├── structure-code.md
│       ├── tests.md
│       ├── fixtures.md
│       └── anonymisation.md
│
├── presentation/
│   ├── README.md
│   ├── 00-kit/
│   │   ├── principes.md
│   │   ├── vocabulaire.md
│   │   └── messages-cles.md
│   │
│   ├── squad/
│   ├── managers/
│   ├── developpeurs/
│   ├── lead-dev/
│   ├── designers/
│   ├── qualite/
│   ├── accessibilite/
│   └── clients/
│
├── config/
├── fixtures/
├── snapshots/
├── src/
├── tests/
└── ...
```

Je ne chercherais **pas à créer les 50 fichiers immédiatement**. L'intérêt de cette arborescence est surtout de donner une destination claire.

---

# 2. Le point essentiel : distinguer spécification, décision et implémentation

C'est probablement le changement qui t'apportera le plus de valeur.

Aujourd'hui, une partie du fonctionnement est mélangée dans `gh-workflow.md`, le code TypeScript, les YAML et les discussions.

Par exemple, ton document dit :

> Une issue `Backlog` doit avoir Grooming, ne doit pas avoir de vélocité, d'itération, de milestone, de branche ou de PR...

et plus loin le même document contient des interrogations du type :

> « Blocked ou Backlog ? »
> « à déterminer »
> « TODO »
> « voir questionnement »

C'est normal à ce stade. Mais il faut pouvoir distinguer :

### A. Règle validée

```text
Une issue en Backlog possède le label Grooming.
```

### B. Règle proposée

```text
Une Epic passe à Ready lorsque toutes ses sous-issues sont Ready.
```

### C. Question ouverte

```text
Le statut d'une Release doit-il être Blocked ou Backlog tant
que les issues de la version ne sont pas terminées ?
```

### D. Décision technique

```text
Les snapshots sont stockés en JSON immuable.
```

### E. Implémentation

```text
src/snapshots/snapshot.ts
```

Ces cinq choses ne doivent pas être confondues.

---

# 3. Je créerais surtout un « modèle de référence »

Le fichier le plus important deviendrait :

```text
docs/01-metier/modele-metier.md
```

Il répondrait à :

> **Quels sont les objets que nous manipulons réellement ?**

Par exemple :

```text
Organisation
 └── Bibliothèque
      ├── Repository
      │    ├── Component
      │    ├── Issue
      │    ├── Pull Request
      │    └── Release
      │
      └── Version
```

Puis :

```text
Issue
├── Issue Type
├── Status
├── Labels
├── Component
├── Iteration
├── Milestone
├── Assignee
├── Creator
├── Pull Requests
├── Parent / Children
└── Relations
```

Et surtout :

```text
Issue
  │
  ├── Audit ────── Component
  │                  │
  │                  └── Catalogue
  │
  ├── Anomaly
  │      ├── Criticality
  │      └── Category
  │
  └── Workflow
```

Cela permettra ensuite de discuter avec moi ou avec un développeur en disant :

> « Modifie la règle qui concerne l'objet `Audit` »

plutôt que :

> « Modifie le truc qui regarde les bugs d'accessibilité liés aux issues... »

---

# 4. Le deuxième document fondamental : la matrice du workflow

Je créerais :

```text
docs/02-workflow/workflow-standard.md
```

mais surtout une matrice globale :

```text
docs/02-workflow/principes.md
```

avec quelque chose comme :

| Objet          | Workflow   | PR obligatoire |   Velocity | Iteration | Milestone |
| -------------- | ---------- | -------------: | ---------: | --------: | --------: |
| Issue standard | Standard   |            Oui |        Oui |       Oui |       Oui |
| Epic           | Epic       |            Non |        Non | Optionnel | Optionnel |
| Audit          | Audit      |            Non |          0 |       Oui |       Oui |
| Release        | Release    |     Spécifique | Spécifique |         ? |       Oui |
| Conception     | Conception |            Non |          ? |         ? |         ? |

Cela va résoudre un problème majeur que nous avons déjà identifié : **ne pas appliquer une règle universelle à tous les types d'issues**.

Ton document actuel contient précisément des différences importantes entre Epic, Audit, Release et Conception.  

---

# 5. Un catalogue des règles métier

Je créerais ensuite :

```text
docs/03-regles/regles-metier.md
```

avec un identifiant stable pour chaque règle.

Par exemple :

```markdown
## BR-001 — Une issue Done doit être implémentée

### Statut
VALIDÉE

### Objet
Issue standard

### Condition
Status = Done

### Attendu
Au moins une Pull Request associée.

### Exception
Epic
Audit
...

### Impact
- qualité du workflow
- métriques de délai
- indicateurs de réalisation

### Source
GitHub Workflow § ...

### Implémentation
À définir
```

C'est extrêmement important pour notre collaboration future.

Tu pourras me dire :

> « Travaille sur BR-014 »

et je pourrai rechercher **la règle métier**, indépendamment du code actuel.

---

# 6. Les indicateurs doivent avoir leur propre catalogue

Le fichier actuel des indicateurs est riche, mais il mélange demandes, idées, contraintes et questions.

Par exemple, il contient les indicateurs de sprint, les indicateurs d'accessibilité, les règles et les demandes client dans un même document.

Je transformerais cela en :

```text
docs/04-indicateurs/catalogue-indicateurs.md
```

avec un identifiant :

```text
KPI-001
KPI-002
KPI-003
...
```

Chaque indicateur aurait une fiche standard :

```markdown
# KPI-XXX — Délai moyen de correction

## Question métier

Combien de temps faut-il en moyenne pour corriger une anomalie ?

## Périmètre

Anomalies corrigées.

## Formule

...

## Numérateur

...

## Dénominateur

...

## Période

...

## Dimensions

- bibliothèque
- composant
- criticité
- catégorie
- version

## Source

Issue
Pull Request
Audit

## Données nécessaires

...

## Fiabilité

...

## Exclusions

...

## Visualisation

...

## Drill-down

...

## Statut

PROPOSÉ / VALIDÉ / IMPLÉMENTÉ
```

Cela correspond parfaitement à la direction que nous avons déjà prise avec le modèle de métrique :

```text
id
value
unit
numerator
denominator
scope
period
definition
sourceEntityIds
reliability
exclusions
breakdowns
```

---

# 7. Je séparerais clairement les indicateurs « métier » des règles DQ

C'est particulièrement important pour la prochaine étape.

Par exemple :

> « Nombre d'anomalies »

est un **KPI**.

Alors que :

> « Une anomalie sans criticité »

est une **règle de qualité des données**.

Et :

> « Une anomalie sans criticité ne doit pas être utilisée dans la répartition par criticité »

est une **règle d'impact du DQ sur le KPI**.

Donc :

```text
KPI
 ↓
Données nécessaires
 ↓
Règles métier
 ↓
Règles de qualité
 ↓
Fiabilité du KPI
```

C'est beaucoup plus robuste que d'avoir des `DQ-001` qui deviennent progressivement un fourre-tout.

---

# 8. Le dossier `presentation` est une excellente idée

Je le ferais même comme un **produit documentaire à part entière**.

```text
presentation/
│
├── README.md
│
├── 00-kit/
│   ├── messages-cles.md
│   ├── glossaire.md
│   ├── chiffres-cles.md
│   └── illustrations/
│
├── squad/
│   └── dashboard-design-system.md
│
├── managers/
│   └── pilotage-design-system.md
│
├── developpeurs/
│   └── qualite-developpement.md
│
├── lead-dev/
│   └── architecture-et-qualite.md
│
├── designers/
│   └── conception-et-composants.md
│
├── qualite/
│   └── qualite-et-indicateurs.md
│
├── accessibilite/
│   └── audits-et-conformite.md
│
└── clients/
    └── valeur-et-resultats.md
```

Mais je ne ferais **pas** un PowerPoint différent comme source de vérité.

Le principe serait :

```text
DOCUMENTATION MÉTIER
        ↓
   messages clés
        ↓
   présentation
        ↓
       public
```

Donc le support manager, par exemple, reprend les concepts validés dans la documentation mais les explique sans parler de `RawDataset`, `DQ-007`, normalisation, etc.

---

# 9. Pour le format des présentations : Markdown + Mermaid au départ

Je te conseille de rester très simple.

Par exemple :

```text
presentation/
    managers/
        README.md
        slides.md
        images/
```

Les slides peuvent être écrites en Markdown et contenir :

* Mermaid
* graphiques
* schémas
* captures
* tableaux
* exemples du dashboard.

Cela permet ensuite de produire éventuellement :

```text
Markdown
   ├── GitHub
   ├── HTML
   ├── PDF
   └── présentation
```

sans enfermer le projet dans PowerPoint.

Et surtout, **les présentations sont versionnées avec le projet**.

---

# 10. Je créerais également un dossier `07-decisions`

C'est le principe des ADR — *Architecture Decision Records*.

Exemple :

```text
docs/07-decisions/
```

avec :

```text
ADR-001-snapshots.md
ADR-002-json-comme-format-d-echange.md
ADR-003-separation-raw-normalized.md
ADR-004-moteur-de-metriques.md
ADR-005-historisation.md
```

Une décision pourrait être :

> **ADR-001 — Le snapshot est le contrat de persistance actuel**

Décision :

```text
Le projet utilise actuellement des snapshots JSON immuables.
```

Justification :

```text
- simplicité
- Git-compatible
- facilement exportable
- facilement consommable
- indépendant d'un moteur SQL
- adapté au prototype
```

Et surtout :

> **Cette décision ne signifie pas que JSON sera la persistance finale.**

---

# 11. C'est justement là que ton idée sur le futur backend est très bonne

Je te conseille de poser dès maintenant cette règle d'architecture :

> **Le snapshot est un format de données et non une architecture de persistance.**

Aujourd'hui :

```text
GitHub
   ↓
TypeScript
   ↓
Snapshot JSON
   ↓
HTML
```

Demain :

```text
GitHub / autres sources
        ↓
   ingestion
        ↓
  modèle normalisé
        ↓
      API
        ↓
   ┌────┴────┐
   ↓         ↓
Frontend   Database
```

Mais le modèle métier reste :

```text
Raw
 ↓
Normalized Domain Model
 ↓
Metrics
 ↓
Snapshot
```

Le stockage peut changer.

---

# 12. Je définirais même trois contrats de données

C'est une évolution que je te recommande fortement.

### Contrat 1 — Raw

```text
RawDataset
```

> Ce que les sources nous ont fourni.

### Contrat 2 — Domain

```text
NormalizedDataset
```

> Notre représentation métier indépendante de GitHub.

### Contrat 3 — Analytics

```text
Snapshot
```

> L'état calculé du système à un instant donné.

Donc :

```text
                ┌── GitHub
Sources ────────┼── Catalogue
                ├── Nexus
                └── Applications
                       ↓
                  RAW DATA
                       ↓
              NORMALIZED DOMAIN
                       ↓
             RULES + METRICS
                       ↓
                   SNAPSHOT
                  /       \
                 /         \
             HTML          API
              ↓             ↓
          Dashboard      Database
```

C'est cette séparation qui permettra demain de passer à un backend sans réécrire le métier.

---

# 13. Le snapshot devient alors extrêmement intéressant

Aujourd'hui :

```text
snapshots/
├── 2026-09-01.json
├── 2026-09-15.json
├── 2026-10-01.json
└── ...
```

On peut ensuite calculer :

```text
Snapshot N
    ↓
Snapshot N+1
    ↓
Diff
    ↓
Flux
```

C'est exactement ce qui permettra de répondre à la question présente dans ton document :

> Peut-on faire des « photos » des indicateurs à des instants précis ?

Oui, et ton architecture actuelle va déjà dans cette direction. Le pipeline actuel produit à la fois un snapshot courant et des snapshots historisés, et compare le précédent pour calculer des métriques de flux. 

---

# 14. Je ferais une distinction importante entre `data`, `snapshot` et `documentation`

Je déconseille par exemple :

```text
docs/
snapshots/
fixtures/
```

où tout finit par se mélanger.

Je garderais :

```text
docs/          → ce que le système signifie
config/        → comment il est configuré
fixtures/      → données de test
snapshots/     → états calculés
src/           → implémentation
presentation/  → comment on l'explique
```

C'est extrêmement lisible pour quelqu'un qui découvre le repository.

---

# 15. Je rajouterais un fichier `docs/README.md` très important

Il pourrait devenir la porte d'entrée de toute notre collaboration.

Quelque chose comme :

```text
# Documentation du Design System Quality Pipeline

## Où commencer ?

### Je veux comprendre le projet
→ 00-cadrage/vision.md

### Je veux comprendre le métier
→ 01-metier/modele-metier.md

### Je veux comprendre notre fonctionnement GitHub
→ 02-workflow/

### Je veux connaître les règles
→ 03-regles/

### Je veux connaître les indicateurs
→ 04-indicateurs/

### Je veux comprendre les données
→ 05-donnees/

### Je veux comprendre l'architecture
→ 06-architecture/

### Je veux connaître les décisions prises
→ 07-decisions/

### Je veux développer
→ 08-implementation/
```

Cela nous permettra aussi, lorsque tu me donneras une nouvelle archive du projet, de travailler avec une **documentation navigable plutôt qu'un ensemble de fichiers dispersés**.

---

# 16. Et je mettrais un statut sur les spécifications

C'est un petit mécanisme qui peut énormément nous aider.

Par exemple :

```text
PROPOSED
DISCUSSION
VALIDATED
IMPLEMENTED
DEPRECATED
```

Pour une règle :

```markdown
**Statut :** VALIDATED
**Version :** 1.2
**Dernière modification :** 2026-10-03
```

Pour une proposition :

```markdown
**Statut :** DISCUSSION
**Décision attendue :** Squad
```

Cela évite que je prenne demain une hypothèse actuelle pour une règle métier définitive.

---

# 17. Une autre chose importante : conserver les questions ouvertes

Je créerais :

```text
docs/07-decisions/decisions-a-prendre.md
```

ou :

```text
docs/00-cadrage/questions-ouvertes.md
```

Par exemple :

```markdown
# Questions ouvertes

## Q-001 — Une issue sans audit est-elle conforme ?

Statut : À décider

Contexte :
...

Options :
- ...
- ...

Impact :
- KPI conformité
- Dashboard accessibilité
- DQ

Décideur :
Responsable accessibilité / Squad

Date :
-
```

C'est particulièrement adapté à ton document actuel, qui contient beaucoup de questions encore ouvertes sur les règles de Release, Epic, Conception, vélocité, etc.

---

# 18. Je te propose même un cycle de vie documentaire

À chaque évolution :

```text
Question
   ↓
Discussion
   ↓
Proposition
   ↓
Validation métier
   ↓
Spécification
   ↓
Implémentation
   ↓
Tests
   ↓
Dashboard
   ↓
Présentation
```

Et inversement, si le développement montre qu'une règle ne fonctionne pas :

```text
Implémentation
      ↓
problème
      ↓
règle métier
      ↓
discussion
      ↓
nouvelle décision
      ↓
nouvelle version
```

C'est ce qui permettra d'éviter que **le code devienne la seule vérité du projet**.

---

# 19. Ma recommandation concernant tes deux documents actuels

Je **ne les supprimerais surtout pas**.

Je les considérerais comme des **sources de travail historiques**.

Je ferais progressivement :

```text
gh-workflow.md
       │
       ├── modèle métier
       ├── workflow
       ├── règles
       ├── questions ouvertes
       └── décisions
       
indicateurs-souhaites.md
       │
       ├── catalogue KPI
       ├── règles métier
       ├── besoins clients
       └── questions ouvertes
```

Cela évite de perdre les réflexions qui ont conduit au modèle actuel.

Et cela nous permet de conserver la trace de la façon dont le modèle a évolué.

---

# 20. Ce que je ferais maintenant dans ton repository

Je ne toucherais **pas encore au code métier**.

Je ferais une étape documentaire dédiée :

### Étape A — installer le squelette

```text
docs/
presentation/
```

### Étape B — transformer les deux documents existants

Sans inventer de nouvelles règles.

### Étape C — produire trois documents de référence

**1. `modele-metier.md`**

> Quels sont nos objets ?

**2. `workflow.md`**

> Comment travaillent-ils ?

**3. `catalogue-indicateurs.md`**

> Que voulons-nous mesurer ?

### Étape D — produire

```text
questions-ouvertes.md
```

### Étape E — seulement ensuite

```text
regles/
```

et notre travail sur le DQ.

---

## Et surtout : je formaliserais cette architecture cible

Je pense qu'elle doit devenir un des premiers schémas du repository :

```text
                         SOURCES
                            │
             ┌──────────────┼──────────────┐
             │              │              │
          GitHub         Catalogue       Autres
             │              │           sources
             └──────────────┼──────────────┘
                            ↓
                      RAW DATASET
                            │
                            ↓
                 NORMALIZED DOMAIN MODEL
                            │
              ┌─────────────┼─────────────┐
              ↓             ↓             ↓
         DOMAIN RULES   WORKFLOW RULES  DATA QUALITY
              │             │             │
              └─────────────┼─────────────┘
                            ↓
                     METRIC ENGINE
                            │
                            ↓
                        SNAPSHOT
                            │
              ┌─────────────┼─────────────┐
              ↓             ↓             ↓
           HISTORY       HTML/API       EXPORT
                            │
                    ┌───────┴───────┐
                    ↓               ↓
                 Dashboard       Future DB
```

**C'est cette architecture qui, à mon avis, protège le projet contre le risque de devenir un gros script TypeScript dépendant de GitHub.**

Et elle est compatible avec ton souhait : **commencer très simplement avec TypeScript + JSON + HTML, tout en gardant la possibilité de passer plus tard à API + backend + base de données + frontend sans remettre en cause le modèle métier.**

### Ma recommandation pour la prochaine étape

Je pense qu'il vaut mieux **ne pas créer cette arborescence à la main**. Si tu me donnes le ZIP actuel comme référence de travail, je peux te préparer une **V11 documentaire** avec :

* l'arborescence `docs/` et `presentation/` ;
* les `README.md` de navigation ;
* le découpage des deux documents existants ;
* le premier modèle métier ;
* la matrice workflow ;
* le catalogue initial des indicateurs ;
* les questions ouvertes ;
* le document d'architecture cible ;
* les premiers ADR ;
* et surtout **aucune modification fonctionnelle du code**.

On aurait ainsi une base documentaire propre avant d'attaquer la refonte des règles métier et du DQ.

----

Oui. Je te propose de procéder comme une **instruction de conception progressive**, avant de toucher à l’implémentation.

Je vais respecter trois règles :

1. **Une question à la fois**, ou un tout petit groupe de questions lorsqu’elles sont indissociables.
2. Des réponses **fermées ou semi-fermées** autant que possible : choix, oui/non, liste courte, exemple concret.
3. Après chaque réponse, je te dirai :

   * ce que ta réponse permet d’établir ;
   * **quel document de référence mettre à jour** ;
   * si nécessaire, **quelle modification faire dans le repository** ;
   * les points restant explicitement **« À instruire »**, sans les inventer.

Je prendrai comme base le projet V11 et les documents déjà présents dans le ZIP, ainsi que les deux spécifications que nous avons déjà étudiées. Si une information n’est pas suffisamment établie par ces sources ou par ta réponse, je ne la déduirai pas.

### Ordre de travail proposé

On va avancer dans cet ordre :

1. **Périmètre et finalité du produit**
2. **Objets métier** : bibliothèque, composant, issue, anomalie, audit, version…
3. **Définition exacte d’une anomalie**
4. **Criticités et catégories**
5. **Workflow et profils d’issues**
6. **Relations entre objets**
7. **Audits et accessibilité**
8. **Versions / releases / milestones**
9. **Sprints / iterations / vélocité**
10. **Indicateurs et définitions mathématiques**
11. **Règles de qualité des données**
12. **Sources externes**
13. **Snapshots et historique**
14. **Architecture cible et évolution API/backend**
15. **Priorisation de l’implémentation**

Cela nous permettra ensuite de revoir les DQ actuelles **à partir du modèle métier validé**, plutôt que d'essayer de corriger DQ-001 à DQ-010 à l'aveugle.

---

## Question 1 — Quel est le rôle principal du dashboard ?

Aujourd’hui, plusieurs usages apparaissent dans les documents. Lequel correspond au **rôle principal** du produit ?

**A. Pilotage opérationnel du Design System**
Suivre les travaux en cours, les anomalies, les audits, les sprints, les délais, les versions.

**B. Mesure de la qualité du Design System**
Mesurer conformité, anomalies, criticités, couverture d’audit, qualité des composants.

**C. Les deux, avec un même niveau d’importance**
Le dashboard doit être à la fois un outil de pilotage opérationnel et un outil de mesure de qualité.

**D. Autre**
Tu précises en une ou deux phrases.

👉 Réponds simplement par **A, B, C ou D + précision éventuelle**.

À partir de ta réponse, je te proposerai immédiatement la première mise à jour concrète de `docs/00-cadrage/` avant de passer à la question 2.

-----

Oui. Cette précision change sensiblement le **périmètre cible** du produit. Je ne vais pas réduire le projet à un simple outil d'audit GitHub.

### Ce que je retiens à ce stade

Le produit doit progressivement couvrir **trois domaines complémentaires** :

| Domaine                          | Objectif                                                                                                              | Horizon                    |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| **Qualité des librairies**       | Conformité, anomalies, criticités, audits, qualité des composants                                                     | **Immédiat / prioritaire** |
| **Pilotage des librairies**      | Travaux, workflow, sprints, délais, versions, activité                                                                | **Immédiat / parallèle**   |
| **Consommateurs des librairies** | Versions utilisées, composants réellement utilisés, dette de version, alertes, qualité RGAA/WAI-ARIA des applications | **Futur**                  |

Pour le troisième domaine, je comprends notamment que tu souhaites pouvoir arriver à quelque chose comme :

```text
Application A
 ├── Design System React 1.8.0
 │    ├── Button       × 37
 │    ├── Modal        × 12
 │    └── DatePicker   × 4
 │
 ├── Version attendue : 1.9.x
 ├── Dette de version : OUI
 └── Qualité RGAA/WAI-ARIA :
       badge / note calculé(e) à partir
       des composants utilisés + de leur état qualité
```

**Mais je ne considère pas encore ce calcul comme défini.** Nous devrons notamment décider plus tard comment une qualité de composant se transforme — ou non — en qualité d'application. Je le marque donc **« À instruire »**, plutôt que de supposer une formule.

De même, ta formulation **« pour les composants les pros utilisées »** n'est pas suffisamment claire pour que je l'interprète sans risque. Nous la traiterons dans une question dédiée.

---

## Mise à jour documentaire à faire maintenant

Dans `docs/00-cadrage/vision.md`, le positionnement devrait évoluer pour faire apparaître ces trois dimensions.

Dans `docs/00-cadrage/objectifs.md`, il faudra distinguer :

* **Objectifs immédiats**

  * mesure de la qualité des librairies ;
  * pilotage opérationnel des librairies.
* **Objectifs futurs**

  * connaissance des consommateurs ;
  * suivi des versions consommées ;
  * analyse de l'utilisation des composants ;
  * suivi de la dette de version ;
  * rapprochement entre qualité du Design System et qualité des applications consommatrices.

Et dans `docs/00-cadrage/perimetre.md`, il faudra explicitement séparer :

```text
Périmètre actuel
    GitHub / librairies / composants / audits / anomalies / workflow

Périmètre futur
    Applications consommatrices / analyse de code / versions utilisées /
    composants utilisés / dette / qualité applicative
```

**Je ne te conseille pas encore de modifier le code.** Le modèle actuel doit d'abord être suffisamment précis pour éviter de construire aujourd'hui une architecture qui empêcherait cette extension demain.

---

# Question 2 — Les trois domaines doivent-ils être dans le même produit ?

Je veux maintenant trancher un point architectural important.

À terme, souhaites-tu **un seul dashboard / produit** avec plusieurs espaces ?

### A

**Oui, un seul produit**

Par exemple :

```text
Dashboard Design System
│
├── Vue globale
├── Qualité des librairies
├── Pilotage des librairies
├── Audits & accessibilité
└── Consommateurs
     ├── Applications
     ├── Versions utilisées
     ├── Composants utilisés
     └── Dette / alertes
```

### B

**Oui, mais avec deux produits fonctionnels distincts**

Par exemple :

```text
Design System Quality & Operations
        +
Design System Consumers
```

Ils partageraient les mêmes référentiels de librairies/composants/versions.

### C

**Je ne sais pas encore**

Dans ce cas, on conserve simplement la possibilité technique de l'un ou l'autre et **on reporte cette décision**.

### D

Autre organisation — précise-la.

👉 **Réponds simplement A, B, C ou D.**

Cette réponse nous permettra ensuite de déterminer si le futur modèle doit être pensé dès maintenant comme un **modèle de données centré sur le Design System**, plutôt que comme un modèle centré uniquement sur GitHub.

----------------

Avant de répondre à cette question, peux-tu me fournir le contenu complet et modifié des documents suite à ton retour :

"Cette réponse est cohérente avec les spécifications existantes : elles parlent bien d'un repository correspondant actuellement à une librairie, tout en prévoyant le cas futur du monorepo. 



Je peux donc maintenant établir comme fait actuel :

Une librairie est aujourd'hui distribuée sous la forme d'un package directement consommé par les applications, avec un nom et une version.

Cela donne une première relation concrète :



Librairie
   │
   └── Package
         │
         └── Version
               │
               └── consommé par Application

Mais je ne vais pas encore décider si Librairie, Package et Version doivent être trois objets distincts dans le modèle final : il faut d'abord comprendre comment vos packages sont réellement organisés.

Mise à jour documentaire

Dans les quatre documents précédents, il faut maintenant remplacer les formulations encore trop hypothétiques par :



Librairie : unité métier actuellement distribuée sous forme de package. 

Package : unité effectivement consommée par les applications. 

Version : version du package consommé. 

Cible future : conserver la possibilité qu'une librairie soit distribuée par plusieurs packages. 



Il faudra également ajouter cette relation dans modele-metier.md :



Librairie
    │
    └── Package
          │
          └── Version

avec la mention :

Situation actuelle observée : une librairie correspond à un package distribué et consommé directement par les applications. La possibilité de plusieurs packages pour une même librairie reste une capacité cible, non une situation actuelle établie.

Je ne te demande donc pas de modifier le code à ce stade."