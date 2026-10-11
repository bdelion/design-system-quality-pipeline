# Cohérence des pages du dashboard — lot 3

**État : implémenté dans le générateur et couvert par un test de non-régression ; validation npm à réaliser.**

Les pages **Analyse des issues**, **Analyse des composants** et le tableau des délais de la **Vue d'ensemble** partagent la projection `issueTreatment` de `src/dashboard/generate.ts`.

- Tous les types d'issues sont admissibles ; la classification « anomalie » n'est pas une condition d'entrée.
- Pour chaque contexte Project, la dernière transition datée valide prévaut sur le statut courant déclaré. Sans transition datée valide, le statut déclaré est utilisé.
- Une issue actuellement `DONE` est **traitée** ; `CANCELLED` est séparé. Une issue rouverte après `DONE` n'est plus traitée, même si GitHub indique `CLOSED`.
- La dernière transition `DONE` du contexte actuellement terminé fournit la date métier. Sans date métier, une preuve de correction exploitable puis `closedAt` servent de repli ; la clôture est signalée comme **estimation**.
- Une issue traitée sans date admissible compte parmi les traitées, mais pas dans les délais calculables. Les durées négatives ou invalides sont exclues.
- La colonne « Traitées » de l'analyse des composants ne signifie pas « anomalies corrigées ».

Les pages spécialisées **Anomalies**, **Audits et composants**, **Cartographie** et **Historique** conservent leurs périmètres spécifiques ; elles ne doivent pas être confondues avec un stock de toutes les issues.

## Contrôles

Le test `tests/dashboard.test.ts` vérifie notamment une issue `Documentation` fermée côté GitHub, avec un statut Project déclaré `DONE` mais une dernière transition valide `BACKLOG` : les deux explorateurs doivent la présenter comme ouverte, sans délai.

Validation locale attendue : `npm run format:check`, `npm run typecheck`, `npm run lint`, `npm test` et `npm run build`.

### Lot 4 — sélection des audits dans les vues spécialisées

La cartographie et la page « Audits et composants » sélectionnent le dernier audit
**terminé** d'un composant à l'aide de `latestCompletedAudit`. L'ordre d'entrée
n'est pas une preuve de récence. La date métier `completedAt` est privilégiée ;
la date de collecte sert seulement de critère de classement de secours et ne
constitue jamais une date d'achèvement. Un audit en cours ne remplace pas un
résultat terminé. Les KPI Analytics et les verdicts Component × Version restent
calculés par le pipeline, et non par cette fonction de présentation.

Tests : `tests/dashboard-audit-selection.test.ts`.

## Lot 5 — Cartographie et historique

- La cartographie représente **toutes les issues normalisées**, sans filtrage par type, par composant et sans dédupliquer une issue entre composants distincts. Elle conserve séparément les anomalies et leurs PR comme chaîne de preuve RGAA. Les issues sont liées à leur URL GitHub normalisée.
- La page Historique affiche le **stock courant des issues distinctes** tous types confondus. Ses quatre indicateurs de flux restent explicitement limités aux anomalies, faute de métriques de flux génériques comparables dans le snapshot. Aucun flux global d'issues n'est inventé.
- Les tests HTML vérifient le rendu de ces contrats.

### Lot 6 — Stock des issues dans Historique

Le bloc « Stock vs flux » présente le nombre d’issues **distinctes**, tous types confondus,
ventilé en **ouvertes**, **traitées** et **annulées**. Le classement réutilise la même
projection métier `issueTreatment` que les explorateurs (dernière transition Project
valide prioritaire, repli GitHub en l’absence de statut Project). Les trois catégories
sont exclusives et leur somme est égale au stock dédupliqué.

Cette ventilation est un **stock au snapshot courant**, pas une évolution entre deux
snapshots. Les quatre flux de la page restent propres aux anomalies RGAA ; aucun flux
d’issues génériques n’est inféré sans comparaison temporelle fiable.

## Flux temporels génériques (lot 7)

Les métriques `issue.flow.created`, `issue.flow.treated`, `issue.flow.reopened` et `issue.flow.cancelled` comparent deux snapshots successifs et couvrent **tous les types d’issues**. Elles utilisent les derniers statuts Project datés valides, avec repli sur le statut GitHub en l’absence de contexte Project. Une issue créée déjà fermée est comptée comme création, sans inventer une transition de traitement. Les flux `anomaly.flow.*` restent distincts : ne jamais additionner ces familles, car une anomalie est également une issue. Sans snapshot antérieur, la page affiche « — » et non zéro.

## Contrat transversal des audits (consolidation)

- **Issue** : unité de travail GitHub, tous types confondus.
- **Audit** : contrôle identifié pour un composant et une version ; un audit `in_progress` ou `not_evaluated` n'est pas terminé.
- **Anomalie** : écart qualité/accessibilité rattachable à une issue, éventuellement issu d'un audit. Les trois volumes ne sont pas additifs.
- Les pages _Composants_, _Cartographie_ et _Audits_ utilisent `latestCompletedAudit` pour le dernier résultat terminé ; un audit en cours ne remplace pas ce résultat.
- La page _Audits_ expose séparément les audits terminés, en cours et non évalués, ainsi que le détail de chaque audit et sa version.
- La conformité _Component × Version_ provient des verdicts Analytics ; les audits en cours ne deviennent jamais conformes par défaut.
- Les anomalies d'un composant ne sont pas automatiquement attribuées à chacun de ses audits : une association par audit exige une relation explicite.

### Consolidation — preuve de rattachement et version canonique

- Une anomalie n’est attribuée à un audit que si `anomaly.auditId`, `anomaly.parentRefs` ou `Issue.parentIssueId` désigne explicitement l’identifiant de l’audit ou de son issue source. Un composant commun ne suffit pas.
- La table des audits affiche les anomalies liées à **cet audit**, et signale séparément les anomalies du composant sans relation prouvée. Ces dernières ne doivent pas être imputées à une version.
- Le libellé de version privilégie `Audit.versionId → Version.number`, avec repli sur `Audit.version` pour compatibilité. Les verdicts `Component × Version` restent produits par Analytics, sans recalcul HTML.
- Les indicateurs de patrimoine par composant restent distincts des résultats par audit et par version.
- Tests : `tests/dashboard-audit-relations.test.ts`.
