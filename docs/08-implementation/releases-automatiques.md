# Releases automatiques après merge sur main

Statut : implémenté dans le workflow, à valider sur GitHub après intégration. Aucun tag ni release n’est publié par les tests locaux.

## Déclenchement et contrôles

Un push sur main exécute le job quality : formatage, consignes IA, types, lint, TSDoc français, tests, build et TypeDoc, puis installation de Chromium, interactions navigateur et accessibilité automatisée. Le job release dépend de son succès et vérifie que le commit exact correspond à une PR fusionnée vers main. Aucun tag n’est créé pour une PR ouverte, develop, master ou un push direct sans merge identifié.

Cela couvre merge classique, squash et rebase via le merge_commit_sha rapporté par GitHub. Chaque push de merge doit déclencher sa propre CI ; une intégration en lot ne publie que le merge correspondant au SHA du push. Si d’autres jobs obligatoires sont ajoutés, les ajouter aussi à needs du job release.

Le formatage intervient immédiatement après npm ci, pour arrêter tôt une exécution incorrecte. TypeDoc précède les tests navigateur, plus coûteux. Les rapports navigateur restent téléversés en fin de job avec always(), même après un échec.

## Versionnement

Les titres et descriptions de PR et les messages de leurs commits sont examinés. Une rupture Conventional Commit explicite (type!: ou pied BREAKING CHANGE / BREAKING-CHANGE) produit une majeure ; feat produit une mineure ; tout autre changement produit un patch. Les types doivent commencer la ligne. Les git emoji après le préfixe sont compatibles.

La base est le plus grand tag stable vX.Y.Z existant. Sans tag, la version de package.json sert de référence : 0.1.0 donne v0.1.1 pour une correction, v0.2.0 pour une nouveauté. Les tags de préversion ou hors convention sont ignorés. package.json et CHANGELOG.md ne sont pas automatiquement réécrits : la version publiée est portée par le tag et la release.

## Notes pour tous

Le modèle de PR contient une zone entre release-notes:start et release-notes:end. Rédiger les bénéfices, corrections, adaptations et limites pour les utilisateurs ; retirer les consignes et sections vides avant merge. Le script reprend cette zone, ou à défaut la description complète de la PR. Il ajoute les commits classés en nouveautés, corrections et documentation/maintenance, les ruptures explicites, la PR, le commit exact et le lien de CI.

L’automatisation ne peut pas inventer une explication métier ou des limites absentes de la PR. La qualité éditoriale reste un point de revue. Les notes portent sur cette PR, sans recopier tout l’historique de CHANGELOG.md ni attribuer à la release un intervalle de commits potentiellement non validés.

## Relances et publications simultanées

Une relance retrouve le tag stable du même SHA et ne republie pas une release existante. Un tag sans release peut être complété. Un brouillon existant bloque pour éviter une publication involontaire. Une collision de tag entre deux jobs relit les tags et recalcule une version, jusqu’à huit tentatives ; une erreur de permission ou de validation sans collision reste un échec visible. Aucun tag n’est déplacé ou supprimé.

Il n’y a pas de groupe de concurrence qui annule des merges en attente. Les numéros suivent l’ordre de publication, qui peut différer de l’ordre des merges lorsque les CI terminent dans un ordre différent. Une reprise s’effectue en relançant le job échoué dans GitHub Actions, sur son commit d’origine.

## Activation et permissions

Intégrer ces fichiers à main via une PR et protéger main contre les push directs. Le job quality conserve contents: read ; le job release reçoit contents: write et pull-requests: read. Le token est transmis uniquement comme variable d’environnement et les erreurs HTTP n’affichent ni token ni réponse nominative.

Le token GITHUB_TOKEN suffit dans le cas courant. Un secret optionnel RELEASE_TOKEN peut fournir un token d’application GitHub ou un token finement limité si les règles du repository exigent des droits supplémentaires. Aucun secret n’est ajouté automatiquement par ce développement.

Attention : la référence locale origin/HEAD pointe actuellement vers develop. D’après la documentation GitHub, créer une release sur un commit modifiant des workflows par rapport à la branche par défaut peut nécessiter Workflows: write, que GITHUB_TOKEN ne peut pas recevoir. Avant activation, vérifier la branche par défaut réelle : main comme branche par défaut, ou un RELEASE_TOKEN disposant des permissions nécessaires. Les règles de protection des tags doivent aussi autoriser ce compte de publication. Ne pas accorder de permissions plus larges que nécessaire.

Les archives source sont disponibles avec la release GitHub ; aucune publication npm ni aucun déploiement n’est ajouté. Un événement produit avec GITHUB_TOKEN ne déclenche généralement pas d’autres workflows : ce mécanisme ne suppose pas de pipeline déclenché par le tag.

## Vérification

Tests locaux : versions patch/mineure/majeure, git emoji, notes, commit exact, absence de publication sans merge, relance idempotente, récupération de tag, collision et erreurs HTTP. Le test du YAML contrôle la dépendance au job complet et les permissions. Ces simulations ne remplacent pas une exécution réelle des runners Ubuntu ou la vérification des permissions du repository.

Commandes : npm test -- tests/release.test.ts puis npm run check:dashboard.

Sources : [syntaxe GitHub Actions](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax), [création de releases](https://docs.github.com/en/rest/releases/releases#create-a-release), [token des workflows](https://docs.github.com/en/actions/tutorials/authenticate-with-github_token).
