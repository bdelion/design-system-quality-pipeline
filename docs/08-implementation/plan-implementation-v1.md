# Plan d’implémentation V1 — Design System Quality Pipeline

## 1. Objet

Ce document transforme la gap analysis V1 en plan d’implémentation séquencé et vérifiable.

Il couvre les lots I0 à I9 et précise, pour chacun :

- l’objectif ;
- les prérequis ;
- les fichiers existants à modifier ;
- les fichiers à créer ;
- les modifications attendues ;
- les tests à écrire ou à adapter ;
- les critères d’acceptation ;
- les dépendances avec les autres lots ;
- le résultat attendu.

Le plan respecte le principe d’architecture suivant :

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

L’ordre d’implémentation est volontaire : les couches aval ne doivent pas compenser des informations absentes ou ambiguës dans les couches amont.

## 2. Principes d’exécution

### 2.1 Source de vérité

L’ordre de priorité est le suivant :

1. décisions métier consolidées D-001 à D-147 ;
2. documentation métier et règles consolidées ;
3. contrat de données cible ;
4. code et tests existants ;
5. documentation legacy uniquement comme trace de l’existant.

Le code actuel ne doit pas invalider une décision métier au motif qu’elle n’est pas encore implémentée.

### 2.2 Stratégie de migration

La migration doit rester incrémentale.

Chaque lot doit :

- préserver autant que possible une branche exécutable ;
- introduire ses contrats avant leur consommation ;
- ajouter les tests au même moment que le comportement ;
- éviter les adaptations temporaires non documentées dans les couches aval ;
- faire évoluer les fixtures dès qu’un contrat RAW ou normalisé change ;
- mettre à jour la documentation technique concernée.

Les projections de compatibilité existantes peuvent être conservées temporairement lorsqu’elles permettent une migration progressive, mais elles doivent être explicitement marquées comme dépréciées et ne doivent pas devenir la nouvelle source de vérité.

### 2.3 Niveaux de priorité

| Priorité | Signification                                                                                   |
|:---------|:------------------------------------------------------------------------------------------------|
| P0       | Nécessaire au chemin critique V1 ou à la fiabilité du modèle métier                             |
| P1       | Nécessaire à une V1 fonctionnellement complète, mais peut être implémenté après les contrats P0 |
| P2       | Amélioration non bloquante ou préparation d’une évolution ultérieure                            |

## 3. Definition of Done commune

Un lot n’est terminé que si toutes les conditions applicables suivantes sont satisfaites :

- le code TypeScript compile sans erreur ;
- ESLint ne remonte aucune erreur ni warning ;
- les tests existants restent verts ou sont adaptés lorsque leur ancien contrat est explicitement remplacé ;
- les nouveaux comportements sont couverts par des tests ;
- les fixtures reflètent les nouveaux contrats lorsqu’elles sont concernées ;
- l’anonymisation préserve les nouveaux champs sans fuite de données sensibles lorsqu’elle est concernée ;
- les erreurs de données sont représentées par la couche Data Quality lorsqu’elles ne doivent pas bloquer le pipeline ;
- aucun KPI ou écran ne recalcule une règle métier qui appartient à la normalisation ;
- la documentation technique correspondant au comportement réellement implémenté est mise à jour ;
- aucune question métier ouverte n’est transformée implicitement en règle de code.

La commande de validation de référence est :

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Lorsque le lot modifie le pipeline de bout en bout, ajouter :

```bash
npm run pipeline
```

sur une fixture de référence adaptée au contrat du lot.

## 4. Vue d’ensemble du séquencement

| Lot | Intitulé                                  | Dépend de                    | Gate principal                                                                        |
|:----|:------------------------------------------|:-----------------------------|:--------------------------------------------------------------------------------------|
| I0  | Baseline technique                        | —                            | Branche actuelle reproductible et verte                                               |
| I1  | Contrats de domaine V1                    | I0                           | Le modèle peut représenter sans ambiguïté les décisions métier V1                     |
| I2  | Collecte GitHub enrichie                  | I1                           | Le RAW contient les faits GitHub nécessaires sans inférence métier                    |
| I3  | Normalisation Audit / Anomalie / Version  | I2                           | Les objets métier V1 sont construits uniquement à partir des faits collectés          |
| I4  | Catalogue historique                      | I1, I2                       | Le Catalogue d’une Version est reconstructible depuis son Git tag                     |
| I5  | Data Quality V1                           | I3, I4                       | Les incohérences sont détectées au bon périmètre et avec un impact métrique explicite |
| I6  | Analytics V1                              | I3, I4, I5                   | Les KPI utilisent exclusivement le modèle métier V1                                   |
| I7  | Snapshots et historique                   | I3, I4, I6                   | Temps métier et temps d’observation sont distincts et testés                          |
| I8  | Dashboard V1                              | I6, I7                       | L’UI restitue les métriques sans recalcul métier                                      |
| I9  | Fixtures, anonymisation et non-régression | Transverse, finalise I1 à I8 | Scénarios V1 complets reproductibles hors GitHub réel                                 |

Le chemin critique est :

```text
I0
↓
I1
↓
I2
↓
I3 ─────→ I5 → I6 → I7 → I8
│          ↑
└──→ I4 ───┘
             ↓
            I9
```

I9 est transverse : les fixtures et tests doivent évoluer dans chaque lot. Le lot I9 finalise la couverture de non-régression et les scénarios de bout en bout.

## 5. Lot I0 — Baseline technique

### 5.1 Objectif

Établir une baseline reproductible avant toute modification métier.

Ce lot ne doit introduire aucune nouvelle règle fonctionnelle.

### 5.2 Prérequis

Aucun.

### 5.3 Fichiers concernés

#### Modifier si nécessaire

- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `eslint.config.mjs`
- `vitest.config.ts`
- `.github/workflows/ci.yml`
- tests existants qui ne compilent plus à cause d’un décalage purement technique avec les types actuels

#### Créer

Aucun fichier métier.

Un document de baseline peut être ajouté si l’équipe souhaite conserver les résultats initiaux, par exemple :

- `docs/08-implementation/baseline-v1.md`

### 5.4 Modifications attendues

1. Installer exactement les dépendances du lockfile avec `npm ci`.
2. Exécuter séparément :
    - `npm run typecheck` ;
    - `npm run lint` ;
    - `npm test` ;
    - `npm run build`.
3. Classer chaque échec :
    - défaut réel de la branche ;
    - test obsolète ;
    - problème d’environnement ;
    - incohérence de type déjà présente.
4. Corriger uniquement les défauts nécessaires à l’obtention d’une baseline verte.
5. Ne pas profiter de I0 pour commencer le refactor métier.

### 5.5 Tests

Aucun nouveau scénario métier n’est requis.

Les tests existants constituent la baseline de non-régression.

### 5.6 Critères d’acceptation

- `npm ci` termine avec succès.
- `npm run typecheck` termine avec succès.
- `npm run lint` termine avec succès sans warning.
- `npm test` termine avec succès.
- `npm run build` termine avec succès.
- La CI exécute les mêmes contrôles ou un sous-ensemble explicitement documenté.
- Toute correction effectuée dans I0 est indépendante des décisions D-137 à D-144.

### 5.7 Résultat attendu

Une branche de référence verte sur laquelle le refactor métier peut commencer.

---

## 6. Lot I1 — Contrats de domaine V1

### 6.1 Objectif

Faire évoluer les contrats TypeScript afin que le modèle puisse représenter les décisions métier V1 sans dépendre encore de la disponibilité réelle des données GitHub.

Les décisions particulièrement concernées sont D-107, D-108 et D-117 à D-147.

### 6.2 Prérequis

I0 terminé.

### 6.3 Fichiers concernés

#### Modifier

- `src/domain/types.ts`
- `src/config.ts`
- `src/normalizers/github.ts`
- `src/pipeline.ts`
- `tests/pipeline.test.ts`
- `tests/snapshot.test.ts`
- `fixtures/github.json`
- `config/system.yaml`
- configurations de fixtures correspondantes

#### Créer

Recommandé pour isoler les contrats et éviter de surcharger `pipeline.test.ts` :

- `tests/domain-contract.test.ts`

À confirmer pendant le lot si la séparation améliore réellement la lisibilité :

- `src/domain/anomaly.ts`
- `src/domain/audit.ts`
- `src/domain/version.ts`

Le découpage en plusieurs fichiers de domaine est une décision d’implémentation, pas une exigence métier.

### 6.4 Modifications attendues

#### RawIssue

Faire évoluer le contrat pour représenter plusieurs Components.

Cible conceptuelle :

```ts
interface RawIssue {
  // ...
  components: string[];
  // ...
}
```

Pendant la migration, `component?: string` peut être toléré uniquement comme compatibilité transitoire si cela évite un changement atomique trop large. La cible V1 reste une collection.

Prévoir également un contrat RAW capable de porter les champs Project collectés sans les réduire au seul `Status`.

#### Issue

Introduire une entité générique `Issue` dans le modèle normalisé conformément à D-145.

Le contrat détaillé de cette entité sera complété au fil des décisions I1 suivantes. À ce stade, les invariants établis sont :

- toute Issue GitHub collectée produit une `Issue` normalisée ;
- une `Issue` normalisée peut ne produire aucun objet métier spécialisé ;
- lorsqu'un `Audit`, une `Anomaly` ou une Improvement d'Audit est dérivé d'une Issue, l'`Issue` normalisée reste présente ;
- la relation entre l'Issue et l'objet spécialisé dérivé doit rester traçable ;
- conformément à D-146, l’`Issue` normalisée conserve le type collecté dans un champ `issueType` ;
- `RawIssue → Issue` doit préserver cette information sans la recalculer ;
- conformément à D-147, les Issue Types constituent un vocabulaire global au système, et non une configuration par repository ;
- les valeurs observées peuvent être inventoriées depuis l’ensemble des Issues collectées ;
- la reconnaissance métier repose sur une configuration globale associant chaque notion canonique à une ou plusieurs valeurs ou mots-clés acceptés, dans la continuité de `github.issueTypes.keywords` dans `system.yaml` ;
- conformément à D-148, une valeur non reconnue reste conservée sous sa forme brute sur l’Issue normalisée ;
- conformément à D-149, l’Issue normalisée porte séparément la valeur brute GitHub et la notion canonique reconnue ; la canonicalisation ne remplace jamais la valeur brute ;
- conformément à D-150, la notion canonique est optionnelle lorsqu’aucune correspondance n’est reconnue ; ne pas utiliser `UNKNOWN` comme valeur de repli ;
- conformément à D-155, accepter une Issue sans Issue Type : `rawIssueType` et `issueType` sont alors absents, l’Issue reste normalisée et une réserve Data Quality non bloquante « issueType manquant » doit référencer l’Issue GitHub ; distinguer ce cas de « issueType à déclarer » défini par D-148 ;
- conformément à D-156, conserver et propager le `title` GitHub dans chaque `Issue` normalisée afin qu’il soit directement disponible pour les couches aval ;
- conformément à D-157, conserver et propager `state: 'OPEN' | 'CLOSED'` dans chaque `Issue` normalisée ; ne pas confondre cet état GitHub avec le statut GitHub Projects ;
- conformément à D-158, conserver et propager `createdAt` et `closedAt?` dans chaque `Issue` normalisée ; les maintenir distincts des dates métier dérivées (`detectedAt`, `correctedAt`, `completedAt`) ;
- conformément à D-159, conserver et propager tous les labels GitHub dans `labels: string[]` ; ne pas supprimer les labels non interprétés et maintenir séparées les propriétés métier dérivées ;
- conformément à D-160, conserver et propager `repositoryId` dans chaque `Issue` normalisée, en plus de `libraryId`, sans déduire la provenance repository de la seule relation Library/repository ;
- conformément à D-161, conserver et propager `url: string` dans chaque `Issue` normalisée ; utiliser cette URL source pour les liens du dashboard et de la Data Quality plutôt que la reconstruire ;
- conformément à D-162, conserver et propager `milestoneId?` dans chaque `Issue` normalisée comme référence vers la `Milestone` normalisée, sans dupliquer ses propriétés ;
- conformément à D-163, conserver et propager `projectStatuses` dans chaque `Issue` normalisée ; préserver ces statuts GitHub Projects indépendamment des spécialisations métier et les maintenir distincts de `state` ;
- conformément à D-164, conserver et propager `parentIssueId?` et `subIssueIds` pour toutes les Issues ;
- conformément à D-165, conserver et propager `linkedPullRequestIds: string[]` pour toutes les Issues ;
- conformément à D-166, conserver l’Iteration GitHub Projects lorsqu’elle existe, avec un contrat détaillé aligné sur le modèle Projects ;
- conformément à D-167, conserver la valeur `Velocity` lorsqu’elle existe, sans la réserver à une spécialisation métier ;
- conformément à D-168, conserver la valeur `Scheduling` lorsqu’elle existe, sans la réserver à une spécialisation métier ;
- conformément à D-169, dériver et conserver `componentIds: string[]` depuis les labels de Component reconnus, sans supprimer les labels source ;
- conformément à D-170, conserver les criticités reconnues au niveau de l’Issue et réserver les contraintes RGAA aux spécialisations concernées ;
- conformément à D-171, conserver les catégories Accessibility reconnues au niveau de l’Issue sans figer prématurément leur vocabulaire ;
- conformément à D-172, structurer les données GitHub Projects par Project d’origine et interdire leur fusion implicite entre Projects ;
- conformément à D-173, conserver les valeurs Project brutes non reconnues, ne pas produire de canonique artificiel et émettre une Data Quality non bloquante dont le numéro sera attribué en I5 ;
- conformément à D-174, conserver `projectId` et `projectName` dans chaque contexte GitHub Project d’une Issue ;
- conformément à D-175, séparer la valeur brute du statut Project de sa notion canonique optionnelle ;
- conformément à D-176, recalculer la notion canonique du statut Project à chaque exécution depuis la valeur brute et la configuration courante ;
- conformément à D-177, reconnaître les variantes de statut Project par égalité stricte sur la valeur complète après `trim`, sans distinction de casse et sans matching par sous-chaîne ;
- conformément à D-178, ne choisir aucun statut canonique en cas d’ambiguïté, conserver le brut, exposer les candidats et produire une Data Quality non bloquante dont le numéro sera attribué en I5 ;
- conformément à D-179, conserver pour chaque Iteration son identifiant, son titre, sa date de début et sa durée/date de fin lorsqu’ils sont fournis par GitHub ;
- conformément à D-180, porter l’Iteration dans le contexte du Project qui l’attribue et ne pas la fusionner au niveau global de l’Issue ;
- conformément à D-181, conserver séparément la valeur brute de `Velocity` et sa valeur numérique normalisée optionnelle ;
- conformément à D-182, conserver une `Velocity` invalide sans valeur numérique et produire une Data Quality non bloquante dont le numéro sera attribué en I5 ;
- conformément à D-183, conserver systématiquement la valeur brute de `Scheduling` dans son contexte Project et séparer toute interprétation future ;
- conformément à D-184, collecter et conserver l’historique des changements de statut dans chaque contexte GitHub Project ;
- conformément à D-185, conserver pour chaque transition le Project, le statut brut précédent lorsqu’il est disponible, le nouveau statut brut et la date/heure ;
- conformément à D-186, appliquer aux statuts historiques les mêmes règles de canonicalisation que pour le statut courant en conservant les valeurs brutes ;
- conformément à D-187, conserver toutes les transitions disponibles, y compris les passages multiples à `Done` et les sorties de `Done` ;
- conformément à D-188, ne jamais inventer une date métier lorsque l’historique est insuffisant et produire une Data Quality non bloquante dont le numéro sera attribué en I5 ;
- conformément à D-189, D-190 et D-191, modéliser `Audit`, `Anomaly` et `AuditImprovement` comme spécialisations référencées de `Issue` via `issueId`, sans duplication des faits GitHub communs ;
- conformément à D-192, définir des identifiants métier stables et déterministes `auditId`, `anomalyId` et `auditImprovementId`, distincts de `issueId` ;
- conformément à D-193, porter `auditId` uniquement lorsque la relation d’une anomalie d’Audit est valide et distinguer ce cas d’une anomalie `HORS_AUDIT` ;
- conformément à D-194, exiger un Audit parent valide pour matérialiser une `AuditImprovement` ;
- conformément à D-195, porter explicitement l’unique `componentId` sur `Audit` ;
- conformément à D-196, porter explicitement le `componentId` sur une anomalie d’Audit lorsque la relation est valide ;
- conformément à D-197, conserver les faits source et produire une Data Quality non bloquante en cas de divergence de Component entre Audit et anomalie ;
- conformément à D-198, matérialiser toute Issue `Bug` en `Anomaly` même si son parent Audit attendu est absent ou invalide, sans créer d’`auditId` artificiel et avec une Data Quality non bloquante ;
- conformément à D-199, définir `versionId` comme identifiant métier stable distinct des objets GitHub techniques ;
- conformément à D-200, utiliser le numéro PROD `M.m.r` comme numéro canonique de Version et conserver toute RC séparément ;
- conformément à D-201, considérer une Version publiée uniquement si son Git tag PROD exact existe ;
- conformément à D-202, dériver `Version.releasedAt` exclusivement de la date du Git tag PROD, sans fallback implicite ;
- conformément à D-203, conserver une Version identifiable sans tag PROD avec `releasedAt` absent et produire une Data Quality non bloquante ;
- conformément à D-204, référencer la Milestone PROD via `milestoneId` lorsqu’elle existe ;
- conformément à D-205, conserver séparément la RC réellement auditée et la Version PROD cible pour un Audit pré-PROD ;
- conformément à D-206, conserver la référence du Git tag RC et sa date lorsqu’ils existent ;
- conformément à D-207, ne jamais inventer une RC manquante et produire une Data Quality non bloquante dont le numéro sera attribué en I5 ;
- conformément à D-208, rattacher un Audit de rattrapage directement à la Version PROD sans RC artificielle ;
- conformément à D-209, catalogue historique propre à chaque Version PROD;
- conformément à D-210, catalogue historique lu dans le Git tree du tag PROD;
- conformément à D-211, catalogue indéterminable lorsqu’un tag PROD manque;
- conformément à D-212, catalogue absent ou illisible au tag PROD;
- conformément à D-213, conservation historique d’un Component supprimé;
- conformément à D-214, absence historique d’un Component ajouté ultérieurement;
- conformément à D-215, identifiant métier stable de Component;
- conformément à D-216, identité d’un Component conservée entre Versions continues;
- conformément à D-217, renommage explicite d’un Component;
- conformément à D-218, nouvelle identité après disparition puis réapparition;
- conformément à D-219, matérialisation de la relation Component × Version;
- conformément à D-220, couverture fondée sur au moins un Audit terminé applicable;
- conformément à D-221, audit incomplet insuffisant pour la couverture;
- conformément à D-222, verdict courant agrégé sur l’ensemble des Audits terminés applicables;
- conformément à D-223, un Audit incomplet ne modifie pas le verdict acquis;
- conformément à D-224, conformité conditionnée à l’absence d’anomalie d’Audit ouverte pertinente;
- conformément à D-225, auditImprovement sans effet sur le verdict de conformité;
- conformément à D-226, correction d’une anomalie insuffisante pour rétablir la conformité;
- conformément à D-227, anomalie HORS_AUDIT sans effet direct sur la conformité d’Audit;
- conformément à D-228, état NON_COUVERT en absence d’Audit terminé applicable;







- conformément à D-151, recalculer la notion canonique à chaque pipeline depuis la valeur brute et la configuration courante ; une évolution des mots-clés doit pouvoir reclassifier une Issue existante et recalculer les objets métier dérivés ;
- conformément à D-152, si plusieurs notions canoniques correspondent, laisser `issueType` absent, n’appliquer aucune priorité implicite et produire une réserve Data Quality contenant la valeur brute, les candidats et le lien vers l’Issue ;
- conformément à D-153, traiter les entrées de `github.issueTypes.keywords` comme des variantes complètes explicitement autorisées, sans recherche implicite par sous-chaîne ;
- conformément à D-154, comparer les variantes sur la valeur complète après `trim`, sans tenir compte de la casse, sans recherche partielle et sans modifier `rawIssueType` ;
- cette situation ne bloque pas le pipeline et doit produire une réserve Data Quality « issueType à déclarer » ;
- cette réserve doit contenir au minimum la valeur brute non reconnue et un lien vers l’Issue GitHub concernée ;
- la liste définitive des notions canoniques reste à instruire.

#### Anomaly

Faire de l’Anomalie une entité autonome de l’Audit.

Cible conceptuelle :

```ts
type AnomalyOrigin = 'AUDIT' | 'HORS_AUDIT';

interface Anomaly {
  anomalyId: string;
  libraryId: string;
  componentIds: string[];
  origin: AnomalyOrigin;
  auditId?: string;
  detectedAt: string;
  correctedAt?: string;
  // ...
}
```

Règles :

- toute Issue de type `🐛 Bug` produit une Anomalie ;
- `auditId` est obligatoire uniquement lorsque `origin === 'AUDIT'` ;
- `detectedAt` correspond à `issue.createdAt` ;
- `correctedAt` représente la date de passage à `Done` ;
- aucune sous-origine de `HORS_AUDIT` n’est ajoutée en V1.

#### Audit

Remplacer le statut synthétique actuel par les faits nécessaires au métier.

Cible conceptuelle :

```ts
type AuditVerdict = 'CONFORM' | 'NON_CONFORM' | 'UNKNOWN';
type AuditTiming = 'PRE_PROD' | 'CATCH_UP' | 'UNKNOWN';

interface Audit {
  auditId: string;
  libraryId: string;
  componentId: string;
  sourceIssueId: string;
  targetVersion: string;
  auditedReleaseCandidate?: string;
  completedAt?: string;
  realized: boolean;
  verdict: AuditVerdict;
  timing: AuditTiming;
  // ...
}
```

Le modèle ne doit plus dépendre de `auditStatus` ou `auditResult` comme vérité métier.

#### Version

Introduire un objet métier Version.

Cible conceptuelle minimale :

```ts
interface Version {
  versionId: string;
  libraryId: string;
  number: string;
  tag: string;
  releasedAt?: string;
  // ...
}
```

`releasedAt` peut rester facultatif dans le contrat afin de représenter une donnée indisponible et laisser la couche DQ qualifier l’incomplétude.

#### NormalizedData

Ajouter les Issues et les Versions :

```ts
interface NormalizedData {
  libraries: Library[];
  components: Component[];
  issues: Issue[];
  versions: Version[];
  audits: Audit[];
  anomalies: Anomaly[];
  pullRequests: PullRequest[];
}
```

### 6.5 Tests à écrire ou adapter

Dans `tests/domain-contract.test.ts` ou `tests/pipeline.test.ts` :

1. toute Issue GitHub collectée est représentable dans `NormalizedData.issues` ;
2. une Issue sans objet métier spécialisé reste présente dans le modèle normalisé ;
3. une Issue ayant produit un objet spécialisé reste également présente et la relation est traçable ;
4. un Bug sans parent Audit est représentable comme `HORS_AUDIT` ;
5. un Bug d’Audit peut porter un `auditId` ;
6. une Anomalie peut porter zéro, un ou plusieurs `componentIds` selon le contexte général ;
7. un Audit exige exactement un `componentId` ;
8. `detectedAt` et `correctedAt` sont distincts ;
9. une Version peut exister avec un `releasedAt` inconnu ;
10. `NormalizedData` contient une collection `versions`.

Adapter les tests qui construisent directement `Issue`, `Anomaly`, `Audit`, `Library`, `NormalizedData` ou `Snapshot`.

### 6.6 Critères d’acceptation

- Le modèle TypeScript conserve toutes les Issues GitHub collectées dans `NormalizedData.issues`.
- La spécialisation d'une Issue en Audit, Anomaly ou Improvement d'Audit ne supprime pas l'Issue normalisée source.
- Le modèle TypeScript permet de représenter un Bug hors Audit sans valeur factice d’`auditId`.
- Le modèle permet de représenter une Issue multi-Component.
- Un Audit ne peut pas être représenté avec plusieurs Components dans son contrat métier.
- Les anciens champs `firstDoneAt`, `objectiveAuditResult`, `auditStatus` et `auditResult` ne sont plus nécessaires comme vérité métier normalisée.
- `NormalizedData` expose les Versions.
- Les tests de contrat passent sans dépendre d’un appel GitHub réel.
- Aucun KPI n’est encore réécrit dans ce lot sauf adaptation minimale nécessaire à la compilation.

### 6.7 Dépendances

Bloque I2, I3 et I4.

### 6.8 Résultat attendu

Un contrat de domaine capable de porter la V1, même si certains champs restent temporairement `undefined` tant que I2 n’a pas enrichi la collecte.

---

## 7. Lot I2 — Collecte GitHub enrichie

### 7.1 Objectif

Collecter les faits GitHub nécessaires au modèle V1 sans appliquer de règle métier dans le collecteur.

Le collecteur doit restituer des faits ; le normalizer doit les interpréter.

### 7.2 Prérequis

I1 terminé.

### 7.3 Fichiers concernés

#### Modifier

- `src/collectors/github.ts`
- `src/domain/types.ts`
- `src/config.ts`
- `config/system.yaml`
- `.env.example` si une nouvelle configuration d’API est nécessaire
- `tests/github-collector.test.ts`
- `fixtures/github.json`
- `src/anonymization/anonymizer.ts`
- `src/anonymization/types.ts`
- `src/anonymization/validator.ts`
- `tests/anonymization.test.ts`

#### Créer

Recommandé si la collecte devient trop volumineuse dans `github.ts` :

- `src/collectors/github-projects.ts`
- `src/collectors/github-tags.ts`

Ces fichiers ne doivent être créés que si cette séparation réduit clairement la complexité du collecteur principal.

### 7.4 Modifications attendues

#### Components

Collecter tous les labels correspondant au préfixe Component au lieu du premier seulement.

Le RAW doit conserver la pluralité sans décider si elle est métierement valide pour le type d’Issue concerné.

#### Relations parent / sub-Issue

Collecter les relations GitHub permettant d’identifier le ou les parents d’une Issue.

Le résultat doit alimenter `RawIssue.parents`.

Le collecteur ne doit pas décider qu’un parent est un Audit : il doit seulement conserver la relation et l’identifiant source.

#### Champs GitHub Project

Remplacer la collecte spécialisée du seul champ `Status` par une représentation plus générique des valeurs de champs nécessaires.

Au minimum, la V1 doit pouvoir obtenir :

- le `Status` courant ;
- le champ explicite contenant la RC auditée.

Le nom technique du champ RC doit être configurable et ne doit pas être codé en dur dans le collecteur.

#### Historique de passage à Done

Collecter la donnée permettant d’identifier la date de transition vers le statut `Done`.

Cette donnée alimentera ultérieurement :

- `Anomaly.correctedAt` ;
- `Audit.completedAt`.

La source exacte doit être validée contre l’API GitHub disponible. Si l’API ne permet pas d’obtenir directement cet historique, le lot doit documenter le mécanisme retenu et ses limites au lieu d’inventer un timestamp.

#### Tags et Release

Collecter les informations nécessaires à l’identification des tags `M.m.r`.

Le RAW doit pouvoir porter au minimum :

- le nom du tag ;
- le commit/ref associé ;
- la date permettant d’établir `releasedAt` selon D-144.

Le traitement des tags légers et annotés doit être explicite et couvert par tests.

### 7.5 Tests à écrire ou adapter

Dans `tests/github-collector.test.ts` :

1. collecte de plusieurs labels Component sur une même Issue ;
2. collecte d’un parent/sub-Issue ;
3. collecte du Status courant ;
4. collecte du champ RC auditée ;
5. collecte de la date de transition vers `Done` lorsque la source GitHub la fournit ;
6. absence de transition `Done` représentée sans date inventée ;
7. collecte d’un tag de Version ;
8. comportement documenté pour tag léger ;
9. comportement documenté pour tag annoté ;
10. pagination des nouvelles connexions GraphQL si nécessaire ;
11. gestion du rate limit sans fabrication de données.

Dans `tests/anonymization.test.ts` :

- les nouvelles relations restent cohérentes après anonymisation ;
- les dates sont décalées de manière cohérente ;
- les noms libres des champs Project ne fuient pas si leur anonymisation est nécessaire ;
- les références de tags/commits restent structurellement exploitables.

### 7.6 Critères d’acceptation

- `RawIssue` contient tous les Components collectés.
- `RawIssue.parents` n’est plus systématiquement vide lorsque GitHub expose une relation.
- Le RAW porte le Status et la RC auditée sans logique métier.
- La date de passage à `Done` est collectée lorsqu’elle est disponible ; sinon l’absence est explicite.
- Les tags nécessaires aux Versions sont présents dans le RAW.
- Le collecteur n’infère ni `AUDIT`/`HORS_AUDIT`, ni `PRE_PROD`/`CATCH_UP`, ni le verdict.
- Les fixtures et l’anonymisation préservent les nouveaux faits.
- Les tests du collecteur ne nécessitent pas l’accès au GitHub réel.

### 7.7 Dépendances

Bloque I3 et fournit une partie des données nécessaires à I4.

### 7.8 Résultat attendu

Un `RawDataset` suffisamment riche pour construire le modèle métier V1 sans heuristique temporelle ou relationnelle cachée.

---

## 8. Lot I3 — Normalisation Audit / Anomalie / Version

### 8.1 Objectif

Transformer les faits RAW de I2 en objets métier conformes aux décisions D-137 à D-144.

### 8.2 Prérequis

I1 et I2 terminés.

### 8.3 Fichiers concernés

#### Modifier

- `src/normalizers/github.ts`
- `src/domain/types.ts`
- `src/config.ts`
- `tests/pipeline.test.ts`
- `fixtures/github.json`

#### Créer

Recommandé pour isoler les règles de résolution :

- `src/normalizers/anomalies.ts`
- `src/normalizers/audits.ts`
- `src/normalizers/versions.ts`
- `tests/anomaly-normalizer.test.ts`
- `tests/audit-normalizer.test.ts`
- `tests/version-normalizer.test.ts`

### 8.4 Modifications attendues

#### Normalisation des Anomalies

Pour chaque Issue de type Bug :

```text
Issue Type = BUG
        ↓
Anomalie
        ↓
parent Audit valide ?
├── oui → origin = AUDIT
└── non → origin = HORS_AUDIT
```

Règles :

- `detectedAt = issue.createdAt` ;
- `correctedAt = date de passage à Done` si connue ;
- aucune origine V1 plus fine que `AUDIT` / `HORS_AUDIT` ;
- `componentIds` provient de tous les labels Component collectés ;
- une Anomalie Audit doit être rattachée à son Audit réel, pas à un Audit synthétique.

#### Normalisation des Audits

Créer un Audit uniquement à partir d’une Issue identifiée comme Audit.

Un Audit doit :

- avoir exactement un Component ;
- référencer l’Issue Audit source ;
- prendre sa Version cible depuis la Milestone ;
- prendre sa RC auditée depuis le champ Project explicite ;
- être `realized = true` uniquement si l’Issue est à la fois `Done` et `Closed` ;
- utiliser la date de passage à `Done` comme `completedAt`.

Ne plus créer un Audit pour chaque Issue.

#### Verdict

Le verdict d’un Audit réalisé est calculé à partir de ses Anomalies d’Audit.

La normalisation doit respecter les décisions métier consolidées et ne pas utiliser `objectiveAuditResult` comme entrée source.

Les Improvements d’Audit ne doivent pas dégrader la conformité.

#### Version

Construire les objets Version à partir des références `M.m.r` disponibles.

La Milestone sert à rattacher l’Audit à sa Version cible.

Le tag sert de référence de Version PROD et fournit `releasedAt` lorsque cette donnée est disponible.

#### Timing de l’Audit

Déduire :

```text
completedAt <= releasedAt
→ PRE_PROD

completedAt > releasedAt
→ CATCH_UP

timestamp manquant
→ UNKNOWN
```

Cette comparaison ne doit pas modifier rétroactivement l’état connu à la Release.

### 8.5 Tests à écrire

#### `tests/anomaly-normalizer.test.ts`

- Bug sans parent Audit → `HORS_AUDIT` ;
- Bug sub-Issue d’un Audit → `AUDIT` ;
- un Bug reste une seule Anomalie même avec plusieurs Components ;
- `detectedAt` reprend exactement `createdAt` ;
- `correctedAt` reprend exactement la transition `Done` ;
- aucune sous-origine hors Audit n’est inférée.

#### `tests/audit-normalizer.test.ts`

- une Issue non Audit ne crée aucun Audit ;
- une Issue Audit avec exactement un Component crée un Audit ;
- Milestone `1.8.0` → `targetVersion = 1.8.0` ;
- champ RC `1.8.0-rc.3` → `auditedReleaseCandidate = 1.8.0-rc.3` ;
- `Done + Closed` → Audit réalisé ;
- `Done + Open` → Audit non réalisé et future réserve DQ ;
- `Closed + non-Done` → Audit non réalisé et future réserve DQ ;
- Audit réalisé sans Anomalie → conforme ;
- Audit réalisé avec au moins une Anomalie → non conforme ;
- Improvement seul → ne rend pas l’Audit non conforme.

#### `tests/version-normalizer.test.ts`

- tag `1.8.0` → Version `1.8.0` ;
- `releasedAt` reprend la date du tag selon le contrat RAW ;
- Audit terminé avant ou à `releasedAt` → `PRE_PROD` ;
- Audit terminé après `releasedAt` → `CATCH_UP` ;
- date insuffisante → `UNKNOWN`.

### 8.6 Critères d’acceptation

- Aucun Audit synthétique n’est créé pour une Issue non Audit.
- Toute Issue Bug devient exactement une Anomalie.
- Une Anomalie hors Audit n’a pas d’`auditId` factice.
- Une Anomalie Audit référence son véritable parent Audit.
- La Version cible d’un Audit ne dépend plus de `config.auditVersion`.
- Le verdict ne dépend plus de `auditResult`.
- `completedAt`, `detectedAt`, `correctedAt` et `releasedAt` ont chacun une sémantique unique.
- Les scénarios pré-PROD et catch-up sont distingués.

### 8.7 Dépendances

Bloque I5 et I6.

### 8.8 Résultat attendu

Un `NormalizedData` conforme au modèle métier V1 pour Anomaly, Audit et Version.

---

## 9. Lot I4 — Catalogue historique par Version

### 9.1 Objectif

Reconstruire le Catalogue applicable à une Version PROD `M.m.r` à partir du contenu du repository au Git tag `M.m.r`, conformément à D-143.

### 9.2 Prérequis

I1 terminé.

La collecte des tags de I2 doit être disponible pour les exécutions GitHub.

### 9.3 Fichiers concernés

#### Modifier

- `src/catalogue.ts`
- `src/pipeline.ts`
- `src/domain/types.ts`
- `src/lib/paths.ts` si un cache local est introduit
- `tests/pipeline.test.ts`
- tests actuels du Catalogue

#### Créer

Recommandé :

- `src/catalogue-history.ts`
- `tests/catalogue-history.test.ts`

Éventuellement, si un cache est retenu :

- `src/lib/cache.ts`

### 9.4 Modifications attendues

Introduire une API explicite, par exemple conceptuellement :

```ts
loadCatalogueAtVersion(repository, version)
```

ou :

```ts
loadCatalogueAtRef(repository, tag)
```

Cette API doit :

1. identifier le tag `M.m.r` ;
2. lire le fichier Catalogue dans l’état du repository correspondant à ce tag ;
3. valider le contenu avec les mêmes règles structurelles que le Catalogue courant ;
4. associer ce Catalogue à la Version ;
5. conserver une provenance permettant d’identifier le repository, le tag/ref et l’instant de collecte.

Le pipeline ne doit pas utiliser le Catalogue courant comme substitut silencieux lorsqu’un Catalogue historique est demandé.

En cas d’impossibilité de reconstruction, la donnée doit être marquée indisponible et la couche DQ doit pouvoir l’expliquer.

### 9.5 Tests à écrire

Dans `tests/catalogue-history.test.ts` :

1. charge le Catalogue correspondant au tag demandé ;
2. deux tags différents peuvent produire deux Catalogues différents ;
3. un Component ajouté après `1.7.0` n’apparaît pas dans le Catalogue historique `1.7.0` ;
4. un Component retiré après `1.7.0` reste présent dans l’historique `1.7.0` ;
5. tag absent → résultat explicite, pas de fallback silencieux ;
6. fichier Catalogue absent au tag → résultat explicite ;
7. Catalogue invalide au tag → erreur ou réserve DQ selon le contrat retenu ;
8. la validation structurelle reste identique à celle du Catalogue courant.

### 9.6 Critères d’acceptation

- Le dénominateur historique peut être obtenu indépendamment du Catalogue courant.
- Une ancienne Version n’est pas affectée par l’ajout ultérieur d’un Component.
- Le pipeline connaît la provenance du Catalogue historique.
- Aucun fallback vers le Catalogue courant n’est effectué sans signalement.
- Le mécanisme est testable avec fixture/mock sans dépendre du réseau.

### 9.7 Dépendances

Bloque le calcul correct de la couverture historique dans I6.

### 9.8 Résultat attendu

Chaque Version analysée peut être associée à son Catalogue historique ou à un état explicite d’indisponibilité.

---

## 10. Lot I5 — Data Quality V1

### 10.1 Objectif

Réaligner les règles DQ sur le modèle métier V1 et supprimer les hypothèses legacy devenues contradictoires.

### 10.2 Prérequis

I3 et I4 terminés.

### 10.3 Fichiers concernés

#### Modifier

- `src/quality/rules.ts`
- `src/lib/metric-impacts.ts`
- `config/quality-rules.yaml`
- `tests/pipeline.test.ts`
- `tests/metric-catalog.test.ts`
- documentation DQ consolidée

#### Créer

Recommandé :

- `tests/quality-rules.test.ts`

Les identifiants des nouvelles règles ne doivent être attribués qu’après vérification du registre DQ canonique afin d’éviter toute collision ou renumérotation implicite.

### 10.4 Modifications attendues

#### Règles à réaligner

| Règle actuelle | Cible V1                                                                             |
|:---------------|:-------------------------------------------------------------------------------------|
| DQ-001/DQ-002  | Criticité RGAA contrôlée uniquement pour une Anomalie issue d’un Audit Accessibilité |
| DQ-003         | Une Anomalie d’Audit doit avoir exactement un parent Audit                           |
| DQ-004/DQ-005  | Cohérence `Done` / `Closed` / merge PR selon le profil applicable                    |
| DQ-006         | Impact métrique ciblé, pas de dégradation globale `portfolio.*`                      |
| DQ-008/DQ-010  | Ne pas figer une politique `Cancelled` tant que Q-022 reste ouverte                  |
| DQ-009         | Réaligner sur le nouveau modèle Version/Release si la règle reste pertinente         |

#### Contrôles supplémentaires nécessaires

- Audit avec exactement un Component ;
- Anomalie Audit avec exactement un parent Audit ;
- cohérence du Component entre Audit et Anomalie Audit ;
- Audit pré-PROD sans RC auditée ;
- RC auditée incompatible avec la Version cible ;
- Audit `Done` non `Closed` ;
- Audit `Closed` non `Done` ;
- Anomalie `Done` incohérente avec `Closed` ou la PR selon le profil applicable ;
- tag PROD absent ;
- Catalogue historique indisponible ;
- Issue Type observé mais non reconnu par `github.issueTypes.keywords` : produire « issueType à déclarer » avec la valeur brute et le lien vers l’Issue concernée, sans bloquer le pipeline.

### 10.5 Tests à écrire

Dans `tests/quality-rules.test.ts` :

- chaque règle possède au moins un cas positif et un cas négatif ;
- une Anomalie hors Audit sans criticité RGAA ne déclenche pas DQ-001 ;
- une Anomalie Audit Accessibilité sans criticité déclenche la règle attendue ;
- un Audit avec zéro ou plusieurs Components est signalé ;
- un Audit pré-PROD sans RC est signalé ;
- une incohérence Done/Closed est signalée ;
- un Issue Type non déclaré conserve sa valeur brute et produit une réserve « issueType à déclarer » contenant la valeur et le lien vers l’Issue source ;
- un tag manquant affecte uniquement les métriques qui dépendent de la Version historique ;
- un Catalogue historique manquant ne transforme pas le dénominateur en zéro ;
- les données restent dans le snapshot même lorsqu’elles sont exclues d’une métrique.

### 10.6 Critères d’acceptation

- Les règles DQ ne généralisent plus les contraintes RGAA aux Bugs hors Audit.
- Les impacts sont métrique-spécifiques.
- `unknown` est utilisé lorsque la donnée nécessaire au calcul n’est pas fiable ou disponible.
- Une réserve DQ n’efface pas silencieusement l’entité source.
- Les règles liées à Q-020, Q-021 ou Q-022 restent explicitement limitées tant que ces questions ne sont pas tranchées.

### 10.7 Dépendances

Bloque la fiabilité finale des métriques I6.

### 10.8 Résultat attendu

Une couche DQ alignée sur le métier, capable d’expliquer pourquoi une métrique est fiable, partielle ou inconnue.

---

## 11. Lot I6 — Analytics V1

### 11.1 Objectif

Recalculer les indicateurs V1 à partir du modèle métier normalisé et des Catalogues historiques, sans logique GitHub dans le moteur Analytics.

### 11.2 Prérequis

I3, I4 et I5 terminés.

### 11.3 Fichiers concernés

#### Modifier

- `src/analytics/catalog.ts`
- `src/analytics/metrics.ts`
- `src/analytics/kpis.ts`
- `src/analytics/flows.ts`
- `src/lib/metric-impacts.ts`
- `tests/analytics-v2-fixture.test.ts`
- `tests/metric-catalog.test.ts`
- `tests/flow-contract.test.ts`

#### Créer

Recommandé :

- `tests/analytics-anomalies.test.ts`
- `tests/analytics-audits.test.ts`
- `tests/analytics-versions.test.ts`

### 11.4 Modifications attendues

#### Délais d’Anomalie

Remplacer :

```text
firstDoneAt - createdAt
```

par :

```text
correctedAt - detectedAt
```

Les métriques moyenne, médiane et p90 utilisent exactement la même population de référence documentée.

#### Origine des Anomalies

Ajouter les métriques ou breakdowns permettant au minimum de distinguer :

- `AUDIT` ;
- `HORS_AUDIT`.

Ne pas ajouter de sous-origine V2.

#### Couverture d’Audit

Calculer par Version :

```text
nombre de Components du Catalogue historique
disposant d'un Audit applicable
/
nombre de Components du Catalogue historique
```

Une absence de Catalogue historique fiable doit produire `unknown`, pas `0 %`.

#### Conformité

Calculer sur les Components couverts :

```text
Components conformes
/
Components couverts
```

Un Component non audité n’est pas implicitement non conforme.

#### Verdict applicable

Pour un couple `Component × Version`, calculer le verdict courant à partir de l’ensemble des Audits terminés applicables conformément à D-222.

Un Audit incomplet ne contribue pas à ce verdict et ne modifie pas le verdict acquis. La correction ou fermeture d’une anomalie ne rétablit pas à elle seule la conformité : un nouvel Audit terminé applicable doit valider la conformité conformément à D-226.

#### Multi-Component

Une Anomalie GitHub reste comptée une seule fois globalement.

Dans une ventilation par Component, elle peut contribuer une fois à chacun de ses Components.

La somme des ventilations par Component peut donc être supérieure au total global ; ce comportement doit être documenté et testé.

### 11.5 Tests à écrire

#### Anomalies

- délai exact entre `detectedAt` et `correctedAt` ;
- Anomalie non corrigée exclue des métriques de délai ;
- une Anomalie multi-Component compte une fois globalement ;
- la même Anomalie apparaît une fois dans chaque ventilation Component ;
- breakdown `AUDIT` / `HORS_AUDIT`.

#### Audits et Versions

- couverture avec Catalogue historique de 10 Components et 7 couverts → 70 % ;
- Component ajouté après la Version → absent du dénominateur historique ;
- 7 couverts dont 5 conformes → conformité 5/7, pas 5/10 ;
- Component non audité → hors dénominateur de conformité ;
- ensemble des Audits terminés applicables pris en compte dans le verdict ;
- Audit incomplet plus récent ignoré pour le verdict acquis ;
- Catalogue historique indisponible → métrique `unknown`.

#### Contrat de métriques

- chaque métrique produite existe dans `METRIC_CONTRACTS` ;
- aucune métrique legacy non documentée n’est créée silencieusement ;
- les définitions décrivent la population réelle.

### 11.6 Critères d’acceptation

- Aucun calcul Analytics ne lit directement la forme RAW GitHub.
- Les délais utilisent exclusivement `detectedAt` et `correctedAt`.
- La couverture utilise le Catalogue historique de la Version.
- La conformité utilise uniquement les Components couverts.
- Les Anomalies Audit et hors Audit sont distinguables.
- Les métriques portent leur fiabilité et leurs exclusions.
- Les anciennes projections `KpiValue` sont supprimées ou explicitement maintenues comme compatibilité temporaire documentée.

### 11.7 Dépendances

Bloque I7 et I8.

### 11.8 Résultat attendu

Un catalogue de métriques V1 cohérent avec le modèle métier consolidé et indépendant des détails de GitHub.

---

## 12. Lot I7 — Snapshots et historique

### 12.1 Objectif

Faire coexister correctement :

- le temps métier ;
- le temps d’observation du pipeline ;
- l’état connu au moment d’une Release ;
- la connaissance actuelle d’une ancienne Version.

### 12.2 Prérequis

I3, I4 et I6 terminés.

### 12.3 Fichiers concernés

#### Modifier

- `src/snapshots/snapshot.ts`
- `src/snapshots/diff.ts`
- `src/analytics/flows.ts`
- `src/domain/types.ts`
- `src/pipeline.ts`
- `tests/snapshot.test.ts`
- `tests/snapshot-diff.test.ts`
- `tests/flow-contract.test.ts`

#### Créer

Recommandé :

- `tests/historical-state.test.ts`

### 12.4 Modifications attendues

Conserver :

```text
Snapshot.capturedAt = instant d'observation du pipeline
```

Ne jamais utiliser `capturedAt` comme substitut générique de :

- `detectedAt` ;
- `correctedAt` ;
- `completedAt` ;
- `releasedAt`.

Construire une projection permettant de répondre à deux questions différentes :

```text
État à la Release
= informations connues à releasedAt
```

et :

```text
Connaissance actuelle de la Version
= informations connues aujourd'hui,
y compris celles apparues après releasedAt
```

Un Audit de rattrapage réalisé après `releasedAt` doit enrichir la connaissance actuelle de la Version sans être projeté dans son état à la Release.

Les diffs de snapshots restent des différences entre observations et ne deviennent pas une source de dates métier lorsque celles-ci sont disponibles.

### 12.5 Tests à écrire

Dans `tests/historical-state.test.ts` :

1. Audit terminé avant Release visible dans l’état à la Release ;
2. Audit de rattrapage terminé après Release absent de l’état à la Release ;
3. le même Audit de rattrapage visible dans la connaissance actuelle ;
4. Anomalie détectée après Release non projetée rétroactivement ;
5. `capturedAt` postérieur à tous les événements ne modifie pas leurs dates métier.

Dans `tests/snapshot-diff.test.ts` :

- les flows restent basés sur l’intervalle entre snapshots ;
- une date métier exacte n’est pas remplacée par la date du snapshot ;
- les entités ajoutées/supprimées sont interprétées comme changements observés, pas comme événements métier exacts.

### 12.6 Critères d’acceptation

- Les quatre timestamps métier restent distincts de `capturedAt`.
- Une vue historique peut restituer l’état connu à `releasedAt`.
- Un Audit catch-up n’est jamais rétroprojeté.
- Les snapshots restent immuables et comparables selon leurs métadonnées de modèle/règles.
- Les flows ne prétendent pas dater précisément un événement uniquement observé entre deux snapshots.

### 12.7 Dépendances

Bloque les vues historiques complètes du dashboard I8.

### 12.8 Résultat attendu

Un modèle temporel cohérent permettant les analyses historiques sans réécriture du passé.

---

## 13. Lot I8 — Dashboard V1

### 13.1 Objectif

Adapter le dashboard au contrat Analytics V1 et au modèle historique sans introduire de logique métier dans la couche de présentation.

### 13.2 Prérequis

I6 terminé.

I7 est requis pour les vues historiques et « état à la Release ».

### 13.3 Fichiers concernés

#### Modifier

- `src/dashboard/generate.ts`
- `src/dashboard/assets/app.js`
- `src/dashboard/assets/graph.js`
- `src/dashboard/assets/style.css`
- `tests/dashboard.test.ts`

Les fichiers sous `data/dashboard/` sont des sorties générées et ne doivent pas devenir la source à modifier manuellement.

#### Créer

À confirmer selon le découpage retenu pour `generate.ts` :

- `src/dashboard/pages/portfolio.ts`
- `src/dashboard/pages/library.ts`
- `src/dashboard/pages/version.ts`
- `src/dashboard/pages/component.ts`
- `src/dashboard/pages/anomalies.ts`
- `src/dashboard/pages/history.ts`

Cette extraction est recommandée si elle réduit réellement la taille et les responsabilités de `generate.ts`.

### 13.4 Modifications attendues

#### Vue portefeuille

Afficher au minimum :

- bibliothèques analysées ;
- Versions de référence ;
- couverture d’Audit ;
- conformité ;
- Anomalies ouvertes ;
- fiabilité des données.

#### Vue Bibliothèque / Version

Afficher :

- Version sélectionnée ;
- `releasedAt` ;
- taille du Catalogue historique ;
- couverture ;
- conformité ;
- distinction pré-PROD / catch-up lorsque pertinente.

#### Vue Component

Afficher :

- présence dans le Catalogue de la Version ;
- Audit applicable ;
- verdict applicable ;
- origine directe ou héritée si cette notion est déjà disponible dans le modèle ;
- Anomalies associées.

Ne pas fabriquer de verdict lorsqu’aucun Audit applicable n’existe.

#### Vue Anomalies

Permettre au minimum de distinguer :

- Audit ;
- hors Audit ;
- criticité lorsqu’elle est applicable ;
- catégories ;
- statut ;
- délai de correction lorsque disponible ;
- Components concernés.

#### Historique

Afficher clairement la différence entre :

- état à la Release ;
- connaissance actuelle.

#### Accessibilité

Le dashboard doit respecter au minimum les principes suivants :

- structure de titres logique ;
- navigation clavier ;
- focus visible ;
- tableaux avec en-têtes explicites ;
- information non portée uniquement par la couleur ;
- graphiques accompagnés d’une alternative textuelle ou tabulaire ;
- libellés compréhensibles pour les états `unknown`, `partial` et `invalid`.

### 13.5 Tests à écrire ou adapter

Dans `tests/dashboard.test.ts` :

- génération de toutes les pages attendues ;
- absence de recalcul métier dans les templates ;
- affichage de `unknown` comme état inconnu et non comme zéro ;
- absence d’assimilation « non audité = non conforme » ;
- distinction Audit / hors Audit ;
- affichage de `releasedAt` ;
- présence de l’état à la Release et de la connaissance actuelle lorsqu’ils diffèrent ;
- tableaux avec structure sémantique minimale ;
- liens de navigation internes valides.

Des tests HTML ciblés peuvent être ajoutés si le fichier devient trop volumineux.

### 13.6 Critères d’acceptation

- Le dashboard consomme les métriques et projections normalisées sans recalculer les règles métier.
- `unknown` n’est jamais affiché comme `0`.
- Non audité n’est jamais affiché comme non conforme.
- Audit et hors Audit sont visuellement distinguables sans dépendre uniquement d’une couleur.
- Les vues Version utilisent le Catalogue historique approprié.
- Les informations historiques indiquent clairement leur référentiel temporel.
- La navigation principale est utilisable au clavier.
- La hiérarchie des titres HTML est cohérente.

### 13.7 Dépendances

Dernier lot fonctionnel avant la consolidation I9.

### 13.8 Résultat attendu

Un dashboard V1 contemporain, accessible et fidèle au contrat métier sans logique métier dupliquée dans l’UI.

---

## 14. Lot I9 — Fixtures, anonymisation et non-régression

### 14.1 Objectif

Finaliser un jeu de scénarios V1 reproductibles permettant de tester le pipeline complet sans accès au GitHub réel.

Ce lot consolide le travail transverse réalisé pendant I1 à I8.

### 14.2 Prérequis

Les contrats de I1 à I8 doivent être stabilisés.

### 14.3 Fichiers concernés

#### Modifier

- `fixtures/github.json`
- `fixtures/my-real-dataset-anonymized.json`
- `src/anonymization/anonymizer.ts`
- `src/anonymization/config.ts`
- `src/anonymization/mapping.ts`
- `src/anonymization/report.ts`
- `src/anonymization/sanitize.ts`
- `src/anonymization/trace.ts`
- `src/anonymization/types.ts`
- `src/anonymization/validation-report.ts`
- `src/anonymization/validator.ts`
- tests d’anonymisation existants
- `tests/analytics-v2-fixture.test.ts`
- `tests/pipeline.test.ts`

#### Créer

Recommandé :

- `fixtures/v1-reference.json`
- configuration et Catalogue associés à cette fixture ;
- `tests/v1-reference-scenario.test.ts`

### 14.4 Scénarios minimaux de la fixture V1

La fixture de référence doit couvrir au minimum :

1. plusieurs repositories ;
2. un Component présent dans le Catalogue sans Issue ;
3. une Issue transverse sans Component ;
4. une Issue multi-Component ;
5. un Bug hors Audit ;
6. un Audit pré-PROD conforme ;
7. un Audit pré-PROD non conforme avec Anomalies ;
8. une RC auditée explicite ;
9. un Audit de rattrapage post-PROD ;
10. un Audit incomplet plus récent qu’un Audit terminé ;
11. une Anomalie corrigée avec date `Done` ;
12. une Anomalie encore ouverte ;
13. une incohérence DQ Done/Closed ;
14. un cas de criticité RGAA manquante sur Anomalie Audit Accessibilité ;
15. au moins deux Versions avec Catalogues historiques différents ;
16. un Component ajouté entre deux Versions ;
17. un tag ou Catalogue historique manquant pour vérifier `unknown` ;
18. une PR mergée reliée à une Anomalie ;
19. un cas permettant de vérifier état à la Release vs connaissance actuelle.

### 14.5 Tests à écrire

Dans `tests/v1-reference-scenario.test.ts` :

- exécuter le pipeline complet sur la fixture V1 ;
- vérifier les cardinalités principales du modèle normalisé ;
- vérifier les métriques de couverture et conformité avec des valeurs attendues ;
- vérifier les délais de correction ;
- vérifier les origines Audit / hors Audit ;
- vérifier les réserves DQ attendues ;
- vérifier les projections historiques ;
- vérifier la génération du dashboard.

Dans les tests d’anonymisation :

- préserver toutes les relations nécessaires au scénario ;
- conserver les propriétés temporelles relatives ;
- empêcher la fuite de noms de repositories, Components, personnes ou URLs réelles selon la politique d’anonymisation ;
- produire un rapport de validation sans incohérence structurelle.

### 14.6 Critères d’acceptation

- Le pipeline V1 complet s’exécute sur une fixture locale.
- Les valeurs attendues des KPI structurants sont assertées, pas seulement leur présence.
- Les scénarios pré-PROD, catch-up et hors Audit sont couverts.
- Au moins un scénario historique démontre qu’un changement de Catalogue ne réécrit pas une ancienne Version.
- L’anonymisation conserve les relations et la sémantique analytique.
- La fixture de référence peut être utilisée dans la CI.
- Aucun test V1 critique ne dépend d’un accès réseau.

### 14.7 Résultat attendu

Une suite de non-régression V1 suffisamment représentative pour faire évoluer ensuite le produit sans dépendre des données réelles.

---

## 15. Questions ouvertes et points de décision pendant l’implémentation

Les points suivants ne doivent pas être tranchés implicitement par le code.

| Question                                                 | Lot consommateur | Règle de conduite                                                                                |
|:---------------------------------------------------------|:-----------------|:-------------------------------------------------------------------------------------------------|
| Q-020 — profils exacts de workflow                       | I5, I8           | Limiter les contrôles aux invariants déjà établis tant que la question reste ouverte             |
| Q-021 — exceptions à la PR obligatoire                   | I5               | Ne pas transformer l’absence de PR en erreur universelle                                         |
| Q-022 — règles exactes de `Cancelled`                    | I5, I6           | Ne pas promouvoir DQ-008/DQ-010 en invariants définitifs                                         |
| Q-035 — mécanisme complet de conservation historique     | I7               | Implémenter uniquement ce qui est nécessaire à l’état à la Release et à la connaissance actuelle |
| Q-037/Q-038 — Nexus/Jenkins                              | I3, I5           | Ne pas introduire de dépendance directe tant que leur rôle V1 n’est pas établi                   |
| Q-045/Q-046 — famille d’Audit                            | I1, I3           | Ne pas rendre une famille obligatoire si la V1 n’en a pas besoin                                 |
| Q-068 — disponibilité exacte de l’historique Project     | I2               | Valider l’API avant de figer le mécanisme de `Done`                                              |
| Q-097/Q-098/Q-099 — Version affectée des Bugs hors Audit | I3, I6           | Ne pas inventer de rattachement Version en V1 sans décision métier                               |

## 16. Stratégie de commits recommandée

Chaque lot doit rester suffisamment petit pour être relu.

Exemple de découpage :

```text
I0
chore: establish v1 technical baseline

I1
refactor(domain): align anomaly audit and version contracts

I2
feat(github): collect v1 issue project and tag facts

I3
refactor(normalization): build v1 audit anomaly and version model

I4
feat(catalogue): resolve historical catalogue by version tag

I5
refactor(quality): align data quality rules with v1 domain

I6
refactor(analytics): calculate v1 historical quality metrics

I7
feat(history): distinguish release state from current knowledge

I8
feat(dashboard): expose v1 quality and historical views

I9
test: add v1 reference fixture and regression scenarios
```

Un lot peut nécessiter plusieurs commits si cela améliore la revue. Il est préférable de séparer un changement de contrat, son adaptation technique et ses tests lorsqu’ils restent chacun cohérents et exécutables.

## 17. Ordre de réalisation recommandé

La réalisation peut maintenant commencer dans cet ordre :

1. I0 — obtenir une baseline verte ;
2. I1 — figer les contrats TypeScript V1 ;
3. I2 — enrichir la collecte GitHub ;
4. I3 — reconstruire la normalisation métier ;
5. I4 — introduire le Catalogue historique ;
6. I5 — réaligner la Data Quality ;
7. I6 — recalculer les Analytics ;
8. I7 — consolider snapshots et historique ;
9. I8 — adapter le dashboard ;
10. I9 — finaliser la fixture V1 et la non-régression.

Le premier changement de code métier ne doit donc intervenir qu’après validation de I0.

## 18. Critères de sortie de la V1

La V1 peut être considérée comme implémentée lorsque les conditions suivantes sont toutes satisfaites :

- plusieurs repositories configurables sont analysés dans une même exécution ;
- toute Issue Bug est représentée comme une Anomalie ;
- une Anomalie est qualifiée `AUDIT` ou `HORS_AUDIT` sans sous-origine inventée ;
- une Anomalie Audit est reliée à son véritable parent Audit ;
- un Audit porte exactement un Component ;
- la Milestone détermine la Version cible de l’Audit ;
- la RC auditée est enregistrée explicitement pour les Audits pré-PROD concernés ;
- la date de détection d’une Anomalie correspond à la création de l’Issue ;
- la date de correction correspond au passage à `Done` ;
- la date de réalisation d’un Audit correspond au passage à `Done`, avec réalisation conditionnée par `Done + Closed` ;
- la date de Release correspond à la date du Git tag `M.m.r` selon le mécanisme technique validé ;
- le Catalogue historique d’une Version est reconstruit depuis le repository au tag `M.m.r` ;
- la couverture historique utilise ce Catalogue comme dénominateur ;
- la conformité est calculée uniquement sur les Components couverts ;
- un Audit incomplet ne remplace pas un verdict acquis ;
- un Audit de rattrapage n’est pas projeté rétroactivement dans l’état à la Release ;
- les métriques indiquent leur fiabilité et n’assimilent pas `unknown` à zéro ;
- le dashboard restitue ces informations sans recalculer les règles métier ;
- les scénarios structurants sont couverts par une fixture V1 et des tests automatisés ;
- `typecheck`, `lint`, `test` et `build` sont verts en CI.
