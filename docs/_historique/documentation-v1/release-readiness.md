# Release readiness V2

## Contract

- `Analytics.metrics` is the analytical source of truth.
- Legacy KPI properties are compatibility projections only.
- Every generated metric must resolve through `src/analytics/catalog.ts`.
- Snapshot metrics are stocks, ratios or durations; temporal flows live in `Analytics.flows` and require two comparable snapshots.

## Data quality

- DQ impacts are metric-scoped.
- A DQ issue does not invalidate unrelated metrics.
- Excluded entities remain present in the normalized snapshot and are explained through metric exclusions.
- Snapshot-level reliability is informational; dashboard reliability is metric-specific.

## History

Flow metrics are only produced when a previous snapshot exists and precedes the current collection timestamp. Their period is the exact pair of snapshot capture times.

## Required CI checks

```text
npm ci
npm run typecheck
npm run lint
npm test
npm run build
```

The repository CI executes these checks on pushes to `main`, `master`, `develop` and on pull requests.

## Local release checklist

1. `npm ci`
2. `npm run typecheck`
3. `npm run lint`
4. `npm test`
5. `npm run build`
6. `npm run pipeline` with fixture data
7. Inspect `data/current/snapshot.json` and the generated dashboard
8. Verify that a second pipeline run produces `Analytics.flows` when a previous snapshot is available

## Known environment limitation

If dependencies cannot be installed in the execution environment, no claim of a green test suite should be made. GitHub Actions is the authoritative clean-environment verification because it starts from the repository lockfile and a fresh Node 20 runner.
