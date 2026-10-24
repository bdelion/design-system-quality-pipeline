# ADR-002 — Séparer RAW et modèle normalisé

**Statut : ACCEPTÉ / DÉJÀ IMPLÉMENTÉ**

## Décision

Ne pas utiliser directement les objets GitHub comme modèle métier du dashboard. Collecter un RAW minimal puis normaliser vers un modèle métier.

## Justification

Le code possède des types RAW et des types normalisés séparés. Cette séparation permet de réduire le couplage avec GitHub.
