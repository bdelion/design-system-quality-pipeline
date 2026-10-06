# Gap analysis V1 --- Design System Quality Pipeline

## 1. Objet

Cette analyse confronte le modèle métier consolidé jusqu'à D-146 au code
présent dans le ZIP
`design-system-quality-pipeline-feature-chatgpt-review-20261003.zip`.

Elle ne modifie pas le code. Elle distingue : - **Conforme** :
comportement déjà aligné avec la cible V1 ; - **Partiel** : brique
réutilisable mais modèle ou comportement incomplet ; - **Absent** :
capacité V1 non implémentée ; - **Contradictoire / legacy** :
comportement actuel incompatible avec une décision métier ; - **À
instruire** : dépend d'une question métier/technique encore ouverte.

## 2. Synthèse exécutive

L'architecture générale est réutilisable :

```text
GitHub / Fixture
      ↓
RawDataset
      ↓
NormalizedData
      ↓
Data Quality
      ↓
Analytics
      ↓
Snapshot
      ↓
Dashboard statique
```

Le principal écart n'est donc pas architectural. Il se situe dans le
**modèle métier normalisé et la collecte des faits GitHub nécessaires à
ce modèle**.

Les cinq chantiers prioritaires sont :

1. **Refondre la modélisation Issue / Anomalie / Audit** ;
2. **Collecter les relations sub-Issue et l'historique du statut
    Project `Done`** ;
3. **Modéliser Version, Git tag, Milestone et RC auditée** ;
4. **Construire le Catalogue historique au tag d'une Version** ;
5. **Recalculer les indicateurs puis adapter snapshots et dashboard sur
    le nouveau modèle**.

Il serait risqué de commencer par modifier les KPI ou l'interface : ils
reposent actuellement sur des hypothèses métier devenues obsolètes.

## 3. Ce qui est déjà réutilisable

| Capacité | État | Observation |
|---|---|---|
| Repositories configurables | Conforme / réutilisable | `system.yaml` contient une liste de repositories ; le collecteur les traite indépendamment. |
| Collecte Issues | Partiel | États, labels, type, dates création/fermeture et Milestone sont collectés. |
| Collecte Pull Requests | Conforme / réutilisable | État, date de merge et références sont disponibles. |
| GitHub Projects | Partiel | Le statut courant est collecté, mais pas l'historique de transition. |
| Labels Component | Partiel | Un seul `component` est actuellement extrait alors que le modèle métier autorise plusieurs Components pour une Issue générale. |
| Criticité / catégories a11y | Partiel | Les données sont collectées mais les règles DQ doivent être resserrées au périmètre Audit Accessibilité. |
| Milestone | Conforme comme donnée RAW | La Milestone de l'Issue est disponible. |
| Moteur DQ | Réutilisable | Bonne architecture : les données restent visibles et l'impact peut être métrique-spécifique. |
| Contrat de métriques | Réutilisable | `Metric` est auto-documenté et porte fiabilité, sources et exclusions. |
| Snapshots | Réutilisable | La distinction `capturedAt` / observation est déjà structurée. |
| Diff de snapshots | Partiel | Réutilisable, mais les transitions reposent encore sur `firstDoneAt`. |
| Dashboard statique | Réutilisable | Bonne séparation présentation / analytics, mais contenu métier à réaligner. |
| Anonymisation / fixtures | Réutilisable | À faire évoluer avec les nouveaux champs. |

## 4. Matrice des écarts métier V1

| Décision / règle cible | État actuel | Écart | Action V1 | Priorité |
|---|---|---|---|:---:|
| D-145 : toutes les Issues sont conservées dans le modèle normalisé | Absent | `NormalizedData` ne contient pas de collection générique d’Issues ; seules certaines Issues produisent des objets spécialisés | Ajouter une entité normalisée `Issue` et une collection `issues` sans supprimer les objets spécialisés dérivés | P0 |
| D-146 : le type collecté est conservé sur l’Issue normalisée | Absent avec l’entité `Issue` cible | Le RAW porte déjà `issueType`, mais aucune entité générique `Issue` normalisée ne permet aujourd’hui de le conserver pour toutes les Issues | Ajouter `Issue.issueType` au contrat normalisé et préserver la valeur collectée pendant `RawIssue → Issue` ; la liste définitive des valeurs reste à instruire | P0 |
| D-147 : vocabulaire global et reconnaissance configurable des Issue Types | Partiel | `system.yaml` contient déjà `github.issueTypes.keywords`, mais le contrat cible n’explicite pas encore la distinction entre valeurs observées globalement et notions canoniques reconnues | Généraliser le mécanisme existant : découverte des valeurs depuis toutes les Issues, reconnaissance globale par notion et mots-clés ; ne pas configurer les types par repository | P0 |
| D-148 : conserver et signaler les Issue Types non déclarés | Absent | Le pipeline dispose d’une reconnaissance par mots-clés mais le contrat ne garantit pas encore la conservation et la traçabilité d’une valeur inconnue | Préserver la valeur brute, conserver l’Issue et produire une réserve Data Quality non bloquante « issueType à déclarer » avec la valeur et le lien vers l’Issue source | P0 |
| D-149 : séparer Issue Type brut et notion canonique | Absent | La reconnaissance actuelle ne formalise pas deux propriétés distinctes et risque de confondre donnée GitHub et interprétation métier | Conserver la valeur brute comme donnée source et stocker séparément la notion canonique reconnue ; ne jamais écraser la valeur brute | P0 |
| D-150 : absence de notion canonique si le type n’est pas reconnu | Absent | Le modèle historique utilise `UNKNOWN`, ce qui confond une absence de reconnaissance avec une notion métier | Rendre la notion canonique optionnelle et ne pas injecter `UNKNOWN` ; conserver la valeur brute et utiliser la Data Quality D-148 | P0 |
| D-151 : recalculer la notion canonique avec la configuration courante | À formaliser | Le contrat ne garantit pas explicitement la reclassification des Issues existantes lorsque les mots-clés évoluent | Recalculer `issueType` et les spécialisations métier à chaque pipeline depuis `rawIssueType` et la configuration courante | P0 |
| D-137 : toute Issue `🐛 Bug` est une Anomalie | Partiel | Le normalizer reconnaît les BUG, mais son modèle suppose un Audit et un Component | Rendre l'Anomalie autonome d'un Audit | P0 |
| D-138 : origine `AUDIT` / `HORS_AUDIT` | Absent | Aucun champ d'origine ; `auditId` obligatoire | Ajouter `origin` ; rendre `auditId` optionnel | P0 |
| D-107/108 : Issue générale 0..n Components | Contradictoire | `RawIssue.component?: string` ne porte qu'un Component | Passer à une collection de Components | P0 |
| D-117 : Audit exactement 1 Component | Contradictoire | Un Audit est artificiellement créé pour quasiment chaque Issue | Créer un Audit uniquement depuis une Issue Audit valide | P0 |
| D-121/D-135 : Anomalie d'Audit = sub-Issue d'un Audit | Absent | `parents` existe mais le collecteur initialise toujours `parents: []` | Collecter la relation sub-Issue/parent GitHub | P0 |
| D-124 : Anomalie d'Audit = Issue Type Bug | Partiel | Type Bug collecté ; relation à l'Audit absente | Qualifier après collecte du parent | P0 |
| D-126/D-129 : criticité et catégorie RGAA obligatoires pour Anomalie Audit Accessibilité | Contradictoire | DQ-001 exige une criticité pour toute Anomalie | Restreindre la règle au bon sous-périmètre | P0 |
| D-139 : `detectedAt = issue.createdAt` | Presque conforme | Champ nommé `createdAt` | Renommer/exposer sémantiquement `detectedAt` ou documenter le mapping explicite | P1 |
| D-140 : `correctedAt = date passage Done` | Partiel / non alimenté | `firstDoneAt` existe dans les types mais le collecteur réel ne le renseigne pas | Collecter l'historique Project et matérialiser `correctedAt` | P0 |
| D-140 : Done / Closed / merge cohérents | Partiel | DQ-004/005 ne couvrent pas complètement la règle | Ajouter des contrôles temporels/états adaptés au workflow | P1 |
| D-141 : Audit réalisé = Done + Closed | Contradictoire | Audit `status` est basé sur des champs artificiels `auditStatus/auditResult` | Déduire la réalisation des faits GitHub | P0 |
| D-141 : `Audit.completedAt = passage Done` | Absent | Aucun timestamp réel de Done | Même collecte d'historique Project que pour Anomalie | P0 |
| Audit verdict = réalisé + 0 anomalie ouverte/détectée selon règle consolidée | Contradictoire | `objectiveAuditResult` provient d'un champ source artificiel | Calculer le verdict à partir de l'Audit et de ses sub-Issues | P0 |
| D-142 : Milestone = Version cible | Partiel | Milestone RAW disponible, mais `Audit.version` vient de `config.auditVersion` global | Résoudre la Version cible depuis la Milestone | P0 |
| D-142 : champ explicite RC auditée | Absent | Aucun champ Project dédié collecté | Ajouter configuration + collecte du champ RC auditée | P0 |
| D-142 : cohérence `M.m.r` / `M.m.r-rc.n` | Absent | Aucun contrôle | Ajouter DQ ciblée | P1 |
| D-143 : Catalogue historique depuis Git tag `M.m.r` | Absent | Un seul YAML courant est chargé | Ajouter résolution du catalogue à un ref/tag Git | P0 |
| D-144 : `releasedAt = date création Git tag M.m.r` | Absent | Aucun tag GitHub collecté | Collecter les tags/références et leur timestamp de référence | P0 |
| État à la Release ≠ connaissance actuelle | Partiel | Snapshots permettent la distinction conceptuelle, mais pas de projection Version/releasedAt | Introduire une vue temporelle Version | P1 |
| Audit de rattrapage post-PROD non rétroactif | Absent | Pas de `releasedAt` ni `completedAt` métier | Déduire pré-PROD / catch-up par comparaison temporelle | P1 |
| Couverture historique = audités / Catalogue de la Version | Contradictoire | KPI utilise les Components actifs courants | Calculer par Version avec Catalogue historique | P0 |
| Conformité = conformes / couverts | Partiel / contradictoire | KPI agrège les Audits terminés, pas le verdict Component×Version applicable | Recalculer au niveau Component×Version | P1 |
| Ensemble des Audits terminés applicables pour Component×Version | Absent | Le modèle legacy ne calcule pas le verdict agrégé défini par D-222 | Ajouter résolution de l’ensemble applicable et calcul du verdict agrégé | P1 |
| Audit incomplet ne modifie pas verdict acquis | Absent | Pas de notion explicite d’ensemble d’Audits terminés applicables | Exclure les Audits incomplets du verdict agrégé | P1 |
| 1 GitHub Anomaly Issue = 1 Anomalie | Conforme dans l'intention | Stable ID par Issue | Conserver | — |
| Multi-Component : 1 global, 1 par Component | Absent | `componentId` unique | Modéliser relation N-N / projections de métriques | P1 |
| Hors Audit V1 sans sous-origine | Absent | Aucun `origin` | Ajouter seulement `AUDIT` / `HORS_AUDIT`, sans inférence supplémentaire | P0 |

## 5. Écarts de collecte GitHub

### 5.1 Historique Project V2

Le collecteur GraphQL lit actuellement uniquement la **valeur courante**
du champ `Status`.

La V1 nécessite la date exacte de passage à `Done` pour : -
`Anomaly.correctedAt` ; - `Audit.completedAt`.

**Action :** enrichir la collecte avec l'historique des changements du
Project item / champ Status, ou une source GitHub équivalente permettant
de dater la transition.

Ne pas remplacer cette date par `closedAt` ou `mergedAt` : ces dates
servent au contrôle de cohérence.

### 5.2 Relations parent / sub-Issue

`RawIssue.parents` existe mais est toujours initialisé à `[]`.

**Action :** collecter explicitement les relations sub-Issue GitHub et
conserver les identifiants source des parents.

C'est indispensable pour distinguer : - Bug sub-Issue d'un Audit →
`AUDIT` ; - Bug sans parent Audit → `HORS_AUDIT`.

### 5.3 Champs Project supplémentaires

La requête GraphQL ne conserve actuellement que le champ nommé `Status`.

**Action :** rendre configurables et collectables les champs
nécessaires, au minimum : - Status ; - RC auditée.

À terme, la même mécanique pourra porter Velocity, Scheduling, etc.,
sans les imposer à la V1.

### 5.4 Tags / Versions

Aucune donnée de tag n'est présente dans `RawDataset`.

**Action :** ajouter une représentation de Version/Tag avec au minimum
: - nom `M.m.r` ; - référence Git/commit ; - `releasedAt` selon D-144.

**Point technique à valider pendant l'implémentation :** l'API GitHub
distingue tag léger et tag annoté. Le code devra définir précisément
comment obtenir la « date de création du Git tag » de manière stable
pour les deux formes, sans modifier la décision métier.

## 6. Refactor cible minimal du modèle normalisé

Le modèle cible V1 devrait au minimum pouvoir exprimer :

```text
Anomaly
- anomalyId
- libraryId
- componentIds: 0..n
- origin: AUDIT | HORS_AUDIT
- auditId?: string
- detectedAt
- correctedAt?
- status
- criticality?
- categories[]
- pullRequestRefs[]
- provenance
- dataQualityStatus

Audit
- auditId
- libraryId
- componentId              // exactement 1
- sourceIssueId
- targetVersion            // Milestone M.m.r
- auditedReleaseCandidate? // pré-PROD
- completedAt?
- realized
- verdict
- timing: PRE_PROD | CATCH_UP | UNKNOWN
- provenance
- dataQualityStatus

Version
- versionId
- libraryId / packageId
- number: M.m.r
- tag
- releasedAt
- historicalCatalogue
- provenance
- dataQualityStatus
```

Le nom exact des propriétés reste une décision d'implémentation ; les
cardinalités et sémantiques ci-dessus sont métier.

## 7. Règles DQ à reprendre

Les DQ-001→DQ-010 actuelles sont du **legacy implémenté**, pas le
contrat métier cible.

### À conserver dans l'esprit

- incohérence Issue / PR ;
- données de Component absentes du référentiel ;
- labels inconnus ;
- impacts DQ métrique-spécifiques.

### À modifier

- **DQ-001/DQ-002** : criticité obligatoire uniquement pour une
    Anomalie issue d'un Audit Accessibilité ;
- **DQ-003** : pour une Anomalie d'Audit, exiger exactement un parent
    Audit, pas seulement interdire plusieurs parents ;
- **DQ-004/DQ-005** : contrôler la cohérence `Done` / `Closed` / PR
    merge selon le profil applicable ;
- **DQ-006** : ne pas dégrader indistinctement `portfolio.*` ;
- **DQ-008/DQ-010** : politique Cancelled encore ouverte (Q-022), donc
    ne pas les promouvoir comme invariants V1 définitifs ;
- **DQ-009** : métriques Release actuelles absentes du catalogue ; à
    réaligner avec le nouveau modèle Version.

### Nouveaux contrôles nécessaires

Sans imposer dès maintenant leur numérotation : - Audit exactement 1
Component ; - Anomalie Audit exactement 1 parent Audit ; - Component(s)
de l'Anomalie cohérents avec son parent Audit ; - Audit pré-PROD avec RC
auditée renseignée ; - RC auditée cohérente avec la Version cible de la
Milestone ; - Audit `Done` mais non `Closed`, et inversement ; -
Anomalie `Done` avec incohérence `Closed` / merge PR selon profil ; -
tag PROD manquant pour une Version historique ; - Catalogue historique
impossible à reconstruire.

## 8. Indicateurs : écarts principaux

### Déjà proches de la cible

- nombre d'Anomalies ;
- répartition par criticité ;
- répartition par catégorie ;
- délai moyen / médian / p90 ;
- moteur de fiabilité par métrique.

Le calcul du délai doit simplement passer de :

```text
firstDoneAt - createdAt
```

à la sémantique explicite :

```text
correctedAt - detectedAt
```

### À refaire conceptuellement

**Couverture d'Audit**

Actuel :

```text
Components actifs actuellement avec au moins un Audit terminé
/
Components actifs actuellement
```

Cible historique :

```text
Components du Catalogue de M.m.r disposant d'un Audit applicable
/
Components du Catalogue historique de M.m.r
```

**Conformité**

Le calcul doit porter sur le verdict applicable au couple
`Component × Version`, et non simplement sur tous les objets Audit
terminés.

### À ne pas ajouter artificiellement

Aucun score global synthétique de qualité n'est défini en V1.

## 9. Snapshots et historique

Le moteur de snapshot est une bonne base.

À conserver : - `capturedAt` = instant d'observation du pipeline ; -
snapshots immuables ; - diff entre observations.

À ajouter : - événements métier (`detectedAt`, `correctedAt`,
`completedAt`, `releasedAt`) ; - Versions et Catalogues historiques ; -
distinction entre état connu à `releasedAt` et connaissance actuelle.

Un snapshot ne doit pas devenir le substitut d'une date métier exacte
lorsqu'elle est disponible depuis GitHub.

## 10. Dashboard

Le dashboard existant est une base technique réutilisable, mais il devra
être adapté **après** le modèle et les métriques.

Priorités UI V1 : 1. vue portefeuille multi-librairies ; 2. vue
Bibliothèque / Version ; 3. couverture et conformité distinctes ; 4.
détail Component avec verdict applicable ; 5. Anomalies Audit / hors
Audit ; 6. délai détection → correction ; 7. qualité/fiabilité des
données ; 8. distinction « état à la Release » / « connaissance actuelle
» lorsqu'une vue historique est affichée.

L'interface ne doit pas présenter `unknown` comme `0` ni une absence
d'Audit comme une non-conformité.

## 11. État des tests du ZIP

Le ZIP analysé ne contient pas `node_modules`.

Conséquence : - `npm test` ne peut pas démarrer (`vitest: not found`)
; - le `typecheck` exécuté sans dépendances installées produit des
erreurs de modules manquants ; - il révèle également au moins des
décalages de contrat dans les tests, notamment autour de
`Library.defaultBranch` et de constructions partielles de `Analytics`.

Ces résultats ne permettent pas de conclure que la branche échoue après
un `npm ci`. Ils indiquent en revanche que la baseline devra être
vérifiée **avant tout refactor**.

## 12. Ordre d'implémentation recommandé

### Lot I0 --- Baseline technique

- `npm ci` ;
- exécuter `npm test`, `npm run typecheck`, `npm run lint`,
    `npm run build` ;
- corriger uniquement les problèmes de baseline indépendants du
    nouveau métier ;
- figer un état vert.

### Lot I1 --- Contrats de domaine V1

- Anomaly autonome ;
- origine `AUDIT | HORS_AUDIT` ;
- `componentIds` multi-valués pour Issue/Anomaly générale ;
- Audit réel uniquement depuis Issue Audit ;
- Version comme objet métier ;
- timestamps métier explicites.

### Lot I2 --- Collecte GitHub enrichie

- relations sub-Issue ;
- historique Status / date Done ;
- champs Project configurables dont RC auditée ;
- tags / données nécessaires à `releasedAt`.

### Lot I3 --- Normalisation Audit / Anomalie / Version

- classification Bug ;
- origine ;
- relations Audit ;
- Milestone → targetVersion ;
- champ RC → auditedReleaseCandidate ;
- `Done + Closed` → Audit réalisé ;
- calcul du verdict ;
- pré-PROD / catch-up.

### Lot I4 --- Catalogue historique

- lecture du contenu du Repository au tag `M.m.r` ;
- reconstruction du Catalogue applicable ;
- contrôles de disponibilité/cohérence.

### Lot I5 --- Data Quality V1

- réaligner DQ-001→010 ;
- ajouter les contrôles nécessaires ;
- conserver l'approche d'impact métrique-spécifique.

### Lot I6 --- Analytics V1

- délais avec timestamps métier ;
- couverture par Version ;
- conformité Component×Version ;
- agrégations multi-Component ;
- distinction Audit / hors Audit.

### Lot I7 --- Snapshots / historique

- intégrer Versions et événements métier ;
- conserver observation vs business time ;
- calculer état à la Release sans rétroprojection.

### Lot I8 --- Dashboard V1

- adapter les pages au nouveau contrat ;
- vues Version / Component ;
- provenance des Anomalies ;
- historique et fiabilité ;
- accessibilité UI.

### Lot I9 --- Fixtures, anonymisation et non-régression

- faire évoluer fixtures ;
- anonymiser les nouveaux champs ;
- tests unitaires des décisions D-137→D-146 ;
- tests d'intégration multi-repositories ;
- scénarios pré-PROD / catch-up / hors Audit / historique.

## 13. Questions encore ouvertes mais non bloquantes pour démarrer I0/I1

La gap analysis ne transforme pas les questions restantes en décisions
implicites.

À garder ouvertes notamment : - Q-020 profils exacts de workflow ; -
Q-021 exceptions à la PR obligatoire ; - Q-022 règles exactes de
`Cancelled` ; - Q-035 mécanisme complet de conservation de l'état
historique ; - Q-037/Q-038 Nexus/Jenkins ; - Q-045/Q-046
représentation/cardinalité de la famille d'Audit si nécessaire ; - Q-068
disponibilité exacte de l'historique Project ; - Q-097/Q-098/Q-099
Version affectée des Bugs hors Audit ; - questions V1.1/V2 déjà classées
comme telles.

Ces points peuvent être instruits au moment du lot qui les consomme.

## 14. Conclusion

**Verdict : faisabilité V1 confirmée, avec refactor métier significatif
mais architecture générale conservable.**

Le chemin critique est :

```text
Contrats métier
→ collecte GitHub des faits manquants
→ normalisation
→ DQ
→ métriques historiques
→ snapshots
→ dashboard
```

Le prochain travail recommandé est **I0 --- baseline technique**, puis
**I1 --- contrats de domaine**, sans encore modifier les KPI ou le
dashboard.
| D-154 : normaliser casse et espaces pour la correspondance stricte | À formaliser | La sémantique exacte de comparaison n’est pas contractualisée | Comparer la valeur complète après `trim`, sans tenir compte de la casse, sans recherche partielle et sans modifier la valeur brute | P0 |
| D-155 : conserver et signaler une Issue sans Issue Type | Absent | Le contrat cible ne distingue pas encore explicitement l’absence totale d’Issue Type d’une valeur présente mais non reconnue | Rendre `rawIssueType` et `issueType` optionnels dans ce cas, conserver l’Issue et produire une réserve Data Quality non bloquante « issueType manquant » avec le lien vers l’Issue source | P0 |
| D-156 : conserver le titre de l’Issue normalisée | À formaliser | Le titre existe dans les données GitHub brutes mais doit être contractualisé dans l’entité générique `Issue` | Ajouter `title: string` à `Issue` et le propager vers le modèle normalisé pour les usages aval | P0 |
| D-157 : conserver l’état GitHub de l’Issue normalisée | À formaliser | L’état `OPEN` / `CLOSED` existe dans les données brutes mais doit être contractualisé dans l’entité générique `Issue` | Ajouter `state: 'OPEN' \| 'CLOSED'` à `Issue`, le propager depuis GitHub et le maintenir distinct du statut GitHub Projects | P0 |
| D-158 : conserver les dates GitHub natives de l’Issue normalisée | À formaliser | `createdAt` et `closedAt` existent dans les données brutes mais doivent être contractualisés dans l’entité générique `Issue` | Ajouter `createdAt: string` et `closedAt?: string` à `Issue`, les propager depuis GitHub et les maintenir distincts des dates métier dérivées | P0 |
| D-159 : conserver tous les labels GitHub de l’Issue normalisée | À formaliser | Les labels existent dans les données brutes mais leur conservation exhaustive doit être contractualisée dans l’entité générique `Issue` | Ajouter `labels: string[]` à `Issue`, propager tous les labels GitHub et maintenir séparées les notions métier qui en sont dérivées | P0 |
| D-160 : rattacher explicitement l’Issue normalisée au repository | À formaliser | La provenance repository existe dans la structure collectée mais le contrat cible de `Issue` ne l’explicite pas encore | Ajouter `repositoryId: string` à `Issue` en plus de `libraryId` et ne pas déduire la provenance uniquement de la relation Library/repository | P0 |
| D-161 : conserver l’URL GitHub de l’Issue normalisée | À formaliser | Les usages Data Quality et dashboard nécessitent un lien vers l’Issue mais le contrat cible ne porte pas encore explicitement son URL | Ajouter `url: string` à `Issue`, la propager depuis GitHub et utiliser cette valeur plutôt que reconstruire l’URL à partir du repository et du numéro | P0 |
| D-162 : conserver le rattachement éventuel de l’Issue à une Milestone | À formaliser | La Milestone existe dans les données collectées mais sa référence doit être contractualisée dans l’entité générique `Issue` | Ajouter `milestoneId?: string` à `Issue` comme référence vers l’objet `Milestone` normalisé, sans dupliquer les données de la Milestone | P0 |
| D-163 : conserver les statuts GitHub Projects de l’Issue normalisée | À formaliser | `projectStatuses` existe dans les données collectées mais sa conservation générique doit être contractualisée dans `Issue` | Ajouter `projectStatuses` à `Issue`, préserver les rattachements/statuts Projects pour toutes les Issues et les maintenir distincts de `state` | P0 |
| D-164 : conserver les relations parent / sous-Issues | À formaliser | Les relations de parenté sont nécessaires aux spécialisations mais doivent rester disponibles dans l’Issue générique | Ajouter `parentIssueId?` et `subIssueIds` à `Issue` et les propager depuis GitHub | P0 |
| D-165 : conserver les Pull Requests liés | À formaliser | Les références aux PR liées existent dans le domaine collecté mais doivent être contractualisées dans `Issue` | Ajouter `linkedPullRequestIds: string[]` à `Issue` et les propager depuis GitHub | P0 |
| D-166 : conserver l’Iteration GitHub Projects | À formaliser | L’Iteration est une donnée de pilotage générique qui ne doit pas être perdue lors de la normalisation | Conserver l’Iteration lorsqu’elle existe et définir sa représentation détaillée avec le contrat GitHub Projects | P0 |
| D-167 : conserver Velocity | À formaliser | `Velocity` est une donnée de pilotage générique actuellement utilisée par le workflow | Conserver la valeur `Velocity` lorsqu’elle existe et définir son typage détaillé avec le contrat GitHub Projects | P0 |
| D-168 : conserver Scheduling | À formaliser | `Scheduling` est une donnée de pilotage générique actuellement utilisée par le workflow | Conserver la valeur `Scheduling` lorsqu’elle existe et définir son typage détaillé avec le contrat GitHub Projects | P0 |
| D-169 : conserver les Components dérivés dans l’Issue | À formaliser | L’Issue conserve ses labels mais le contrat cible doit exposer les Components reconnus sans recalcul aval | Ajouter `componentIds: string[]`, cardinalité 0..n, en conservant tous les labels source | P0 |
| D-170 : conserver les criticités reconnues dans l’Issue | À formaliser | Les criticités dérivées des labels ne doivent pas être perdues hors spécialisation Accessibility | Conserver les criticités reconnues au niveau `Issue` et appliquer les contraintes RGAA uniquement dans les spécialisations concernées | P0 |
| D-171 : conserver les catégories Accessibility reconnues dans l’Issue | À formaliser | Les catégories a11y dérivées des labels doivent rester disponibles sans figer prématurément leur vocabulaire | Conserver les catégories reconnues au niveau `Issue` et laisser leur vocabulaire/règles détaillées aux contrats dédiés | P0 |
| D-172 : structurer les données Projects par Project source | À formaliser | Une Issue peut appartenir à plusieurs Projects et des valeurs fusionnées seraient ambiguës | Rattacher statut, Iteration, Velocity, Scheduling et autres valeurs au Project qui les porte | P0 |
| D-173 : conserver et signaler les valeurs Project non reconnues | À formaliser | Une valeur Project inconnue ne doit ni être perdue ni convertie arbitrairement | Conserver la valeur brute, ne pas créer de canonique artificiel, poursuivre le pipeline et émettre une DQ non bloquante ; numéro à attribuer en I5 | P0 |
| D-174 : conserver `projectId` et `projectName` | À formaliser | Les données Project doivent rester rattachées à une identité stable et compréhensible | Conserver l’identifiant et le nom dans chaque contexte Project associé à une Issue | P0 |
| D-175 : séparer statut Project brut et canonique | À formaliser | La canonicalisation ne doit pas écraser la valeur GitHub source | Conserver la valeur brute et une notion canonique optionnelle, sur le même principe que les Issue Types | P0 |
| D-176 : recalculer le statut Project canonique | À formaliser | Une évolution de configuration doit pouvoir reclasser les valeurs existantes | Recalculer la notion canonique à chaque pipeline depuis la valeur brute et la configuration courante | P0 |
| D-177 : matching strict des statuts Project | À formaliser | Les correspondances permissives ou par sous-chaîne introduiraient des classifications implicites | Comparer la valeur complète après trim, sans distinction de casse, uniquement avec les variantes configurées | P0 |
| D-178 : gérer les statuts Project ambigus | À formaliser | Une valeur correspondant à plusieurs notions ne doit pas être classée arbitrairement | Ne produire aucun canonique, conserver le brut, exposer les candidats et émettre une DQ non bloquante ; numéro à attribuer en I5 | P0 |
| D-179 : conserver les données source de l’Iteration | À formaliser | Une Iteration réduite à son titre perdrait des informations utiles à l’historique et au pilotage | Conserver identifiant, titre, date de début et durée/date de fin lorsque GitHub les fournit, sans inventer les données absentes | P0 |
| D-180 : rattacher l’Iteration au Project source | À formaliser | Une Issue multi-Projects peut avoir plusieurs Iterations différentes | Porter l’Iteration dans chaque contexte Project et interdire une fusion globale implicite | P0 |
| D-181 : séparer Velocity brute et numérique | À formaliser | La donnée source doit être préservée tout en permettant un usage numérique fiable | Conserver la valeur brute et une valeur numérique normalisée optionnelle lorsqu’elle est valide | P0 |
| D-182 : gérer une Velocity invalide | À formaliser | Une valeur non numérique ne doit ni casser le pipeline ni être convertie arbitrairement | Conserver le brut, omettre la valeur numérique et émettre une DQ non bloquante ; numéro à attribuer en I5 | P0 |
| D-183 : conserver Scheduling brut | À formaliser | Toute interprétation future de Scheduling doit rester traçable vers la donnée Project source | Conserver systématiquement la valeur brute dans le contexte Project et séparer toute interprétation/canonicalisation | P0 |
| D-184 : conserver l’historique des statuts Project | À formaliser | Le statut courant ne permet pas d’établir les dates métier fondées sur un passage à `Done` | Collecter et normaliser l’historique des changements de statut dans chaque contexte Project | P0 |
| D-185 : définir le contenu minimal d’une transition Project | À formaliser | Les événements doivent rester traçables et exploitables sans inventer les données absentes | Conserver Project, statut brut précédent si disponible, nouveau statut brut et date/heure de transition | P0 |
| D-186 : canonicaliser les statuts historiques | À formaliser | Le statut courant et l’historique doivent suivre les mêmes règles d’interprétation | Appliquer D-175 à D-178 aux statuts historiques tout en conservant leurs valeurs brutes | P0 |
| D-187 : conserver toutes les transitions | À formaliser | Plusieurs passages à `Done` ou réouvertures peuvent être significatifs | Ne pas réduire l’historique au premier/dernier `Done`; laisser les règles métier sélectionner les événements pertinents | P0 |
| D-188 : gérer un historique Project insuffisant | À formaliser | Une date métier ne doit pas être inventée lorsque GitHub ne fournit pas assez d’historique | Conserver les faits disponibles, laisser la date dérivée absente et émettre une DQ non bloquante ; numéro à attribuer en I5 | P0 |
| D-189 : Audit référence Issue | À formaliser | Les spécialisations ne doivent pas dupliquer les faits GitHub communs | Faire porter `issueId` à `Audit` et conserver les données génériques dans `Issue` | P0 |
| D-190 : Anomaly référence Issue | À formaliser | Les anomalies doivent rester reliées à leur Issue sans recopier son socle générique | Faire porter `issueId` à `Anomaly` | P0 |
| D-191 : AuditImprovement référence Issue | À formaliser | Les améliorations d’Audit suivent le même modèle de spécialisation | Faire porter `issueId` à `AuditImprovement` | P0 |
| D-192 : identifiants métier propres aux spécialisations | À formaliser | Les entités métier doivent disposer d’identités stables distinctes de la source GitHub | Ajouter `auditId`, `anomalyId`, `auditImprovementId` avec génération déterministe | P0 |
| D-193 : relation Anomaly vers Audit selon origine | À formaliser | Une anomalie d’Audit doit référencer son Audit tandis qu’une anomalie hors Audit ne le doit pas | Rendre `auditId` conditionnel et distinguer absence valide de relation attendue invalide | P0 |
| D-194 : relation obligatoire AuditImprovement vers Audit | À formaliser | Une amélioration d’Audit n’a de sens spécialisé qu’avec un Audit parent valide | Exiger un `auditId` valide pour matérialiser `AuditImprovement` | P0 |
| D-195 : Component explicite sur Audit | À formaliser | L’Audit concerne exactement un Component et doit être directement exploitable | Porter `componentId` sur `Audit` et le valider depuis les faits source | P0 |
| D-196 : Component explicite sur anomalie d’Audit | À formaliser | La spécialisation doit être exploitable sans recalcul tout en restant cohérente avec son Audit | Porter `componentId` sur l’anomalie d’Audit lorsque la relation est valide | P0 |
| D-197 : incohérence Component Audit/anomalie | À formaliser | Une divergence ne doit pas être corrigée silencieusement | Conserver les faits source, ne pas corriger automatiquement et émettre une DQ non bloquante ; numéro en I5 | P0 |
| D-198 : Bug conservé malgré parent Audit invalide | À formaliser | Une relation invalide ne doit pas faire disparaître une anomalie | Matérialiser l’Anomaly sans `auditId` artificiel et émettre une DQ non bloquante ; numéro en I5 | P0 |
| D-199 : identifiant métier stable de Version | À formaliser | La Version doit être référencée indépendamment des objets GitHub techniques | Ajouter `versionId` stable et distinct des IDs Tag/Milestone | P0 |
| D-200 : numéro PROD canonique | À formaliser | La RC auditée ne doit pas remplacer l’identité de la Version cible | Utiliser `M.m.r` comme numéro canonique de Version et modéliser la RC séparément | P0 |
| D-201 : tag PROD requis pour publication | À formaliser | Milestone/Audit seuls ne prouvent pas qu’une Version a été publiée | Considérer publiée uniquement une Version possédant le tag exact `M.m.r` | P0 |
| D-202 : tag PROD source de `releasedAt` | À formaliser | Les différentes dates GitHub ne doivent pas être mélangées | Dériver `releasedAt` de la date du tag PROD uniquement, sans fallback implicite | P0 |
| D-203 : Version sans tag PROD | À formaliser | Une Version attendue ne doit pas disparaître si son tag manque | Conserver la Version, laisser `releasedAt` absent, ne pas la considérer publiée et émettre une DQ non bloquante | P0 |
| D-204 : Milestone PROD référencée par Version | À formaliser | La relation Version/Milestone doit être explicite sans changer la source de vérité de publication | Conserver `milestoneId` lorsqu’une Milestone PROD correspondante existe | P0 |
| D-205 : RC auditée séparée de la PROD cible | À formaliser | Un Audit pré-PROD porte deux notions de version distinctes | Conserver la RC auditée dans le contexte Audit et la Version PROD cible séparément | P0 |
| D-206 : tag et date de RC | À formaliser | La RC auditée doit rester traçable vers son état Git | Conserver la référence du tag RC et sa date lorsqu’ils existent | P0 |
| D-207 : RC indéterminable | À formaliser | Une RC absente ne doit pas être inventée ni supprimer l’Audit | Conserver l’Audit, laisser la RC absente et émettre une DQ non bloquante ; numéro en I5 | P0 |
| D-208 : Audit de rattrapage sur PROD | À formaliser | Un rattrapage post-publication n’a pas besoin d’une RC fictive | Référencer directement la Version PROD et ne pas créer de RC artificielle | P0 |
| D-209 : Catalogue historique propre à chaque Version PROD | À formaliser | Contrat I1 établi | Implémenter et tester conformément à D-209 | P0 |
| D-210 : Catalogue historique lu dans le Git tree du tag PROD | À formaliser | Contrat I1 établi | Implémenter et tester conformément à D-210 | P0 |
| D-211 : Catalogue indéterminable lorsqu’un tag PROD manque | À formaliser | Contrat I1 établi | Implémenter et tester conformément à D-211 | P0 |
| D-212 : Catalogue absent ou illisible au tag PROD | À formaliser | Contrat I1 établi | Implémenter et tester conformément à D-212 | P0 |
| D-213 : Conservation historique d’un Component supprimé | À formaliser | Contrat I1 établi | Implémenter et tester conformément à D-213 | P0 |
| D-214 : Absence historique d’un Component ajouté ultérieurement | À formaliser | Contrat I1 établi | Implémenter et tester conformément à D-214 | P0 |
| D-215 : Identifiant métier stable de Component | À formaliser | Contrat I1 établi | Implémenter et tester conformément à D-215 | P0 |
| D-216 : Identité d’un Component conservée entre Versions continues | À formaliser | Contrat I1 établi | Implémenter et tester conformément à D-216 | P0 |
| D-217 : Renommage explicite d’un Component | À formaliser | Contrat I1 établi | Implémenter et tester conformément à D-217 | P0 |
| D-218 : Nouvelle identité après disparition puis réapparition | À formaliser | Contrat I1 établi | Implémenter et tester conformément à D-218 | P0 |
| D-219 : Matérialisation de la relation Component × Version | À formaliser | Contrat I1 établi | Implémenter et tester conformément à D-219 | P0 |
| D-220 : Couverture fondée sur au moins un Audit terminé applicable | À formaliser | Contrat I1 établi | Implémenter et tester conformément à D-220 | P0 |
| D-221 : Audit incomplet insuffisant pour la couverture | À formaliser | Contrat I1 établi | Implémenter et tester conformément à D-221 | P0 |
| D-222 : Verdict courant agrégé sur l’ensemble des Audits terminés applicables | À formaliser | Contrat I1 établi | Implémenter et tester conformément à D-222 | P0 |
| D-223 : Un Audit incomplet ne modifie pas le verdict acquis | À formaliser | Contrat I1 établi | Implémenter et tester conformément à D-223 | P0 |
| D-224 : Conformité conditionnée à l’absence d’anomalie d’Audit ouverte pertinente | À formaliser | Contrat I1 établi | Implémenter et tester conformément à D-224 | P0 |
| D-225 : AuditImprovement sans effet sur le verdict de conformité | À formaliser | Contrat I1 établi | Implémenter et tester conformément à D-225 | P0 |
| D-226 : Correction d’une anomalie insuffisante pour rétablir la conformité | À formaliser | Contrat I1 établi | Implémenter et tester conformément à D-226 | P0 |
| D-227 : Anomalie HORS_AUDIT sans effet direct sur la conformité d’Audit | À formaliser | Contrat I1 établi | Implémenter et tester conformément à D-227 | P0 |
| D-228 : État NON_COUVERT en absence d’Audit terminé applicable | À formaliser | Contrat I1 établi | Implémenter et tester conformément à D-228 | P0 |
