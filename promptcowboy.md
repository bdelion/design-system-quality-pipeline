Tu es un ingénieur logiciel full-stack spécialisé dans les intégrations API GitHub et les outils de data visualization. Je veux construire un dashboard de suivi de qualité pour mes librairies open source hébergées sur GitHub, capable d'agréger des données depuis plusieurs repositories configurables.

**Contrainte technique principale :** la collecte de données doit être multi-repository et configurable — l'utilisateur doit pouvoir ajouter/retirer des repositories à suivre sans modifier le code, via un fichier de configuration ou une interface de gestion. Le système doit supporter un **rafraîchissement quotidien automatique avec option de forçage manuel**.

## Architecture

Conçois une architecture technique adaptée incluant :
- **Backend de collecte** : choix de stack pour requêter l'API GitHub, gérer les rate limits, et scheduler le refresh quotidien
- **Stockage** : schéma de données pour persister les métriques collectées, optimisé pour les requêtes temporelles et multi-repository
- **Moteur de règles de qualité** : architecture extensible permettant de définir et vérifier des règles de conformité (voir section ci-après)
- **API de service** : endpoints pour exposer les données filtrées et interrogeables par plage temporelle, repository, et critère de qualité
- **Frontend** : composants de visualisation pour les dashboards

Structure le projet en composants clairs avec responsabilités distinctes.

## Fonctionnalités

1. **Suivi des issues** : nombre total, répartition par statut (ouvert, fermé, etc.), avec distinction entre issues "Done" et "Cancelled" identifiées via l'**état du projet GitHub** (Project Status, ou équivalent natif GitHub) plutôt que via labels.

2. **Suivi des Pull Requests** : nombre, statut (ouverte, mergée, fermée sans merge).

3. **Statistiques sur les labels** : distribution et usage des labels à travers les issues.

4. **Délais de résolution** : temps écoulé entre l'ouverture et la fermeture d'une issue, avec agrégations (moyenne, médiane, distribution) selon ce qui est le plus pertinent.

5. **Évolution temporelle** : visualisation de ces métriques dans le temps, avec granularité configurable — jour, mois, année, ou plage personnalisée entre deux dates.

6. **Analyse de conformité aux règles qualité** : moteur de règles **extensible et configurable** permettant de valider des critères tels que :
   - une issue marquée "Done" doit avoir une PR associée et mergée
   - (autres règles similaires à définir dans une structure extensible)
   
   Fournir un framework de règles permettant à l'utilisateur d'en ajouter facilement, et reporter les violations (issues non conformes). Aucune hiérarchie de priorité entre les règles initiales — traiter toutes les règles avec le même poids et permettre leur extension équitable.

## Configuration et Refresh

- **Configuration multi-repository** : permettre à l'utilisateur d'ajouter/retirer des repositories à surveiller via fichier de configuration ou interface, sans modification du code.
- **Rafraîchissement des données** : mise en place d'un scheduler pour rafraîchir les données **quotidiennement**. Prévoir aussi une option de **forçage manuel** pour une mise à jour immédiate.

## Implémentation

Fournis le code nécessaire pour une première implémentation fonctionnelle couvrant l'ensemble de ces fonctionnalités, avec attention particulière aux patterns d'extensibilité du moteur de règles et à l'efficacité des requêtes de données pour les filtres temporels et multi-repository.

-------

Je veux une solution pour le moment sans base de données, que je peux exécuté en local sur mon poste.