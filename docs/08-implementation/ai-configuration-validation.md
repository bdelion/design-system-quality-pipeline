# Validation du kit IA — 11 octobre 2026

## Périmètre et provenance

Correction effectuée dans le clone Windows sur `feature/codex-copilot`, à partir
du commit `a64a862` et des 26 fichiers du kit déjà présents dans l’index Git.
Le kit initial provenait de `design-system-quality-pipeline-20261011-1209.zip`.
Les validations de cette archive (comparaison octet par octet et `quick_validate.py`)
ne sont pas présentées comme des contrôles rejoués dans ce clone.

Les corrections concernent les références, chemins, consignes, formatage, outils
de validation, tâches VS Code, CI et tests de ces outils. Le registre D/Q n’est
pas réécrit ; les calculs métier, fixtures, dépendances et lockfile ne changent pas.

## Corrections et améliorations validées

| Sujet                  | Résultat observable                                                                                                                                                                                                                     | Preuve                                                                                                                           |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| D-047 / D-238          | D-047 définit la date métier d’audit ; D-238 définit la cardinalité des Components des anomalies HORS_AUDIT. L’écart avec la dernière date Done implémentée est explicitement identifié dans les documents et dans l’index de contexte. | Lecture ciblée du registre, `docs/01-metier/audits.md`, `docs/08-implementation/ai-context-map.md`, `src/normalizers/github.ts`. |
| Chemins et liens       | Les chemins du contexte sont complets depuis la racine ; les liens locaux du kit sont vérifiés.                                                                                                                                         | `npm run check:ai` et tests de chemin/lien absent.                                                                               |
| Skills et instructions | Trois skills, leurs interfaces OpenAI facultatives et cinq instructions `applyTo` sont vérifiées par lecture YAML.                                                                                                                      | `npm run check:ai` et tests de métadonnées/syntaxe invalides.                                                                    |
| Tâches VS Code         | Six tâches ciblent des scripts npm existants, avec `npm.cmd` sous Windows et le répertoire de travail du projet ; une tâche dédiée contrôle les consignes IA.                                                                           | `npm run check:ai` et test de script/commande Windows absents.                                                                   |
| Index D/Q              | 357 titres et leurs lignes correspondent au registre. L’index est régénérable et déterministe, sans renumérotation.                                                                                                                     | `npm run ai:index:update`, `npm run check:ai`, tests d’index obsolète et de génération.                                          |
| Non-régression du kit  | Une consigne locale supprimée, un lien cassé, un chemin absent, des métadonnées invalides, une syntaxe JSON/YAML invalide et une tâche incorrecte produisent des diagnostics.                                                           | Neuf tests dans `tests/ai-configuration.test.ts`, sur des fixtures minimales et isolées.                                         |
| Formatage et CI        | Le formatage couvre `.agents/`. Le contrôle IA est exécuté par `npm run check` et par une étape dédiée de CI.                                                                                                                           | `npm run format:check`, `package.json`, `.github/workflows/ci.yml`.                                                              |

## Vérifications exécutées dans le clone

- `npm.cmd test -- tests/ai-configuration.test.ts` : **9 tests réussis**.
- `npm.cmd run check` : **succès** — kit IA, typage strict, lint sans avertissement,
  contrôle TSDoc, **165 tests dans 34 fichiers** et compilation TypeScript.
- `npm.cmd run format:check` : **succès**, y compris les fichiers `.agents/`.
- `npm.cmd run ai:index:update` : index régénéré ; `npm.cmd run check:ai` confirme
  la fidélité des 357 entrées au registre.
- `git diff --check` : **succès**.

Le premier contrôle de lint a détecté des imports `URL` manquants dans les deux
scripts Node ; ils ont été corrigés et le contrôle complet a ensuite réussi.
Les échecs de formatage du kit initial sont également corrigés.

## Reproduction

```powershell
npm.cmd run check:ai
npm.cmd test -- tests/ai-configuration.test.ts
npm.cmd run check
npm.cmd run format:check
```

Après une modification du registre, exécuter `npm.cmd run ai:index:update` avant
le contrôle. Cette commande écrit uniquement l’index documentaire ; le contrôle
`check:ai` reste en lecture seule et ne contacte aucun service distant.

## Limites et écart métier conservé

Le contrôle automatique valide la structure, les références et la fidélité de
l’index ; il ne démontre pas la sémantique des décisions. D-047 et le calcul actuel
fondé sur la dernière transition Done restent distincts et l’écart est à arbitrer.
Aucune migration métier n’est appliquée par cette correction du kit.

Les trois skills figurent dans les capacités de cette session Codex. Cela ne
certifie pas leur découverte dans une autre session, ni celle des instructions
par une extension Copilot. L’authentification et le lancement des tâches depuis
l’interface VS Code restent à vérifier sur le poste.

Playwright, axe-core, TypeDoc, collecte GitHub réelle et exécution distante de la
CI n’ont pas été relancés pour ce lot d’outillage. Les résultats du dashboard
obtenus dans le lot précédent ne sont pas réattribués à cette validation.
Aucun commit ni push n’est effectué dans ce lot.
