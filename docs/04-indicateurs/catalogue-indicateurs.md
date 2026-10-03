# Catalogue des indicateurs

## Contrat actuel

Le code déclare un catalogue V2 dans `src/analytics/catalog.ts`.

### Portfolio

- `portfolio.repositories`
- `portfolio.libraries`
- `portfolio.components`
- `portfolio.componentsAudited`
- `portfolio.auditCoverage`

### Audit

- `audit.completed`
- `audit.conform`
- `audit.conditional`
- `audit.nonConform`
- `audit.critical`
- `audit.conformityRate`

### Anomalies

- `anomaly.total`
- `anomaly.open`
- `anomaly.inProgress`
- `anomaly.done`
- `anomaly.byCriticality.blocking`
- `anomaly.byCriticality.major`
- `anomaly.byCriticality.minor`
- `anomaly.criticalityCoverage`
- `anomaly.byCategory.*`
- `anomaly.correctedEver`
- `anomaly.reopened`
- `anomaly.cancelled`
- `anomaly.flow.created`
- `anomaly.flow.corrected`
- `anomaly.flow.reopened`
- `anomaly.flow.cancelled`
- `anomaly.correctionDelay.average`
- `anomaly.correctionDelay.median`
- `anomaly.correctionDelay.p90`
- `anomaly.backlog.oldestAge`

## Principe

Chaque metric contient notamment : valeur, unité, périmètre, définition, entités sources, fiabilité et exclusions.

## Distinction stock / flow

- Stock : état observé dans un snapshot.
- Flow : événement observable entre deux snapshots.

Cette distinction est explicitement présente dans le code du catalogue et du diff.
