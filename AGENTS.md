# Consignes du projet

## Mission et références

Design System Quality Pipeline : CLI Node.js/TypeScript ESM, lecture seule GitHub,
collecte multi-repositories → RAW → normalisation → Data Quality → métriques →
snapshot → dashboard HTML statique. Répondre en français.

Distinguer décision métier établie et comportement réellement implémenté.
Lire `docs/README.md` pour la gouvernance et
`docs/08-implementation/ai-context-map.md` pour choisir les sources utiles.
Ne pas résoudre un écart cible/code en réécrivant silencieusement une décision.
Rechercher les seuls D-xxx/Q-xxx concernés dans le registre ; conserver leurs identifiants.

## Travail et qualité

- Lire `git status` et préserver les changements existants. Ne pas supposer la branche active.
- Pour toute modification de code, ajouter ou mettre à jour les tests correspondants dans le même patch.
- Documenter chaque fonction ajoutée/modifiée en français avec TSDoc ; respecter le contrôle existant.
- Mettre à jour les sections concernées du README et de `docs/`, sans duplication inutile.
- Respecter TypeScript strict, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess` et les imports ESM `.js`.
- Ne pas convertir une valeur inconnue en zéro, faux ou conforme ; conserver provenance et réserves DQ.
- Garder les calculs métier dans le pipeline ; le dashboard restitue les résultats.
- Ne pas modifier les sources GitHub. Ne pas afficher les secrets `.env`, tokens ou traces RAW nominatives.

## Commandes

Node >=22.15.0 ; référence `.nvmrc` : 22.23.3. Installer avec `npm ci` si nécessaire.
Sous PowerShell, utiliser `npm.cmd` si `npm.ps1` est bloqué.

- Test ciblé : `npm test -- tests/<fichier>.test.ts`.
- Gate code : `npm run check` (types, lint, TSDoc, tests, build).
- Gate dashboard : `npm run check:dashboard` (ajoute navigateur, format et TypeDoc).
- Consignes IA : `npm run check:ai` contrôle skills, tâches, liens et index ; après évolution du registre, `npm run ai:index:update` régénère uniquement l’index.
- Documentation seule : vérifier liens et format des fichiers modifiés ; ne pas déclarer les tests exécutés s'ils ne le sont pas.

## Contexte utile et restitution

Utiliser `rg` et lire les fichiers/extraits liés à la demande. Ne pas charger tout
`docs/`, les grosses fixtures, `data/`, `dist/`, `docs/api/` ou les rapports générés
sans besoin précis. Les exclusions de l'éditeur ne sont pas une barrière d'accès.
Lire explicitement les `AGENTS.md` du sous-dossier modifié si la session démarre
à la racine ; leur découverte automatique varie selon l'outil et le répertoire.
Choisir une skill pertinente dans `.agents/skills/`, sans toutes les charger.

Livrer : comportement changé, fichiers concernés, tests réellement exécutés,
écarts/limites et prochaine action éventuelle. Faire les corrections locales
nécessaires dans le périmètre demandé ; un commit, push ou changement externe
requiert une demande correspondante de l'utilisateur.
