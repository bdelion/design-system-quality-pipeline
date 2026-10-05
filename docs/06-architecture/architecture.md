# Architecture logicielle actuelle

Le projet est un pipeline Node.js + TypeScript en lecture seule.

```mermaid
flowchart LR
  SRC[GitHub / Fixture] --> COL[Collectors]
  COL --> RAW[RawDataset]
  CAT[Catalogue] --> NORM[Normalizer]
  RAW --> NORM
  NORM --> DQ[Quality Rules]
  RAW --> DQ
  NORM --> ANA[Analytics]
  DQ --> ANA
  ANA --> SNAP[Snapshot]
  RAW --> SNAP
  NORM --> SNAP
  DQ --> SNAP
  SNAP --> DASH[HTML Dashboard]
```

## Principales responsabilités

- `src/cli.ts` : CLI.
- `src/pipeline.ts` : orchestration.
- `src/collectors/` : collecte.
- `src/catalogue.ts` : catalogue.
- `src/normalizers/` : normalisation.
- `src/quality/` : DQ.
- `src/analytics/` : métriques et flows.
- `src/snapshots/` : snapshots/diff.
- `src/dashboard/` : rendu HTML.
- `src/domain/types.ts` : contrats.
