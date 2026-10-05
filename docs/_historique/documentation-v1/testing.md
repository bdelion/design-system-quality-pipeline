# Tests et validation

## Commandes

```bash
npm run typecheck
npm run lint
npm test
```

## Couverture fonctionnelle

- `pipeline.test.ts` vérifie la normalisation, le catalogue, la validation et les KPI.
- `github-collector.test.ts` vérifie pagination, séparation issue/PR, relations textuelles et GraphQL.
- `snapshot.test.ts` vérifie le contrat du snapshot.
- `dashboard.test.ts` vérifie les pages HTML, les liens et les libellés français.

## Stratégie

Les tests utilisent la fixture pour être déterministes. Les appels GitHub sont simulés avec `fetch`, ce qui permet de tester les réponses API sans accès réseau. Toute modification d'un contrat RAW, normalisé ou dashboard doit être accompagnée d'un test de contrat ciblé.
