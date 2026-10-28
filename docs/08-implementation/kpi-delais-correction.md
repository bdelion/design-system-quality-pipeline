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

## Durée de traitement de la vue synthétique — D-245

Depuis #126, la cohorte **Correction confirmée des bugs** de la vue synthétique expose un délai distinct de ces KPI historiques : premier In progress → dernier Done, ou repli de la paire entière sur création → clôture GitHub si l’une des transitions manque. Les bornes et leur provenance restent consultables dans le détail et le CSV ; les données incohérentes sont exclues. La PR fusionnée prouve l’appartenance à la population des corrections confirmées, sans fournir la date de fin de cette durée. La [décision D-245 et la restitution](dashboard-double-presentation.md#revue-des-espaces--issues-124-à-128) décrivent ce périmètre sans remplacer les contrats ci-dessus.

## Validation

Exécuter `npm.cmd run format`, `npm.cmd run check` et `npm.cmd run format:check`, puis générer le dashboard sur le jeu de données de référence. Vérifier les effectifs des trois KPI, la ventilation des dates estimées et l'exclusion des annulations.
