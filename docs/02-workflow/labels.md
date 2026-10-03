# Labels

Labels métier explicitement identifiés :

- `🧩 Component:xxx`
- criticité accessibilité, avec préfixe configurable ; la configuration actuelle utilise `🚦 rgaa:`
- catégorie accessibilité, avec préfixe configurable ; la configuration actuelle utilise `♿ a11y:`
- `🔎 Grooming`
- `label:unknown`
- autres labels de classification/action décrits dans le workflow.

## Configuration actuelle

`config/system.yaml` configure les préfixes et les valeurs de criticité :

- `bloquante` → `blocking`
- `majeure` → `major`
- `mineure` → `minor`

## Principe

Un label est une donnée source et ne doit pas être confondu avec le statut Project ou l'Issue Type.
