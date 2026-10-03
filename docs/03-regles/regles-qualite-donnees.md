# Règles de qualité des données — état actuel

| ID | Niveau | Action actuelle | Condition observée dans le code | Impact actuel |
|---|---|---|---|---|
| DQ-001 | ERROR | exclude | Anomalie sans criticité | `anomaly.byCriticality.*`, `anomaly.criticalityCoverage` |
| DQ-002 | ERROR | exclude | Plusieurs criticités incompatibles dans le cas détecté | idem criticité |
| DQ-003 | ERROR | exclude | Plus d'un parent d'anomalie | `audit.anomalyCount.*` déclaré mais non présent dans le catalogue actuel ; délai inclus |
| DQ-004 | WARNING | include | Done sans PR identifiable | correction/délai/flow corrected |
| DQ-005 | WARNING | include | PR mergée liée à issue ouverte | correction/délai/flow corrected |
| DQ-006 | WARNING | include | composant absent du catalogue | `portfolio.*` |
| DQ-007 | WARNING | include | label inconnu | `anomaly.byCategory.*` |
| DQ-008 | ERROR | exclude | anomalie cancelled avec PR | nombreux stocks anomalies |
| DQ-009 | WARNING | include | Nexus indisponible | `portfolio.release.*` déclaré dans les impacts mais absent du catalogue V2 actuel |
| DQ-010 | ERROR | exclude | anomalie cancelled avec milestone | nombreux stocks anomalies |

## Divergences ou points à revoir

- Les définitions déclaratives YAML et la logique conditionnelle sont actuellement réparties entre configuration, TypeScript et table d'impacts.
- DQ-003 référence un pattern `audit.anomalyCount.*` qui n'apparaît pas dans le catalogue V2 actuel observé.
- DQ-006 impacte `portfolio.*`, ce qui peut être plus large que nécessaire selon le KPI.
- DQ-009 référence `portfolio.release.*`, absent du catalogue V2 actuel.
- DQ-008 et DQ-010 portent tous deux sur les anomalies annulées.
- La fiabilité globale du snapshot est actuellement `partial` dès qu'il existe au moins une alerte DQ, y compris un WARNING. Cela mérite d'être distingué de la fiabilité métrique.

Ces points sont des constats techniques, pas des décisions de refonte.
