Oui. J’ai repris **le code V10 réellement implémenté**, les fiches `docs/quality-rules/DQ-xxx.md`, le fichier `config/quality-rules.yaml` et la mécanique d’impact sur les métriques.

Il y a une chose importante à comprendre avant de refaire les règles : **le système actuel fonctionne, mais les règles sont plus complexes et parfois moins cohérentes entre elles que nécessaire**. Je te conseille donc de ne pas simplement ajouter DQ-011, DQ-012, etc. : mieux vaut repartir sur un modèle DQ plus simple et explicite.

---

# 1. À quoi servent réellement les DQ ?

Le rôle des DQ dans ton pipeline est de répondre à une question très précise :

> **« Peut-on faire confiance à cette donnée pour calculer tel indicateur ? »**

Elles ne servent normalement **pas à supprimer les données**.

Le pipeline fait actuellement :

```text
                    GitHub / Fixture
                          │
                          ▼
                    RAW Dataset
                          │
                          ▼
                    Normalisation
                          │
                          ▼
                  Données normalisées
                          │
             ┌────────────┴────────────┐
             │                         │
             ▼                         ▼
       Règles DQ                   Analytics
             │                         │
             │ impacts                │
             └────────────┬────────────┘
                          ▼
                       Métriques
                          │
                          ▼
                       Snapshot
                          │
                          ▼
                       Dashboard
```

Une DQ ne devrait donc pas être comprise comme :

> « cette donnée est mauvaise, supprimons-la »

mais plutôt :

> « cette donnée présente un problème précis ; voici **quelles métriques sont affectées et comment** ».

C'est justement ce que permet `DataQualityImpact` :

```text
DQ-001
   │
   ├── anomaly.byCriticality.blocking → exclude
   ├── anomaly.byCriticality.major    → exclude
   ├── anomaly.byCriticality.minor    → exclude
   └── anomaly.criticalityCoverage    → exclude
```

---

# 2. Les trois notions fondamentales

Il faut bien distinguer **sévérité**, **action** et **impact métrique**.

## Sévérité

Actuellement :

```text
INFO
WARNING
ERROR
```

Elle décrit **la gravité du problème de qualité**.

### `ERROR`

Problème suffisamment important pour qu'une donnée ne puisse pas être utilisée normalement pour certaines métriques.

Exemple :

> Une anomalie n'a aucune criticité.

### `WARNING`

La donnée reste exploitable, mais elle présente une réserve.

Exemple :

> Une anomalie est `done`, mais aucune PR de correction n'est identifiable.

### `INFO`

Simple information de qualité.

Il n'y en a actuellement aucune dans les DQ-001 à DQ-010.

---

# 3. `action` : attention, ce n'est pas la même chose

Une règle possède aussi :

```text
exclude
include
```

Cela signifie essentiellement :

### `exclude`

L'entité concernée **ne doit pas être comptée dans les métriques affectées**.

### `include`

L'entité reste comptée.

Mais sa présence provoque une **fiabilité `partial`** pour les métriques concernées.

Et il existe également au niveau impact :

```text
unknown
```

qui signifie :

> On ne peut pas déterminer la métrique correctement.

Cela produit une fiabilité :

```text
reliable
partial
unknown
```

---

# 4. Le système actuel fonctionne donc comme ceci

Prenons une anomalie sans criticité.

```text
Issue GitHub
     │
     ▼
Anomalie normalisée
     │
     │ criticality = undefined
     ▼
   DQ-001
     │
     ├── severity = ERROR
     ├── action = exclude
     │
     └── impacts
          │
          ├── criticality blocking → exclude
          ├── criticality major    → exclude
          ├── criticality minor    → exclude
          └── criticalityCoverage  → exclude
```

La donnée reste donc dans :

```text
RAW
NormalizedData
Snapshot
```

mais elle est retirée des calculs qui nécessitent une criticité.

C'est une bonne architecture de principe.

---

# 5. DQ-001 — Criticité absente

### Ce qu'elle cherche

```text
Anomalie
   │
   └── criticality = undefined
             ↓
           DQ-001
```

La règle se déclenche lorsque `anomaly.criticality` est absente.

### Sévérité

```text
ERROR
```

### Action

```text
exclude
```

### Pourquoi ?

Une anomalie sans criticité ne peut pas être correctement répartie entre :

```text
Blocking
Major
Minor
```

et ne peut donc pas être utilisée pour calculer correctement :

```text
anomaly.byCriticality.*
anomaly.criticalityCoverage
```

### Impact

C'est précisément ce que fait `metric-impacts.ts`.

### Exemple

Supposons :

```text
10 anomalies
9 avec criticité
1 sans criticité
```

Alors :

```text
Total anomalies             = 10
Blocking/Major/Minor        = 9 classifiées
Criticality coverage        = 90 %
```

La DQ ne supprime pas l'anomalie du total général.

**C'est important : DQ-001 ne signifie pas « anomalie inexistante ».**

---

# 6. DQ-002 — Plusieurs criticités

Elle cherche une situation comme :

```text
Issue
 ├── Criticité : Major
 └── Criticité : Minor
          ↓
       DQ-002
```

### Sévérité

```text
ERROR
```

### Action

```text
exclude
```

### Pourquoi ?

Une anomalie ne peut pas simultanément être :

```text
Major + Minor
```

pour une classification exclusive.

### Conséquence

Elle est exclue des :

```text
anomaly.byCriticality.*
anomaly.criticalityCoverage
```

### Correction attendue

Conserver une seule criticité métier.

---

# 7. DQ-003 — Parents multiples

Elle détecte :

```text
Anomalie
   │
   ├── parent A
   ├── parent B
   └── ...
        ↓
     DQ-003
```

Le code actuel déclenche si :

```ts
anomaly.parentRefs.length > 1
```

### Sévérité

```text
ERROR
```

### Action

```text
exclude
```

### Intention

Une anomalie doit être rattachée à **un seul audit parent identifiable**.

---

## ⚠️ Première incohérence à corriger

La documentation dit :

> la règle se déclenche lorsqu'une anomalie possède une criticité **et** plus d'un parent.

Mais le code fait simplement :

```ts
if (anomaly.parentRefs.length > 1)
```

Il ne vérifie **pas la criticité**.

Donc :

```text
parentRefs = [A, B]
criticality = undefined
```

déclenche quand même DQ-003.

C'est un premier exemple où la documentation et l'implémentation ne sont pas parfaitement alignées.

---

## ⚠️ Deuxième problème plus important

La règle déclare dans `metric-impacts.ts` :

```text
audit.anomalyCount.* → exclude
```

mais les métriques actuellement enregistrées dans `calculateMetrics()` ne contiennent pas de :

```text
audit.anomalyCount.*
```

Donc **DQ-003 n'a actuellement aucun impact métrique réel correspondant à cette règle**.

Elle produit bien une DQ :

```text
DQ-003 ERROR
```

mais cette DQ ne retire actuellement aucune anomalie d'une métrique existante via cet impact.

C'est un point que je corrigerais dans la refonte.

---

# 8. DQ-004 — Anomalie `done` sans PR

Schéma :

```text
Issue
 │
 ├── status = DONE
 │
 └── pullRequestRefs = []
              ↓
           DQ-004
```

### Sévérité

```text
WARNING
```

### Action

```text
include
```

C'est donc une **anomalie de qualité mais pas une exclusion**.

### Pourquoi ?

Parce que :

```text
DONE
```

ne signifie pas forcément :

> « une PR existe nécessairement ».

Mais ton modèle considère une PR comme une preuve importante de correction.

### Conséquence

L'anomalie continue à participer aux métriques.

La métrique devient cependant :

```text
partial
```

pour les indicateurs impactés.

---

# 9. DQ-005 — PR mergée mais issue ouverte

Situation :

```text
PR
 │
 └── state = MERGED
          │
          ▼
       Issue
       state = OPEN
```

→ DQ-005.

### Sévérité

```text
WARNING
```

### Action

```text
include
```

La donnée reste donc utilisable.

Mais le lien :

```text
Issue ↔ PR
```

est considéré comme douteux.

Les métriques concernées restent calculées mais avec une fiabilité :

```text
partial
```

---

# 10. DQ-006 — Composant absent du catalogue

Celle-ci concerne les composants.

Le normaliseur peut découvrir un composant via GitHub :

```text
GitHub
   │
   └── Component = X
            │
            ▼
       Catalogue ?
        /       \
      oui       non
       │         │
   catalogue   suggested
                   │
                   ▼
                DQ-006
```

### Sévérité

```text
WARNING
```

### Action

```text
include
```

Le composant n'est donc pas supprimé.

### Pourquoi ?

Parce qu'il peut être parfaitement réel.

Mais le catalogue de référence ne possède pas ses métadonnées.

Donc :

```text
composant connu par GitHub
        ≠
composant complètement décrit par le catalogue
```

### Impact

Actuellement :

```text
portfolio.*
```

Donc potentiellement **tous les KPI de portefeuille** deviennent `partial`.

---

## ⚠️ C'est probablement trop large

C'est l'un des points que je reverrais.

Si :

```text
1 composant sur 50
```

n'est pas dans le catalogue, il est discutable de dégrader :

```text
portfolio.repositories
portfolio.libraries
portfolio.components
portfolio.componentsAudited
portfolio.auditCoverage
```

de la même manière.

Par exemple :

```text
portfolio.repositories
```

ne dépend probablement pas du tout de la complétude des métadonnées du catalogue.

La future DQ devrait donc avoir des impacts **beaucoup plus précis**.

---

# 11. DQ-007 — Label inconnu

La règle recherche explicitement :

```text
label = configured unknown label
```

Par exemple :

```text
Issue
 ├── Component:Button
 ├── Category:Contrast
 └── Unknown
          ↓
       DQ-007
```

### Sévérité

```text
WARNING
```

### Action

```text
include
```

### Impact

```text
anomaly.byCategory.*
```

Donc la donnée continue à être comptée.

Mais les analyses par catégorie doivent être considérées avec prudence.

---

# 12. DQ-008 — Issue annulée + PR

Cette règle est différente.

Une anomalie est d'abord considérée comme annulée si un statut Project correspond à :

```text
github.cancelledProjectStatuses
```

par défaut :

```text
Cancelled
```

Puis :

```text
Cancelled
   │
   └── PR associée
          ↓
       DQ-008
```

### Sévérité

```text
ERROR
```

### Action

```text
exclude
```

Et surtout le code fait :

```ts
continue;
```

après le traitement des règles d'annulation.

Donc une issue annulée **ne passe pas dans les autres règles générales**.

C'est une décision importante du modèle.

---

# 13. DQ-010 — Issue annulée + milestone

Même principe :

```text
Cancelled
   │
   └── Milestone
          ↓
       DQ-010
```

### Sévérité

```text
ERROR
```

### Action

```text
exclude
```

L'intention est :

> une issue annulée ne doit plus participer aux KPI opérationnels.

---

# 14. DQ-008 et DQ-010 ont en réalité une logique commune

Actuellement tu as :

```text
                 ISSUE
                   │
             Cancelled ?
              /        \
            non         oui
                         │
                 ┌───────┴────────┐
                 │                │
              PR liée         Milestone
                 │                │
              DQ-008           DQ-010
```

Mais le code indique également :

```text
Cancelled
    │
    ├── DQ-008 si PR
    ├── DQ-010 si milestone
    │
    └── aucune autre DQ
```

Cela suggère qu'à terme il serait probablement plus simple d'avoir une notion générale :

```text
DQ-CANCELLED-RELATION
```

ou, mieux encore, une règle de qualité sur l'état d'annulation et des contrôles de relations séparés.

---

# 15. DQ-009 — Nexus indisponible

Celle-ci est différente des autres.

Elle ne porte pas sur une issue.

Elle porte sur **la source de données** :

```text
raw.nexusAvailable = false
          ↓
       DQ-009
```

### Sévérité

```text
WARNING
```

### Action

```text
include
```

### Impact

```text
portfolio.release.*
```

avec :

```text
unknown
```

Donc :

```text
Nexus indisponible
        ↓
release evidence
        ↓
UNKNOWN
```

C'est conceptuellement différent de `partial`.

### `partial`

> Je peux calculer quelque chose, mais il existe une réserve.

### `unknown`

> Je ne dispose pas des informations nécessaires pour connaître le résultat.

C'est une bonne distinction.

---

# 16. Vue d'ensemble des 10 règles

| Règle  | Problème                   | Sévérité | Action  | Type           |
| ------ | -------------------------- | -------- | ------- | -------------- |
| DQ-001 | Criticité absente          | ERROR    | exclude | donnée         |
| DQ-002 | Plusieurs criticités       | ERROR    | exclude | donnée         |
| DQ-003 | Plusieurs parents          | ERROR    | exclude | relation       |
| DQ-004 | Done sans PR               | WARNING  | include | preuve         |
| DQ-005 | PR mergée + issue ouverte  | WARNING  | include | relation       |
| DQ-006 | Composant absent catalogue | WARNING  | include | référentiel    |
| DQ-007 | Label inconnu              | WARNING  | include | classification |
| DQ-008 | Annulée + PR               | ERROR    | exclude | relation       |
| DQ-009 | Nexus indisponible         | WARNING  | include | source externe |
| DQ-010 | Annulée + milestone        | ERROR    | exclude | relation       |

---

# 17. Le point le plus important : une DQ n'est pas forcément une exclusion

C'est là que ton modèle V2 est intéressant.

Prenons :

```text
DQ-004
```

L'anomalie est `done`, mais aucune PR n'est trouvée.

On ne veut probablement pas faire :

```text
DQ-004
   ↓
supprimer l'anomalie
```

On veut :

```text
               Anomalie
                   │
                   ├──────────► anomaly.total
                   │               INCLUDE
                   │
                   ├──────────► anomaly.correctedEver
                   │               INCLUDE / PARTIAL
                   │
                   └──────────► preuve PR
                                   INCOMPLÈTE
```

C'est exactement l'intérêt de ton système d'impact.

---

# 18. Mais il y a actuellement un problème architectural

Le fichier :

```text
config/quality-rules.yaml
```

donne l'impression que les règles sont configurables.

Par exemple :

```yaml
- id: DQ-001
  severity: ERROR
  action: exclude
```

Mais **le véritable comportement est codé en dur dans** :

```text
src/quality/rules.ts
src/lib/metric-impacts.ts
```

Le YAML est donc essentiellement une **description parallèle**.

Cela crée un risque :

```text
             YAML
              │
              │
              ▼
       documentation ?
              
             TS
              │
              ▼
        comportement réel
```

Les deux peuvent diverger.

Et on vient justement de voir plusieurs exemples de divergence potentielle :

* DQ-003 documentation ≠ code ;
* DQ-003 impact ≠ métriques réellement disponibles ;
* DQ-006 impact très large ;
* DQ-009 référence des métriques `portfolio.release.*` qui ne figurent pas actuellement dans `calculateMetrics()`.

---

# 19. Autre point important : la fiabilité globale

Le code actuel fait :

```ts
const reliability =
  dqIssues.some(ERROR)
    ? 'partial'
    : dqIssues.length > 0
      ? 'partial'
      : 'reliable';
```

Donc **une seule WARNING suffit à rendre le snapshot global `partial`**.

Et `pipelineStatus()` fait également :

```text
ERROR ou WARNING
      ↓
PARTIAL
```

Alors que les métriques individuelles savent déjà faire :

```text
reliable
partial
unknown
```

Cela crée deux niveaux :

```text
SNAPSHOT
   │
   └── reliability = partial
          │
          ├── metric A = reliable
          ├── metric B = partial
          ├── metric C = reliable
          └── metric D = unknown
```

C'est probablement ce qu'il faut conserver : **la fiabilité doit principalement être lue au niveau de la métrique**, pas comme une condamnation globale du snapshot.

---

# 20. Ce que je te propose pour la refonte

Je ne partirais surtout pas sur une nouvelle liste de 15 ou 20 règles immédiatement.

Je repartirais sur **4 familles de DQ très simples**.

```text
                     DATA QUALITY
                           │
          ┌────────────────┼────────────────┐
          │                │                │
       COMPLETUDE       COHÉRENCE        RÉFÉRENCE
          │                │                │
      donnée absente    relation invalide  catalogue
      classification    états incohérents  labels
          │                │                │
          └────────────────┼────────────────┘
                           │
                      DISPONIBILITÉ
                           │
                    source externe
```

Et surtout chaque règle devrait répondre à quatre questions seulement :

```text
1. QUOI ?
   Quelle donnée est incorrecte/incomplète ?

2. DÉTECTION ?
   Quelle condition exacte déclenche la règle ?

3. IMPACT ?
   Quelles métriques sont affectées ?

4. COMPORTEMENT ?
   include / exclude / unknown
```

---

# 21. Je simplifierais également le modèle DQ

Aujourd'hui :

```text
DataQualityIssue
 ├── id
 ├── ruleId
 ├── severity
 ├── action
 ├── entityType
 ├── entityId
 ├── message
 ├── detectedAt
 └── impacts[]
```

Je conserverais presque tout, mais avec une distinction plus nette :

```text
DQ Issue
│
├── rule
│
├── entity
│
├── severity
│
├── message
│
└── impacts
      │
      ├── metric
      ├── effect
      └── reason
```

Et surtout :

### La règle ne devrait pas décider globalement `exclude`.

Elle devrait plutôt dire :

```text
DQ-001
    │
    ├── anomaly.total
    │      → include
    │
    ├── anomaly.open
    │      → include
    │
    ├── anomaly.byCriticality.*
    │      → exclude
    │
    └── anomaly.criticalityCoverage
           → exclude
```

C'est beaucoup plus précis.

---

# 22. Exemple de règle future beaucoup plus lisible

Je viserais quelque chose conceptuellement proche de :

```yaml
id: DQ-001

name: Criticité absente

when:
  entity: anomaly
  condition: criticality == null

severity: ERROR

impacts:
  - metric: anomaly.total
    effect: include

  - metric: anomaly.open
    effect: include

  - metric: anomaly.byCriticality.*
    effect: exclude

  - metric: anomaly.criticalityCoverage
    effect: exclude
```

Cela raconte immédiatement toute l'histoire.

---

# 23. Et je séparerais trois catégories de règles

C'est probablement la simplification la plus importante.

## A. Règles de validité de donnée

Exemple :

```text
DQ-001 Criticité absente
DQ-002 Criticités multiples
```

Elles répondent :

> La donnée possède-t-elle les informations nécessaires ?

---

## B. Règles de cohérence métier

Exemple :

```text
DQ-004 Done sans PR
DQ-005 PR mergée + issue ouverte
DQ-008 relation d'une issue annulée
```

Elles répondent :

> Les informations sont-elles cohérentes entre elles ?

---

## C. Règles de disponibilité

Exemple :

```text
DQ-009 Nexus indisponible
```

Elles répondent :

> Dispose-t-on de toutes les sources nécessaires ?

---

# 24. Schéma cible

Je verrais donc ton système final ainsi :

```text
                    RAW
                     │
                     ▼
                NORMALIZED
                     │
                     ▼
              ┌───────────────┐
              │ DQ ENGINE     │
              │               │
              │ Complétude    │
              │ Cohérence     │
              │ Référentiel   │
              │ Disponibilité │
              └───────┬───────┘
                      │
              DQ findings
                      │
             ┌────────┴────────┐
             │                 │
             ▼                 ▼
       données conservées   impacts
                               │
                    ┌──────────┼──────────┐
                    ▼          ▼          ▼
                 INCLUDE    EXCLUDE    UNKNOWN
                    │          │          │
                    └──────────┼──────────┘
                               ▼
                          METRICS
                               │
                  ┌────────────┼────────────┐
                  ▼            ▼            ▼
               reliable     partial      unknown
```

---

# 25. Mon diagnostic sur les règles actuelles

Je garderais **le principe général**, mais je ne considérerais pas encore les DQ actuelles comme définitives.

Les points que je mettrais en priorité sur la table sont :

### 🟢 Bonnes bases

* données RAW/normalized conservées ;
* DQ séparées des données ;
* impacts par métrique ;
* `include / exclude / unknown` ;
* fiabilité des métriques ;
* traçabilité `ruleId + entityId` ;
* distinction `partial / unknown`.

### 🟠 À simplifier

* YAML des règles + logique TypeScript en parallèle ;
* `action` globale de la règle ;
* impacts parfois trop larges ;
* règles d'annulation DQ-008/DQ-010 ;
* notion de sévérité et notion d'impact actuellement un peu mélangées.

### 🔴 À corriger avant de multiplier les règles

1. **DQ-003 : documentation et code ne correspondent pas.**
2. **DQ-003 : son impact `audit.anomalyCount.*` n'est pas exploité par les métriques actuelles.**
3. **DQ-006 : `portfolio.*` est probablement trop large.**
4. **DQ-009 : son impact porte sur des métriques de release qui ne sont pas actuellement calculées.**
5. **La fiabilité globale du snapshot devient `partial` dès qu'une simple WARNING existe.**
6. **Le YAML n'est pas réellement la source d'exécution des règles.**

---

## La prochaine étape que je te recommande

Avant de modifier le moindre code, je pense qu'il faut faire **un vrai inventaire des règles métier que tu veux réellement appliquer à tes données GitHub**.

Je te propose de construire ensemble une matrice très simple :

| ID     | Question métier                                     | Donnée contrôlée | Condition | Gravité | Métriques impactées | INCLUDE / EXCLUDE / UNKNOWN |
| ------ | --------------------------------------------------- | ---------------- | --------- | ------- | ------------------- | --------------------------- |
| DQ-001 | Une anomalie doit-elle avoir une criticité ?        | Issue            | ...       | ...     | ...                 | ...                         |
| DQ-002 | Une anomalie peut-elle avoir plusieurs criticités ? | Issue            | ...       | ...     | ...                 | ...                         |
| ...    | ...                                                 | ...              | ...       | ...     | ...                 | ...                         |

**Et surtout, nous ne partirons plus des DQ-001 à DQ-010 comme étant « la vérité ».** Nous partirons de tes règles métier réelles, puis nous vérifierons lesquelles des règles actuelles les implémentent correctement, lesquelles sont inutiles, lesquelles doivent être fusionnées et lesquelles manquent.

C'est à mon avis la meilleure façon d'obtenir un moteur DQ **simple, sécurisé, explicable et durable**, plutôt qu'une accumulation de cas particuliers.

--------------------------------------------

Oui. Je te conseille de **ne pas me donner toutes les règles d'un coup**. Pour éviter de reconstruire un système DQ complexe avant d'avoir stabilisé le modèle métier, on peut les définir **une par une, puis les valider dans une matrice commune**.

## 1. Comment me transmettre les indications

Pour chaque règle, tu peux simplement répondre avec ce canevas, même en langage naturel :

```text
Règle :
- Nom / objectif :
- Ce que je veux contrôler :
- Sur quelles données :
- Ce qui est considéré comme normal :
- Ce qui est considéré comme anormal :
- Que doit-on faire de l'élément anormal :
- Quelles métriques cela peut affecter :
- Cas particuliers / exceptions :
- Exemple réel :
```

Tu n'as **pas besoin de connaître la solution technique**.

Par exemple, tu pourrais me dire :

> Une anomalie doit avoir exactement une criticité. Les criticités possibles sont Blocking, Major et Minor. Si elle n'en a aucune, c'est une anomalie de qualité. Si elle en a deux, c'est également une anomalie. Je veux quand même la compter dans le nombre total d'anomalies, mais pas dans les statistiques par criticité.

À partir de ça, **je traduis en règle DQ technique**.

---

# 2. Je te propose surtout de travailler dans cet ordre

Je commencerais par les règles qui définissent **la structure fondamentale de tes données**, avant les règles de cohérence métier.

### Étape 1 — Identité et classification des anomalies

C'est le socle.

```text
Issue GitHub
     │
     ├── Est-ce une anomalie ?
     │
     ├── Quel composant ?
     │
     ├── Quelle criticité ?
     │
     └── Quelle catégorie ?
```

Donc je commencerais par :

### Règle A — Identification d'une anomalie

> **Comment sait-on qu'une issue est une anomalie ?**

C'est extrêmement important parce que quasiment tous les KPI dépendent de cette définition.

Il faut notamment décider précisément :

* `issueType`
* labels
* statut
* combinaison éventuelle de plusieurs critères
* anciennes issues qui ne respectent plus le modèle
* issues historiques hors modèle

---

### Règle B — Criticité

Ensuite :

> **Qu'est-ce qu'une criticité valide ?**

Par exemple :

```text
0 criticité   → problème
1 criticité   → normal
2+ criticités → problème
```

Puis :

```text
Blocking
Major
Minor
```

Mais c'est **toi qui dois confirmer cette règle métier**.

---

### Règle C — Composant

Ensuite :

> **Comment détermine-t-on le composant auquel appartient une anomalie ?**

Par exemple :

```text
Component:Button
Component:Input
Component:Modal
```

et surtout :

> Que fait-on lorsqu'une anomalie n'a aucun composant ou plusieurs composants ?

Cela aura un impact direct sur tes KPI par composant.

---

### Règle D — Catégorie RGAA

Même principe :

```text
Anomalie
   │
   └── catégorie
         ├── Contraste
         ├── Clavier
         ├── Sémantique
         └── ...
```

Il faut définir :

* catégorie obligatoire ou non ;
* une ou plusieurs catégories ;
* valeurs autorisées ;
* comportement d'une catégorie inconnue.

---

# 3. Ensuite seulement : les relations

Une fois les anomalies correctement décrites, on attaque les relations :

```text
Audit
  │
  └── Anomalies
          │
          ├── PR
          ├── composant
          ├── milestone
          └── parent
```

Je commencerais par :

### Règle E — Une anomalie appartient-elle à un audit ?

Il faut définir ce qu'est **exactement** une anomalie valide dans ton modèle :

```text
Audit
 └── anomaly
```

Et ce qu'on fait lorsqu'une anomalie :

* n'a aucun parent ;
* a un parent ;
* a plusieurs parents ;
* pointe vers un parent inexistant.

C'est là que nous pourrons reprendre DQ-003.

---

# 4. Puis les règles de workflow

Une fois la structure solide :

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

et les états particuliers :

```text
Blocked
Cancelled
```

On pourra alors définir les règles du type :

> Une anomalie `Done` doit-elle obligatoirement avoir une PR ?

> Une anomalie `Cancelled` peut-elle avoir une PR ?

> Une anomalie `Cancelled` peut-elle être dans une milestone ?

> Que signifie exactement `In review` sans PR ?

C'est ici que DQ-004, DQ-005, DQ-008 et DQ-010 devront être **revalidées**, plutôt que simplement conservées.

---

# 5. Enfin : les règles de cohérence temporelle

Je les garderais pour la fin.

Par exemple :

```text
createdAt
    │
    ▼
In progress
    │
    ▼
PR
    │
    ▼
Done
```

On pourra contrôler :

* dates impossibles ;
* `closedAt < createdAt` ;
* `firstDoneAt < createdAt` ;
* PR mergée avant création de l'issue ;
* anomalie corrigée puis rouverte ;
* etc.

Ces règles sont puissantes mais il vaut mieux les faire **après avoir stabilisé le modèle métier**.

---

# 6. Je te propose donc ce parcours

```text
PHASE 1 — Définition
─────────────────────
1. Anomalie
2. Criticité
3. Composant
4. Catégorie
       ↓
PHASE 2 — Relations
─────────────────────
5. Audit ↔ anomalie
6. Issue ↔ PR
7. Issue ↔ milestone
       ↓
PHASE 3 — Workflow
─────────────────────
8. Statuts
9. Done / Cancelled
10. PR / correction
       ↓
PHASE 4 — Temps
─────────────────────
11. Dates
12. Délais
13. Réouverture
       ↓
PHASE 5 — Référentiels
─────────────────────
14. Catalogue
15. Labels
16. Projects / Iterations
       ↓
PHASE 6 — Sources
─────────────────────
17. Nexus
18. données manquantes
19. collecte partielle
```

---

# 7. Et je te propose une méthode encore plus importante

Pour **chaque règle**, je te restituerai systématiquement une fiche comme celle-ci :

### DQ-XXX — Criticité obligatoire

**Question métier**

> Une anomalie doit-elle avoir exactement une criticité ?

**Entrée**

```text
NormalizedAnomaly.criticality
```

**Règle**

```text
0 criticité  → INVALID
1 criticité  → VALID
>1 criticité → INVALID
```

**Impact sur les données**

```text
anomaly.total             → INCLUDE
anomaly.open              → INCLUDE
anomaly.byCriticality     → EXCLUDE
```

**Fiabilité**

```text
anomaly.total         → reliable
anomaly.byCriticality → partial
```

**Exemple**

```text
Issue #123
Criticality = Major
→ OK
```

```text
Issue #124
Criticality = ∅
→ DQ
```

**Décision métier à confirmer**

> Une anomalie sans criticité doit-elle être conservée dans le total général ?

Et **tu valides cette fiche avant que je la transforme en code**.

---

# 8. Pour commencer, je te propose donc une seule chose

Commençons par **la définition d'une anomalie**, pas par DQ-001.

Réponds-moi simplement à ces **5 questions** :

1. **Comment reconnaît-on aujourd'hui une anomalie dans GitHub ?**
   `issueType`, label, combinaison des deux ?

2. **Une issue sans `issueType = anomaly` peut-elle quand même être considérée comme une anomalie ?**

3. **Une anomalie doit-elle obligatoirement être rattachée à un composant ?**

4. **Une anomalie doit-elle obligatoirement être rattachée à un audit ?**

5. **Y a-t-il des anciennes issues que tu veux volontairement exclure du modèle actuel**, même si elles ressemblent à des anomalies ?

À partir de tes réponses, je rédigerai **la première règle DQ complète**, puis nous ferons la deuxième. Cela nous permettra de construire progressivement un référentiel DQ propre, compréhensible par toi et directement traduisible en tests automatisés.

--------------------------------------------



--------------------------------------------