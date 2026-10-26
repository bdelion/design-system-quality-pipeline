# Identifiants de revue de tous les éléments du dashboard

**EXIGENCE CONFIRMÉE — 26 octobre 2026 :** disposer d’un identifiant unique pour tout élément du dashboard afin de désigner sans confusion un chiffre, une fenêtre, un lien GitHub ou un autre élément à valider.

**ÉTAT : demande de conception enregistrée, non implémentée.** Le présent document décrit l’évolution attendue ; il ne prouve pas que les dashboards générés disposent déjà de ces identifiants. L’algorithme et le format technique définitifs restent des propositions à préciser lors de l’implémentation.

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

## Mode de revue proposé

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

## Critères d’acceptation de l’implémentation future

1. Une vérification de couverture recense tous les types d’éléments et espaces des deux présentations ; aucun espace n’est limité aux seuls exemples initiaux.
2. Aucun doublon n’existe dans un rendu ni entre les pages d’un même site ; les sites indépendants disposent d’espaces d’identité distincts. Une collision détectée fait échouer le contrôle au lieu de recevoir un suffixe dépendant de l’ordre de rendu.
3. Modifier les chiffres, libellés ou URL GitHub sans changer l’élément logique ne modifie pas son identité. Trier, filtrer, paginer et rouvrir une fenêtre conserve les références des éléments retrouvés.
4. Deux repositories, composants, versions, colonnes, présentations et origines de fenêtres distincts restent distinguables, y compris lorsque leurs libellés sont identiques.
5. La référence copiée permet de retrouver le même élément et d’identifier la génération examinée. Une référence introuvable donne une explication explicite.
6. Les interactions souris/clavier, noms accessibles, focus, navigation GitHub et exports CSV restent utilisables avec le mode de revue activé ou désactivé.
7. Les tests couvrent les éléments dynamiques, les tableaux sans résultat, les valeurs indisponibles et les fenêtres réutilisant un même composant de rendu.
8. Les budgets de taille et DOM à croissance nulle restent les références existantes. Tout surcoût est mesuré et soumis à validation avant une éventuelle mise à jour des budgets ; aucun seuil n’est relevé silencieusement.

L’implémentation future inclura ses tests, sa documentation et les contrôles du dashboard. Aucun code applicatif, compteur, lien GitHub ou budget n’est modifié par l’enregistrement de cette demande.
