# Objectifs

## Objectifs explicitement présents dans les sources

- Collecter des données GitHub en lecture seule.
- Pouvoir travailler sur des fixtures sans dépendre de GitHub.
- Normaliser les données dans un modèle métier indépendant des objets riches de l'API GitHub.
- Contrôler la qualité des données sans supprimer silencieusement les données sources.
- Calculer des KPI documentés et traçables.
- Conserver des snapshots historisables.
- Comparer les snapshots pour faire apparaître des flux.
- Générer un dashboard HTML.
- Analyser plusieurs repositories configurables.
- Préparer le modèle à une évolution vers plusieurs bibliothèques dans un même repository.
- Conserver la possibilité d'exploiter les données hors du dashboard.

## Objectifs métier demandés

Les demandes client couvrent notamment :

- ratio tickets déclarés / corrigés ;
- délais de correction ;
- répartition par criticité ;
- couverture d'audit des composants ;
- conformité des composants audités ;
- anomalies par catégorie ;
- applications utilisant le Design System par version ;
- applications qui devraient l'utiliser mais ne l'utilisent pas ;
- anomalies par composant rapprochées de la fréquence d'utilisation ;
- à terme, audit dès la maquette et anomalies détectées en conception ;
- conformité globale d'une version au moment de sa sortie ;
- historique des indicateurs par snapshots.

Ces besoins sont documentés dans `specifications/indicateurs-souhaites.md`.
