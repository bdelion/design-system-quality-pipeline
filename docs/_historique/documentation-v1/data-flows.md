# Flux de données

## Étapes et contrats

| Étape | Entrée | Sortie | Responsable |
| --- | --- | --- | --- |
| Collecte | Fixture ou API GitHub | `RawDataset` | `collectors/` |
| Référence | YAML catalogue | `Catalogue` | `catalogue.ts` |
| Normalisation | RAW + catalogue + règles | `NormalizedData` | `normalizers/github.ts` |
| Qualité | RAW + normalisé + règles | `DataQualityIssue[]` | `quality/rules.ts` |
| Analyse | Normalisé + alertes | `Analytics` | `analytics/kpis.ts` |
| Snapshot | Tous les résultats | `Snapshot` | `snapshots/snapshot.ts` |
| Restitution | Snapshot | HTML/JS/CSS | `dashboard/generate.ts` |

## RAW

Le RAW conserve la forme proche de GitHub : repositories, issues, pull requests, labels, dates et relations. Le champ `catalogueComponents` reçoit les noms de référence avant la normalisation.

## Normalisé

Le normaliseur produit des objets indépendants de GitHub. Les identifiants stables relient les composants aux audits, anomalies et pull requests. La provenance indique si l'objet vient de GitHub ou du catalogue.

## Qualité et KPI

Les alertes qualité ne modifient pas le RAW. Les actions `exclude` influencent le périmètre des KPI ; les actions `include` conservent l'objet tout en dégradant la fiabilité.
