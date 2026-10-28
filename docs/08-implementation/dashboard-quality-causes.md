# Synthèse des causes DQ — #88

**IMPLÉMENTÉ dans le patch.** La page Qualité des données présente les causes avant leurs occurrences détaillées. Une cause affiche son libellé français, son code, sa sévérité, l'action déclarée, les indicateurs et motifs d'impact, ainsi que la prochaine vérification disponible. Les libellés de présentation et suggestions de vérification s'appuient sur les [fiches de règles](../quality-rules.md), leur [référentiel métier](../03-regles/regles-qualite-donnees.md) et `config/quality-rules.yaml`. Aucun moteur de règle ni calcul d'indicateur n'est modifié.

## Regroupement et décomptes

Le regroupement conserve exactement la règle, le message source, la sévérité, l'action, le type d'entité, les impacts complets (indicateur, action, motif) et la disponibilité d'une source résolue. Seul l'ordre des impacts est neutralisé. Des messages ou effets différents restent séparés, même sous un code commun. Les identités des occurrences et leurs URL ne sont pas des critères de séparation ; elles restent accessibles dans le détail et le CSV. Aucune occurrence n'est dédupliquée.

Les filtres s'appliquent avant le regroupement : la somme des occurrences de tous les groupes correspond au total filtré. Ainsi, 120 anomalies sans criticité peuvent former un groupe de 120 occurrences ; cela ne démontre ni 120 défauts produit ni 120 non-conformités RGAA. La synthèse concerne la fiabilité des données.

La partition est volontairement conservatrice : des messages dynamiques différents peuvent produire beaucoup de petits groupes. Elle n'essaie pas de deviner une cause commune par similarité de texte. Une règle inconnue conserve son code et son message, avec « Cause non documentée ». Une action inconnue ou une source non résolue rend la vérification indisponible ; aucune correction ni URL n'est inventée.

## Détail, liens et export

« Voir les occurrences » limite le tableau détaillé et son CSV à la cause choisie, en conservant les filtres. « Toutes les causes » rétablit toutes les occurrences filtrées. La synthèse continue de montrer tous les groupes du périmètre filtré pour permettre la réconciliation. Le CSV conserve toutes les occurrences concernées, toutes pages, et leurs preuves originales.

Le paramètre URL `dqCause` identifie un groupe dans la capture courante ; cet identifiant n'est pas un identifiant métier stable entre captures. Un identifiant inconnu affiche « Indisponible » et désactive l'export, sans substituer les résultats globaux. Réinitialiser efface aussi ce paramètre.

La synthèse et les occurrences ont chacune une pagination de 50 lignes. Les données sont dérivées du JSON DQ existant, sans ajouter un second jeu de données. Le HTML initial borne séparément ces deux listes à 50 lignes ; les autres tableaux de la page restent hors de cette limite. La partition parcourt toutefois l'ensemble des diagnostics en mémoire.

## Clavier et validation

Les messages source se déplient dans des éléments `details` natifs. Les boutons sont accessibles au clavier ; choisir une cause place le focus sur le titre du détail, revenir à toutes les causes sur le résumé. Les contrôles de pagination conservent le contrat de [#87](dashboard-pagination.md).

Les tests unitaires vérifient les 120 occurrences, les critères de séparation, l'ordre des impacts, l'immutabilité et les informations inconnues. Les tests navigateur PC vérifient les décomptes, les filtres et la recherche, l'URL ciblée, le clavier, les preuves et l'export complet depuis une dernière page partielle. Les tests de pagination existants couvrent toujours 3 000 diagnostics.

## Budget

Le [contrôle synthétique #81 face à la référence #87](benchmarks/issue-88-review.md) mesure sur DQ : +21 709 octets HTML, +30 lignes de synthèse initiales et rendues, +847 nœuds DOM. Le JSON et les autres pages restent inchangés. Ces ajouts ont déclenché le budget de croissance de 0 %. **Validation explicite de l'utilisateur le 19/10/2026 : « Oui, valider ces ajouts et la nouvelle référence ».** La référence automatique est actualisée pour ce coût fonctionnel ; l'alerte dès la moindre augmentation et le budget de 0 % restent inchangés. Le rapport de revue conserve les dépassements constatés avant cette validation. Les contrôles de performance et ces mesures synthétiques ne constituent pas une mesure de production.

Le [contrôle final](benchmarks/issue-88-control.md) ne présente aucun dépassement : les mesures HTML/JSON, lignes initiales/rendues et nœuds DOM sont identiques à la référence approuvée. `npm run check:dashboard` passe avec 350 tests unitaires et 57 tests navigateur. TypeDoc conserve son avertissement préexistant sur le type `Resource`.
