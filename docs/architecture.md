# Architecture

Le projet est un pipeline Node.js/TypeScript en lecture seule. Il collecte des données, les traduit dans un modèle métier stable, mesure leur qualité, calcule des indicateurs et produit un snapshot ainsi qu'un dashboard statique.

```mermaid
flowchart LR
  C[Configuration] --> P[Pipeline]
  F[Fixture] --> P
  G[GitHub REST/GraphQL] --> P
  K[Catalogue YAML] --> P
  P --> R[RAW]
  R --> N[Normalisation]
  N --> Q[Quality Rules]
  Q --> A[KPI]
  A --> S[Snapshot]
  S --> D[Dashboard HTML]
```

## Responsabilités

- `src/cli.ts` expose les commandes utilisateur.
- `src/pipeline.ts` orchestre les étapes sans porter les détails des sources.
- `src/collectors/` produit un `RawDataset` depuis une fixture ou GitHub.
- `src/catalogue.ts` valide la référence YAML des composants.
- `src/normalizers/` convertit les données RAW en modèle métier.
- `src/quality/` détecte les problèmes sans supprimer les données sources.
- `src/analytics/` calcule les KPI sur les objets admissibles.
- `src/snapshots/` assemble une sortie immuable et traçable.
- `src/dashboard/` génère des pages HTML statiques.
- `src/domain/types.ts` définit les contrats partagés entre ces couches.

## Principes

- Les sources ne sont jamais modifiées.
- Une donnée invalide reste visible et porte une décision de qualité.
- Chaque entité normalisée conserve sa provenance.
- Les KPI distinguent une valeur calculable d'une valeur inconnue.
- Les sorties sont rejouables avec la version du modèle et des règles.
