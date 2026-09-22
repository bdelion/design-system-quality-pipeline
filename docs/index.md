# Documentation du pipeline

Cette documentation explique le fonctionnement du pipeline de qualité Design System.

## Parcours recommandé

1. [Architecture](architecture.md) : responsabilités des modules et limites du système.
2. [Workflow](workflow.md) : déroulement d'une exécution complète.
3. [Flux de données](data-flows.md) : transformations entre RAW, normalisé, qualité et KPI.
4. [Modèle de données](data-model.md) : contrats principaux et provenance.
5. [Catalogue](catalogue.md) : validation et enrichissement des composants.
6. [Collecte GitHub](github-collector.md) : pagination, liens issue/PR et retries.
7. [Calculs KPI](analytics.md) : définitions, exclusions et valeurs inconnues.
8. [Snapshots et dashboard](snapshots-dashboard.md) : persistance et restitution.
9. [Tests](testing.md) : stratégie de vérification.
10. [Quality Rules](quality-rules.md) : détail de chaque règle DQ.

## Source de vérité

Le code et les fichiers de configuration restent les sources de vérité exécutables. Les pages Markdown décrivent leur intention et leurs contrats ; lorsqu'une règle change, la configuration, les tests et cette documentation doivent évoluer ensemble.
