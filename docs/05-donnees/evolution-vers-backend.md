# Évolution vers API / backend / base de données

## Principe architectural

Le projet doit rester capable de passer de :

```text
TypeScript → JSON → HTML
```

à une architecture potentielle :

```text
Sources → ingestion → modèle normalisé → API → frontend
                                      └→ database
```

sans déplacer les règles métier dans la couche de stockage.

## Ce qui doit rester stable

- modèle métier normalisé ;
- définitions des métriques ;
- règles métier ;
- règles de qualité ;
- versionnement du modèle ;
- provenance ;
- snapshots comme représentation d'un état analytique.

## Ce qui peut changer

- persistance ;
- transport ;
- génération HTML ;
- interface utilisateur ;
- fréquence de collecte ;
- mode d'exposition des données.

**Ce document décrit une cible d'architecture, pas une fonctionnalité actuellement disponible.**
