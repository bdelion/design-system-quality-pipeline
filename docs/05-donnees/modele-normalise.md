# Modèle normalisé

## Objectif

Le modèle normalisé traduit les données RAW en objets exploitables par
le métier sans exposer directement la structure de l'API GitHub.

Il constitue la frontière entre :

```text
formats des sources
        ↓
normalisation
        ↓
concepts utilisés par le pipeline
```

## État actuellement implémenté

Le modèle TypeScript actuel contient principalement :

- `Library` ;
- `Component` ;
- `Audit` ;
- `Anomaly` ;
- `PullRequest`.

Cet inventaire décrit **l'état du code actuel**. Il ne doit pas être
interprété comme le modèle métier cible complet.

La décision D-145 établit que le modèle cible doit également contenir
une entité générique `Issue` pour chaque Issue GitHub collectée. Les
objets spécialisés tels que `Audit`, `Anomaly` ou une Improvement
d'Audit sont dérivés des Issues concernées sans supprimer leur
représentation générique.

Conformément à D-146, cette entité générique conserve le type d’Issue GitHub/métier collecté dans un champ `issueType`. Ce champ fait partie du contrat normalisé de l’Issue et ne doit pas être perdu pendant la transformation `RawIssue → Issue`.

Conformément à D-147, les Issue Types forment un vocabulaire global au système et non une configuration propre à chaque repository. Les valeurs observées peuvent être inventoriées à partir du dataset collecté. La reconnaissance des notions métier est pilotée par une configuration globale associant une notion canonique à plusieurs variantes acceptées, dans la continuité de `github.issueTypes.keywords` dans `system.yaml`.

Conformément à D-148, une valeur non reconnue reste conservée telle qu’elle a été collectée. L’Issue normalisée n’est ni supprimée ni invalidée pour ce motif. La Data Quality doit signaler le cas par un élément « issueType à déclarer » contenant au minimum la valeur brute concernée et un lien vers l’Issue GitHub source. Cette réserve est non bloquante pour le pipeline.

Conformément à D-149, le modèle normalisé porte séparément la valeur brute remontée par GitHub et la notion canonique reconnue par le pipeline ; la canonicalisation ne remplace jamais la donnée source.

Conformément à D-150, la notion canonique est optionnelle : si aucune notion n’est reconnue, elle est absente et aucune valeur `UNKNOWN` n’est injectée.

Conformément à D-151, cette notion canonique est dérivée à chaque exécution depuis la valeur brute et la configuration courante ; elle n’est pas une vérité historique indépendante à conserver lorsque la configuration évolue.

Conformément à D-152, une reconnaissance ambiguë vers plusieurs notions laisse également la notion canonique absente. Aucune priorité implicite n’est appliquée et une réserve Data Quality documente les candidats et l’Issue concernée.

Conformément à D-153, la reconnaissance repose sur une correspondance stricte avec une variante complète explicitement déclarée ; les keywords ne sont pas des fragments recherchés dans la valeur brute.

Conformément à D-154, la résolution compare la valeur complète après `trim` et sans tenir compte de la casse. Aucune recherche partielle n’est effectuée et `rawIssueType` reste inchangé.

Conformément à D-155, l’absence totale d’Issue Type est également représentable : `rawIssueType` et `issueType` sont alors absents. L’Issue reste dans `NormalizedData`, aucune valeur `UNKNOWN` n’est injectée et la Data Quality produit une réserve non bloquante « issueType manquant » avec un lien vers l’Issue GitHub. Ce cas est distinct d’un `rawIssueType` présent mais non reconnu, qui relève de « issueType à déclarer » selon D-148.

Conformément à D-156, `Issue` conserve aussi le `title` GitHub. Le titre appartient au socle générique normalisé et reste disponible pour les traitements aval, qu’une spécialisation métier soit dérivée ou non.

Conformément à D-157, ce socle générique contient également `state: 'OPEN' | 'CLOSED'`. Cette propriété représente l’état natif GitHub de l’Issue et reste distincte de tout statut GitHub Projects.

Conformément à D-158, le socle générique contient aussi `createdAt: string` et `closedAt?: string`. Ces dates représentent respectivement la création et la fermeture GitHub de l’Issue. Elles ne remplacent aucune date métier dérivée, notamment `detectedAt`, `correctedAt` ou `completedAt`.

Conformément à D-159, `Issue` conserve également `labels: string[]`, contenant tous les labels GitHub de l’Issue, qu’ils soient ou non interprétés par le pipeline. Toute propriété métier dérivée d’un label reste séparée de cette donnée source.

Conformément à D-160, `Issue` contient également `repositoryId: string` en plus de `libraryId`. Le repository source est ainsi porté explicitement par l’Issue et n’est pas déduit de la relation Library/repository, ce qui préserve le contrat lors d’une future association d’une Library à plusieurs repositories.

Conformément à D-161, `Issue` contient également `url: string`, correspondant à son URL GitHub source. Les couches aval utilisent cette valeur pour créer les liens vers GitHub et ne reconstruisent pas l’URL à partir de `repositoryId` et `number`.

Conformément à D-162, `Issue` contient également `milestoneId?: string`. Cette propriété référence la `Milestone` normalisée associée lorsqu’elle existe ; elle ne duplique pas les données de la Milestone et reste indépendante de l’usage métier qui sera fait de ce rattachement.

Conformément à D-163, `Issue` conserve également `projectStatuses`, représentant ses rattachements et statuts GitHub Projects. Cette collection reste distincte de `state: 'OPEN' | 'CLOSED'` et est conservée même lorsqu’aucune spécialisation métier ne l’exploite.

Conformément à D-164, `Issue` conserve `parentIssueId?: string` et `subIssueIds: string[]` afin de représenter explicitement les relations GitHub de parenté sans les réserver à une spécialisation métier.

Conformément à D-165, `Issue` conserve `linkedPullRequestIds: string[]` afin de préserver les références aux Pull Requests liés.

Conformément à D-166, D-167 et D-168, `Issue` conserve également, lorsqu’elles existent, les informations GitHub Projects `Iteration`, `Velocity` et `Scheduling`. Leur structure normalisée détaillée doit être définie avec le contrat GitHub Projects ; aucune forme supplémentaire n’est imposée par ces décisions.

Conformément à D-169, `Issue` conserve `componentIds: string[]`, dérivé des labels de Component reconnus. Cette propriété ne remplace jamais `labels` et accepte une cardinalité de zéro à plusieurs Components.

Conformément à D-170 et D-171, `Issue` conserve les criticités et catégories Accessibility reconnues depuis ses labels. Ces données génériques restent distinctes des contraintes métier appliquées ensuite aux spécialisations, notamment aux anomalies d’Audit Accessibility.

Conformément à D-172, les informations GitHub Projects sont structurées par Project d’origine. Chaque ensemble de statut, Iteration, `Velocity`, `Scheduling` ou autre valeur Project doit rester rattaché à l’identifiant du Project qui le porte.

Conformément à D-173, lorsqu’une valeur Project soumise à reconnaissance n’est pas reconnue, sa valeur brute est conservée, aucune valeur canonique artificielle n’est produite et une Data Quality non bloquante est émise. Le contrat détaillé brut/canonique des champs Project sera précisé avec leur modèle normalisé.



La liste définitive des notions canoniques reste à préciser.

Les décisions métier ont également établi ou introduit des concepts
supplémentaires, notamment autour des Packages, Versions, Improvements,
Catalogues historiques et Audits applicables. Leur traduction dans le
modèle normalisé est réalisée progressivement dans les lots
d'implémentation V1.

## Relations

Les objets normalisés sont reliés par des identifiants stables.

Le normaliseur peut ainsi établir des relations entre :

- Library et Issues ;
- Library et Components ;
- Issues et objets métier spécialisés dérivés ;
- Components et Audits ;
- Audits et Anomalies ;
- Issues et Pull Requests selon les données disponibles.

Les cardinalités métier cibles ne doivent pas être déduites uniquement
des structures TypeScript actuelles.

## Identifiants stables

L'implémentation utilise `stableId(prefix, value)` pour produire des
identifiants déterministes.

À entrée équivalente, le même objet logique reçoit donc le même
identifiant stable.

Ce mécanisme facilite notamment :

- les relations entre objets normalisés ;
- les comparaisons de Snapshots ;
- la détection de changements entre exécutions.

Un identifiant stable technique ne remplace pas pour autant la
définition d'une identité métier. Cette dernière doit rester documentée
pour chaque objet.

## Provenance

Les entités normalisées conservent une provenance permettant de remonter
vers les données ayant servi à leur construction.

Le modèle actuel utilise notamment des informations telles que :

- `source` ;
- `sourceId` ;
- `collectedAt`.

La provenance permet d'expliquer :

- l'origine d'une entité ;
- l'origine d'une alerte DQ ;
- les entités ayant contribué à une métrique.

## État de qualité

Le contrat actuel définit les statuts :

```text
reliable
partial
unknown
invalid
```

Ils permettent de distinguer plusieurs situations qui ne doivent pas
être confondues.

Par exemple, une information absente ne doit pas être transformée
artificiellement en valeur zéro.

La stratégie cible de fiabilité est métrique-spécifique : une
incohérence sur une dimension ne doit pas automatiquement rendre toutes
les métriques du Snapshot partielles.

## Exemple : valeur inconnue

Si la date nécessaire au calcul d'un délai n'est pas disponible, le
pipeline doit représenter le délai comme inconnu plutôt que comme nul.

```text
absence de preuve
≠
valeur métier égale à zéro
```

## Indépendance vis-à-vis des sources

Le modèle normalisé est la couche destinée à accueillir d'autres sources
que GitHub.

Une nouvelle source doit être adaptée vers les concepts normalisés au
moyen d'un mapping explicite, sans imposer son schéma propre au moteur
de métriques ou au dashboard.

## Évolution du modèle

L'enrichissement du modèle doit suivre l'ordre suivant :

1. décision ou définition métier ;
2. cardinalités et règles ;
3. contrat normalisé ;
4. mapping depuis le RAW ;
5. Data Quality ;
6. métriques ;
7. restitution.

Le code existant ne doit donc pas être utilisé pour limiter
artificiellement le modèle métier cible.
