# Bilan de consolidation métier — après 100 questions/réponses

## 1. Pourquoi faire un bilan maintenant

La phase d'exploration a produit un niveau de détail suffisant pour arrêter temporairement l'enchaînement des questions unitaires.

Le registre contient désormais **136 décisions stables** (`D-001` à `D-136`) et **114 questions référencées** (`Q-001` à `Q-114`).

Le risque principal n'est plus de manquer immédiatement une règle locale, mais de perdre la vue d'ensemble, de créer des redondances ou de détailler prématurément certains sujets avant d'avoir validé le modèle métier global.

## 2. Domaines fortement stabilisés

### Audit Accessibilité

Le cœur du modèle Audit est maintenant fortement défini :

- un Audit porte sur exactement un Composant ;
- un Audit réalisé est `Project Status = Done` ET `Issue State = Closed` ;
- le verdict de conformité est dérivé du dernier Audit terminé applicable au couple Composant × Version ;
- une Anomalie affecte la conformité ; une Improvement ne l'affecte pas ;
- Anomalie et Improvement sont obligatoirement des sous-Issues de leur Audit ;
- chacune appartient à exactement un Audit parent ;
- leurs labels Composant doivent être identiques à celui de l'Audit parent ;
- une Anomalie d'Audit Accessibilité est un `🐛 Bug` ;
- une Improvement d'Audit est une `✨ Feature` ;
- une Anomalie possède exactement une criticité RGAA et exactement une catégorie `♿ a11y:*` ;
- les criticités RGAA sont interdites hors Anomalie d'Audit ;
- les catégories `♿ a11y:*` sont transverses et peuvent exister hors Audit ;
- une Improvement peut ne pas avoir de catégorie a11y ;
- la correction d'Anomalies ne vaut jamais revalidation de conformité ;
- une revalidation est portée par un nouvel Audit ;
- une nouvelle constatation lors d'une revalidation produit une nouvelle Anomalie ;
- l'unité de comptage est l'Issue Anomalie GitHub, pas l'occurrence interne d'un défaut.

### Versions, Releases et temporalité

Les concepts essentiels sont séparés :

- version déclarée dans `package.json` ;
- version d'artefact calculée/publiée par Jenkins ;
- SNAPSHOT, RC, HC et PROD ;
- Tag Git, espace Nexus, Milestone et éventuellement GitHub Release ;
- Audit pré-PROD sur RC versus Audit de rattrapage post-PROD ;
- version de référence versus version effectivement auditée ;
- historique d'une version figé au moment de sa release ;
- un Audit ultérieur ne réécrit pas rétroactivement l'état historique d'une ancienne version.

### Catalogue et couverture

Le modèle distingue :

- Catalogue historique par Version ;
- Composant actif ou décommissionné ;
- Audit effectivement réalisé sur une Version ;
- verdict hérité d'un Audit antérieur applicable ;
- couverture d'Audit ;
- conformité parmi les Composants couverts ;
- évolution du Composant et besoin d'Audit comme concepts séparés.

### Issues et Composants

Les règles principales sont définies :

- toute Issue concernant effectivement un Composant doit avoir son label Composant ;
- une Issue classique peut concerner plusieurs Composants ;
- une Issue transverse peut légitimement n'en avoir aucun ;
- les comptages globaux distincts sont séparés des ventilations par Composant ;
- une Issue multi-Composants compte une fois dans chacun des Composants concernés ;
- le dashboard devra permettre des analyses dynamiques multi-filtres.

## 3. Domaines encore ouverts mais non bloquants immédiatement

Plusieurs sujets peuvent rester ouverts sans empêcher de consolider le modèle :

- cardinalité maximale `♿ a11y:*` des Improvements ;
- vocabulaire/catégorisation future des Improvements ;
- évolution future du référentiel de criticité RGAA ;
- détails UX de représentation des verdicts hérités ;
- représentation d'une réactivation exceptionnelle de Composant ;
- mécanisme exact de comparaison automatique des Composants entre Versions ;
- analyse des applications consommatrices et métriques normalisées par usage ;
- mécanisme opérationnel matérialisant la décision de revalidation.

## 4. Domaines structurants encore insuffisamment stabilisés

Avant de figer le modèle de données complet, il reste surtout à consolider les sujets transverses suivants :

1. **Library / Repository / Package / Component**  
   Les cardinalités cibles entre ces objets ne sont pas encore toutes arrêtées.

2. **Anomalie hors Audit**  
   La définition générale d'une Anomalie et son cycle de vie restent moins précis que le cas Audit Accessibilité.

3. **Workflow par profil**  
   Les exceptions exactes entre STANDARD, AUDIT, EPIC, RELEASE et CONCEPTION doivent être consolidées dans une matrice unique.

4. **Sources et temporalité des dates**  
   Les dates de détection, correction, transitions Project et release doivent être reliées à des sources GitHub/Jenkins/Nexus réellement disponibles.

5. **Référentiel historique des Composants**  
   Le principe du Catalogue par Version est établi, mais sa construction technique n'est pas encore définie.

6. **Sources externes consommateurs**  
   Applications, versions utilisées et occurrences de Composants constituent un futur domaine distinct qui ne doit pas bloquer le premier dashboard.

## 5. Recommandation pour la suite

Ne pas continuer immédiatement avec une Question 101.

Le prochain jalon devrait être une **revue de consolidation du modèle métier** :

1. construire une carte des objets métier et de leurs relations ;
2. construire une matrice des règles par profil de workflow ;
3. classer toutes les questions encore ouvertes en `bloquante V1`, `à confirmer V1`, `V2/futur` ;
4. rechercher les doublons, contradictions et décisions devenues obsolètes ;
5. seulement ensuite reprendre les questions, mais uniquement sur les trous réellement bloquants.

## 6. Critère de sortie de la phase de cadrage

La phase métier pourra être considérée suffisamment stable pour passer à la conception lorsque nous disposerons de :

- un modèle métier consolidé ;
- des cardinalités principales explicites ;
- une matrice de workflow ;
- une matrice des règles/DQ ;
- un catalogue initial des indicateurs avec formules et périmètres ;
- une liste courte de questions réellement bloquantes ;
- une séparation claire entre V1, V2 et futur.

Le nombre de questions posées n'est donc pas le critère de fin. Le critère est la **couverture cohérente du modèle nécessaire au produit V1**.
