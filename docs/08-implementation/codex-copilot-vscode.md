# Codex et Copilot dans VS Code

## Installation sur le poste

Ce kit est préparé à partir de l’archive du 11 octobre 2026 à 12 h 09. Il configure
le dépôt ; il ne connecte pas VS Code et ne transfère pas les conversations ChatGPT.

1. Ouvrir le clone Git réel `D:\1010 - Developpement\Git\design-system-quality-pipeline`.
2. Vérifier `git status` et conserver les changements en cours. Copier les fichiers du kit en respectant leurs chemins ; examiner les différences README/docs avant remplacement si votre clone a évolué.
3. Utiliser l’extension Codex officielle OpenAI et s’y connecter. Pour Copilot, disposer de l’extension et de l’accès correspondant. Les deux outils gardent leurs sessions et permissions propres.
4. Vérifier Node : minimum 22.15.0, référence du dépôt 22.23.3. Exécuter `npm.cmd ci` sous PowerShell si les dépendances sont absentes.
5. Ouvrir une nouvelle session et demander : « Lis AGENTS.md et indique les règles applicables à src/dashboard, les tests et les sources métier. Ne modifie rien. » Vérifier la réponse et les références Copilot.
6. Examiner le diff puis versionner ces consignes avec votre travail habituel. Aucun push sur votre repository GitHub n’a été effectué par ce kit.

## Répartition des fichiers

| Fichier                                              | Rôle et chargement                                                                 |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------- |
| AGENTS.md                                            | Socle court du projet pour Codex et les agents Copilot qui le prennent en charge   |
| src/AGENTS.md et consignes locales                   | Règles par domaine ; lire explicitement celles des fichiers modifiés si nécessaire |
| .github/copilot-instructions.md                      | Entrée spécifique Copilot, avec règles essentielles et lien au socle               |
| .github/instructions/*.instructions.md               | Adaptateurs Copilot avec applyTo vers les consignes locales                        |
| .agents/skills/*/SKILL.md                            | Trois procédures partagées chargées lorsqu’elles sont pertinentes                  |
| .agents/skills/*/agents/openai.yaml                  | Métadonnées facultatives spécifiques OpenAI ; le SKILL.md reste partagé            |
| .vscode/tasks.json                                   | Six tâches de contrôle via Terminal → Run Task / Exécuter la tâche, dont le kit IA |
| scripts/ai-config.mjs et scripts/check-ai-config.mjs | Validation locale des consignes, tâches, chemins et index                          |
| scripts/update-ai-decisions-index.mjs                | Régénération déterministe de l’index sans modification du registre                 |
| ai-context-map.md                                    | Index thématique des sources, du code et des tests                                 |
| ai-decisions-index.md                                | Titres D/Q ; le registre complet reste normatif                                    |

Codex construit ses consignes depuis le répertoire global puis la racine du projet
jusqu’au répertoire de lancement. Les consignes imbriquées ne sont donc pas
supposées chargées automatiquement lorsque la session commence à la racine.
Copilot distingue instructions globales, ciblées et instructions d’agents ; la
prise en charge dépend de la fonctionnalité. Les adaptateurs ciblés demandent
une lecture explicite du fichier local, dont il faut vérifier l’usage en session.

## Trois skills

- `dsq-change` : correction de code, tests, documentation, contrôles.
- `dsq-fixture` : anonymisation, intégrité, alias et triplet fixture/system/catalogue.
- `dsq-business-review` : comparaison décisions, documentation et code.

Dans Codex : « Utilise $dsq-change pour corriger … ». Dans Copilot mode agent :
« Utilise la skill dsq-change du dépôt pour corriger … ». Si la découverte échoue,
demander de lire explicitement son SKILL.md et vérifier la version de l’extension.
Aucune de ces skills ne nécessite de serveur MCP ni de token GitHub pour les tests fixture.

## Réduire le contexte chargé

Le socle permanent reste court ; les procédures détaillées et les décisions sont
lues à la demande. Donner le symptôme, le périmètre, le comportement attendu et
le test/log pertinent. Éviter de coller tout le registre ou un dataset réel dans
la conversation. Demander une recherche par ID et un extrait ciblé.

Exemple : « Utilise $dsq-change. Dans la table anomalies, une anomalie sans
composant doit afficher le repository source. Ajoute le test correspondant,
actualise la documentation concernée et exécute les contrôles dashboard. »

Pour une revue : « Utilise $dsq-business-review. Compare la règle D-047 avec les
dates des audits implémentées ; fournis les écarts sans modifier le code. »

Après une tâche longue, demander un bref état de reprise (objectif, fichiers,
décisions, contrôles et reste à faire), puis ouvrir une session dédiée au prochain
sujet. Une nouvelle session ne conserve pas automatiquement la précédente.
Aucun pourcentage d’économie de tokens n’est garanti ; les lectures, sorties de
commandes, outils et historique de session contribuent aussi à la consommation.

Ne pas compter sur `.gitignore`, `files.exclude` ou `search.exclude` pour interdire
l’accès aux fichiers ou garantir qu’un agent ne les chargera pas. Les permissions
sont configurées séparément dans chaque outil.

## Réglages personnels et extensions

Le fichier global `%USERPROFILE%\.codex\AGENTS.md` est facultatif si Codex utilise
son emplacement par défaut. Y placer seulement des préférences transversales,
par exemple langue et forme des comptes rendus. Garder le modèle métier dans le
dépôt ; ne pas copier les mêmes consignes globales et locales. En environnement
WSL, utiliser le répertoire utilisateur de l’environnement où tourne Codex.

Aucun `config.toml` imposant modèle, effort ou permissions n’est ajouté : ces
choix dépendent de votre installation et ne sont pas interchangeables avec Copilot.
Les agents personnalisés `.github/agents/` sont propres à Copilot et distincts
d’AGENTS.md ; ils ne sont pas nécessaires pour ce premier kit. MCP GitHub est
optionnel pour une demande nécessitant des données distantes ; le clone local
suffit à modifier le code et exécuter les tests hors réseau.

## Contrôles et limites de cette livraison

Les consignes, skills, index, tâches VS Code, outils de contrôle et leurs tests sont
ajoutés/modifiés. Aucun code applicatif, contrat métier ni fixture n’est changé.
Le rapport `ai-configuration-validation.md` précise les vérifications exécutées.
La découverte des instructions et skills doit encore être confirmée sur votre
poste ; ce kit ne constitue pas un test réel de votre extension VS Code.

Les scripts `format` et `format:check` couvrent désormais `.agents/` en plus des sources, configurations et documents. Les six tâches VS Code incluent « DSQ : contrôle des consignes IA ». `npm run check` exécute aussi ce contrôle, et la CI dispose d’une étape dédiée.

`npm run check:ai` vérifie les noms/descriptions des skills, leur interface OpenAI lorsqu’elle est présente, les champs `applyTo`, les tâches npm et leur commande Windows, les liens Markdown locaux du kit, les chemins explicites de l’index de contexte et la fidélité des titres/lignes D/Q. Il ne modifie rien, ne contacte aucun service et ne certifie pas la sémantique métier ni la découverte par Copilot.

Après toute modification du registre, lancer :

```powershell
npm.cmd run ai:index:update
npm.cmd run check:ai
npm.cmd run format:check
```

La régénération ne modifie que `docs/08-implementation/ai-decisions-index.md` ; elle conserve les identifiants et les décisions du registre. Les tests `tests/ai-configuration.test.ts` protègent notamment l’index obsolète, les chemins absents, les liens cassés, les métadonnées invalides et les tâches incompatibles avec Windows.

D-047 définit la date métier de réalisation d’un audit ; le calcul actuel fondé sur Done reste explicitement identifié comme un état implémenté distinct. D-238 concerne les anomalies hors audit. Le kit ne transforme pas cet écart préexistant en une nouvelle décision.

## Documentation officielle vérifiée le 11 octobre 2026

- [Codex : AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
- [Codex : skills et emplacements](https://learn.chatgpt.com/docs/build-skills)
- [Copilot : instructions VS Code](https://docs.github.com/en/copilot/how-tos/copilot-in-your-ide/customize-copilot/configure-custom-instructions/add-repository-instructions-in-your-ide?tool=vscode)
- [Copilot : skills](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills)
