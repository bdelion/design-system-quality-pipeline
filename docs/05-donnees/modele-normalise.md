# Modèle normalisé

Le modèle normalisé est indépendant du format de l'API GitHub.

Il contient actuellement :

- `Library`
- `Component`
- `Audit`
- `Anomaly`
- `PullRequest`

Chaque entité possède une provenance et un statut de qualité.

Le modèle est donc la bonne couche pour accueillir demain une autre source que GitHub, à condition de définir les mappings correspondants.
