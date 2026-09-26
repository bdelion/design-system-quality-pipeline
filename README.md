# Pilotage qualité des Design Systems

Projet Node.js + TypeScript basé sur le référentiel **Design System Quality V2.1**. Il collecte des données GitHub en lecture seule, les transforme en modèle métier, contrôle leur qualité, calcule des indicateurs et génère un dashboard statique.

Le projet peut être découvert et exécuté sans accès GitHub réel : une fixture locale est fournie pour les tests et les démonstrations.

## À quoi sert le projet ?

Le pipeline suit ce chemin :

```text
configuration
	↓
collecte des données RAW
	↓
normalisation vers le modèle métier
	↓
contrôles de qualité des données
	↓
calcul des KPI
	↓
snapshot immuable
	↓
dashboard statique
```

Quelques principes importants :

- une donnée inconnue n'est jamais transformée silencieusement en `false`, `0` ou « conforme » ;
- les données invalides restent conservées et sont signalées par une alerte de qualité ;
- les KPI indiquent leur niveau de fiabilité ;
- aucun objet GitHub n'est modifié par la V1 ;
- les résultats sont rejouables à partir des données collectées et de la version des règles.

## Prérequis

- Node.js 20 ou supérieur ;
- npm ;
- un terminal ouvert dans le dossier `implementation`.

Vérifier l'installation :

```bash
node --version
npm --version
```

## Première installation

```bash
npm install
npm run typecheck
npm test
npm run lint
```

## Lancer le pipeline de démonstration

La commande la plus simple est :

```bash
npm run pipeline
```

Elle charge la configuration et la fixture, normalise les données, exécute les contrôles de qualité, calcule les KPI, enregistre un snapshot et génère le dashboard.

La fixture couvre trois repositories (`design-system-core`, `design-system-react` et `design-system-docs`) et contient volontairement quelques cas imparfaits. Le résultat attendu est donc généralement `PARTIAL`, et non `COMPLETE`. Cela permet de voir comment le système compare les sources et expose les données douteuses au lieu de les masquer.

## Consulter le dashboard

Après `npm run pipeline` ou `npm run dashboard`, ouvrir [data/dashboard/index.html](data/dashboard/index.html) dans un navigateur.

Le dashboard contient trois pages :

- **Vue d'ensemble** : KPI, criticité des anomalies, synthèse des alertes, comparaison des trois repositories et délais de correction moyens/médians ;
- **Anomalies** : détail des anomalies par repository, état, criticité, correction et alertes de qualité, avec filtre local ;
- **Audits** : composants découverts par repository, origine de leur découverte et résultat objectif d'audit, y compris les audits conformes.

Les délais sont calculés entre `createdAt` et `firstDoneAt`. Une anomalie sans date de correction n'entre pas dans le calcul : elle reste visible, mais ne transforme pas une information inconnue en durée artificielle.

Le dashboard est statique. Il ne nécessite ni serveur applicatif ni base de données.

## Commandes

- `npm run collect` : collecte la fixture RAW.
- `npm run validate` : valide la configuration et la fixture.
- `npm run analyze` : normalise, contrôle la qualité et calcule les KPI.
- `npm run snapshot` : produit un snapshot immuable.
- `npm run dashboard` : génère les pages statiques dans `data/dashboard/`.
- `npm run pipeline` : exécute toutes les étapes et affiche `COMPLETE`, `PARTIAL` ou `FAILED`.

## Où trouver les fichiers importants ?

```text
config/              Configuration versionnée du système et des règles DQ
fixtures/            Données GitHub de démonstration
src/collectors/      Connecteurs de collecte
src/normalizers/     Traduction vers le modèle métier interne
src/quality/         Contrôles de qualité des données
src/analytics/       Calcul des KPI
src/dashboard/       Génération HTML, CSS et JavaScript
src/snapshots/       Construction des snapshots immuables
tests/               Tests de pipeline, contrats et dashboard
data/current/        Snapshot courant et dashboard généré
data/runs/           Historique des snapshots générés
```

## Utiliser une vraie source GitHub

Un collecteur GitHub REST est maintenant disponible. Il fonctionne en lecture seule et récupère les repositories configurés dans `config/system.yaml`, leurs issues et leurs pull requests. La collecte gère la pagination, les retries contrôlés et les réponses liées aux limites de l'API.

1. Fournir un token dans la session du terminal, sans l'ajouter au dépôt :

	```powershell
	$env:GITHUB_TOKEN = "ghp_..."
	```

2. Lancer explicitement une collecte GitHub :

	```bash
	npm run collect -- --source github
	npm run pipeline -- --source github
	```

Le token n'est jamais écrit dans les snapshots, les logs ou le dashboard. Définir `GITHUB_API_URL` avec l'URL de l'API REST, `GITHUB_GRAPHQL_URL` avec l'URL GraphQL et `GITHUB_URL` avec l'URL web correspondante dans le fichier `.env` (pour GitHub Enterprise, par exemple `https://github.example.com/api/v3`, `https://github.example.com/api/graphql` et `https://github.example.com`).

Les règles de lecture GitHub sont configurées dans `config/system.yaml` : préfixes des labels, label inconnu, types d'issues, mots-clés d'inférence et mots-clés de fermeture des issues. Le code ne dépend donc pas des libellés métier propres à un dépôt.

Les statuts GitHub Projects sont conservés pour toutes les issues. Une issue est considérée comme `Cancelled` dès qu'un Project porte une valeur déclarée dans `github.cancelledProjectStatuses`. Elle reste traçable mais est exclue des KPI ; les relations interdites sont signalées par `DQ-008` et `DQ-010`.

## Documentation des Quality Rules

L'index de la documentation technique est disponible dans [docs/index.md](docs/index.md). Il couvre l'architecture, le workflow, les flux de données, les calculs KPI, les snapshots, le dashboard et les tests.

Le détail de chaque contrôle de qualité est disponible dans [docs/quality-rules.md](docs/quality-rules.md). Cette documentation explique le déclencheur, la sévérité, l'action sur les KPI et la correction attendue pour chaque règle `DQ-*`.

La liste de composants de référence et ses métadonnées sont définies dans [config/catalogue.yaml](config/catalogue.yaml). Le catalogue est validé au chargement du pipeline.

Lorsque `GITHUB_GRAPHQL_URL` est défini, le pipeline consulte aussi `closedByPullRequestsReferences` pour récupérer les pull requests liées à une issue via l'interface GitHub **Development**, même lorsqu'aucun mot-clé `Closes`, `Fixes` ou `Resolves` n'est présent.

Le collecteur déduit les composants depuis les labels `Component:`, les criticités depuis `criticite:` et les types depuis les types GitHub ou les labels/titres. Les références `Fixes #123`, `Closes #123` et `Resolves #123` permettent de relier les issues aux PR.

Un éventuel token doit être fourni par l'environnement, par exemple via un fichier `.env` local non versionné. Ne jamais placer un token dans `fixtures/`, `config/`, `data/` ou le code source.

## Comprendre un résultat `PARTIAL`

`PARTIAL` ne signifie pas que le pipeline a échoué. Il indique que le pipeline a terminé, mais que des réserves de qualité existent. Pour les comprendre :

1. ouvrir la page **Anomalies** ;
2. consulter la section **Qualité des données** ;
3. identifier la règle `DQ-*` concernée ;
4. vérifier si la donnée a été incluse, exclue du KPI ou seulement marquée comme moins fiable.

Une donnée exclue d'un indicateur reste visible dans le RAW et dans les données normalisées afin de préserver la traçabilité.

## Dépannage rapide

**`npm` n'est pas reconnu**

Installer Node.js puis rouvrir le terminal. Sous Windows, vérifier que le dossier d'installation de Node.js est présent dans le `PATH`.

**Le typecheck échoue après une modification**

Exécuter `npm run typecheck` et corriger d'abord les erreurs TypeScript avant de relancer le pipeline.

**Le dashboard semble ancien**

Relancer `npm run dashboard`, puis rouvrir `data/dashboard/index.html`. Les fichiers HTML sont générés à partir du snapshot courant.

**La commande retourne `PARTIAL`**

Consulter les alertes de qualité dans le dashboard. Avec la fixture fournie, ce comportement est volontaire et sert à illustrer la gestion des données incomplètes.
