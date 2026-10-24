# Validation métier du 19 octobre 2026

**DÉCIDÉ** : arbitrages explicitement validés durant la revue du dataset local. Les JSON et les attendus rédigés par l’utilisateur sont préservés. Aucun identifiant privé ni contenu de ticket n’est publié ici.

## Types, labels et rattachements

- Bug est commun aux défauts fonctionnels et d’accessibilité. Les catégories se recouvrent ; le total distinct ne les additionne pas. Les listes de labels exacts et de préfixes sont configurables. Un bug non classé ne devient pas fonctionnel par défaut et ne dégrade pas automatiquement l’accessibilité.
- Accessibility seul indique le domaine et ne crée pas un Bug. Des marqueurs RGAA/a11y configurés peuvent reconnaître un Bug en l’absence de type GitHub. Un Enhancement reste une amélioration ; une criticité RGAA associée est une contradiction à signaler.
- VOIR AUDITEUR signale une demande d’avis et ne prouve ni audit ni anomalie. Les anciens AUDIT inférés sans preuve sont non confirmés.
- Le composant vient du label de l’issue, jamais de son parent audit. Les anomalies sans composant ont une liste et un compteur distincts. Les labels valides restent reconnus hors catalogue, avec réserve. L’exception exacte InputPagination est validée ; la généralisation à tous les labels égaux au catalogue reste **PROPOSÉE**, non appliquée.
- Une anomalie compte une fois par composant, y compris dans le total global ; le nombre d’issues distinctes est séparé. Le multi-composant d’une anomalie est signalé comme à séparer. Un audit a exactement un composant ; sinon il reste consultable sans produire de verdict.
- Un désaccord entre composant de l’audit et de l’anomalie est signalé. L’anomalie compte pour son propre composant ; elle ne bloque pas un résultat sans anomalie pour l’autre composant.
- Les bugs sans audit restent visibles, ouverts ou fermés. Les bugs d’accessibilité connus sans audit affectent le composant mais pas les compteurs des audits. Les améliorations ont un compteur cliquable distinct et n’affectent pas la conformité.

## Corrections et annulations

- Correction confirmée = tous les contextes Project reconnus Done et au moins une PR de correction explicitement liée fusionnée. Closed seul ne prouve rien. Done sans PR et PR sans Done ont des réserves distinctes.
- La milestone du Bug porte la version de correction : prévue avant confirmation, confirmée pour cette version après. Elle ne prouve pas la publication. Une version future ne retire pas une anomalie existante de son audit. Sans milestone, la correction peut être confirmée, sa version reste inconnue.
- Cancelled + un seul motif configuré accepted/invalid neutralise l’anomalie, sans la déclarer corrigée ni effacer l’historique. Absence de motif, motifs doubles ou motif sans Cancelled ne neutralisent pas ; les incohérences sont signalées. Une acceptation n’est pas une preuve de conformité par audit.
- Sans Project, sans statut et avec statut sont distincts. Un statut non reconnu mais renseigné ne devient pas un statut absent. Une vélocité absente est non renseignée ; zéro explicite reste zéro.

## Vérification par audit

- Done sur l’issue d’audit suffit à sa terminaison : cet arbitrage **amende D-047 pour la condition de terminaison**, auparavant Done + Closed. Une date inconnue reste inconnue.
- Une correction confirmée ne suffit pas à prouver la conformité. Un audit ultérieur terminé sur la version corrigée ou suivante, après correction et sans anomalie du composant non neutralisée, permet la vérification sans lien direct vers l’ancienne anomalie.
- Les nouvelles anomalies sont de nouvelles issues sans lien avec les précédentes. Si le nouvel audit contient des anomalies, la vérification individuelle des anciennes corrections reste indéterminée.
- La synthèse privilégie la version auditée terminée la plus élevée, pas la date de fin la plus récente ; un audit en cours ne remplace pas ce résultat. L’historique est conservé.
- Résultat du dernier audit, bugs d’accessibilité connus, corrections confirmées et corrections vérifiées sont présentés séparément. Les compteurs de corrections donnent accès aux preuves et aux versions de correction.

## Configuration et rejeu local

Le fichier [exemple](../../config/issue-policy.example.json) documente les valeurs par défaut DSQ et l’exception InputPagination. La comparaison des labels est exacte et sensible à la casse ; les préfixes sont explicites. Les listes vides sont autorisées pour désactiver une reconnaissance. Le fichier peut être adapté localement sans modifier les entrées du dataset.

```powershell
npm.cmd run pipeline -- --dataset datasets/20261019-1506-anonymise --issue-policy config/issue-policy.example.json --output data/output/20261019-1506-anonymise
npm.cmd run dashboard:serve -- data/output/20261019-1506-anonymise/dashboard
```

Liens après rejeu :

- [Sans Project enregistré](http://127.0.0.1:4174/issues.html?project=none).
- [Bugs sans audit](http://127.0.0.1:4174/issues.html?review=no-audit).
- [Bugs sans composant](http://127.0.0.1:4174/issues.html?review=no-component).
- [Avis auditeur demandé](http://127.0.0.1:4174/issues.html?review=advice).
- [Synthèse audits et corrections](http://127.0.0.1:4174/audits.html#business-review).

Les champs normalisés `Issue.review` et `Analytics.businessReview` portent les algorithmes versionnés. Une ancienne capture sans ces champs reste lisible ; son évaluation détaillée exige un rejeu. Les sources ne sont jamais réécrites.

## Budget de restitution — validé le 20 octobre 2026

La [mesure de contrôle](benchmarks/business-review-control.md) conserve la même fixture que la référence précédente. L’utilisateur a explicitement validé les 41 324 octets HTML et les 2 375 nœuds DOM d’Activité, soit +2 128 octets et +407 nœuds, comme nouvelle référence. Le JSON et les nombres de lignes restent inchangés. Le seuil d’alerte dès la moindre augmentation reste fixé à 0 % ; aucune autre page ni aucun seuil temporel n’est modifié. La validation précédente est conservée dans les métadonnées pour la traçabilité.
