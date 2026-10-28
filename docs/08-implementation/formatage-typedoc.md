# Formatage et documentation du code

## Convention

- TypeScript / JavaScript : Prettier pour la présentation, ESLint pour les erreurs et les règles de qualité.
- JSON / YAML / Markdown / CSS / HTML : Prettier lorsque les fichiers sont maintenus à la main.
- Fichiers générés, fixtures de référence et snapshots : exclus de l'opération automatique.
- Encodage UTF-8, fin de ligne LF ; formatage déterministe et sans modification métier.

## Installation proposée

```powershell
npm.cmd install --save-dev --save-exact prettier typedoc
```

Puis, après intégration des scripts dans `package.json` :

```powershell
npm.cmd run format:check
npm.cmd run format
npm.cmd run docs:api
npm.cmd run check
```

Ne pas mélanger un formatage global et un changement métier dans le même commit.

## Commentaires français et TSDoc

Documenter les fonctions exportées, leurs paramètres, le résultat, les invariants
métier, les limites et les erreurs significatives. Utiliser `@param`, `@returns`,
`@throws`, `@example` et `@deprecated` lorsque pertinents. Les identifiants
TypeScript et noms des champs JSON restent inchangés.

Les commentaires TSDoc français sont pris en charge par TypeDoc. La configuration
`typedoc.json` cible les points d'entrée métier principaux ; elle peut être étendue
progressivement, après vérification de la documentation générée.
