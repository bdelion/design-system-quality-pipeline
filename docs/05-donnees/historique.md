# Historisation

Le diff actuel compare deux snapshots et produit des faits observables :

- entités ajoutées / supprimées ;
- transitions d'état d'anomalie ;
- anomalies créées ;
- anomalies corrigées ;
- anomalies rouvertes ;
- anomalies annulées.

Les métriques de flow sont ensuite dérivées de ces différences.

## Limite

La détection repose sur des snapshots comparables et sur les identifiants normalisés. Une absence dans un snapshot peut avoir plusieurs causes ; elle ne doit pas être automatiquement interprétée comme suppression métier sans garantie de complétude de la collecte.
