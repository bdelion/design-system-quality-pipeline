# Projects

Les GitHub Projects portent le statut de workflow et d'autres informations de planification.

Le RAW actuel conserve uniquement :

- `projectId`
- `projectName`
- `status`

**Limitation importante :** les champs de Project nécessaires à certains indicateurs métier, notamment Velocity et Iteration, ne sont pas encore représentés dans `RawProjectStatus`.

Cette limite doit être explicitement prise en compte avant de déclarer les indicateurs concernés comme implémentés.
