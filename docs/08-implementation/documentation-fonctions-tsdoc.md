# Documentation des fonctions TypeScript

Les fonctions nommées de `src/` (déclarations, méthodes et fonctions fléchées affectées à une variable ou propriété) disposent de commentaires TSDoc lorsqu'aucun bloc n'existait. Les descriptions sont en français et les commentaires métier existants ont été conservés.

Les callbacks anonymes locaux (par exemple dans `map`, `filter`, `reduce` et les gestionnaires d'événements) ne sont pas systématiquement documentés individuellement : leur rôle est à expliquer dans le contrat de la fonction englobante lorsqu'il est non trivial.

Pour consulter les commentaires sur les fonctions privées, lire les fichiers source : TypeDoc peut masquer ces éléments selon sa configuration. La génération de TypeDoc ne garantit pas à elle seule l'exhaustivité de la documentation des fonctions internes.

## Contrôles

```powershell
npm.cmd ci
npm.cmd run check
npm.cmd run docs:api
```

La documentation est à relire pour enrichir les descriptions métier des fonctions internes, en particulier les calculs d'indicateurs et les règles Data Quality.
