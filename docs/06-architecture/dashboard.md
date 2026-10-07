# Dashboard

## Statut

**ÉTAT IMPLÉMENTÉ** pour le dashboard décrit ici.

La cible UX et fonctionnelle finale sera définie après consolidation du
modèle métier et des indicateurs.

## Principe

Le dashboard actuel est statique.

Il est généré à partir d'un Snapshot et ne nécessite ni serveur
applicatif ni base de données pour être consulté.

```text
Snapshot
   ↓
générateur
   ↓
HTML + JavaScript + CSS
```

## Pages actuelles

Le générateur produit les pages suivantes :

```text
index.html
anomalies.html
audits.html
components.html
squad.html
graph.html
history.html
```

### `index.html`

Vue Direction / synthèse des KPI et de l'état global observable.

### `anomalies.html`

Vue détaillée des Anomalies, métriques, criticités, catégories, délais
et alertes DQ associées.

### `audits.html`

Vue prioritaire Audit & Versions : couverture, conformité, verdicts et
traçabilité `Component × Version → Audit → Anomalies`.

### `components.html`

Référentiel du patrimoine : composants, versions historiques, couverture
des audits, résultats non conformes et anomalies ouvertes. Recherche et
filtre par statut sont disponibles.

### `squad.html`

Vue opérationnelle des Issues et des faits GitHub Projects collectés :
statuts, itérations, Velocity source et composants associés. Les valeurs
sont restituées sans interprétation ni agrégat Sprint non défini.

### `graph.html`

Cartographie des relations entre Composants, Issues et Pull Requests
avec recherche et badges d'état.

### `history.html`

Vue des flux observés entre le Snapshot précédent et le Snapshot courant
lorsqu'une comparaison est disponible.

## Assets

Les assets sont maintenus séparément sous :

```text
src/dashboard/assets/
```

et copiés lors de la génération.

Ils comprennent actuellement :

- `style.css` ;
- `app.js` ;
- `graph.js` ;
- `logo.svg`.

Les pages HTML portent la structure et les données nécessaires ; les
comportements communs restent dans les assets.

## Consommation des métriques

Les écrans doivent consommer :

```text
analytics.metrics[metricId]
```

et utiliser les informations portées par la métrique :

- `value` ;
- `numerator` ;
- `denominator` ;
- `definition` ;
- `scope` ;
- `reliability` ;
- `exclusions`.

Le dashboard ne doit pas recalculer les règles métier ou les formules
KPI.

## Data Quality

Les alertes DQ restent visibles et explicables.

Le dashboard peut afficher :

- règle concernée ;
- cible ;
- source ;
- impacts ;
- fiabilité de la métrique.

Pour le comportement actuel `DQ-006`, il peut proposer la copie d'une
structure YAML de Catalogue à compléter. Cette action reste une aide
utilisateur : le navigateur n'écrit pas directement dans le Catalogue.

## Liens GitHub

Les liens GitHub sont construits uniquement lorsqu'une URL GitHub est
fournie à la génération.

Sans cette configuration, le dashboard affiche les références sous forme
de texte.

Les valeurs injectées dans le HTML doivent être échappées.

## Historique

`history.html` affiche actuellement les flux :

```text
anomaly.flow.created
anomaly.flow.corrected
anomaly.flow.reopened
anomaly.flow.cancelled
```

uniquement lorsqu'un Snapshot précédent comparable est disponible.

Sans comparaison, l'interface doit indiquer que les flux ne sont pas
disponibles plutôt que d'afficher artificiellement zéro.

## Séparation des responsabilités

```text
Metric Engine
    ↓
Snapshot
    ↓
Dashboard
```

Le dashboard est une couche de restitution.

Il ne doit pas :

- redéfinir la conformité ;
- recalculer les ratios ;
- décider quelles entités doivent être exclues ;
- transformer une donnée inconnue en zéro ;
- reconstruire une règle DQ.

## Cible future

Les besoins déjà identifiés prévoient plusieurs niveaux de lecture :

- Portfolio / Executive ;
- Librairie ;
- Composant ;
- Audit / Version ;
- Issue / traçabilité.

Chaque KPI devra pouvoir conduire aux entités sources qui expliquent sa
valeur.

Les pages `components.html` et `squad.html` amorcent les espaces
Composants et Activité Squad. Les indicateurs Sprint, Velocity et delivery
restent soumis à leurs définitions métier avant agrégation ou comparaison.

Les tableaux des pages générées proposent un tri interactif accessible ;
les vues détaillées ajoutent recherche et filtres lorsque le périmètre le
justifie.
