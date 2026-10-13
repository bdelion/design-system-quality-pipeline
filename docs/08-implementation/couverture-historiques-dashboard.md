# Couverture des historiques GitHub dans le dashboard

La page **Anomalies** présente une section descriptive de couverture, indépendante des KPI métier.

- **Issue avec historique** : au moins une transition de statut dans l'un de ses contextes Project normalisés.
- **Date métier fiable** : `anomaly.correctedAt` est définie selon le contrat I3.
- **Plusieurs Done** : plusieurs transitions canoniques `DONE` sont observées ; aucune date n'est déduite automatiquement.
- **Historique absent** : aucune transition observable sur les contextes de l'issue, ou issue non retrouvée.
- **Aucune transition Done** : historique observable, mais aucune transition canonique `DONE` exploitable.

Ces catégories sont des **diagnostics de disponibilité**, non des preuves qu'une issue n'a jamais été corrigée. Les décomptes portent sur les anomalies normalisées, alors que la couverture d'historique porte sur les issues normalisées : les dénominateurs diffèrent intentionnellement.

Le tableau affiche exclusivement `correctedAt` pour la date et le délai métier ; `firstDoneAt`, `technicalCorrectedAt`, `mergedAt` et `closedAt` ne sont jamais substitués à `correctedAt`. Les KPI existants restent inchangés.

Limite : le classement « plusieurs Done » compte les transitions canoniques présentes dans les contextes Project. Les événements absents de l'API ou du RAW ne peuvent pas être reconstitués.
