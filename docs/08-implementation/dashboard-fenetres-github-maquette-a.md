# Fenêtres GitHub : maquette A validée (#115)

**DÉCISION DE PRÉSENTATION VALIDÉE — 24 octobre 2026.** L’utilisateur a choisi : « Je choisi A. »

**ÉTAT : demande enregistrée, correction de l’application à implémenter et à vérifier.** Ce document ne constitue pas une preuve que le dashboard généré respecte déjà la demande. Il précise la cible de [l’issue #115](https://github.com/bdelion/design-system-quality-pipeline/issues/115) après le rejet des présentations précédentes.

## Référence visuelle

Ouvrir le [prototype HTML autonome](maquettes/fenetres-github.html) dans un navigateur, puis choisir **Voir A — lien sur la ligne du titre**. Le prototype conserve aussi la variante B pour la traçabilité de la comparaison ; **B n’est pas retenue**.

Le prototype utilise uniquement des données fictives. Le lien GitHub y est simulé : il ne valide ni une requête réelle ni son résultat sur les données non anonymisées. Les exports et la pagination servent à examiner les interactions de la maquette.

```text
┌──────────────────────────────────────────────────────────────────┐
│ Issues total                Ouvrir dans GitHub ↗       Fermer     │
├──────────────────────────────────────────────────────────────────┤
│ Librairie / composant · Tous les états                            │
│ 14 issues                                  Exporter en CSV       │
│ Liste des issues                                                 │
│ Pagination                                                       │
└──────────────────────────────────────────────────────────────────┘
```

## Exigences de la correction

- Un seul accès global **Ouvrir dans GitHub**, dans l’en-tête de chaque fenêtre concernée, à droite du titre, près de **Fermer**.
- Aucun accès GitHub supplémentaire en haut des pages, dans les outils des tableaux, dans les cartes ou à côté des cellules. Les cellules conservent leur action d’ouverture de la fenêtre locale.
- Aucun découpage de l’accès GitHub en lots : aucun lien « lot 1/N », ni liste de recherches à ouvrir successivement.
- L’accès global concerne toute la population de la fenêtre et ses filtres, indépendamment de la page de résultats affichée localement.
- Lorsqu’il n’y a qu’un élément, ouvrir directement son URL source dans un nouvel onglet. Le prototype utilise alors le libellé équivalent **Ouvrir l’issue dans GitHub**.
- Les totaux issues/PR doivent inclure tous les états, sans filtre ouvert/fermé implicite. Les autres recherches doivent respecter la population effectivement affichée.
- Les liens individuels des tickets de la liste restent distincts de cet accès global ; la demande rejette les ajouts qui encombrent les pages et les tableaux principaux.
- Préserver les exports CSV, les filtres, les tris, la pagination, l’accessibilité et la présentation compacte.

## Points fonctionnels restant à traiter

La construction d’une recherche GitHub unique et adéquate **n’est pas validée par le choix de la maquette**. Les recherches approximatives par numéros et les liens par lots des versions précédentes ne sont pas une solution acceptée pour cette cible.

Avant de déclarer la correction terminée, vérifier les fenêtres de Composant, Situation et Prochaine action dans Actions à examiner, puis Composant, Issues total, Issues en cours, Issues Done et Issues Cancelled dans Activité par librairie et composant. Vérifier également les fenêtres de PR et le cas d’un élément unique.

Respecter les distinctions métier établies entre statut Project et état GitHub (D-163) : le choix visuel ne change pas les règles de comptage. Toute divergence ou impossibilité de reproduire exactement une population doit être explicitée et traitée ; elle ne justifie pas de réintroduire des lots ou de masquer des tickets.

Les URL sources restent la référence (D-161). Aucun lien ne doit être fabriqué depuis des identifiants anonymisés. Une destination indisponible doit être signalée clairement.

## Critères de validation ultérieure

1. Les pages et tableaux principaux ne contiennent plus les ajouts de liens GitHub rejetés par l’utilisateur.
2. Chaque fenêtre concernée possède au maximum un accès global GitHub à la position de la maquette A.
3. La destination correspond à toute la liste et aux filtres attendus ; un total ne se limite pas aux éléments ouverts.
4. La pagination ne change pas la destination ; un seul élément ouvre directement son ticket.
5. Aucun libellé ni mécanisme de lot n’est présent.
6. Vérifier les comportements sur une fixture déterministe, puis sur les données non anonymisées disponibles localement, sans les committer ni les transmettre à un service externe.
7. Exécuter les contrôles du projet avant de publier la correction fonctionnelle. En l’absence de vérification du cas réel, conserver cette limite dans le compte rendu.

La présente livraison versionne la demande et le prototype uniquement. **L’issue #115 reste à traiter fonctionnellement ; ce commit ne demande pas sa clôture automatique.**
