# Export et import

Le JSON du snapshot doit être considéré comme un format d'échange actuel, pas comme un modèle de base de données définitif.

## Objectif de compatibilité future

Une future base de données ou API devrait pouvoir être alimentée à partir de :

- `RawDataset` si l'on souhaite conserver la donnée source ;
- `NormalizedData` pour une base métier ;
- `Snapshot.analytics` pour une couche analytique pré-calculée.

**À décider plus tard :** format d'export officiel, versionnement de schéma et stratégie de migration.
