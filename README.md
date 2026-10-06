# Design System Quality Pipeline

Pipeline Node.js + TypeScript de collecte, contrôle et analyse de la
qualité de Design Systems à partir de données GitHub.

Le projet collecte les données en lecture seule, les projette dans un
modèle métier minimal, contrôle leur qualité, calcule les indicateurs,
produit des snapshots et génère un dashboard HTML statique.

La documentation détaillée est disponible dans [`docs/`](docs/index.md).

---

## Vue d'ensemble

```text
GitHub / Fixture
       │
       ▼
     RAW
       │
       ▼
 Normalisation
       │
       ▼
 Data Quality
       │
       ▼
 KPI / Analytics
       │
       ▼
 Snapshot
       │
       ▼
 Dashboard statique
```

Les principes structurants sont :

- le modèle RAW ne conserve que les données utiles au pipeline ;
- les données inconnues ou invalides ne sont pas transformées
    silencieusement en `0`, `false` ou « conforme » ;
- les contrôles de qualité sont associés à leur impact réel sur les
    indicateurs ;
- les KPI exposent leur périmètre et leur fiabilité ;
- les snapshots permettent de comparer les états successifs et de
    calculer les flux ;
- le pipeline reste déterministe et rejouable à partir des données
    collectées et des versions de règles.

## Prérequis

- Node.js 20 ou supérieur ;
- npm ;
- terminal ouvert à la racine du projet.

Vérification :

```bash
node --version
npm --version
```

## Installation

```bash
npm install
```

Vérifier ensuite le projet :

```bash
npm run typecheck
npm test
npm run lint
```

## Exécution du pipeline

La commande principale est :

```bash
npm run pipeline
```

Elle enchaîne les principales étapes du pipeline :

1. chargement de la configuration ;
2. collecte de la source ;
3. normalisation ;
4. contrôles de qualité ;
5. calcul des KPI ;
6. création du snapshot ;
7. génération du dashboard.

Une exécution peut être `COMPLETE` ou `PARTIAL`. `PARTIAL` signifie que
le traitement est terminé mais que certaines données ou métriques sont
affectées par des réserves de qualité.

### Exécuter les étapes séparément

```bash
npm run collect
npm run validate
npm run analyze
npm run snapshot
npm run dashboard
```

## Dashboard

Après une exécution du pipeline, le dashboard statique est disponible
dans :

```text
data/dashboard/index.html
```

Il comprend notamment :

- **Vue d'ensemble** : principaux KPI, criticités, qualité des données
    et délais ;
- **Anomalies** : détail des anomalies et de leur qualité de données ;
- **Audits** : composants, audits et résultats ;
- **Cartographie** : relations repository → composant → audit →
    anomalie → PR ;
- **Historique** : évolution entre snapshots comparables.

Le dashboard ne nécessite ni serveur applicatif ni base de données.

## Sources de données

### Fixture locale

Une fixture permet d'exécuter le pipeline sans accès à GitHub.

```bash
npm run pipeline
```

La configuration de démonstration utilise les fichiers de configuration
et fixtures présents dans le dépôt.

### GitHub

Un collecteur GitHub REST est disponible en lecture seule.

Définir le token uniquement dans l'environnement :

```powershell
$env:GITHUB_TOKEN = "..."
```

Puis :

```bash
npm run collect -- --source github
npm run pipeline -- --source github
```

Pour GitHub Enterprise, les URLs API/web sont configurées dans `.env` :

```text
GITHUB_API_URL=...
GITHUB_GRAPHQL_URL=...
GITHUB_URL=...
```

Le token n'est pas écrit dans les snapshots, les logs ou le dashboard.

La collecte gère notamment la pagination et les retries contrôlés. Les
relations entre issues et pull requests sont également exploitées
lorsqu'elles sont disponibles.

## Anonymisation des données réelles

Le projet fournit une chaîne dédiée pour transformer un RAW réel en
fixture partageable.

```bash
npm run fixture:anonymize -- \
  --input data/raw/my-real-dataset.json \
  --output fixtures/github-real-anonymized.json
```

L'anonymisation est déterministe à partir d'une seed.

Elle anonymise notamment :

- identifiants ;
- noms et propriétaires de repositories ;
- numéros techniques ;
- dates ;
- textes libres ;
- noms de projets ;
- relations associées.

Certaines données métier sont volontairement conservées exactement car
elles ont une signification analytique :

- `labels` ;
- `state` ;
- `issueType` ;
- `projectStatuses[].status` ;
- `milestone.title` ;
- `milestone.state`.

Le collecteur et l'anonymiseur reconstruisent explicitement le modèle
RAW : les objets riches provenant de l'API GitHub ne sont pas recopiés
tels quels.

### Manifeste de traçabilité RAW

Depuis V7, l'anonymisation produit par défaut un manifeste local :

```text
fixtures/github-real-anonymized.json.trace.json
```

Il permet de relier :

```text
fixture anonymisée
      ↓
sourcePath JSON
      ↓
identifiant de l'entité RAW
```

Il contient également les relations entre issues et pull requests et
indique si une cible existait dans le RAW source.

Ce fichier peut contenir des identifiants issus de la source réelle. Il
est donc **local uniquement** et ne doit pas être partagé ou versionné.

Les fichiers `*.trace.json` sont exclus du dépôt par `.gitignore`.

Pour désactiver sa génération :

```bash
npm run fixture:anonymize -- \
  --input <raw.json> \
  --output <fixture.json> \
  --no-trace
```

Un chemin explicite peut être fourni avec :

```bash
--trace-output <path>
```

## Validation d'une fixture

```bash
npm run fixture:validate -- \
  --input fixtures/github-real-anonymized.json
```

La validation contrôle notamment :

- la présence de données sensibles résiduelles ;
- les relations entre entités ;
- la cohérence des références ;
- les éléments susceptibles d'empêcher une fixture d'être considérée
    comme partageable.

Un rapport Markdown est généré par défaut à côté de la fixture :

```text
fixtures/github-real-anonymized.json.validation.md
```

Un emplacement peut être précisé avec :

```bash
--report <path>
```

### Rapport enrichi avec la trace RAW

Pour analyser une anomalie de fixture avec son origine dans les données
réelles :

```bash
npm run fixture:validate -- \
  --input fixtures/github-real-anonymized.json \
  --trace fixtures/github-real-anonymized.json.trace.json
```

Le rapport peut alors indiquer :

- le chemin JSON dans la fixture ;
- le fichier RAW source ;
- le `sourcePath` correspondant ;
- l'identifiant RAW de l'entité ;
- l'identifiant RAW de la référence ;
- si la cible était présente ou absente du RAW.

Cela permet notamment de distinguer une référence réellement absente de
la source d'un problème introduit pendant l'anonymisation.

### Détection des données sensibles

La détection est désormais consciente du contexte des champs.

Les valeurs structurées connues, notamment les timestamps ISO, ne sont
pas interprétées comme des numéros de téléphone. Les champs libres
restent analysés afin de ne pas masquer un véritable numéro présent dans
un texte.

Le contrôle distingue ainsi mieux :

```text
date structurée
≠
numéro de téléphone
```

tout en conservant une détection des données sensibles dans les textes
qui peuvent réellement en contenir.

## Architecture du code

```text
config/                 Configuration du système et des règles
fixtures/               Fixtures locales et données de démonstration
src/
  collectors/           Collecte RAW
  normalizers/          Normalisation vers le modèle métier
  quality/               Contrôles Data Quality
  analytics/             Calcul des KPI
  snapshots/             Snapshots et comparaison historique
  dashboard/             Génération du dashboard statique
  anonymization/         Anonymisation et validation des fixtures
  cli.ts                 Interface en ligne de commande
tests/                  Tests unitaires et contractuels
data/current/            Résultats courants
data/runs/               Historique des snapshots
docs/                   Documentation technique détaillée
```

## Commandes disponibles

---
  Commande                            Rôle
  ----------------------------------- -----------------------------------
  `npm run collect`                   Collecte les données RAW

  `npm run validate`                  Valide configuration et données

  `npm run analyze`                   Normalise, contrôle la qualité et
                                      calcule les KPI

  `npm run snapshot`                  Produit un snapshot

  `npm run dashboard`                 Génère le dashboard

  `npm run pipeline`                  Exécute le pipeline complet

  `npm run fixture:anonymize`         Génère une fixture anonymisée

  `npm run fixture:validate`          Valide une fixture anonymisée

  `npm run typecheck`                 Vérifie les types TypeScript

  `npm test`                          Exécute les tests

  `npm run lint`                      Exécute ESLint
---

## Historique et flux

Les métriques d'état courant et les métriques d'évolution sont
distinguées.

Les métriques de **stock** décrivent l'état à la date du snapshot :
anomalies ouvertes, en cours, corrigées, etc.

Les métriques de **flux** décrivent les évolutions entre deux snapshots
comparables : éléments créés, corrigés, rouverts ou annulés.

Les flux ne sont calculés que lorsqu'un snapshot précédent comparable
est disponible.

## Data Quality

Les contrôles `DQ-*` ne rendent pas automatiquement tous les KPI
invalides.

Une anomalie de qualité peut :

- exclure certaines données d'un indicateur ;
- réduire la fiabilité d'une métrique ;
- laisser les autres métriques inchangées ;
- rendre une métrique indisponible lorsqu'elle ne peut plus être
    calculée correctement.

Le détail des règles, sévérités, périmètres et impacts est documenté
dans [`docs/quality-rules.md`](docs/quality-rules.md).

## Documentation

Le README reste volontairement synthétique. Pour les détails techniques
:

- [`docs/index.md`](docs/index.md) --- index de la documentation ;
- [`docs/architecture.md`](docs/architecture.md) --- architecture ;
- [`docs/workflow.md`](docs/workflow.md) --- déroulement d'une
    exécution ;
- [`docs/data-flows.md`](docs/data-flows.md) --- flux de données ;
- [`docs/data-model.md`](docs/data-model.md) --- modèle de données ;
- [`docs/catalogue.md`](docs/catalogue.md) --- catalogue ;
- [`docs/github-collector.md`](docs/github-collector.md) --- collecte
    GitHub ;
- [`docs/analytics.md`](docs/analytics.md) --- calcul des KPI ;
- [`docs/snapshots-dashboard.md`](docs/snapshots-dashboard.md) ---
    snapshots et dashboard ;
- [`docs/testing.md`](docs/testing.md) --- stratégie de tests ;
- [`docs/quality-rules.md`](docs/quality-rules.md) --- règles Data
    Quality.

Les fichiers de configuration et le code restent les sources de vérité
exécutables ; la documentation décrit leurs contrats et leur intention.

## Dépannage

### `npm` ou `node` n'est pas reconnu

Installer Node.js 20+ et rouvrir le terminal.

### Le typecheck échoue

```bash
npm run typecheck
```

Corriger les erreurs TypeScript avant de relancer le pipeline.

### Le dashboard semble ancien

Regénérer le dashboard :

```bash
npm run dashboard
```

Puis rouvrir :

```text
data/dashboard/index.html
```

### Le pipeline retourne `PARTIAL`

Ce n'est pas nécessairement une erreur d'exécution. Consulter les
alertes Data Quality dans le dashboard et la documentation des règles
`DQ-*`.

### Une fixture est déclarée invalide

Générer ou consulter le rapport :

```bash
npm run fixture:validate -- \
  --input <fixture.json> \
  --report <fixture.json.validation.md>
```

Pour remonter jusqu'aux données d'origine, utiliser également le
manifeste `.trace.json`.

## Sécurité et données sensibles

Ne jamais versionner :

- tokens GitHub ;
- fichiers RAW issus d'un environnement réel ;
- manifestes de trace RAW ;
- fichiers contenant des données personnelles ou confidentielles.

Utiliser `.env` pour les secrets et conserver les traces RAW localement.

---

**Version du projet :** `0.1.0`\
**Stack :** Node.js · TypeScript · Commander · Vitest · ESLint\
**Modèle :** Design System Quality V2.1

## Documentation V11

La documentation structurée V11 est disponible dans [`docs/README.md`](docs/README.md). Les supports de présentation sont dans [`presentation/README.md`](presentation/README.md).

La documentation distingue explicitement faits implémentés, règles métier, propositions et questions ouvertes. Elle ne doit pas être considérée comme une nouvelle source de vérité fonctionnelle tant que les points marqués « à confirmer » n'ont pas été arbitrés.
