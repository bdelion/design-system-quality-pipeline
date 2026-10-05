Oui. J’ai maintenant les deux documents métier et je les ai confrontés à ce que nous avons déjà vu du code du dashboard.  

Mon retour principal est le suivant :

> **Le sujet est plus large qu’un dashboard de qualité GitHub. Vous êtes en train de définir un véritable modèle opérationnel du Design System : objets, relations, workflow, règles de cohérence, qualité des composants, audits, versions et historique.**

C’est une très bonne direction, mais cela implique de **stabiliser le modèle métier avant de continuer à empiler des DQ et des KPI**.

---

# 1. Mon analyse en Lead Tech / Lead Dev

## 1.1. La première bonne décision : vous distinguez correctement les responsabilités

Votre taxonomie est saine :

| Mécanisme         | Rôle                                        |
| ----------------- | ------------------------------------------- |
| **Issue Type**    | Nature de l'objet                           |
| **Label**         | Classification / contexte                   |
| **Project**       | Workflow, sprint, estimation, planification |
| **Catalogue**     | Référentiel des composants                  |
| **Release / Tag** | Publication technique                       |



Je recommande de **conserver cette philosophie**.

C'est même une règle d'architecture que je mettrais au cœur du projet :

```text
Issue Type
    ↓
QU'EST-CE QUE C'EST ?

Labels
    ↓
QU'EST-CE QUI LE CARACTÉRISE ?

Project
    ↓
OÙ EN EST-IL DANS LE TRAVAIL ?

Iteration / Milestone
    ↓
QUAND / DANS QUEL LOT ?

Relations
    ↓
AVEC QUOI EST-IL LIÉ ?

Catalogue
    ↓
QUEL COMPOSANT ?

PR / Development
    ↓
COMMENT EST-IL RÉALISÉ ?

Release / version
    ↓
QU'EST-CE QUI EST LIVRÉ ?
```

**C'est cette séparation que le dashboard doit comprendre.**

---

# 2. Le principal problème que je vois : les règles ne sont pas globales

Dans ton document, tu écris par exemple :

> une Issue `In progress` doit avoir une branche.

Mais tu précises ensuite que :

* un audit d'accessibilité n'a pas de branche ;
* une Epic n'a pas de branche ;
* une issue d'audit n'a pas de PR ;
* une Epic n'a pas de PR.

 

Donc la vraie règle n'est **pas** :

```text
IN_PROGRESS → branche obligatoire
```

Elle est plutôt :

```text
                    Issue
                      │
             ┌────────┴────────┐
             │                 │
          Epic/Audit       Issue de réalisation
             │                 │
       pas de branche       branche obligatoire
       pas de PR            PR à partir de In Review
```

C'est extrêmement important pour notre future DQ.

### Je recommande donc un modèle :

```text
Règle
 ├── applicable à
 │    ├── Issue Type
 │    ├── éventuellement label/type d'audit
 │    └── éventuellement workflow
 │
 ├── précondition
 │
 ├── propriété attendue
 │
 ├── niveau
 │
 └── impact métrique
```

Autrement dit, **ne faisons plus des DQ qui disent simplement "une Issue doit avoir X"**.

Faisons des DQ qui disent :

> Pour une Issue de type `Bug` dans le workflow standard, lorsque son statut est `In review`, une PR ouverte doit être associée.

C'est beaucoup plus robuste.

---

# 3. Il faut formaliser les "profils de workflow"

Je pense que c'est probablement **la plus grosse amélioration à apporter au projet**.

Aujourd'hui ton document décrit implicitement plusieurs workflows.

### Workflow standard

```text
Backlog
   ↓
Ready
   ↓
In progress
   ↓
In review
   ↓
Done
```

avec `Blocked` comme état transversal et `Cancelled` comme sortie alternative. 

### Workflow Audit

```text
Ready
 ↓
In progress
 ↓
Done
```

sans `In review`, sans branche et sans PR. 

### Workflow Epic

```text
Backlog
 ↓
Ready
 ↓
In progress
 ↓
...
 ↓
Done
```

mais avec une logique déterminée par les sub-issues et **sans branche ni PR**. 

### Workflow Release

Il possède encore une logique spécifique autour de la milestone, de la branche release et de la Release Candidate. 

### Conclusion

Je créerais conceptuellement :

```text
WorkflowProfile

STANDARD
EPIC
AUDIT
RELEASE
CONCEPTION
```

Et éventuellement :

```text
AUDIT_ACCESSIBILITY
AUDIT_SECURITY
AUDIT_QUALITY
...
```

si les différences deviennent suffisamment importantes.

Cela simplifierait **énormément** les DQ.

---

# 4. Issue Type ≠ domaine métier

Ton document contient une excellente intuition :

> un Bug et un Bug d'audit sont différents pour le suivi RGAA/WAI-ARIA. 

Je pousserais cette idée beaucoup plus loin.

Actuellement :

```text
Bug
```

est un **Issue Type**.

Mais :

```text
RGAA bloquante
RGAA majeure
RGAA mineure
```

est une **dimension métier**.

Et :

```text
contraste
clavier
sémantique
...
```

est une autre dimension.

Donc une anomalie pourrait conceptuellement être :

```text
Anomalie
│
├── nature : Bug
│
├── origine : Audit
│
├── domaine : Accessibilité
│
├── criticité : RGAA majeure
│
├── catégorie : clavier
│
├── composant : Button
│
└── audit : Audit Button v1.2.0
```

C'est beaucoup plus puissant que :

```text
Bug + quelques labels
```

---

# 5. Je recommande de distinguer les différentes criticités

Ton document le dit explicitement et je suis complètement d'accord :

> la criticité RGAA/WAI ARIA est différente d'une criticité métier, fonctionnelle, technique, DX ou UX. 

Il faut absolument éviter dans le modèle :

```ts
criticality: "major"
```

car on ne sait pas ce que signifie `major`.

Je préférerais conceptuellement :

```text
criticalities
 ├── accessibility
 │     └── major
 │
 ├── business
 │     └── ...
 │
 ├── technical
 │     └── ...
 │
 ├── developerExperience
 │     └── ...
 │
 └── designerExperience
       └── ...
```

Et dans le dashboard :

```text
Criticité accessibilité
    Bloquante / Majeure / Mineure

Criticité technique
    ...

Priorité produit
    P1 / P2 / P3 / P99999
```

Cela évitera une énorme quantité de confusion dans les KPI futurs.

---

# 6. Le sujet "Audit" mérite une vraie modélisation

C'est probablement le deuxième gros chantier.

Tu envisages plusieurs types d'audit et tu poses toi-même la question :

> faut-il différencier les types d'audit ? accessibilité, sécurité, qualité, design... 

**Oui, je pense qu'il faut le prévoir dans le modèle.**

Je ne ferais cependant pas forcément :

```text
Issue Type = Audit
Label = accessibility
```

comme seule information.

Je ferais :

```text
Issue Type
    = Audit

Audit
    type = accessibility
    component = Button
    campaign = Audit 2026 S2
    version = 1.8.0
    auditor = ...
```

La représentation GitHub pourra ensuite utiliser un label ou un autre champ, mais le dashboard doit avoir une notion explicite d'**Audit**.

Cela permettra demain de faire :

```text
Audits
├── Accessibilité
├── Sécurité
├── Qualité
├── Design
└── ...
```

sans refaire le modèle.

---

# 7. Très bonne distinction : anomalie vs amélioration

Ton modèle d'audit prévoit :

```text
Audit
 ├── Non-conformité
 │      └── Bug
 │
 └── Amélioration
        └── Feature
```



C'est **très intéressant pour le dashboard**.

Car aujourd'hui, si on compte simplement les `Bug`, on risque de mélanger :

```text
Bug produit
Bug technique
Bug issu d'un audit
Bug accessibilité
```

Alors que les indicateurs client ne veulent pas forcément dire la même chose.

Je recommande donc que le modèle distingue :

```text
Anomalie
    → impacte la conformité / qualité

Amélioration
    → proposition d'évolution
```

et ensuite :

```text
Anomalie
 ├── issue externe / produit
 ├── issue découverte en audit
 └── autre origine
```

---

# 8. Le composant ne doit pas être uniquement un label

Ton système utilise :

```text
🧩 Component:xxx
```

ce qui est très bien pour GitHub. 

Mais pour le dashboard, il faut considérer :

```text
GitHub label
       ↓
   résolution
       ↓
Catalogue Component
```

et pas simplement :

```text
label = composant
```

Le catalogue doit être la référence.

Cela permettra notamment :

* composant supprimé ;
* composant renommé ;
* composant non encore catalogué ;
* plusieurs repositories ;
* demain monorepo ;
* plusieurs librairies dans un repository.

Tu as d'ailleurs explicitement identifié le futur cas :

> un repository = N librairies. 

Je prévoirais donc dès maintenant le modèle :

```text
Organisation
   │
   ├── Librairie
   │      │
   │      ├── Repository
   │      │
   │      └── Components
   │
   └── ...
```

Même si aujourd'hui :

```text
1 repository = 1 librairie
```

---

# 9. Milestone est actuellement surchargée

C'est un point que je traiterais avant d'aller beaucoup plus loin.

Tu utilises les milestones pour :

```text
1.8.0
1.8.0-Audit
2026 T1
2027 S1
2026 - Design M1
```



Donc une Milestone représente tantôt :

* une version ;
* une campagne d'audit ;
* un horizon temporel ;
* une priorité Design.

Ce n'est pas nécessairement mauvais dans GitHub, mais **c'est dangereux pour un modèle analytique**.

Le dashboard doit distinguer leur sémantique :

```text
Milestone
   │
   ├── Release
   │     └── 1.8.0
   │
   ├── Audit
   │     └── 1.8.0-Audit
   │
   ├── Planning horizon
   │     └── 2026 T4
   │
   └── Design batch
         └── 2026 - Design M1
```

Et ton idée de considérer :

```text
1.1.0
1.1.0-Audit
```

comme la même version analytique est excellente. 

Je ferais même une fonction conceptuelle :

```text
milestone
    ↓
parseMilestone()
    ↓
{
  raw: "1.1.0-Audit",
  kind: "audit",
  version: "1.1.0"
}
```

---

# 10. Velocity : il faut absolument distinguer vide et 0

Tu l'as identifié plusieurs fois dans les documents. 

Et c'est très important.

```text
undefined
```

peut vouloir dire :

> pas encore estimé

alors que :

```text
0
```

peut vouloir dire :

> volontairement non estimé / travail hors effort / audit / Epic / R&D...

Ce ne sont pas les mêmes choses.

Je recommande :

```text
velocity
    null     = non renseignée
    0        = explicitement zéro
    > 0      = estimation
```

Puis une règle :

```text
velocity = null
```

n'a pas la même signification que :

```text
velocity = 0
```

---

# 11. Le workflow est suffisamment précis pour produire de vraies DQ

Ton document donne maintenant une excellente base.

Par exemple :

### Backlog

```text
Grooming obligatoire
Velocity = null
Iteration = null
Milestone = null
PR = null
Close = false
```



### Ready

```text
Grooming absent
Velocity > 0
pas de PR
pas de branche
```

avec exceptions à définir pour Epic/Audit/R&D/POC. 

### In Review

```text
Iteration
Milestone
Branch
PR
Assignee
Issue ouverte
```



### Done

```text
Iteration
Milestone
Branch
PR
Issue close
Assignee
```



Cela nous permet de construire quelque chose de beaucoup plus intéressant que les DQ actuelles :

# une matrice de conformité du workflow

Par exemple :

| Status      | Règle               | Exception      |
| ----------- | ------------------- | -------------- |
| Backlog     | Grooming            | —              |
| Backlog     | Velocity vide       | —              |
| Backlog     | pas d'Iteration     | —              |
| Ready       | Velocity renseignée | Epic/Audit/... |
| In progress | Iteration           | —              |
| In progress | branche             | Audit/Epic     |
| In review   | PR                  | Audit/Epic     |
| Done        | PR mergée           | Audit/Epic     |
| Done        | Issue fermée        | —              |
| Cancelled   | resolution          | —              |
| Cancelled   | pas de PR mergée    | —              |

**C'est probablement la future structure centrale de tes DQ.**

---

# 12. Ton idée de mesurer les sprints est très bonne

Les indicateurs demandés vont au-delà du simple :

> 10 tickets terminés.

Tu souhaites notamment :

* durée du sprint ;
* jours ouvrés ;
* nombre traité ;
* Done ;
* Cancelled ;
* autres statuts ;
* répartition des statuts ;
* créateurs ;
* assignés. 

Je rajouterais conceptuellement :

```text
Sprint
 ├── capacité planifiée
 ├── capacité réalisée
 ├── tickets engagés
 ├── tickets Done
 ├── tickets reportés
 ├── tickets Cancelled
 ├── tickets Blocked
 └── vélocité réalisée
```

Mais attention à ne pas transformer le dashboard en **outil d'évaluation individuelle**.

Les métriques :

> nombre d'issues créées par personne
> nombre d'issues assignées par personne

sont utiles pour comprendre le fonctionnement, mais je déconseille fortement de les présenter comme des indicateurs de performance individuels.

Pour un manager, je privilégierais :

```text
Flux de l'équipe
Capacité
Délais
Blocages
Prévisibilité
Qualité
```

plutôt que :

```text
Jean = 17 tickets
Paul = 11 tickets
```

---

# 13. Tes indicateurs de délai sont bien choisis

Tu demandes :

* moyenne ;
* médiane ;
* P90 ;
* min ;
* max. 

Je conserverais surtout :

```text
Médiane
P90
```

et éventuellement moyenne.

Le P90 est particulièrement intéressant pour répondre à :

> « Dans les cas difficiles, combien de temps faut-il réellement ? »

Il faut par contre définir **exactement le début et la fin**.

Par exemple :

```text
createdAt → closedAt
```

n'est pas forcément :

```text
Ready → Done
```

et encore moins :

```text
In progress → Done
```

Je proposerais donc plusieurs métriques :

```text
Lead time
Création → Done

Cycle time
In progress → Done

Review time
In review → Done

Blocked time
temps passé Blocked
```

À terme, cela donnera une lecture beaucoup plus utile.

---

# 14. La partie accessibilité est en réalité un deuxième produit analytique

C'est un point majeur.

Tes indicateurs demandent :

* campagnes d'audit ;
* composants prévus ;
* en cours ;
* terminés ;
* conformes ;
* non conformes ;
* ratio de conformité ;
* anomalies ;
* améliorations ;
* criticité ;
* familles de critères ;
* délais ;
* vélocité ;
* scoring par version. 

Ce n'est plus simplement :

> « dashboard GitHub ».

C'est :

> **un système de pilotage de la qualité et de la conformité du Design System.**

Et je séparerais clairement dans l'interface :

```text
              DASHBOARD DS
                   │
        ┌──────────┼──────────┐
        │          │          │
     DELIVERY    QUALITY   ACCESSIBILITY
        │          │          │
     workflow    anomalies   audits
     sprints     délais      conformité
     releases    backlog     RGAA
```

---

# 15. Attention au KPI "100 % conforme"

Tu as posé une excellente question :

> faut-il considérer les composants non audités comme non conformes ?



**Non, je ne le ferais pas.**

Je recommande trois états :

```text
NON AUDITÉ
AUDITÉ — CONFORME
AUDITÉ — NON CONFORME
```

Et donc :

```text
Taux de couverture d'audit
= composants audités / composants totaux

Taux de conformité
= composants conformes / composants audités
```

Ainsi :

```text
100 % de conformité
```

peut parfaitement coexister avec :

```text
40 % de couverture
```

C'est beaucoup plus honnête.

---

# 16. Le scoring de qualité doit attendre

Tu proposes :

> scoring de la qualité d'accessibilité du composant. 

Je le garderais comme **phase 2**.

Avant de mettre un score du type :

```text
Button = 82/100
```

il faut définir :

* quelles anomalies comptent ;
* leur poids ;
* si une bloquante vaut 10 ou 100 ;
* si plusieurs mineures peuvent compenser une majeure ;
* comment évolue le score ;
* si le score est comparable entre versions ;
* comment traiter un composant non audité ;
* comment traiter une catégorie non applicable.

Sinon on crée un chiffre très séduisant mais difficilement défendable.

---

# 17. Certains indicateurs nécessitent des données que GitHub ne possède pas

C'est très important pour l'architecture.

Tu demandes :

> nombre d'applications qui utilisent le DS, par version ; celles qui ne l'utilisent pas et devraient. 

et :

> nombre d'anomalies par composant, à rapprocher avec la fréquence d'utilisation. 

Ces indicateurs ne peuvent pas être calculés correctement à partir de GitHub seul.

Il faut probablement une architecture :

```text
GitHub
   │
   ├── Issues
   ├── Projects
   ├── PR
   ├── Releases
   └── Milestones
             │
             ▼
      Dashboard Analytics
             ▲
             │
   ┌─────────┴──────────┐
   │                    │
Nexus / registry    Catalogue / usage
   │                    │
versions             applications
```

C'est exactement pourquoi votre DQ-009 sur Nexus ne doit pas être traitée comme une simple anomalie de données.

**Une source externe indisponible signifie : "je ne peux pas calculer cet indicateur", pas "les données GitHub sont mauvaises".**

---

# 18. Les snapshots historiques sont absolument pertinents

Tu demandes :

> possibilité de faire des "photos" des indicateurs à des instants précis. 

Et là, ton architecture actuelle est déjà bien orientée.

Je conserverais :

```text
Snapshot
 ├── timestamp
 ├── modelVersion
 ├── ruleVersion
 ├── sourceVersion
 └── metrics
```

Puis :

```text
Snapshot T0
    ↓
Snapshot T1
    ↓
Snapshot T2
    ↓
Historique
```

Cela permet notamment de répondre :

> « Est-ce que la qualité s'améliore ? »

et pas uniquement :

> « Quelle est la qualité aujourd'hui ? »

---

# 19. Le dashboard devrait donc être organisé autour de 5 niveaux

Je vois maintenant assez clairement la cible.

```text
┌─────────────────────────────────────┐
│  1. PORTFOLIO / EXECUTIVE           │
│  Santé globale du Design System     │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│  2. LIBRARY                         │
│  Vue d'une librairie                │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│  3. COMPONENT                       │
│  Santé d'un composant               │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│  4. AUDIT / VERSION                 │
│  Conformité et évolution            │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│  5. ISSUE / TRACEABILITY             │
│  Pourquoi le chiffre est celui-ci ? │
└─────────────────────────────────────┘
```

Et surtout :

## Chaque KPI devrait pouvoir répondre à « pourquoi ? »

Par exemple :

> **87 % des composants audités sont conformes**

clic :

```text
7 / 8 composants audités

Conformes
 ├── Button
 ├── Input
 ├── Modal
 ...

Non conformes
 └── Select
       ├── 1 bloquante
       ├── 2 majeures
       └── 3 mineures
```

Puis :

```text
Select
  ↓
Audit #1234
  ↓
Issue #456
  ↓
PR #789
```

C'est cette **traçabilité du KPI jusqu'à GitHub** qui peut réellement différencier ton dashboard.

---

# 20. Ma recommandation d'architecture finale

Je ne ferais plus :

```text
GitHub
 ↓
10 règles DQ
 ↓
KPI
```

Je viserais :

```text
                    GITHUB
                       │
                       ▼
                 RAW DATASET
                       │
                       ▼
              NORMALIZED MODEL
                       │
          ┌────────────┼─────────────┐
          │            │             │
          ▼            ▼             ▼
       DOMAIN       WORKFLOW       QUALITY
       RULES          RULES          RULES
          │            │             │
          └────────────┼─────────────┘
                       ▼
                 DATA QUALITY
                       │
                       ▼
                 METRIC ENGINE
                       │
                       ▼
                  SNAPSHOT
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
      Dashboard     History      Exports
```

Et les règles seraient réparties en :

### A. Domain rules

> Est-ce que l'objet est correctement défini ?

### B. Workflow rules

> Est-ce que l'objet est dans un état cohérent avec son workflow ?

### C. Relationship rules

> Ses relations sont-elles cohérentes ?

### D. Reference rules

> Composant, catalogue, version, audit, etc.

### E. Data-quality rules

> Les données nécessaires sont-elles présentes ?

### F. Source-availability rules

> Les sources externes nécessaires sont-elles disponibles ?

C'est **beaucoup plus simple à comprendre que DQ-001 à DQ-010**, et surtout beaucoup plus extensible.

---

# 21. Les trois niveaux de restitution que je te propose

Je pense que nous pouvons maintenant produire trois documents différents à partir du même modèle.

## Niveau 1 — équipe Lead Dev / Dev / Designer / client

Il faut parler :

* du problème ;
* du modèle GitHub ;
* des workflows ;
* des audits ;
* des indicateurs ;
* de la qualité ;
* des décisions encore à prendre ;
* de la traçabilité.

Pas parler des détails TypeScript/DQ internes.

Voici une première version que tu pourrais réellement présenter.

# Dashboard de pilotage du Design System

## 1. Pourquoi ce projet ?

Le Design System est utilisé et évolue au travers de plusieurs librairies, composants, versions, audits et contributions.

GitHub contient une grande partie de cette information : issues, types d'issues, labels, projets, itérations, milestones, relations entre issues, pull requests et releases.

L'objectif du dashboard est de transformer ces données opérationnelles en une vision fiable, compréhensible et historisée de l'activité et de la qualité du Design System.

Le dashboard ne doit pas simplement compter les tickets. Il doit permettre de comprendre :

* ce qui est en cours ;
* ce qui a été réalisé ;
* ce qui est bloqué ;
* ce qui doit encore être traité ;
* la qualité des composants ;
* la conformité aux audits ;
* les anomalies découvertes ;
* les délais de correction ;
* l'évolution de ces indicateurs dans le temps.

## 2. Un modèle GitHub structuré

Chaque mécanisme GitHub possède une responsabilité distincte :

* **Issue Type** : définit la nature de l'objet ;
* **Label** : apporte une classification ou un contexte ;
* **GitHub Project** : porte le workflow, l'estimation et la planification ;
* **Catalogue** : constitue le référentiel des composants ;
* **Milestone / Release** : permet de rattacher les travaux à une version ou à un horizon.

Cette séparation permet au dashboard de comprendre le sens de chaque information plutôt que de traiter tous les champs GitHub comme de simples données.

## 3. Plusieurs workflows

Toutes les issues ne suivent pas exactement le même cycle.

Le workflow standard est :

Backlog → Ready → In progress → In review → Done

avec la possibilité d'être temporairement `Blocked` ou définitivement `Cancelled`.

Les Epics, les audits, les releases et certains travaux spécifiques suivent cependant des règles différentes.

Le dashboard doit donc vérifier la cohérence d'une issue en fonction de son type et de son workflow, et non appliquer une règle unique à toutes les issues.

## 4. Les audits constituent un domaine spécifique

Un audit d'accessibilité permet d'évaluer un composant.

Il peut appartenir à une campagne d'audit et être associé à une version du Design System.

Un audit peut produire :

* des non-conformités ;
* des améliorations proposées.

Les non-conformités sont suivies comme des anomalies et peuvent être classées par criticité et par famille de critères d'accessibilité.

Le dashboard doit donc permettre de suivre séparément :

* la couverture des audits ;
* les audits en cours ;
* les audits terminés ;
* les composants conformes ;
* les composants non conformes ;
* les anomalies découvertes ;
* les anomalies corrigées ;
* les améliorations proposées.

## 5. Mesurer la conformité sans produire de faux indicateurs

Un composant non audité ne doit pas être considéré comme non conforme.

Il faut distinguer :

* non audité ;
* audité et conforme ;
* audité et non conforme.

On peut alors calculer séparément :

**Couverture d'audit**

Composants audités / composants totaux

**Taux de conformité**

Composants conformes / composants audités

Cette distinction permet d'éviter qu'un taux de conformité de 100 % donne l'impression que toute la librairie a été auditée alors qu'une partie des composants ne l'a pas encore été.

## 6. Les indicateurs

Le dashboard doit proposer plusieurs niveaux d'analyse.

### Vue globale

* nombre de composants ;
* couverture des audits ;
* conformité ;
* anomalies ouvertes ;
* anomalies par criticité ;
* délais de correction ;
* évolution dans le temps.

### Vue librairie

* issues par composant ;
* délais ;
* vélocité ;
* répartition par type et labels ;
* état des sprints et milestones.

### Vue composant

* audits réalisés ;
* conformité ;
* anomalies ;
* criticités ;
* catégories d'accessibilité ;
* délais de correction ;
* historique.

### Vue version / release

* composants concernés ;
* audits ;
* anomalies ;
* conformité ;
* état de préparation de la release.

## 7. Fiabilité des indicateurs

Tous les chiffres ne peuvent pas toujours être calculés.

Par exemple, un composant absent du catalogue ou une source externe indisponible peut empêcher le calcul fiable d'un indicateur.

Le dashboard doit donc pouvoir distinguer :

* indicateur fiable ;
* indicateur partiel ;
* indicateur non calculable.

Un problème de qualité sur une donnée ne doit pas rendre artificiellement tous les autres indicateurs invalides.

## 8. Traçabilité

Chaque indicateur important doit pouvoir être expliqué.

Exemple :

> 87 % des composants audités sont conformes.

Le dashboard doit permettre de retrouver :

* les composants audités ;
* les composants conformes ;
* les composants non conformes ;
* les audits correspondants ;
* les anomalies ;
* les pull requests de correction.

L'objectif est de pouvoir remonter du KPI jusqu'à la donnée GitHub qui le justifie.

## 9. Historisation

Les indicateurs doivent pouvoir être capturés à intervalles réguliers.

Le dashboard pourra ainsi montrer l'évolution :

* de la couverture d'audit ;
* de la conformité ;
* du nombre d'anomalies ;
* des délais ;
* de la dette restante ;
* de la qualité des composants.

On passe ainsi d'une photographie à un véritable suivi de trajectoire.

## 10. Une architecture ouverte

Le système doit aujourd'hui exploiter GitHub, tout en permettant demain d'intégrer d'autres sources.

Certaines informations, comme l'utilisation réelle d'un composant ou les versions utilisées par les applications, peuvent nécessiter des sources complémentaires.

Le dashboard doit donc être conçu comme un moteur d'analyse multi-sources plutôt que comme un simple lecteur de GitHub.

## 11. Objectif final

Le résultat attendu est un outil permettant à chaque profil de disposer du bon niveau d'information :

* **Développeur** : que dois-je traiter et pourquoi ?
* **Designer** : où sont les problèmes de qualité ou d'expérience ?
* **Lead Dev** : quel est l'état du flux et où sont les blocages ?
* **Responsable accessibilité** : quelle est la couverture et la conformité ?
* **Client / produit** : quelle est la qualité du Design System et son évolution ?
* **Manager** : quelle est la tendance globale et où faut-il porter l'attention ?

Le dashboard devient ainsi un outil commun de pilotage du Design System, basé sur des données GitHub explicables et historisées.

---

# 22. Version vulgarisée pour des managers

Ici, je changerais complètement le vocabulaire.

Le manager n'a pas besoin de savoir ce qu'est `DQ-007`.

Il faut répondre à quatre questions :

> **Où en sommes-nous ?**
> **Est-ce que nous sommes en qualité ?**
> **Qu'est-ce qui nous ralentit ?**
> **Est-ce que la situation s'améliore ?**

# Le dashboard du Design System expliqué simplement

## Pourquoi avons-nous besoin de cet outil ?

Un Design System contient de nombreux composants utilisés par plusieurs équipes et plusieurs applications.

Ces composants évoluent régulièrement. Ils doivent être développés, testés, documentés et parfois audités, notamment sur l'accessibilité.

Toutes ces activités produisent beaucoup d'informations dans GitHub.

Le problème est que GitHub nous montre surtout les tâches individuelles.

Le dashboard a pour objectif de transformer toutes ces informations en une vision simple de la santé du Design System.

## Que veut dire "santé du Design System" ?

On peut la regarder avec plusieurs questions.

### 1. Avançons-nous correctement ?

Nous pouvons suivre :

* les travaux à faire ;
* les travaux en cours ;
* les travaux terminés ;
* les travaux bloqués ;
* les travaux abandonnés ;
* les délais.

Cela permet de voir si le fonctionnement de l'équipe est fluide.

### 2. Les composants sont-ils de bonne qualité ?

Un composant peut être audité.

L'audit peut révéler des problèmes plus ou moins importants.

Le dashboard permet alors de suivre :

* combien de composants ont été audités ;
* combien sont conformes ;
* combien présentent encore des problèmes ;
* combien de problèmes restent ouverts ;
* quelle est leur gravité.

### 3. Corrigeons-nous les problèmes ?

Un autre indicateur important est le délai entre la découverte d'un problème et sa correction.

L'objectif n'est pas simplement de connaître le nombre de problèmes.

Il faut également savoir si la dette de qualité diminue ou augmente et si les problèmes importants sont effectivement traités.

### 4. Sommes-nous en train de nous améliorer ?

Une photographie à un instant donné est utile.

Mais une série de photographies est beaucoup plus intéressante.

Elle permet de voir une tendance :

```text
         Qualité
           ↑
           │                 ●
           │            ●
           │        ●
           │    ●
           │ ●
           └────────────────────→ Temps
```

On peut ainsi voir si :

* la couverture des audits augmente ;
* le nombre d'anomalies diminue ;
* les délais diminuent ;
* davantage de composants deviennent conformes.

## Une précision importante

Un composant qui n'a pas encore été audité n'est pas nécessairement mauvais.

Il faut donc distinguer :

**Pas encore audité**

de

**Audité et conforme**

et

**Audité mais non conforme**

Cela évite de produire des indicateurs trompeurs.

## Et si certaines informations sont manquantes ?

Le dashboard doit également être capable de dire :

> "Nous ne savons pas."

Par exemple, si une source nécessaire à un indicateur n'est pas disponible, le système ne doit pas inventer une valeur.

Il doit indiquer que l'indicateur est incomplet ou momentanément indisponible.

## À quoi sert finalement le dashboard ?

Le but n'est pas de surveiller chaque développeur.

Le but est de disposer d'une vision commune permettant de répondre à quatre questions :

1. **Où en sommes-nous ?**
2. **Quels sont les problèmes importants ?**
3. **Qu'est-ce qui ralentit le système ?**
4. **Est-ce que la situation s'améliore ?**

Le dashboard doit donc devenir un outil d'aide au pilotage du Design System, aussi bien pour les équipes techniques et design que pour les responsables et les clients.

---

# 23. Et maintenant, ce que je ferais concrètement dans le projet

Je **ne toucherais pas encore aux DQ existantes**.

Je ferais plutôt quatre étapes.

### Étape 1 — figer le modèle métier

Nous devons décider définitivement :

```text
Issue Type
Label
Status
Velocity
Iteration
Milestone
Component
Audit
Anomaly
Improvement
Epic
Release
PR
Relationship
```

et leurs relations.

### Étape 2 — construire une matrice des workflows

Par exemple :

| Type       | Workflow   | Velocity | Branch     | PR         | Milestone | Iteration |
| ---------- | ---------- | -------: | ---------- | ---------- | --------- | --------- |
| Bug        | standard   |       >0 | oui        | oui        | oui       | oui       |
| Feature    | standard   |       >0 | oui        | oui        | oui       | oui       |
| Task       | standard   |       >0 | oui        | oui        | oui       | oui       |
| Audit      | audit      |      0 ? | non        | non        | oui       | oui/non   |
| Epic       | epic       |        0 | non        | non        | optionnel | optionnel |
| Release    | release    |        ? | spécifique | spécifique | oui       | ?         |
| Conception | conception |        ? | ?          | ?          | ?         | ?         |

Les `?` sont précisément les décisions qu'il faut prendre.

### Étape 3 — seulement ensuite définir les DQ

Nous pourrons alors dire :

```text
Workflow STANDARD
    ├── Backlog
    ├── Ready
    ├── In progress
    ├── In review
    ├── Done
    ├── Blocked
    └── Cancelled

Workflow AUDIT
    ├── Ready
    ├── In progress
    └── Done
```

et les DQ deviendront beaucoup plus simples.

### Étape 4 — définir les KPI à partir des événements métier

Et là je voudrais faire évoluer fortement le dashboard.

Au lieu de demander uniquement :

> combien d'issues sont Done ?

on pourrait avoir :

```text
Création
   ↓
Grooming
   ↓
Ready
   ↓
In progress
   ↓
In review
   ↓
Done
```

et mesurer :

```text
Lead time
Cycle time
Temps d'attente
Temps de développement
Temps de revue
Temps bloqué
```

C'est à mon avis **beaucoup plus intéressant pour les Lead Dev et les managers** qu'un simple compteur de tickets.

---

## Ma conclusion de Lead Tech

Les documents que tu viens de fournir changent assez nettement ma perception du projet.

**Le code actuel est en train de construire un moteur de KPI autour de GitHub.**

Mais le besoin réel que tu viens de formaliser est plutôt :

> **un moteur de compréhension et de pilotage du cycle de vie du Design System, dont GitHub est aujourd'hui la principale source de données.**

Et cette distinction est importante.

Je te conseille donc **de ne pas repartir immédiatement dans "DQ-001, DQ-002..."**.

La prochaine étape que je te propose est beaucoup plus structurante :

### Construire ensemble le **modèle métier de référence V1**

avec un grand schéma :

```text
                    DESIGN SYSTEM
                          │
          ┌───────────────┼────────────────┐
          │               │                │
      Librairies       Composants       Versions
          │               │                │
          │          ┌────┴────┐           │
          │          │         │           │
          │        Audits   Issues         │
          │          │         │           │
          │          │    ┌────┼────┐      │
          │          │    │    │    │      │
          │          │   Bug Feature Task   │
          │          │    │                 │
          │          │    └── PR             │
          │          │                       │
          └──────────┴───────────────────────┘
```

Puis, pour **chaque objet**, définir :

> **ce qu'il est → ce qui est obligatoire → ce qui est optionnel → ce qui est interdit → avec quoi il peut être lié → quel workflow il suit → quels KPI il alimente.**

Une fois cette matrice validée, **les nouvelles DQ, les KPI et même la structure finale du dashboard découleront beaucoup plus naturellement du modèle**, au lieu de devoir corriger les règles au fur et à mesure.
