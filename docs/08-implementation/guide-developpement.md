# Guide de développement

## 1. Stack observée

Le repository utilise actuellement notamment :

- Node.js \>= 20 ;
- TypeScript ;
- ESM ;
- Commander ;
- YAML ;
- Vitest ;
- ESLint ;
- `tsx` pour l'exécution TypeScript.

Cette liste décrit l'état observé du projet. Les versions et dépendances
exécutables restent définies par `package.json`, le lockfile et la
configuration du repository.

---

## 2. Installation

Pour une vérification reproductible à partir du lockfile :

```bash
npm ci
```

Pour le travail de développement local lorsqu'une installation stricte
depuis le lockfile n'est pas recherchée :

```bash
npm install
```

La CI constitue la vérification en environnement propre à partir du
repository versionné.

---

## 3. Vérifications standard

Avant de considérer une modification technique comme prête :

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Lorsqu'une modification affecte le pipeline, les données, les métriques,
les Snapshots ou le dashboard, compléter par une exécution
représentative :

```bash
npm run pipeline
```

avec la fixture appropriée.

Ne jamais affirmer qu'une suite de tests est verte sans l'avoir
réellement exécutée dans l'environnement concerné ou sans disposer d'un
résultat CI correspondant.

---

## 4. Vérification d'une évolution du pipeline

Pour une évolution affectant le pipeline de bout en bout :

1. installer les dépendances depuis le lockfile ;
2. vérifier le typage ;
3. exécuter le lint ;
4. exécuter les tests ;
5. construire le projet ;
6. exécuter le pipeline sur une fixture représentative ;
7. inspecter `data/current/snapshot.json` ;
8. inspecter le dashboard généré ;
9. lorsque l'évolution concerne l'historisation, vérifier le
   comportement avec un Snapshot précédent comparable.

Commandes de référence :

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm run pipeline
```

Les arguments nécessaires à `npm run pipeline` dépendent de la source et
de la fixture choisies.

---

## 5. CI

La configuration exécutable de la CI se trouve sous :

```text
.github/workflows/
```

Au moment de la consolidation documentaire V2, la CI vérifie les
branches et Pull Requests configurées par le workflow GitHub Actions et
exécute les contrôles du projet dans un environnement propre.

Les noms de branches, événements et commandes exactes doivent être lus
dans le workflow versionné plutôt que dupliqués ici comme une règle
immuable.

---

## 6. Évolution métier

Une évolution métier doit suivre autant que possible cet ordre :

1. établir ou mettre à jour la définition métier ;
2. enregistrer la décision si le point était ouvert ;
3. mettre à jour les règles et cardinalités concernées ;
4. faire évoluer le modèle ou la configuration ;
5. adapter les tests ;
6. adapter l'implémentation ;
7. mettre à jour la documentation technique ;
8. mettre à jour la restitution ou la présentation si le changement est
   visible pour ses utilisateurs.

Le code actuel ne doit pas être utilisé pour invalider une décision
métier déjà établie simplement parce qu'elle n'est pas encore
implémentée.

---

## 7. Évolution des contrats

Les frontières principales à protéger sont :

```text
Source → RAW
RAW → NormalizedData
NormalizedData + DQ → Metrics
Metrics → Snapshot
Snapshot → Dashboard
```

Une modification d'un contrat doit entraîner l'examen des couches
suivantes et des tests associés.

Voir également :

- `docs/05-donnees/architecture-donnees.md` ;
- `docs/06-architecture/pipeline.md` ;
- `docs/08-implementation/tests.md`.

---

## 8. Release readiness technique

Le document historique `release-readiness.md` accompagnait la
stabilisation du contrat Analytics V2.

Ses principes encore applicables ont été répartis dans la documentation
structurée :

- `Analytics.metrics` comme contrat analytique courant :
  `docs/04-indicateurs/catalogue-indicateurs.md` ;
- impacts DQ métrique-spécifiques :
  `docs/06-architecture/metric-engine.md` ;
- stocks, flux et historique : `docs/05-donnees/historique.md` ;
- fiabilité du Snapshot : `docs/05-donnees/snapshots.md` ;
- checklist technique : la présente page.

Une future procédure de Release du produit
`design-system-quality-pipeline` devra être documentée explicitement si
elle devient plus riche qu'une validation CI/build.

---

## 9. Limitation d'environnement

Si les dépendances ne peuvent pas être installées ou si les commandes de
validation ne peuvent pas être exécutées dans l'environnement utilisé,
le résultat doit être présenté comme **non vérifié**.

Une impossibilité d'exécution n'est ni un succès ni un échec
fonctionnel.

Lorsque GitHub Actions exécute les contrôles depuis un runner propre et
le lockfile versionné, son résultat constitue la référence de
vérification CI pour le commit concerné.
