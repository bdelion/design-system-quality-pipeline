# Revue du dashboard : UX, UI et architecture

**REVUE du 14 octobre 2026 — constats et propositions, sans modification du produit.**

Branche `review/dashboard-ux-ui-technique`, issue de `feat/69-durees-epics`, au commit de référence `34bcb2c`. Le périmètre comprend l'import historique local et le suivi des Epics. Cette revue ne migre aucune décision métier.

## Avis général

Le dashboard possède une base solide pour un outil d'investigation : séparation des populations, provenance, filtres, CSV, inconnues explicites et relations vers les sources. Sa direction visuelle est cohérente : navigation stable, palette bleu/blanc, surfaces distinctes, titres lisibles et états textuels.

Il reste difficile à utiliser comme outil quotidien de décision. L'utilisateur doit interpréter plusieurs périmètres, parcourir des explications longues et manipuler plusieurs systèmes de filtres avant d'atteindre les données. La densité technique prend parfois le pas sur la question métier. À volume réel, la quantité de données livrées au navigateur constitue un problème plus urgent qu'une nouvelle refonte graphique.

Mon ordre de priorité : **rendre les chiffres fiables à interpréter, réduire le volume transporté, simplifier les parcours, puis affiner la présentation**. Garder la palette et la navigation principale ; travailler d'abord les populations, les messages, les filtres et les tableaux.

## Méthode et limites

- Inspection du code courant et génération isolée depuis le snapshot anonymisé `data/output/issue-49-historique/current/snapshot.json`. Les datasets et sorties d'origine restent intacts.
- Population source : 3 dépôts, 1 764 issues et 1 511 PR ; historique local avec 2 316 relations composant/version. Le snapshot garde ses calculs existants ; le modèle d'activité Epic est ajouté à la copie de prévisualisation pour examiner son état sans références anciennement collectées.
- Inspection dans Edge automatisé, à 1 440 × 1 000 et 390 × 844. Pages visitées : Vue d'ensemble, Composants, Accessibilité, Activité, Qualité des données et Epics. Mobile : Vue d'ensemble et Composants. Audits, Cartographie et Historique sont générés et étudiés dans le code, sans revue visuelle exhaustive.
- Parcours ciblé : filtrer Tag, ouvrir sa qualité par version, confronter les messages de résultats et les filtres.
- Artefacts locaux ignorés par Git : `data/output/review-dashboard-20261014/`, captures PNG, `observations.json` et `interactions.json`. Les captures ne sont pas ajoutées au dépôt.
- Aucune erreur JavaScript observée sur les six navigations. Pas de débordement horizontal du document à 390 px sur les deux pages mobiles ; les tableaux restent larges à l'intérieur de leur conteneur.
- Les temps ci-dessous incluent navigation, attente de 500 ms et capture d'écran. Un passage local, sans répétitions ni profil réseau : ce ne sont ni des mesures Web Vitals ni un benchmark de production.
- Aucun test utilisateur ni audit WCAG exhaustif réalisé. La revue ne vaut pas certification d'accessibilité. Les tests du logiciel n'ont pas été relancés pour ce lot documentaire.

## Constats prioritaires

P1 : risque d'interprétation erronée ou obstacle majeur à l'usage. P2 : friction fréquente. P3 : amélioration de finition. L'effort S/M/L est indicatif et devra être estimé lors de la conception.

| ID  | Priorité / effort | Constat démontré                                                                                                                                                                                                                | Conséquence                                                                                                             | Proposition et critère de validation                                                                                                                                                                                                                                                                   |
| --- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R01 | P1 / M            | Accessibilité annonce la « version PROD courante », mais `workspaceAnalytics` choisit la version numériquement maximale sans vérifier `prodTag` ni `channel`. Sur demo-react : 1.7.1 est publiée et 1.8.0 est en développement. | L'utilisateur peut interpréter une couverture de développement comme une couverture PROD.                               | Définir explicitement le mode par défaut, puis aligner texte, population et calcul. Test avec PROD 1.7.1 et développement 1.8.0 ; afficher le canal et la version réellement utilisés. Ne pas résoudre cet écart en réécrivant silencieusement une décision.                                           |
| R02 | P1 / L            | L'accueil contient environ 24,1 Mo de snapshot et 14,4 Mo de données `workspace-data`, déjà présentes dans le snapshot. Les espaces calculés comportent 19 064 contextes. Chaque page reçoit cette duplication.                 | Parsing et transfert importants, même pour une page affichant seulement trois dépôts ; la navigation multiplie le coût. | Construire des contrats de lecture par page ; charger une ressource partagée une seule fois lorsque nécessaire. Sortir le RAW et les agrégats non utilisés des HTML. Budgets initiaux proposés : accueil < 1 Mo non compressé et données partagées sans duplication ; vérifier la parité des chiffres. |
| R03 | P1 / S–M          | Sur Composants, le retour global annonce « 0 lignes visibles » alors que l'explorateur annonce 83 composants et 360 issues distinctes. Le compteur global ne sélectionne pas les lignes dynamiques de cet explorateur.          | Le dashboard contredit ses propres résultats et suggère une absence de données.                                         | Un retour de filtrage par population ; aucune somme de lignes hétérogènes. Vérifier recherche, filtre partagé, remise à zéro et navigation ciblée sur le volume réel.                                                                                                                                  |
| R04 | P2 / M            | Composants dispose des filtres partagés puis d'un deuxième groupe local avec repository, composant et version. Les cartes de délais apparaissent avant le tableau métier.                                                       | Deux endroits pour exprimer le même besoin ; effort pour comprendre lequel pilote quoi.                                 | Une barre de périmètre unique, recherche proche du tableau, options avancées repliables. Résumé explicite du périmètre actif et remise à zéro cohérente.                                                                                                                                               |
| R05 | P2 / M            | Le tableau Composants commence à environ 1 264 px sur desktop et 2 559 px sur mobile. L'introduction explique plusieurs approximations GitHub avant les résultats.                                                              | Les données recherchées arrivent après plus d'un écran desktop et trois écrans mobiles.                                 | Raccourcir l'introduction à une phrase de périmètre ; déplacer le détail vers une aide accessible. Remonter le résultat métier et les filtres essentiels. Objectif proposé : voir le début du résultat à 900 px sur desktop, hors aide ouverte.                                                        |
| R06 | P2 / M            | La carte Accessibilité affiche notamment 28,6, 21,1 et 50 sans symbole `%`, tandis que les cartes de durée indiquent des jours et parfois leurs populations.                                                                    | L'unité et le dénominateur nécessitent une interprétation.                                                              | Associer systématiquement valeur, unité, population et réserve. Exemple : « 21,1 % · 16 sur 76 composants présents ». Test de rendu pour pourcentage, durée, zéro et indisponibilité.                                                                                                                  |
| R07 | P2 / M            | Le tableau d'accueil compte les identités de composants ; la carte globale compte les actifs ; Accessibilité utilise une présence/version. Sur ce jeu, le dépôt affiche 85 identités et Accessibilité une population de 76.     | Ces nombres peuvent être légitimes mais paraissent contradictoires si la population reste implicite.                    | Nommer précisément chaque population et rendre son périmètre consultable. Ne pas forcer les nombres à être égaux : conserver les disparitions, réapparitions et présences inconnues.                                                                                                                   |
| R08 | P2 / M            | Les compteurs ouvrent une recherche GitHub actuelle et parfois approchée, alors que les chiffres proviennent du snapshot. Les avertissements existent mais sont regroupés dans des paragraphes longs.                           | L'utilisateur s'attend à retrouver exactement les éléments comptés, puis perd confiance si GitHub diffère.              | Distinguer dans le libellé et près du lien « éléments du snapshot » et « recherche GitHub actuelle ». Proposer une liste interne exacte quand les identifiants sont disponibles. Conserver l'ouverture GitHub choisie par l'utilisateur.                                                               |
| R09 | P2 / M–L          | Qualité des données affiche 3 030 alertes et 88 207 nœuds DOM ; l'activité atteint 76 028 nœuds. Les diagnostics exposent des codes, `include`, des identifiants techniques et du texte anglais.                                | Surcharge de lecture et de rendu ; absence d'une première action évidente.                                              | Regrouper les alertes par cause et effet métier, paginer les entités, traduire le résumé tout en gardant le message source dans le détail. Premier écran : causes dominantes, indicateurs affectés, prochaine vérification.                                                                            |
| R10 | P2 / M            | Sur mobile, les six entrées de navigation occupent environ 170 px sous le bandeau. Les filtres empilés de Composants remplissent ensuite l'écran avant les résultats.                                                           | Adaptation sans débordement global, mais priorité faible aux tâches de consultation.                                    | Navigation compacte et accessible, panneau de filtres repliable, résumé actif toujours visible. Garder les comparaisons complexes en tableau défilant avec indication de défilement et colonne d'identification stable.                                                                                |
| R11 | P2 / S–M          | La fraîcheur est surtout dans le pied de navigation ; le badge « partielle » est peu explicatif. Les pages mélangent état de la collecte et qualité du résultat.                                                                | Difficile de savoir si le problème est la date, une donnée absente ou la conformité du composant.                       | Montrer date de collecte, périmètre et réserve principale près du titre ; permettre d'ouvrir les causes du statut global. Distinguer fraîcheur, fiabilité et conformité.                                                                                                                               |
| R12 | P3 / S            | En-têtes techniques en capitales et police `ui-monospace`, avec plusieurs tailles de 10–11 px ; nombreuses conventions de statuts et libellés.                                                                                  | Lecture dense, particulièrement dans les tableaux et sur mobile.                                                        | Standardiser titres de colonnes, tailles, espacements, alignement des nombres et unités. Utiliser une police technique pour les identifiants, pas pour tous les en-têtes. Préserver le vocabulaire GitHub utile dans les détails.                                                                      |

## Retour UX : questions métier et parcours

### Vue d'ensemble

L'accueil répond actuellement surtout à « quelle activité avons-nous ? ». Les stocks de dépôts, issues, PR et défauts sont utiles, mais une personne responsable de qualité cherche aussi « où intervenir ? », « quelle version est évaluée ? » et « qu'est-ce qui empêche de conclure ? ».

**PROPOSITION :** conserver les tableaux demandés, mais les compléter à terme par une synthèse courte du périmètre et des priorités : version/canal, composants non couverts, conformité démontrée et réserves empêchant de conclure. Le choix de ces priorités doit être validé avec les utilisateurs métier ; ne pas créer de score de qualité opaque.

Un nombre de défauts ou d'issues n'est pas une mesure directe de qualité. La présence de 74 défauts normalisés dans un dépôt ne signifie pas 74 anomalies RGAA ouvertes. Les distinctions existantes sont une force à préserver, mais elles doivent apparaître dans les titres et les populations, pas seulement dans une notice.

### Composants et versions

Deux questions doivent rester distinctes : « quel est le résultat de cet audit ? » et « quelle conformité est démontrée pour ce composant dans cette version ? ». L'ajout de « Qualité par version » répond à la seconde, mais enfouit une information métier centrale dans une cellule déjà chargée et contenant potentiellement 40 versions.

**PROPOSITION :** conserver une liste compacte de composants, puis une fiche ou un panneau de détail avec version/canal choisi, résultat d'audit, conformité héritée, présence historique et liens justificatifs. Les noms historiques Table/RMCTable et les nouvelles incarnations doivent rester visibles dans ce détail. Une synthèse courante ne doit pas effacer l'historique.

### Accessibilité et audits

Les cartes, ventilations et listes de revue offrent une bonne base opérationnelle. Le taux de couverture et la conformité ont des dénominateurs différents ; ce contraste doit être expliqué immédiatement. « Non couvert », « non conforme » et « inconnu » ne sont pas trois couleurs interchangeables.

**PROPOSITION :** un bandeau de périmètre décrivant la population, le canal et les exclusions ; les cartes prioritaires en premier, puis les ventilations et la liste des actions. Donner accès aux preuves depuis le chiffre concerné et garder une légende textuelle.

### Activité et Epics

L'activité globale et le suivi d'une Epic répondent à des besoins différents. Leur proximité dans la navigation est adaptée. La durée calendaire d'Epic doit rester distincte d'une charge réelle ou d'un engagement de délai. La vélocité doit conserver sa valeur source, y compris zéro.

Sur l'ancienne fixture utilisée ici, les références de description n'ont pas été collectées. Cet état ne permet pas une revue réaliste des lignes de l'Epic ; il permet de vérifier l'explication de l'indisponibilité. La page doit conduire vers l'action « refaire collecte et préparation », sans affirmer qu'aucune issue n'est rattachée.

### Qualité des données

Le détail technique est nécessaire pour le diagnostic, mais ne devrait pas constituer l'entrée principale. Les 247 erreurs et 2 781 avertissements ne sont pas 3 028 anomalies produit à corriger. Commencer par les causes et les métriques concernées, puis permettre d'ouvrir les occurrences, la règle et la source.

## Retour UI : conserver la direction, réduire la charge

Les captures montrent une structure stable, une hiérarchie des grands titres, des panneaux calmes et une navigation identifiable. Une nouvelle palette ne résoudrait pas les principaux problèmes observés.

Les améliorations proposées portent sur :

- une hiérarchie courte « question → périmètre → résultat → preuve », avec l'aide longue repliable ;
- des valeurs toujours accompagnées d'une unité, des chiffres alignés et des dénominateurs lisibles ;
- des libellés cohérents : français dans l'interface, terminologie et identifiants source dans les détails ;
- des tableaux avec colonnes essentielles et détails à la demande, plutôt qu'un empilement de petites cellules ;
- un état vide indiquant ce qui manque et comment obtenir le résultat ;
- des variantes explicites pour conforme, non conforme, non couvert, inconnu, développement et fiabilité partielle, sans dépendre uniquement de la couleur ;
- une navigation mobile moins haute et des filtres qui n'éclipsent pas le contenu.

Les repères de taille et de poids de fichier de cette revue sont des **objectifs proposés**, pas des décisions métier ni des normes de conformité.

## Retour Lead Dev : responsabilité et coût de rendu

### Mesures sur le jeu examiné

| Page                       | Nœuds DOM | Lignes de tableaux dans le DOM | Navigation + attente + capture |
| -------------------------- | --------: | -----------------------------: | -----------------------------: |
| Vue d'ensemble             |       267 |                              6 |                         11,0 s |
| Composants                 |    16 742 |                             83 |                          4,5 s |
| Accessibilité              |     1 397 |                             62 |                          6,6 s |
| Activité                   |    76 028 |                          4 433 |                         11,7 s |
| Qualité des données        |    88 207 |                          3 036 |                          9,0 s |
| Epics, état sans sélection |       113 |                              0 |                          4,9 s |

Le nombre de lignes DOM ne représente pas une population métier : il peut inclure plusieurs tableaux et leurs occurrences. Les compteurs métier doivent rester distincts. Les HTML sur disque vont d'environ **38,5 à 46,9 Mo** sur les pages inspectées, non compressés.

La duplication est identifiable dans [generate.ts](../../src/dashboard/generate.ts) (`serializedSnapshot`, `window.__SNAPSHOT__`) et [workspaces.ts](../../src/dashboard/workspaces.ts) (`workspacePayload`). Le snapshot complet contient déjà `analytics.workspaces`, puis le même modèle est sérialisé dans un second script. Les RAW, relations et réserves complets suivent ainsi chaque navigation, même lorsque le DOM de l'accueil reste petit.

**PROPOSITION d'architecture :** garder les calculs métier dans le pipeline, produire des modèles de lecture versionnés par usage, partager uniquement les métadonnées et charger les détails nécessaires au parcours. Le dashboard reste statique ; aucun backend métier n'est requis pour servir des fichiers JSON locaux sur HTTP. Vérifier le contrat de distribution et l'état `file:` avant de choisir cette évolution.

Paginer les résultats longs et limiter le DOM initial. Évaluer une virtualisation seulement si la pagination ne répond pas au besoin, car le clavier, les liens ciblés et l'export complet doivent rester fiables. Le CSV doit représenter la sélection métier, pas uniquement la page affichée.

Le générateur combine de grands templates et de nombreux parcours de collections. Des appels répétés à `issueFacts(snapshot)` restent visibles dans les vues de cartographie et d'audits. Cela constitue une **piste de profilage**, pas une mesure démontrée de leur coût dans cette revue. Préférer des index préparés et des fonctions de rendu courtes, sans déplacer les règles métier dans le JavaScript du navigateur.

### Tests à renforcer lors des corrections

- Cohérence du libellé, de la version et du canal sur un jeu avec PROD et développement simultanés.
- Retours de filtrage correspondant réellement aux explorateurs, y compris liens ciblés et valeurs inconnues.
- Contrats de population : identités historiques, composants actifs, présences par version, résultats d'audit.
- Budget de taille et de DOM sur un scénario synthétique de volume représentatif, sans intégrer les données locales privées au dépôt.
- Export de toute la sélection après pagination, et maintien des liens et preuves.
- Clavier, focus, annonces des résultats, zoom et mobile sur les nouveaux états interactifs.
- Vérification des variantes de payload pour éviter un second calcul métier dans une page.

## Confrontation aux règles établies

| Règle et source                                                                   | Comportement observable                                                                                                         | Écart ou risque                                                                                                 | Action proposée                                                                                                | Validation nécessaire                                                                   |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| D-217 / D-218 : renommage explicite et nouvelle identité après disparition        | L'import local conserve les règles Table/RMCTable et les incarnations. La vue Composants regroupe par nom pour la consultation. | Une ligne par nom peut cacher plusieurs identités et leur portée temporelle.                                    | Exposer incarnation et noms historiques dans le détail, sans fusionner les preuves.                            | Cas Table/RMCTable, Radio et DatePicker ; vérifier les audits par identité/version.     |
| D-219 : présence composant/version démontrée                                      | Historique local et relations explicites ; populations différentes entre vues.                                                  | Un total général peut être lu comme une présence dans la version sélectionnée.                                  | Nommer la population et permettre d'examiner ses preuves.                                                      | Cas présent, absent, inconnu et développement ; aucune présence fabriquée.              |
| D-221 / D-223 : audit incomplet sans couverture ni remplacement du verdict acquis | Résultat propre à l'audit et qualité par version sont distincts.                                                                | « En cours » peut sembler incompatible avec une conformité héritée si les deux résultats ne sont pas expliqués. | Présenter les deux questions et leurs sources séparément.                                                      | Audit ancien terminé, audit récent incomplet et version suivante.                       |
| D-225 : amélioration sans effet sur la conformité                                 | Cas Tag conforme avec une amélioration, et preuve par version.                                                                  | L'activité ouverte peut être assimilée à une non-conformité.                                                    | Séparer anomalies d'audit et améliorations dans les détails.                                                   | Cas Tag et compteurs ouverts, sans nouvelle règle métier.                               |
| D-228 : non couvert distinct de non conforme                                      | Les états existent dans le pipeline.                                                                                            | Risque de simplifier les états dans une synthèse unique « qualité ».                                            | Conserver non couvert et inconnu dans les libellés et légendes.                                                | Absence d'audit et absence de preuve de présence traitées différemment.                 |
| D-047 : date de réalisation quand Done ET Closed sont réunis                      | `auditCompletedAt` utilise `lastDoneAt` après vérification de l'état traité.                                                    | Écart déjà documenté si Closed intervient après Done ; cette revue ne le crée pas.                              | Arbitrer séparément la règle de date et son explication avant de promettre un ordre ou délai conforme à D-047. | Scénarios Done avant Closed et Closed avant Done ; migration uniquement après décision. |
| Contrat d'interface : conformité par version PROD courante annoncée               | `workspaceAnalytics` choisit la version maximale, incluant une version de développement.                                        | R01 : incohérence entre texte et calcul.                                                                        | Aligner le mode et le canal effectivement évalués.                                                             | Test explicite 1.7.1 PROD / 1.8.0 développement ; choix du mode à valider.              |

Sources normatives : [registre des décisions](../00-cadrage/questions-ouvertes.md), [audits](../01-metier/audits.md). Sources d'implémentation : [contrat du dashboard](dashboard-coherence.md), [workspaces Analytics](../../src/analytics/workspaces.ts), [normaliseur](../../src/normalizers/github.ts), [gestion du contexte](../../src/dashboard/assets/app.js).

## Séquence recommandée

1. **Fiabilité de lecture :** trancher le périmètre courant PROD/développement, corriger le compteur de filtrage et rendre unités/populations explicites. Cela ne demande pas une refonte de palette.
2. **Volume :** supprimer les payloads dupliqués, produire les modèles de lecture utiles, paginer activité et DQ. Fixer les budgets sur un jeu représentatif avant optimisation.
3. **Parcours :** unifier les filtres, remonter le tableau Composants, proposer un détail par composant/version et une entrée DQ orientée causes/actions.
4. **Finition UI :** typographie des tableaux, états, résumé de fraîcheur, navigation mobile et aides accessibles.

Cette séquence reste une proposition de backlog. Aucun changement d'interface, de calcul, de registre, de dataset ou de convention métier n'est appliqué dans cette branche de revue.
