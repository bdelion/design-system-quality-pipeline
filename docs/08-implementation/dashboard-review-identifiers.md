# Identifiants de revue de tous les éléments du dashboard

**EXIGENCE CONFIRMÉE — 26 octobre 2026 :** disposer d’un identifiant unique pour tout élément du dashboard afin de désigner sans confusion un chiffre, une fenêtre, un lien GitHub ou un autre élément à valider.

**ÉTAT : implémenté sur la branche dédiée `feat/dashboard-review-identifiers`.** Le mode de revue couvre la page de choix, les dix écrans détaillés et les cinq espaces synthétiques, ainsi que leurs éléments dynamiques. Cette livraison reste distincte de la validation métier de #118.

La branche `fix/118-github-repository-project-links` reste **en attente de validation utilisateur**. Cette demande ne valide ni ses liens ni ses résultats et ne clôt aucune issue existante.

## Couverture exigée

La couverture concerne l’ensemble des sites générés, leurs présentations simplifiée et détaillée, tous les écrans et toutes les fenêtres. Elle ne se limite pas aux fenêtres GitHub.

Chaque page, section, carte, compteur, tableau, liste, ligne, colonne, cellule, fenêtre, lien, bouton, filtre, contrôle de tri, pagination, export, information ou graphique doit pouvoir être désigné individuellement. Un chiffre, le contrôle qui ouvre son détail et le lien GitHub de ce détail constituent des éléments distincts. Les occurrences d’une même entité dans deux écrans ont des identifiants d’élément différents.

Les éléments générés après filtrage, changement de page, ouverture d’une fenêtre ou affichage d’un message vide/indisponible sont également couverts. Une colonne possède sa référence propre ; chaque cellule de cette colonne possède une référence propre à sa ligne. Les conteneurs et leurs contrôles restent distinguables lorsque leurs zones visuelles se recouvrent.

## Unicité et stabilité

L’identifiant désigne un élément logique précis. Il reste stable lors des générations successives d’un même périmètre d’identité, même si la valeur, le libellé, la destination du lien, le tri, la pagination ou la disposition visuelle évoluent.

La construction doit distinguer au minimum le site ou espace d’identité, la présentation, l’écran, le tableau ou la section, l’entité de ligne, la version métier lorsqu’elle distingue la ligne, la colonne et le rôle de l’élément. Deux repositories contenant chacun un composant Table ne partagent donc pas les références de leurs cellules. Les contrôles globaux se distinguent des contrôles de ligne ou de fenêtre.

La position DOM, le numéro de ligne affiché, le texte visible et la valeur mesurée ne sont pas des clés d’identité. Les relations parent/enfant et l’origine d’une fenêtre doivent rester identifiables : deux listes ouvertes depuis des compteurs différents ne deviennent pas la même fenêtre logique parce qu’elles partagent un composant de rendu.

L’espace d’identité du site est stable et distingue deux datasets ou sites sans correspondance explicite. Il ne dépend pas de l’heure de génération ou du dossier de sortie. Une nouvelle génération du même site conserve ses références ; une copie du même rendu conserve également ses références, avec son contexte de génération. Aucune correspondance entre données anonymisées et réelles, ou entre deux identités historiques, n’est inventée.

La référence de génération est séparée de l’identifiant stable. Le couple permet de désigner l’élément et le rendu exact examiné, sans changer l’identifiant de l’élément à chaque build.

## Exemple de distinction

Les formes suivantes sont illustratives : elles ne fixent pas le format technique. Les mentions SITE, REPOSITORY et COMPONENT représentent des clés stables, pas les simples noms affichés.

```text
DSQ-SITE-SIMPLE-COMPONENTS-ACTIVITY-REPOSITORY-COMPONENT-DONE-VALUE
DSQ-SITE-SIMPLE-COMPONENTS-ACTIVITY-REPOSITORY-COMPONENT-DONE-OPEN
DSQ-SITE-SIMPLE-COMPONENTS-ACTIVITY-REPOSITORY-COMPONENT-DONE-DIALOG
DSQ-SITE-SIMPLE-COMPONENTS-ACTIVITY-REPOSITORY-COMPONENT-DONE-GITHUB
```

Ces références désignent respectivement le chiffre, son action d’ouverture, la fenêtre logique et son accès GitHub. Les mêmes rôles dans une autre présentation ou sur un autre repository ont d’autres références. Une cellule de version ajoute la clé de version nécessaire.

## Mode de revue implémenté

Tous les éléments portent leur identité dans le rendu ; le mode de revue permet de la consulter sans encombrer la consultation normale. Une sélection doit pouvoir viser précisément une cellule, son lien ou son conteneur, y compris au clavier. Afficher des identifiants ne doit pas déplacer les tableaux, perturber le focus ou déclencher la navigation sélectionnée.

Une action « Copier la référence » prépare un signalement contenant :

- l’identifiant stable de l’élément et, si utile, son parent et l’élément d’origine ;
- la version du générateur et la référence de génération ;
- la référence et la date du snapshot ;
- la présentation, l’écran et la fenêtre concernés ;
- les clés de repository, composant et version applicables ;
- les filtres, le tri et la pagination actifs.

L’identifiant seul doit être copiable. La copie contextuelle est une action distincte et explicite. Aucun token, contenu RAW, titre ou corps de ticket n’est copié automatiquement. La collecte éventuelle d’une valeur affichée ou d’une URL réelle doit être une option explicite, visible avant copie.

Un accès local permettant de retrouver et surligner un élément par sa référence est proposé. Si une référence est ancienne, absente du snapshot ou masquée par les filtres, l’outil l’explique ; il ne sélectionne pas silencieusement un autre élément.

## Critères d’acceptation

1. Une vérification de couverture recense tous les types d’éléments et espaces des deux présentations ; aucun espace n’est limité aux seuls exemples initiaux.
2. Aucun doublon n’existe dans un rendu ni entre les pages d’un même site ; les sites indépendants disposent d’espaces d’identité distincts. Une collision détectée fait échouer le contrôle au lieu de recevoir un suffixe dépendant de l’ordre de rendu.
3. Modifier les chiffres, libellés ou URL GitHub sans changer l’élément logique ne modifie pas son identité. Trier, filtrer, paginer et rouvrir une fenêtre conserve les références des éléments retrouvés.
4. Deux repositories, composants, versions, colonnes, présentations et origines de fenêtres distincts restent distinguables, y compris lorsque leurs libellés sont identiques.
5. La référence copiée permet de retrouver le même élément et d’identifier la génération examinée. Une référence introuvable donne une explication explicite.
6. Les interactions souris/clavier, noms accessibles, focus, navigation GitHub et exports CSV restent utilisables avec le mode de revue activé ou désactivé.
7. Les tests couvrent les éléments dynamiques, les tableaux sans résultat, les valeurs indisponibles et les fenêtres réutilisant un même composant de rendu.
8. Les budgets de taille et DOM à croissance nulle restent les références existantes. Tout surcoût est mesuré et soumis à validation avant une éventuelle mise à jour des budgets ; aucun seuil n’est relevé silencieusement.

## Utilisation

1. Régénérer le dashboard avec la commande habituelle, puis le servir localement.
2. Sur la page à examiner, appuyer sur **Alt+Maj+R** ou ajouter `?review=1` avant le fragment `#components`, par exemple `simplified/index.html?review=1#components`.
3. Faire **Alt+clic** sur le chiffre, le lien ou le conteneur. Au clavier, placer le focus sur le contrôle puis utiliser **Alt+Maj+I**. « Remonter » sélectionne son conteneur parent.
4. Utiliser **Copier l’identifiant** pour désigner l’élément, ou **Copier le contexte** pour joindre les métadonnées de génération, les filtres et les états de tri/pagination. Ces deux actions sont distinctes.
5. Coller un identifiant dans le champ et choisir **Retrouver** sur le même écran. Un élément absent ou masqué est annoncé ; l’outil ne navigue pas automatiquement vers une autre page de résultats.

Le panneau ne s’affiche pas en consultation normale. Ses contrôles restent accessibles lorsqu’une fenêtre est ouverte et après sa fermeture. L’inspection par Alt+clic évite d’activer le lien sélectionné.

## Contrat technique maintenu

- `data-review-slot` conserve un rôle source permanent. Ces clés sont opaques ; ne pas les renuméroter lors d’un déplacement ou d’une traduction du modèle.
- `data-review-key` porte l’identité explicite d’une entité répétée. Les clés de colonne désignent le schéma du tableau, jamais l’ordre des lignes triées. Les compteurs synthétiques possèdent un élément de valeur distinct de leur bouton.
- `data-review-id` est attribué au DOM courant et actualisé après les rendus. Le format versionné `DSQ1` encode séparément l’espace de site, la présentation, l’écran et les rôles/identités des conteneurs. Les séparateurs sont encodés sans perte ; aucun suffixe de position n’est ajouté en cas de collision.
- L’espace de site utilise le périmètre déclaré et les identités sources des repositories, triées, indépendamment du dossier de sortie et de la date. Un changement de ce périmètre définit un autre espace ; une correspondance anonymisé/réel n’est pas inventée.
- La génération distingue la référence du snapshot, sa capture et une empreinte des sources du générateur accompagnée de sa version package. Le fichier local `review-context.js` ne contient pas de RAW ni de titres de tickets.
- Une fenêtre réutilisée inclut la référence de l’élément qui l’a ouverte. Les actions de son en-tête, ses colonnes et ses lignes héritent de cette origine.
- Les valeurs, titres affichés, URL navigables et tris ne deviennent pas des clés d’élément. Les identités de labels sources et de causes DQ restent celles des populations métier ; changer la population définit une autre entité.
- Toute collision est remontée par l’inventaire et empêche la copie et la recherche. Les tests navigateur échouent sur une collision ; aucun compteur de doublons n’est caché.

La copie contextuelle omet les recherches en texte libre et les titres/corps de tickets. La case **Inclure la valeur visible et l’URL**, désactivée par défaut, autorise explicitement leur copie pour l’élément sélectionné. Les références peuvent contenir des clés techniques de repositories/composants : elles restent à partager selon les règles du dataset.

Les changements CSS de disposition ne réassignent pas les rôles. Lors d’une refonte du modèle DOM ou du schéma de colonnes, préserver explicitement les clés et leur portée ; toute modification de ces identités exige une migration documentée. Un identifiant d’un élément supprimé reste introuvable et n’est pas réaffecté.

## Vérification

`tests/review-identifiers.test.ts` vérifie les espaces et générations. `tests/browser/review-identifiers.spec.ts` inventorie les pages, les données anciennes et les grandes listes ; il contrôle les tris, retours de pagination, fenêtres réutilisées, copie, recherche et collisions. Les tests existants conservent leurs assertions de contenu, de métriques et d’accessibilité.

Les surcoûts sont mesurés séparément des seuils : aucune augmentation de budget n’est acceptée implicitement par l’implémentation.

## Budgets validés le 26 octobre 2026

Accord utilisateur : « Oui, actualiser ces références ». Le seuil reste à **0 %** pour les changements suivants.

| Périmètre             |                          Ajout HTML |    Dont JSON | Dépassement du plafond DOM antérieur |
| --------------------- | ----------------------------------: | -----------: | -----------------------------------: |
| Choix de présentation |                          531 octets |            0 |                               1 nœud |
| Vue synthétique       |                        2 544 octets | 1 514 octets | 168 nœuds (maximum des cinq espaces) |
| Pages détaillées      | 2 187 à 75 793 octets selon la page |            0 |                                Aucun |

Les lignes initiales et rendues ne changent pas. Les plafonds DOM antérieurs restent conservés lorsqu’ils sont supérieurs aux nouvelles mesures. Les fichiers `config/benchmark-control-baseline.json` et `config/benchmark-simplified-baseline.json` conservent les valeurs précédentes et la validation. Le panneau de revue est créé uniquement après activation et reste exclu des mesures de consultation normale.
