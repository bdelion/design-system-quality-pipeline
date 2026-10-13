# KPI de délais de correction — contrat V3

Trois moyennes sont exposées sur la page **Anomalies** :

- `anomaly.correctionDelay.average` : **KPI officiel**, dates `Done` et clôtures estimées admissibles.
- `anomaly.correctionDelay.averageActual` : uniquement les transitions `Done` (la dernière en cas de réouverture).
- `anomaly.correctionDelay.averageEstimated` : uniquement les dates de clôture `closedAt` de repli.

Chaque moyenne utilise les anomalies admissibles de **sa propre population**, et expose son effectif. La moyenne globale n'est pas la moyenne arithmétique des deux sous-moyennes : elle est pondérée par les effectifs.

## Provenance et exclusions

`correctionDateSource` vaut `done`, `last_done`, `issue_closed` ou `unavailable`. `correctedAt` reste la date provenant d'un événement `Done` ; `effectiveCorrectedAt` est la date utilisée pour le calcul, y compris lorsqu'elle est estimée.

Une issue `Cancelled`, une issue ouverte sans transition `Done`, une issue fermée avec un statut Project courant contradictoire, ou un délai négatif/non calculable n'alimente pas les moyennes. Une clôture GitHub n'est **pas** une preuve de correction métier ; la provenance estimée est explicitement conservée.

Le calcul des dates de réalisation des **audits** reste indépendant et inchangé. Les anciennes assertions I3 concernant les anomalies à plusieurs transitions `Done` sont remplacées par le choix explicite de la dernière transition.

## Validation

Exécuter `npm.cmd run format`, `npm.cmd run check` et `npm.cmd run format:check`, puis générer le dashboard sur le jeu de données de référence. Vérifier les effectifs des trois KPI, la ventilation des dates estimées et l'exclusion des annulations.
