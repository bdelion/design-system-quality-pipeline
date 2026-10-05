# Architecture logicielle actuelle

## Statut

**ÉTAT IMPLÉMENTÉ**

Cette page décrit l'architecture logicielle observable dans le
repository au moment de la consolidation documentaire.

Elle ne définit pas à elle seule le modèle métier cible.

## Vue générale

Le projet est un pipeline Node.js + TypeScript en lecture seule.

``` mermaid
flowchart LR
  C[Configuration] --> P[Pipeline]
  F[Fixture] --> P
  G[GitHub REST / GraphQL] --> P
  K[Catalogue YAML] --> P

  P --> R[RawDataset]
  R --> N[Normalisation]
  K --> N

  N --> Q[Quality Rules]
  R --> Q

  N --> A[Analytics]
  Q --> A

  R --> S[Snapshot]
  N --> S
  Q --> S
  A --> S

  S --> D[Dashboard HTML]
```

## Responsabilités actuelles

  -----------------------------------------------------------------------
  Couche                              Responsabilité
  ----------------------------------- -----------------------------------
  `src/cli.ts`                        expose les commandes utilisateur

  `src/pipeline.ts`                   orchestre les étapes du pipeline

  `src/config.ts`                     charge la configuration

  `src/collectors/`                   produit un `RawDataset` depuis une
                                      fixture ou GitHub

  `src/catalogue.ts`                  charge et valide le catalogue YAML

  `src/normalizers/`                  convertit le RAW en modèle
                                      normalisé

  `src/quality/`                      détecte les problèmes de qualité
                                      sans modifier la source

  `src/analytics/`                    calcule les métriques et les
                                      éléments de flow

  `src/snapshots/`                    construit et compare les Snapshots

  `src/dashboard/`                    génère le dashboard HTML statique

  `src/domain/types.ts`               définit les contrats TypeScript
                                      partagés
  -----------------------------------------------------------------------

## Orchestration

``` mermaid
flowchart TD
    OP[Opérateur] --> CLI[CLI]
    CLI --> PIPE[Pipeline]

    PIPE --> CFG[Configuration]
    PIPE --> CAT[Catalogue]
    PIPE --> COL[Collecteur]

    COL --> RAW[RawDataset]
    CAT --> NORM[Normalisation]
    RAW --> NORM

    RAW --> DQ[Data Quality]
    NORM --> DQ

    NORM --> KPI[Analytics]
    DQ --> KPI

    RAW --> SNAP[Snapshot]
    NORM --> SNAP
    DQ --> SNAP
    KPI --> SNAP

    SNAP --> CURRENT[Snapshot courant]
    SNAP --> RUNS[Historique de runs]
    SNAP --> DASH[Générateur dashboard]
    DASH --> HTML[Pages et assets statiques]
```

## Sources

### Fixture

Le collecteur Fixture permet de rejouer le pipeline sur un jeu de
données contrôlé.

### GitHub

Le collecteur GitHub interroge les API nécessaires et projette les
réponses vers le contrat RAW du projet.

Les sources externes sont lues ; le pipeline n'a pas vocation à modifier
GitHub.

### Catalogue

Le catalogue YAML constitue une source de référence distincte. Il est
chargé et validé avant la normalisation.

## Traitement

### Normalisation

La normalisation produit les objets utilisés par le reste du pipeline et
les découple du format des sources.

### Data Quality

Les règles DQ décrivent les incohérences observées et leur impact. Elles
ne doivent pas corriger silencieusement la donnée source.

### Analytics

Les métriques sont calculées à partir du modèle normalisé en tenant
compte des impacts DQ.

### Snapshot

Le Snapshot assemble les résultats nécessaires à la restitution et à
l'historisation.

## Restitution

Le dashboard actuel est généré sous forme de fichiers statiques HTML,
JavaScript et CSS.

Il consomme le Snapshot et ne doit pas devenir un second moteur métier.

## Principes architecturaux

-   lecture seule vis-à-vis des sources externes ;
-   séparation RAW / normalisation / qualité / métriques / restitution ;
-   conservation de la provenance ;
-   données invalides conservées et accompagnées d'une décision de
    qualité ;
-   distinction entre valeur calculable et valeur inconnue ;
-   versionnement du modèle et des règles dans les sorties ;
-   possibilité de rejouer le pipeline à partir de données contrôlées.

## Limite de cette page

Le modèle métier documenté après les décisions D-001 à D-136 est plus
riche que le modèle TypeScript actuellement implémenté.

Cette différence est volontairement conservée et sera traitée lors de la
future gap analysis code ↔ modèle cible.

Voir également :

-   [Architecture des données](../05-donnees/architecture-donnees.md) ;
-   [Pipeline](pipeline.md) ;
-   [Normalisation](normalisation.md) ;
-   [Quality Engine](quality-engine.md) ;
-   [Metric Engine](metric-engine.md) ;
-   [Snapshot Engine](snapshot-engine.md) ;
-   [Dashboard](dashboard.md) ;
-   [Architecture cible](architecture-cible.md).
