# Composants et catalogue

Le catalogue est une référence séparée des données GitHub.

Le pipeline charge le catalogue puis renseigne `raw.catalogueComponents` avec les composants déclarés dans le catalogue avant normalisation.

Le modèle actuel distingue :

- composant découvert dans le catalogue ;
- composant découvert ailleurs / suggéré ;
- statut du composant ;
- provenance.

La règle DQ-006 signale actuellement un composant dont `discoverySource` vaut `suggested`.

## Besoin monorepo

Les spécifications indiquent qu'aujourd'hui un repository correspond à une bibliothèque, mais que demain un monorepo pourra contenir plusieurs bibliothèques. Le modèle doit donc conserver une identité `library` indépendante de l'identité `repository`.

**À confirmer :** la source et la règle permettant de déterminer plusieurs libraries dans un même repository.
