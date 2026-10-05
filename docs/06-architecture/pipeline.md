# Pipeline

## Statut

**ÉTAT IMPLÉMENTÉ**, sauf mention explicite d'une cible.

## Rôle

Le pipeline orchestre les différentes couches du projet.

Il ne doit pas concentrer les règles spécifiques aux sources ni les
règles métier détaillées.

## Séquence actuelle

``` text
configuration
    ↓
catalogue
    ↓
collecte Fixture ou GitHub
    ↓
RawDataset
    ↓
normalisation
    ↓
Data Quality
    ↓
Analytics
    ↓
comparaison éventuelle avec le Snapshot précédent
    ↓
construction du Snapshot
    ↓
écriture des sorties
    ↓
génération du dashboard
```

## Contrats

  Étape           Entrée principale                 Sortie principale
  --------------- --------------------------------- ----------------------
  configuration   fichiers de configuration         paramètres actifs
  catalogue       YAML                              catalogue validé
  collecte        Fixture ou GitHub                 `RawDataset`
  normalisation   RAW + catalogue + configuration   `NormalizedData`
  qualité         RAW + normalisé + règles          `DataQualityIssue[]`
  analytics       normalisé + impacts DQ            métriques
  snapshot        résultats précédents              `Snapshot`
  restitution     Snapshot                          dashboard statique

## Sélection de la source

Le pipeline peut fonctionner à partir :

-   d'une fixture ;
-   de GitHub.

Les deux chemins doivent converger vers le même contrat `RawDataset`,
afin que les couches suivantes ne dépendent pas du mode de collecte.

## Catalogue

Le catalogue est chargé indépendamment de la source de collecte puis
utilisé pendant la normalisation.

Le rôle cible du Catalogue est plus large que l'implémentation actuelle,
notamment pour l'historisation par Version. Cette évolution ne doit pas
être anticipée implicitement dans l'orchestrateur.

## Data Quality

Le pipeline transmet le RAW et le modèle normalisé au moteur de qualité.

Les alertes produites sont conservées et leurs impacts sont pris en
compte par la couche Analytics.

La DQ ne doit pas modifier le RAW pour rendre artificiellement une
donnée conforme.

## Analytics

La couche Analytics reçoit les objets normalisés et les informations
nécessaires pour déterminer le périmètre et la fiabilité des métriques.

Les décisions de calcul doivent rester dans le moteur de métriques, pas
dans le CLI ou le dashboard.

## Snapshot et historique

Le pipeline construit le Snapshot courant et peut conserver des
Snapshots de runs.

La comparaison de deux Snapshots permet de produire des changements
observables lorsque leurs identifiants et périmètres sont comparables.

Une absence d'entité entre deux collectes ne doit pas être interprétée
automatiquement comme une suppression métier sans garantie de
complétude.

## Restitution

Le dashboard est généré à partir du Snapshot.

Cette dépendance doit rester unidirectionnelle :

``` text
Snapshot → Dashboard
```

Le dashboard ne doit pas modifier ni compléter les données métier.

## Évolution

L'orchestration devra évoluer avec le modèle métier cible, mais en
conservant autant que possible les frontières :

``` text
Sources
  ↓
RAW
  ↓
Normalized Model
  ↓
Rules / Data Quality
  ↓
Metric Engine
  ↓
Snapshot
  ↓
Consumers
```

Les consommateurs pourront à terme être un dashboard, une API, un export
ou un backend sans déplacer les règles métier hors du pipeline.
