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

Conformément à D-174, chaque contexte Project conserve `projectId` et `projectName`. Les valeurs Project restent ainsi rattachées à une identité stable tout en restant directement compréhensibles pour l’affichage et le diagnostic.

Conformément à D-175, le statut Project est représenté par sa valeur brute et, lorsqu’elle est reconnue sans ambiguïté, par une notion canonique distincte. La valeur brute n’est jamais écrasée.

Conformément à D-176, la notion canonique est recalculée à chaque exécution depuis la valeur brute et la configuration courante.

Conformément à D-177, la reconnaissance des variantes utilise une égalité stricte sur la valeur complète après `trim`, insensible à la casse, sans correspondance par sous-chaîne.

Conformément à D-178, une valeur brute correspondant à plusieurs notions canoniques conserve uniquement sa valeur source ; aucune notion canonique n’est choisie, les candidats sont exposés au diagnostic et une Data Quality non bloquante est émise.

Conformément à D-179, l’Iteration conserve au minimum son identifiant, son titre, sa date de début et sa durée ou sa date de fin lorsque ces données sont fournies par GitHub. Les propriétés non fournies restent absentes.

Conformément à D-180, l’Iteration est une propriété du contexte Project associé à l’Issue et non une propriété globale unique de l’Issue.

Conformément à D-181, `Velocity` sépare sa valeur brute de sa valeur numérique normalisée optionnelle. La valeur numérique n’existe que lorsque la donnée brute est interprétable comme un nombre valide.

Conformément à D-182, une `Velocity` brute non interprétable est conservée sans valeur numérique normalisée et produit une Data Quality non bloquante.

Conformément à D-183, `Scheduling` conserve systématiquement sa valeur brute dans son contexte Project ; toute représentation interprétée ou canonique reste distincte.

Conformément à D-184, chaque contexte Project conserve l’historique disponible des changements de statut de l’Issue.

Conformément à D-185, chaque transition contient au minimum le Project concerné, le statut brut précédent lorsqu’il est disponible, le nouveau statut brut et la date/heure de transition. Les données non fournies restent absentes.

Conformément à D-186, les statuts historiques utilisent les mêmes mécanismes de séparation brut/canonique, de recalcul, de matching strict et de gestion des ambiguïtés que le statut Project courant.

Conformément à D-187, l’historique conserve toutes les transitions disponibles sans réduire plusieurs passages à `Done` à un événement unique.

Conformément à D-188, lorsqu’un historique insuffisant empêche d’établir une date métier, aucune date n’est inventée : la valeur dérivée reste absente et une Data Quality non bloquante est émise.

Conformément à D-189, D-190 et D-191, les objets `Audit`, `Anomaly` et `AuditImprovement` référencent l’`Issue` générique par `issueId` et ne dupliquent pas ses faits GitHub communs.

Conformément à D-192, ils disposent respectivement de `auditId`, `anomalyId` et `auditImprovementId`, identifiants métier propres et stables, distincts de `issueId`.

Conformément à D-193, `Anomaly.auditId` n’est présent pour une anomalie d’Audit que lorsque la relation vers l’Audit est valide. Une anomalie `HORS_AUDIT` n’en porte pas ; une relation attendue mais invalide reste signalée séparément.

Conformément à D-194, une `AuditImprovement` possède obligatoirement un `auditId` valide pour être matérialisée comme telle.

Conformément à D-195, `Audit` expose explicitement son unique `componentId`. Conformément à D-196, une anomalie d’Audit expose également le `componentId` associé à l’Audit lorsque la relation est valide.

Conformément à D-197, une divergence entre le Component de l’Issue enfant et celui de l’Audit parent conserve les faits source sans correction automatique et produit une Data Quality non bloquante.

Conformément à D-198, une Issue `Bug` continue de produire une `Anomaly` si un parent Audit attendu est absent ou invalide. Dans ce cas, aucun `auditId` artificiel n’est créé et l’incohérence est signalée.

Conformément à D-199, `Version` possède un `versionId` métier stable distinct des identifiants GitHub techniques. Conformément à D-200, son numéro canonique est le numéro PROD `M.m.r`.

Conformément à D-201 et D-202, l’existence du Git tag PROD exact établit la publication de la Version et sa date établit `releasedAt`. Les autres dates ne constituent pas de fallback implicite.

Conformément à D-203, une Version identifiable sans tag PROD est conservée avec `releasedAt` absent, sans être considérée publiée, et produit une Data Quality non bloquante.

Conformément à D-204, `milestoneId` référence la Milestone PROD lorsqu’elle existe sans modifier la source de vérité de `releasedAt`.

Conformément à D-205 et D-206, le contexte d’un Audit pré-PROD conserve séparément la RC auditée et, lorsqu’il existe, son Git tag avec sa date.

Conformément à D-207, une RC indéterminable reste absente sans valeur inventée et produit une Data Quality non bloquante.

Conformément à D-208, un Audit de rattrapage cible directement la Version PROD sans RC artificielle.

### Décisions I1 sur Catalogue historique et verdict Component × Version

- **D-209 — Catalogue historique propre à chaque Version PROD** : Chaque Version PROD possède son propre Catalogue historique, représentant les Components présents dans le repository pour cette Version.
- **D-210 — Catalogue historique lu dans le Git tree du tag PROD** : Le Catalogue historique d’une Version est reconstruit à partir du fichier de catalogue présent dans le Git tree du tag PROD exact `M.m.r`. Le catalogue courant ne sert jamais de substitut rétroactif.
- **D-211 — Catalogue indéterminable lorsqu’un tag PROD manque** : Si une Version est identifiable mais que son tag PROD est absent, son Catalogue historique est indéterminable. Le catalogue courant n’est pas utilisé comme fallback.
- **D-212 — Catalogue absent ou illisible au tag PROD** : Si le tag PROD existe mais que le fichier Catalogue attendu est absent ou illisible dans ce tag, la Version est conservée, son Catalogue historique reste indéterminable et une Data Quality non bloquante est produite. Son identifiant `DQ-xxx` sera attribué en I5.
- **D-213 — Conservation historique d’un Component supprimé** : Un Component présent dans le Catalogue d’une ancienne Version reste membre du Catalogue historique de cette Version même s’il a ensuite été supprimé du catalogue courant.
- **D-214 — Absence historique d’un Component ajouté ultérieurement** : Un Component ajouté après une Version `M.m.r` est absent du Catalogue historique de cette Version. Sa présence actuelle ne doit jamais être rétroprojetée.
- **D-215 — Identifiant métier stable de Component** : Chaque `Component` possède un `componentId` métier stable, distinct de son nom ou libellé affiché.
- **D-216 — Identité d’un Component conservée entre Versions continues** : Lorsqu’un même Component métier est présent dans plusieurs Versions continues, il conserve le même `componentId` afin de permettre son suivi longitudinal.
- **D-217 — Renommage explicite d’un Component** : Un renommage peut conserver le `componentId` lorsqu’il est explicitement établi que le Component métier reste le même. Cette continuité doit être déclarée par configuration ou règle explicite et ne doit jamais être devinée automatiquement.
- **D-218 — Nouvelle identité après disparition puis réapparition** : Lorsqu’un Component disparaît du Catalogue pendant une ou plusieurs Versions puis réapparaît, sa réapparition ne réutilise pas le `componentId` historique précédent. Elle constitue une nouvelle identité métier.
- **D-219 — Matérialisation de la relation Component × Version** : Le modèle normalisé matérialise explicitement la présence d’un Component dans une Version. Les KPI et verdicts ne doivent pas reconstruire implicitement cette relation à partir du catalogue courant.
- **D-220 — Couverture fondée sur au moins un Audit terminé applicable** : Un couple `Component × Version` est couvert dès lors qu’au moins un Audit applicable à ce couple est terminé au sens métier défini par D-141.
- **D-221 — Audit incomplet insuffisant pour la couverture** : Un Audit commencé mais non terminé ne rend jamais un couple `Component × Version` couvert à lui seul.
- **D-222 — Verdict courant agrégé sur l’ensemble des Audits terminés applicables** : Le verdict courant d’un couple `Component × Version` est calculé à partir de l’ensemble des Audits terminés applicables à ce couple, et non à partir du seul Audit terminé le plus récent. Tous les Audits terminés applicables contribuent à l’état courant selon les règles de conformité. Cette décision remplace la règle antérieure de sélection du dernier Audit terminé portée notamment par D-046.
- **D-223 — Un Audit incomplet ne modifie pas le verdict acquis** : Un Audit plus récent mais incomplet ne contribue pas au verdict courant et ne remplace pas l’état acquis à partir des Audits terminés applicables.
- **D-224 — Conformité conditionnée à l’absence d’anomalie d’Audit ouverte pertinente** : Un couple `Component × Version` couvert ne peut être conforme que si l’ensemble des Audits terminés applicables pris en compte pour son verdict ne laisse aucune anomalie d’Audit ouverte affectant la conformité.
- **D-225 — AuditImprovement sans effet sur le verdict de conformité** : Une `AuditImprovement`, ouverte ou fermée, n’intervient jamais dans le calcul du verdict de conformité d’un couple `Component × Version`.
- **D-226 — Correction d’une anomalie insuffisante pour rétablir la conformité** : La correction ou la fermeture d’une anomalie issue d’un Audit ne rétablit pas à elle seule la conformité du Component. Le Component reste non conforme jusqu’à ce qu’un nouvel Audit terminé applicable valide la conformité. L’anomalie corrigée reste conservée dans l’historique.
- **D-227 — Anomalie HORS_AUDIT sans effet direct sur la conformité d’Audit** : Une anomalie d’origine `HORS_AUDIT` ne modifie pas directement le verdict de conformité calculé à partir des Audits applicables au couple `Component × Version`.
- **D-228 — État NON_COUVERT en absence d’Audit terminé applicable** : Si un Component appartient au Catalogue historique d’une Version mais ne possède aucun Audit terminé applicable, son état est `NON_COUVERT` / non évalué. Il ne doit jamais être assimilé à `NON_CONFORME`.








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


## Décisions finales I1 sur cardinalités, origine et intégrité

- **D-229 — Issue Audit sans Component reconnu** : Si une Issue reconnue comme Audit ne possède aucun Component reconnu, l’Issue générique est conservée mais aucun `Audit` métier valide n’est matérialisé. Aucun Component n’est inventé. Une Data Quality non bloquante signale l’absence du Component requis. Son identifiant `DQ-xxx` sera attribué en I5.
- **D-230 — Issue Audit avec plusieurs Components reconnus** : Si une Issue reconnue comme Audit possède plusieurs Components reconnus, l’Issue générique est conservée mais aucun `Audit` métier valide n’est matérialisé. Le pipeline ne sélectionne jamais arbitrairement un Component. Une Data Quality non bloquante signale la violation de cardinalité. Son identifiant `DQ-xxx` sera attribué en I5.
- **D-231 — Issue Audit sans Version PROD cible déterminable** : Si la Version PROD cible d’une Issue Audit ne peut pas être déterminée, l’Issue générique est conservée mais aucun `Audit` métier complet et valide n’est matérialisé. Aucune Version cible n’est inventée. Une Data Quality non bloquante signale l’information manquante. Son identifiant `DQ-xxx` sera attribué en I5.
- **D-232 — Conservation des anomalies enfants d’un Audit invalide** : Lorsqu’une Issue Audit parente existe mais ne peut pas être matérialisée comme `Audit` valide, ses Issues `Bug` enfants restent conservées et sont matérialisées comme `Anomaly`. Aucun `auditId` invalide ou artificiel n’est produit. Les Data Quality correspondant à l’Audit invalide et à la relation d’anomalie non validable sont conservées.
- **D-233 — Feature enfant sans Audit parent valide** : Une Issue `Feature` dont l’Audit parent est absent ou invalide reste conservée comme `Issue` générique mais n’est pas matérialisée en `AuditImprovement`. Un `AuditImprovement` exige un Audit parent valide conformément à D-194. Une Data Quality non bloquante peut signaler la relation attendue non validable.
- **D-234 — Bug rattaché à plusieurs Audits valides** : Si une Issue `Bug` est sous-Issue de plusieurs Audits valides, l’`Anomaly` est conservée mais la relation vers l’Audit est considérée ambiguë. Aucun `auditId` n’est sélectionné automatiquement. Une Data Quality non bloquante expose l’ambiguïté et les Audits candidats.
- **D-235 — Feature rattachée à plusieurs Audits valides** : Si une Issue `Feature` est sous-Issue de plusieurs Audits valides, aucune `AuditImprovement` n’est matérialisée tant que la relation vers l’Audit n’est pas univoque. L’Issue générique reste conservée et une Data Quality non bloquante expose l’ambiguïté et les Audits candidats.
- **D-236 — Origine indéterminée d’une anomalie à relation Audit non validable** : Lorsqu’une Issue `Bug` présente une relation qui suggère une origine Audit mais que cette relation ne peut pas être validée, son origine n’est pas artificiellement classée `HORS_AUDIT`. L’anomalie est conservée avec une origine indéterminée et la Data Quality appropriée.
- **D-237 — Trois valeurs canoniques pour Anomaly.origin** : Le contrat normalisé de `Anomaly.origin` accepte trois valeurs canoniques : `AUDIT`, `HORS_AUDIT` et `UNDETERMINED`. `UNDETERMINED` représente les situations où les faits source suggèrent une relation d’Audit mais ne permettent pas de la valider. Cette décision étend D-138.
- **D-238 — Cardinalité Component des anomalies HORS_AUDIT** : Une `Anomaly` d’origine `HORS_AUDIT` n’impose pas exactement un Component. Elle conserve le rattachement 0..n Components dérivé de son Issue générique.
- **D-239 — Cardinalité Component des anomalies UNDETERMINED** : Une `Anomaly` d’origine `UNDETERMINED` conserve également les 0..n Components dérivés de son Issue générique. Le pipeline ne sélectionne pas artificiellement un Component.
- **D-240 — Unicité des spécialisations par Issue** : Une Issue GitHub donnée peut produire au maximum une instance de chaque spécialisation métier qui lui est applicable. Une ambiguïté ou une cardinalité source invalide ne doit jamais être résolue en dupliquant `Audit`, `Anomaly` ou `AuditImprovement`.
- **D-241 — Intégrité référentielle du modèle normalisé** : Toute référence normalisée telle que `issueId`, `auditId`, `componentId`, `versionId` ou `milestoneId` doit pointer vers une entité réellement présente dans le dataset normalisé lorsque la relation est matérialisée. Si une relation attendue ne peut pas être résolue, aucune référence orpheline n’est créée : la référence reste absente et une Data Quality non bloquante signale l’incohérence.
- **D-242 — Déterminisme de la normalisation** : À dataset brut et configuration identiques, la normalisation produit les mêmes identifiants métier, classifications et relations, indépendamment de l’ordre des objets collectés. La génération des identifiants et les règles de résolution ne dépendent ni de l’ordre d’itération ni d’un état d’exécution non déterministe.
- **D-243 — Clôture conditionnelle du lot I1 avant implémentation** : I1 est fonctionnellement spécifié lorsque ses décisions permettent de définir les contrats TypeScript sans ambiguïté métier bloquante. Avant de déclarer I1 `GREEN` et de modifier le code, un checkpoint final est réalisé sur un ZIP complet et à jour du repository contenant les décisions appliquées jusqu’à D-243. Il vérifie au minimum décisions actives/supplantées, documentation, configuration, contrats TypeScript existants, tests et fixtures. Les questions non bloquantes restantes sont reportées aux lots I2 à I9.
