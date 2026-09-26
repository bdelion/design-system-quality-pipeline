Oui. Je te propose de figer maintenant un **contrat analytique V2**. Il servira de référence pour le code, les tests et ensuite le nouveau dashboard.

Le dépôt confirme que le pipeline actuel est bien organisé autour de normalisation → qualité → KPI → snapshot → dashboard, et que les résultats sont rejouables avec une version des règles et du modèle. ([GitHub][1])

# 1. Principe directeur de la V2

Je ferais évoluer le modèle de :

```text
NormalizedData
      ↓
 calculateKpis()
      ↓
   Analytics
```

vers :

```text
NormalizedData
      ↓
┌───────────────────────┐
│ Evaluation layer      │
│                       │
│ • périmètres          │
│ • exclusions         │
│ • événements          │
│ • états               │
│ • réserves DQ         │
└───────────┬───────────┘
            ↓
┌───────────────────────┐
│ Metrics               │
│                       │
│ valeur                │
│ définition            │
│ périmètre             │
│ période               │
│ sources               │
│ fiabilité             │
│ exclusions            │
│ ventilations           │
└───────────┬───────────┘
            ↓
        Snapshot
            ↓
       Dashboard
```

**Le dashboard ne devrait quasiment rien savoir du métier.**

Il affiche et explore les `Metric`.

---

# 2. Le nouveau type `Metric`

Je partirais sur ceci :

```ts
export type MetricUnit =
  | 'count'
  | 'percentage'
  | 'days';

export type MetricScope =
  | 'portfolio'
  | 'library'
  | 'component'
  | 'audit'
  | 'anomaly';

export interface MetricPeriod {
  from?: string;
  to?: string;
}

export interface MetricReliability {
  status: DataQualityStatus;
  issueIds: string[];
}

export interface MetricBreakdown {
  dimension: string;
  values: Record<string, number>;
}

export interface Metric {
  id: string;

  value: number | 'unknown';

  unit: MetricUnit;

  numerator?: number | 'unknown';
  denominator?: number | 'unknown';

  scope: MetricScope;

  period?: MetricPeriod;

  definition: string;

  sourceEntityIds: string[];

  reliability: MetricReliability;

  exclusions: {
    entityId: string;
    ruleId: string;
  }[];

  breakdowns?: MetricBreakdown[];
}
```

### Pourquoi cette structure ?

Parce que :

```ts
{
  value: 71
}
```

ne raconte pratiquement rien.

Alors que :

```ts
{
  id: 'audit.coverage',
  value: 71,
  unit: 'percentage',

  numerator: 5,
  denominator: 7,

  scope: 'portfolio',

  definition:
    'Composants actifs disposant d’un audit valide / composants actifs devant être audités',

  reliability: {
    status: 'reliable',
    issueIds: []
  },

  exclusions: []
}
```

permet au dashboard de **comprendre ce qu'il affiche**.

---

# 3. Les métriques V2

Je les organiserais en quatre domaines.

## `portfolio.*`

### `portfolio.repositories`

Nombre de repositories analysés.

```text
3 repositories
```

### `portfolio.libraries`

Nombre de bibliothèques.

### `portfolio.components`

Nombre de composants dans le périmètre.

### `portfolio.componentsAudited`

Nombre de composants disposant d'un audit valide.

### `portfolio.auditCoverage`

```text
composants audités
──────────────────
composants à auditer
```

Exemple :

```text
5 / 7
71,4 %
```

**Important :** cette métrique remplace le `auditsCoverage` actuel.

---

# 4. Les audits

Je créerais :

### `audit.completed`

Nombre d'audits terminés.

### `audit.conform`

Nombre d'audits conformes.

### `audit.conditional`

Nombre d'audits conditionnels.

### `audit.nonConform`

Nombre d'audits non conformes.

### `audit.critical`

Nombre d'audits critiques.

### `audit.conformityRate`

```text
audits conformes
────────────────
audits terminés
```

Mais dans le dashboard :

```text
100 %

5 / 5 audits conformes
```

et **jamais simplement `100 %`**.

Cela évite précisément le problème :

> « 100 % conforme » alors que seulement une petite partie du patrimoine a été auditée.

---

# 5. Les anomalies

Je distinguerais clairement **stock** et **flux**.

## Stock

### `anomaly.total`

Nombre d'anomalies dans le périmètre.

### `anomaly.open`

```text
status = open | reopened
```

### `anomaly.inProgress`

```text
status = in_progress
```

### `anomaly.done`

```text
status = done
```

### `anomaly.cancelled`

Je la conserverais dans les données, mais **pas dans les KPI opérationnels**, conformément au fonctionnement actuel documenté. Les issues annulées sont actuellement exclues des KPI tout en restant traçables. ([GitHub][1])

---

# 6. Criticité

Je ferais trois métriques distinctes :

```text
anomaly.byCriticality.blocking
anomaly.byCriticality.major
anomaly.byCriticality.minor
```

Mais surtout je voudrais aussi :

```text
anomaly.criticalityCoverage
```

avec :

```text
anomalies possédant une criticité valide
───────────────────────────────────────
anomalies nécessitant une criticité
```

Pourquoi ?

Parce qu'une erreur `DQ-001` signifie précisément qu'une anomalie sans criticité est exclue des KPI concernés. ([GitHub][1])

Aujourd'hui, l'utilisateur voit l'effet sans forcément voir **le trou dans le périmètre**.

---

# 7. Catégories

Même principe :

```text
anomaly.byCategory.contrast
anomaly.byCategory.keyboard
anomaly.byCategory.semantics
...
```

Mais il faudra explicitement documenter :

> **Une anomalie peut appartenir à plusieurs catégories.**

Donc :

```text
4 clavier
3 contraste
2 sémantique
```

ne signifie pas :

```text
9 anomalies
```

C'est une **ventilation multi-étiquette**.

---

# 8. Flux d'anomalies

C'est une nouvelle partie importante.

Pour une période :

### `anomaly.created`

Nombre d'anomalies créées.

### `anomaly.corrected`

Nombre ayant reçu leur première correction métier.

### `anomaly.reopened`

Nombre rouvertes.

### `anomaly.cancelled`

Nombre annulées.

### `anomaly.backlogVariation`

Conceptuellement :

```text
créées
+ rouvertes
- corrigées
- annulées
```

Cela permet d'expliquer l'évolution du backlog.

---

# 9. Délais

Je garderais :

```text
anomaly.correctionDelay.average
anomaly.correctionDelay.median
```

et j'ajouterais :

```text
anomaly.correctionDelay.p90
```

ainsi que :

```text
anomaly.backlog.oldestAge
```

Le code actuel calcule bien les délais entre `createdAt` et `firstDoneAt`, en excluant les anomalies sans date de correction. ([GitHub][1])

Je garderais cette règle.

### Pourquoi trois statistiques ?

Exemple :

```text
Délai de correction

Médiane       8 j
Moyenne      21 j
P90          47 j
```

Cela permet de distinguer le comportement habituel des cas longs.

---

# 10. La grande nouveauté : `Metric.reliability`

Je veux que **chaque métrique sache pourquoi elle est fiable ou non**.

Par exemple :

```ts
reliability: {
  status: 'partial',

  issueIds: [
    'DQ-001:anomaly-123',
    'DQ-004:anomaly-456'
  ]
}
```

Et le dashboard peut afficher :

> ⚠️ Données partielles — 2 réserves

Puis :

```text
DQ-001
Criticité absente
→ 1 anomalie exclue

DQ-004
PR de correction absente
→ 1 anomalie incluse avec réserve
```

Les règles actuelles ont précisément cette distinction `include / exclude`, qu'il faut conserver. ([GitHub][1])

---

# 11. Je modifierais même légèrement le concept de fiabilité

Actuellement tu as :

```text
reliable
partial
unknown
invalid
```

Je conserverais ces quatre états, mais **je ne calculerais plus `partial` globalement**.

Actuellement, une seule alerte peut rendre l'ensemble des KPI `partial`.

Le snapshot lui-même peut rester :

```text
snapshot.reliability = partial
```

mais :

```text
metric.reliability
```

doit être calculé **uniquement avec les DQ qui concernent cette métrique**.

---

# 12. Il faut donc introduire une notion d'impact DQ

Je rajouterais aux règles quelque chose comme :

```ts
export interface DataQualityRuleImpact {
  metricPrefixes: string[];
}
```

Par exemple :

### DQ-001

```ts
{
  ruleId: 'DQ-001',

  metricPrefixes: [
    'anomaly.',
    'audit.'
  ]
}
```

Mais surtout, je préfère une liste explicite quand l'impact est limité :

```ts
affectedMetrics: [
  'anomaly.total',
  'anomaly.open',
  'anomaly.done',
  'anomaly.byCriticality.*',
  'anomaly.correctionDelay.*'
]
```

Cela rend les conséquences des règles **auditable dans le code**.

---

# 13. Et je changerais la logique d'exclusion

Il y a une subtilité importante dans `DQ-003`.

La documentation dit que plusieurs parents rendent l'anomalie exclue **des indicateurs qui dépendent de son rattachement à un audit**.

Mais le code actuel ajoute :

```ts
action = 'exclude'
entityType = 'anomaly'
```

puis `calculateKpis()` retire globalement l'anomalie du périmètre :

```ts
excludedAnomalies
```

Donc actuellement :

> une anomalie avec DQ-003 peut disparaître de **tous** les KPI d'anomalies.

C'est plus large que ce que décrit la documentation.

### V2

Une exclusion doit être :

```text
DQ issue
   │
   ▼
impact
   │
   ├── anomaly.total      OK
   ├── anomaly.open       OK
   ├── anomaly.criticality EXCLU
   ├── audit.anomalies     EXCLU
   └── correction.delay    OK
```

Autrement dit :

**l'exclusion appartient au couple `(règle, métrique)`, pas simplement à l'entité.**

C'est probablement la modification conceptuelle la plus importante de cette V2.

---

# 14. Je propose donc ce modèle de DQ

```ts
export interface DataQualityIssue {
  id: string;

  ruleId: string;

  severity: Severity;

  entityType: string;

  entityId: string;

  message: string;

  detectedAt: string;

  impacts: {
    metricId: string;

    action: 'include' | 'exclude' | 'unknown';

    reason: string;
  }[];
}
```

Exemple :

```ts
{
  id: 'DQ-001:anomaly-123',

  ruleId: 'DQ-001',

  severity: 'ERROR',

  entityType: 'anomaly',

  entityId: 'anomaly-123',

  impacts: [
    {
      metricId: 'anomaly.byCriticality.*',
      action: 'exclude',
      reason: 'Criticité absente'
    },

    {
      metricId: 'anomaly.total',
      action: 'include',
      reason: 'L’existence de l’anomalie reste certaine'
    }
  ]
}
```

**Ça change énormément les possibilités du dashboard.**

---

# 15. Le modèle final que je viserais

On arrive à quelque chose comme :

```text
Snapshot
│
├── rawData
│
├── normalizedData
│
├── dataQuality
│   ├── issues[]
│   └── summary
│
├── metrics
│   ├── portfolio.*
│   ├── audit.*
│   └── anomaly.*
│
├── ruleVersion
├── modelVersion
└── reliability
```

Et non plus :

```text
analytics
├── anomaliesDeclared
├── anomaliesCorrected
├── openAnomalies
├── ...
```

Je renommerais d'ailleurs `Analytics` en **`MetricsSnapshot`** ou simplement `Metrics`.

---

# 16. Exemple concret de ce que recevrait le dashboard

Pour le KPI de couverture :

```json
{
  "id": "portfolio.auditCoverage",
  "value": 71.4,
  "unit": "percentage",

  "numerator": 5,
  "denominator": 7,

  "scope": "portfolio",

  "definition": "Composants actifs disposant d’un audit valide / composants actifs devant être audités",

  "reliability": {
    "status": "reliable",
    "issueIds": []
  },

  "exclusions": []
}
```

Le composant graphique n'a alors **aucune règle métier**.

Il sait simplement faire :

```text
71,4 %
5 / 7 composants
```

et éventuellement :

```text
ⓘ définition
```

---

# 17. Ce que je ne changerais pas

Je garderais plusieurs choix actuels qui sont bons :

* les données RAW ;
* la normalisation ;
* la conservation des données douteuses ;
* les snapshots immuables ;
* les versions `modelVersion` / `ruleVersion` ;
* le fonctionnement statique sans serveur ;
* la séparation des repositories ;
* la collecte GitHub en lecture seule ;
* les tests Vitest ;
* le principe `unknown` plutôt que d'inventer un zéro.

Le README confirme notamment que le projet est conçu pour être rejoué à partir des données collectées et de la version des règles. ([GitHub][1])

---

# 18. Le contrat V2 en une phrase

Je résumerais la nouvelle philosophie ainsi :

> **Une métrique ne doit pas seulement donner une valeur ; elle doit être capable d'expliquer son périmètre, son calcul, ses sources, ses exclusions et la qualité des données qui la composent.**

C'est cette propriété qui permettra ensuite de faire le dashboard que nous imaginons.

## Et maintenant, je passerais au code

Je te propose de faire **une première implémentation V2 minimale**, sans toucher encore au design :

```text
src/domain/types.ts
        ↓
src/analytics/metrics.ts
        ↓
src/quality/rules.ts
        ↓
src/snapshots/snapshot.ts
        ↓
tests/
```

avec **compatibilité temporaire avec l'ancien `Analytics`**, afin de ne pas casser ton dashboard actuel.

Ensuite seulement, on pourra remplacer le dashboard actuel par le nouveau rendu.

C'est aussi l'approche qui permet de travailler proprement dans VS Code : **chaque étape restera compilable et testable**, plutôt qu'une grosse refonte d'un seul coup.

[1]: https://github.com/bdelion/design-system-quality-pipeline "GitHub - bdelion/design-system-quality-pipeline · GitHub"

---------

C'est parti. J'ai réalisé la **première étape de la V2** sur une copie de ton dépôt.

### Ce qui a été implémenté

**1. Nouveau modèle `Metric`**

Chaque métrique contient désormais :

* sa valeur ;
* son unité ;
* numérateur / dénominateur ;
* son périmètre ;
* sa définition ;
* les entités sources ;
* sa fiabilité ;
* les exclusions ;
* les ventilations possibles.

**2. Nouvelles métriques**

Notamment :

* `portfolio.components`
* `portfolio.componentsAudited`
* `portfolio.auditCoverage`
* `audit.completed`
* `audit.conform`
* `audit.conditional`
* `audit.nonConform`
* `audit.critical`
* `audit.conformityRate`
* `anomaly.total`
* `anomaly.open`
* `anomaly.inProgress`
* `anomaly.done`
* criticités `blocking / major / minor`
* `anomaly.criticalityCoverage`
* catégories
* `anomaly.corrected`
* `anomaly.reopened`
* `anomaly.cancelled`
* délai moyen
* délai médian
* **P90**
* âge du plus ancien élément ouvert.

**3. Les DQ ont maintenant des impacts métriques explicites**

C'est une évolution importante.

Une règle DQ ne signifie plus implicitement :

> « cette anomalie est mauvaise donc retirons-la partout ».

Elle peut désormais dire :

```text
DQ-001
   │
   ├── KPI criticité → EXCLUDE
   ├── couverture criticité → EXCLUDE
   └── autres KPI → pas nécessairement affectés
```

Cela prépare directement le futur écran **« Pourquoi ce KPI est-il partiel ? »**.

**4. Correction d'une incohérence existante**

`anomaliesCorrected` comptait `everCorrected`, alors que sa définition disait « date de première correction métier ».

La V2 utilise désormais `firstDoneAt`, ce qui rend le calcul cohérent avec sa définition.

**5. Documentation analytique mise à jour**

`docs/analytics.md` décrit maintenant le modèle V2 et la logique d'impact des DQ.

**6. Tests V2 ajoutés**

Ils vérifient notamment que les métriques sont auto-documentées et qu'une DQ peut affecter une métrique précise.

---

### Le fichier modifié

J'ai préparé une archive directement exploitable :

**[Télécharger la version V2 – modèle métrique](sandbox:/mnt/data/design-system-quality-pipeline-v2-metrics.zip)**

Elle contient le projet sans `node_modules` ni données générées.

---

### Validation

J'ai pu compiler isolément le nouveau cœur TypeScript :

```text
domain/types.ts
lib/metric-impacts.ts
analytics/metrics.ts
```

avec succès.

En revanche, je n'ai **pas** marqué la suite complète comme validée : l'installation de `node_modules` a rencontré un timeout dans mon environnement. Je préfère être transparent plutôt que de te dire que `npm test` est vert alors que je n'ai pas pu l'exécuter complètement.

---

## Et maintenant, je ferais une étape très intéressante

**Je ne passerais toujours pas au CSS.**

Maintenant que le modèle analytique existe, je voudrais faire tourner les données de ton fixture dessus et produire une sorte de **« rapport d'analyse V2 »**, par exemple :

```text
PATRIMOINE
3 repositories
7 composants
5 composants audités
71 % de couverture

AUDITS
5 terminés
5 conformes
100 % de conformité

ANOMALIES
6 dans le périmètre
3 ouvertes
5 corrigées
1 exclue

CRITICITÉ
1 bloquante
4 majeures
1 mineure

DÉLAIS
médiane : XX j
moyenne : XX j
P90     : XX j

QUALITÉ DES DONNÉES
1 erreur
2 avertissements

KPI AFFECTÉS
...
```

Puis surtout :

```text
⚠ Pourquoi certaines données sont-elles partielles ?

DQ-001
1 anomalie sans criticité

Impact :
  ✓ anomalie.total
  ✗ anomaly.byCriticality.*
  ✗ anomaly.criticalityCoverage

Action :
  compléter la criticité GitHub
```

**C'est cette sortie intermédiaire que je voudrais valider avec toi avant de construire le nouveau dashboard.** Elle nous permettra de vérifier que les chiffres et les règles correspondent bien à ta vision métier, indépendamment de toute interface graphique.

-------

Le scénario de référence est maintenant cohérent avec le contrat V2.

### Résultats du fixture

| Domaine                        |   Résultat |
| ------------------------------ | ---------: |
| Repositories                   |      **3** |
| Composants actifs              |      **8** |
| Composants audités             |  **1 / 8** |
| Couverture des audits          | **12,5 %** |
| Audits terminés                |      **1** |
| Audits conformes               |      **1** |
| Conformité des audits          |  **100 %** |
| Anomalies                      |      **7** |
| Anomalies ouvertes             |      **3** |
| Anomalies corrigées            |      **4** |
| Criticité renseignée           | **85,7 %** |
| Délai moyen                    |  **7,1 j** |
| Délai médian                   |  **6,1 j** |
| P90                            | **12,4 j** |
| Plus ancienne anomalie ouverte | **12,2 j** |

Le point intéressant est justement :

> **100 % de conformité, mais seulement 12,5 % de couverture.**

Le futur dashboard devra rendre cette relation évidente, plutôt que de présenter le `100 %` seul.

### Les 4 réserves de qualité

* **DQ-001** : une anomalie sans criticité → elle reste dans les anomalies, mais pas dans les indicateurs nécessitant une criticité.
* **DQ-006** : `Tooltip` n'est pas dans le catalogue → le patrimoine reste exploitable, mais certains KPI sont `partial`.
* **DQ-007** : label inconnu → les statistiques par catégorie sont `partial`.
* **DQ-009** : Nexus indisponible → aucune métrique actuelle n'est directement impactée.

Et c'est exactement le comportement que je cherchais à obtenir avec le nouveau modèle : **une anomalie DQ ne dégrade plus artificiellement tous les KPI**.

J'ai également ajouté le scénario de test correspondant dans le dépôt.

**[Télécharger le dépôt V2 avec le rapport analytique](sandbox:/mnt/data/design-system-quality-pipeline-v2-analytics-report.zip)**

### Ce que je considère maintenant comme validé conceptuellement

```text
                    SNAPSHOT
                       │
              ┌────────┴────────┐
              │                 │
         DATA QUALITY        METRICS
              │                 │
        DQ-001...DQ-010         │
              │                 │
              └────────┬────────┘
                       ▼
                 KPI explicable
                       │
             ┌─────────┼─────────┐
             ▼         ▼         ▼
           valeur    fiabilité   causes
             │         │         │
             └─────────┴─────────┘
                       ▼
                  DASHBOARD
```

**La prochaine étape est maintenant le vrai changement de rendu.** Je te propose de prendre ce contrat V2 et de concevoir directement la nouvelle page **Synthèse**, avec une interface qui permet de passer de *« quel est le chiffre ? »* à *« pourquoi ce chiffre ? »*, puis nous l'implémenterons dans `src/dashboard/`.

-------

C’est fait. J’ai intégré la **nouvelle Synthèse V2** au projet.

### Ce qui change

* **Patrimoine**

  * repositories
  * composants actifs
  * composants audités
  * couverture réelle des audits

* **Audits**

  * conformité objective
  * distinction claire entre **couverture** et **conformité**
  * ratios `1/8`, `1/1`, etc.

* **Anomalies**

  * stock total
  * ouvertes
  * corrigées
  * délai médian
  * P90
  * âge de la plus ancienne anomalie ouverte

* **Criticité et catégories**

  * répartition issue directement des métriques V2
  * couverture de criticité affichée
  * catégories multi-étiquettes conservées

* **Qualité des données**

  * les alertes DQ sont toujours visibles
  * ajout d’une **fiabilité par métrique**
  * une anomalie DQ ne rend donc plus artificiellement tous les indicateurs « partiels »

* **Conservation de l'existant**

  * pages Anomalies
  * Audits / Composants
  * Cartographie
  * filtres et liens GitHub

J’ai également adapté le test du dashboard au nouveau contrat.

### Archive

[**Télécharger le projet avec le Dashboard V2**](sandbox:/mnt/data/design-system-quality-pipeline-v2-dashboard.zip)

**Point de vérification :** j’ai contrôlé statiquement les nouvelles erreurs TypeScript introduites par le dashboard ; elles ont été corrigées. En revanche, l’installation complète des dépendances `npm ci` a dépassé le délai de l’environnement, donc je ne présente pas la suite Vitest comme validée.

La prochaine étape logique est maintenant de faire **la page Anomalies V2**, avec le même principe : passer de « tableau d’issues » à une vraie lecture **stock / flux / criticité / délais / qualité des données**, tout en gardant le détail GitHub.

-----

C’est fait : **Anomalies V2** est intégrée.

### Ce qui a été ajouté

* **Stock**

  * total
  * ouvertes
  * en cours
  * terminées
  * corrigées

* **Flux**

  * créées
  * corrigées
  * rouvertes
  * annulées
  * avec une distinction explicite entre le stock actuel et les flux

* **Délais**

  * médiane
  * P90
  * plus ancienne anomalie ouverte
  * détail par anomalie avec date de création, première correction et délai

* **Criticité**

  * bloquante / majeure / mineure
  * couverture de criticité
  * une anomalie sans criticité reste bien dans le **stock total**

* **Tableau détaillé**

  * recherche
  * repository
  * criticité
  * catégorie
  * état
  * liens GitHub
  * PR associées
  * dates et délais

* **Filtres URL**

  * `?status=open`
  * `?status=done`
  * `?criticality=major`
  * `?category=focus`

  Les liens depuis les KPI et graphiques permettent donc maintenant d'aller directement vers le sous-ensemble concerné.

* **Qualité des données**

  * les alertes DQ restent accessibles en bas de page
  * le principe V2 est conservé : une anomalie affectée par une règle DQ n'est pas automatiquement retirée de tous les indicateurs.

### Archive

[**Télécharger le projet Design System Quality Pipeline – Anomalies V2**](sandbox:/mnt/data/design-system-quality-pipeline-v2-anomalies.zip)

### Vérification

J’ai également tenté une vérification TypeScript complète. L'environnement ne dispose pas des dépendances du projet et `npm ci` a de nouveau dépassé le délai disponible ; je ne peux donc pas honnêtement annoncer une exécution complète de Vitest/TypeScript.

La prochaine évolution logique est **Audits & Composants V2** : rendre visible le véritable périmètre auditable, la couverture par repository/composant, le résultat de chaque audit et surtout le lien **composant → audit → anomalies**, avec les mêmes mécanismes d'explication et de qualité des données.
