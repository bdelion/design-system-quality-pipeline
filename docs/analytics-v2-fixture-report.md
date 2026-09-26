# Rapport de validation analytique V2 — fixture

Snapshot fixture : `2026-09-08T09:00:00.000Z`

## Patrimoine

| Métrique | Valeur | Fiabilité | Lecture |
|---|---:|---|---|
| Repositories | 3 | fiable | 3 repositories analysés |
| Composants actifs | 8 | partielle | Tooltip est découvert hors catalogue (DQ-006) |
| Composants audités | 1 | partielle | Toast dispose d'un audit terminé |
| Couverture des audits | 12.5% | partielle | 1 / 8 composants |

## Audits

| Métrique | Valeur | Fiabilité |
|---|---:|---|
| Audits terminés | 1 | fiable |
| Audits conformes | 1 | fiable |
| Taux de conformité | 100.0% | fiable |

> Le taux de conformité à 100 % doit toujours être présenté avec la couverture : ici 1 audit terminé sur 8 composants.

## Anomalies

| Métrique | Valeur | Fiabilité |
|---|---:|---|
| Anomalies brutes | 7 | — |
| Anomalies dans le périmètre général | 7 | fiable |
| Anomalies ouvertes | 3 | fiable |
| Anomalies corrigées | 4 | fiable |
| Couverture de criticité | 85.7% | partielle |
| Délai moyen | 7.1 j | fiable |
| Délai médian | 6.1 j | fiable |
| P90 | 12.4 j | fiable |
| Plus ancienne anomalie ouverte | 12.2 j | fiable |

### Criticité

- Bloquante : 2
- Majeure : 2
- Mineure : 2
- 1 anomalie sans criticité reste dans `anomaly.total`, mais est exclue des métriques de criticité (DQ-001).

### Catégories

- contrast : 1
- focus : 2
- keyboard : 1
- name : 2
- structure : 1

> Les catégories sont multi-étiquettes : leur somme n'est donc pas un nombre d'anomalies.

## Qualité des données

Le fixture déclenche 4 réserves :

| Règle | Niveau | Objet | Impact |
|---|---|---|---|
| DQ-001 | ERROR | issue-103 | Exclusion des métriques de criticité et de leur couverture ; l'anomalie reste dans `anomaly.total` |
| DQ-006 | WARNING | Tooltip | Le patrimoine reste inclus, mais les métriques `portfolio.*` sont signalées partielles |
| DQ-007 | WARNING | issue-302 | Les métriques de catégories sont signalées partielles |
| DQ-009 | WARNING | Nexus | Aucun KPI V2 actuel n'est affecté, car aucune métrique `portfolio.release.*` n'est encore définie |

### Point important

Le snapshot global est `partial`, mais cela ne signifie **pas** que tous les KPI sont partiels.

Exemples :

- `anomaly.total` reste fiable : DQ-001 ne concerne pas cette métrique.
- `anomaly.correctionDelay.*` reste fiable : la criticité manquante n'empêche pas le calcul du délai.
- `audit.conformityRate` reste fiable : aucune DQ ne remet en cause l'audit terminé de Toast.
- `portfolio.auditCoverage` est partielle à cause de DQ-006.
- les métriques `anomaly.byCategory.*` sont partielles à cause de DQ-007.

## Ce que ce scénario valide

1. La fiabilité doit être portée **par métrique**, pas uniquement par snapshot.
2. Une DQ peut exclure une métrique sans supprimer l'entité du patrimoine.
3. `100 % de conformité` n'a de sens qu'accompagné de `1/8 composants couverts` dans ce scénario.
4. Les catégories doivent être affichées comme des ventilations multi-étiquettes.
5. `anomaly.created` ne doit pas encore être présenté comme un véritable flux tant que le modèle de période/historique n'est pas branché aux snapshots.
