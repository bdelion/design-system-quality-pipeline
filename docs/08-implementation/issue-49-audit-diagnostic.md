# Diagnostic local de l’issue #49

**IMPLÉMENTÉ / LIMITES DE DONNÉES.** Analyse du 13 octobre 2026 sur `datasets/20261013` et `data/output/20261013`, conservés sans modification. Les chiffres de référence concernent la campagne des tâches « Audit RGAA » de `demo-react`, et non tous les bugs et audits historiques du dépôt.

## Intégrité et comparaison

Le manifeste ne correspond plus à `dataset.json` après la modification locale de trois issues, confirmée par l’utilisateur. Ces trois différences avec le snapshot concernent un autre dépôt ; les 1 509 issues de `demo-react` sont identiques. Le rejeu de diagnostic a utilisé une copie temporaire explicitement locale et les nouvelles conventions DSQ d’audit, sans valider artificiellement le manifeste original. Ce rejeu comparatif ne représente pas une migration du dataset source.

## Résultats démontrés

| Mesure                                     | Snapshot initial                        | Rejeu corrigé / constat                           |
| ------------------------------------------ | --------------------------------------- | ------------------------------------------------- |
| Audits retenus pour le dépôt               | 50, incluant des inférences historiques | 28 tâches reconnues par les stratégies explicites |
| Composants avec un audit de cette campagne | À distinguer des historiques            | 27                                                |
| Audits terminés / en cours / à faire       | Mélange historique et campagne          | 16 / 2 / 10                                       |
| Relations parent conservées dans le RAW    | 0                                       | 0 : une nouvelle collecte est nécessaire          |
| Catalogues historiques                     | 39 manquants                            | Présence composant × version non démontrée        |

Le nouveau profil DSQ configure `auditDetection.allowLegacyIssueTypes: false` : ses stratégies explicites sont autoritaires. L’ancienne interprétation de `issueType: AUDIT`, parfois inférée du texte par le collecteur, reste disponible pour les anciens profils où cette option est absente, ou lorsqu’elle vaut `true`. Le profil DSQ reconnaît aussi `Enhancement` et `Improvement` comme variantes de `FEATURE` : une amélioration ne devient `AuditImprovement` qu’avec un parent Audit valide (D-233). Elle ne modifie pas la conformité (D-225).

Le collecteur GraphQL conserve maintenant le parent explicite avec son repository et son numéro. L’anonymisation résout cette identité à travers tous les repositories. Aucun rattachement n’est fabriqué à partir d’un nom de composant ou d’un label. Le contrat API est documenté dans [GitHub GraphQL : Issue.parent](https://docs.github.com/en/graphql/reference/issues#issue).

## Écarts qui ne doivent pas être masqués

La population accessibilité initiale contient 20 bugs de type GitHub `Bug` et six anciens bugs inférés, non annulés. Ces derniers ajoutent notamment quatre criticités mineures et trois issues traitées : cela explique les 7 mineures et 7 traitées du snapshot, au lieu des 3 et 4 attendues pour la campagne. Le pipeline conserve ces autres bugs ; il ne peut pas les attribuer à la campagne sans relation explicite.

Un bug de CopyString n’a ni criticité ni catégorie : sans son parent, sa qualification reste non prouvée et il n’entre pas dans la répartition accessibilité. La relation explicite permettrait de le qualifier, tout en conservant sa criticité inconnue. Pour Table, le RAW contient un bug ciblant `1.9.0`, au-delà du package `1.8.0` : il est exclu du périmètre accessibilité courant, conformément au contrat des versions futures. D’autres bugs de Table ne portent aucun label RGAA ; leur appartenance à l’audit n’est pas démontrée. Les catégories observées ne sont pas identiques à la saisie de l’issue : 3 « navigation clavier » et 1 « statut » sur les bugs typés, notamment. Ne pas remplacer leurs labels pour obtenir artificiellement les nombres attendus.

Les 8 composants conformes et 9 non conformes cités dans l’issue incluent un audit encore en cours. D-221 et D-223 distinguent ce constat d’un verdict courant couvert : un audit incomplet ne crée pas la couverture et ne remplace pas un verdict acquis. Les 39 catalogues historiques absents empêchent en outre de prouver les populations composant × version (D-219). Les ratios correspondants restent inconnus. Ce diagnostic ne migre pas la règle de date d’audit D-047 ni les cohortes d’audits établies par D-222.

## Parcours de vérification

Le diagnostic ci-dessus conserve les constats du premier jeu `20261013`. Pour le jeu anonymisé plus récent `datasets/issue-49` et son référentiel Excel désormais intégré, suivre le [parcours concret de préparation et de consultation](datasets.md#cas-concret--le-dataset-de-lissue-49). Il utilise `datasets/issue-49-historique` et une destination dédiée, sans réécrire les données de ce diagnostic initial.

Effectuer une nouvelle collecte avec GraphQL et le profil DSQ mis à jour, puis préparer un nouveau dataset et une nouvelle destination de pipeline. Les nouveaux parents ne sont pas récupérables en rejouant le RAW actuel. Les configurations capturées sont figées : modifier le profil livré ne réécrit pas les anciens datasets. Le nouveau profil porte modèle `2.4` / règle `dq-2026.10-audit-relations` pour distinguer les runs.

Vérifier ensuite les relations Audit → Bug/Enhancement et les milestones réellement présentes. Le catalogue courant peut enrichir les métadonnées ; il ne remplace pas les preuves historiques de présence par version. Les tests synthétiques de `tests/audit-campaign.test.ts` couvrent ces frontières sans versionner les données personnelles.
