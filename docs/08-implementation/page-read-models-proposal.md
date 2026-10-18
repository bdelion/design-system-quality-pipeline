# Proposition : données du dashboard par page (#83)

**Statut : VALIDÉ par l’utilisateur le 18/10/2026 : « Go pour JSON intégré au HTML ».** Référence examinée : `develop` à `3e816bb`, après #82. Cette décision technique ne modifie aucune décision métier. Voir [ADR-005](../07-decisions/ADR-005-modeles-lecture-dashboard.md).

## Choix recommandé

Chaque page reçoit uniquement ses données interactives, dans un contrat JSON versionné intégré au HTML. Le snapshot complet, son RAW et les agrégats des autres parcours restent locaux au pipeline. L'accueil, par exemple, conserve ses cartes et tableaux calculés côté génération mais ne reçoit pas les milliers d'issues nécessaires aux explorateurs.

| Option                                                           | Avantages                                                                                                                                               | Contraintes                                                                                                                                               |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **JSON ciblé intégré dans chaque HTML — recommandé pour ce lot** | Aucun chargement réseau de données supplémentaire, distribution simple, erreurs limitées au contrat de la page, migration progressive des consommateurs | Les données réellement communes peuvent rester répétées entre pages ; chaque navigation HTML relit son propre contrat                                     |
| Fichiers JSON statiques séparés, servis en HTTP                  | Cache possible de ressources communes, chargement différé envisageable                                                                                  | Gestion supplémentaire des chargements, échecs HTTP, chemins et cache ; il faut distribuer tous les fichiers et mesurer les réponses réellement utilisées |

La première option réduit d'abord les données envoyées, avant de multiplier les mécanismes de chargement. Une extraction ultérieure pourra être décidée sur les mesures des modèles ciblés. Aucun parsing unique entre navigations HTML indépendantes n'est promis.

## Inventaire des consommateurs et contrat cible

L'inspection des assets montre que `app.js` ne lit dans le snapshot que `capturedAt` et `ruleVersion`. `issues.js` et `components.js` utilisent aussi la date de capture pour l'ancienneté affichée. Les autres informations de filtrage/navigation sont déjà dans les faits des explorateurs ou dans les attributs HTML.

| Page                   | Consommateurs                      | Données JSON nécessaires                                                                           |
| ---------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------- |
| Accueil                | `app.js`, navigation et infobulles | Métadonnées de capture uniquement ; stocks/délais/tableaux déjà rendus en HTML                     |
| Anomalies              | `app.js`, filtres DOM              | Métadonnées uniquement ; défauts et preuves déjà rendus en HTML                                    |
| Cartographie           | `app.js`, `graph.js`               | Métadonnées uniquement ; graphe et preuves filtrés dans le DOM                                     |
| Historique             | `app.js`, contexte                 | Métadonnées uniquement ; stocks/flux/journal déjà rendus en HTML                                   |
| Qualité                | `app.js`, filtres DQ               | Métadonnées uniquement ; diagnostics, effets et liens déjà rendus en HTML                          |
| Activité des équipes   | `app.js`, `issues.js`              | Métadonnées + faits de l'explorateur et préfixe de composant ; aucun RAW                           |
| Composants et versions | `app.js`, `components.js`          | Métadonnées + lignes de l'explorateur et faits associés ; aucun RAW                                |
| Epics                  | `app.js`, `epics.js`               | Métadonnées + modèle d'activité Epic pré-calculé                                                   |
| Audits et conformité   | `app.js`, `workspaces.js`          | Métadonnées + synthèses par contexte nécessaires aux cartes ; pas de lignes d'export accessibilité |
| Accessibilité          | `app.js`, `workspaces.js`          | Métadonnées + synthèses par contexte, faits des listes et population de revue pour les exports     |

Les infobulles communes seront initialisées par le script commun, indépendamment du modèle des espaces. Les modules spécifiques ne seront chargés que pour les pages qui les utilisent. Les synthèses de présentation omettront les champs non consommés dans le navigateur, tels que `sourceIds` lorsque les preuves correspondantes sont déjà rendues en HTML. Les règles de qualification, dates, verdicts, héritages et réserves ne changent pas.

Contrat proposé, à préciser par des types discriminés par page lors de l'implémentation :

```typescript
interface DashboardPageEnvelope<Page, Data> {
  schema: 'dsq-dashboard-page';
  version: 1;
  page: Page;
  snapshot: {
    id: string;
    capturedAt: string;
    modelVersion: string;
    ruleVersion: string;
  };
  data: Data;
}
```

Une page émet une seule enveloppe JSON. Un lecteur commun vérifie schéma, version, identité de page et sections obligatoires, puis la lit une seule fois par document pour ses modules. Aucun champ de type `Snapshot`, RAW ou collection de faits hors parcours n'est accepté comme raccourci de transport.

## Responsabilités et compatibilité

- Les calculs métier restent dans les couches existantes et leurs projections côté génération. Aucun nouveau moteur de conformité, de datation ou de fiabilité n'est introduit dans les assets.
- Les statistiques interactives d'exploration existantes continuent de porter sur les faits calculés et le sous-ensemble filtré/sélectionné ; elles ne redéfinissent pas les règles métier ni les verdicts.
- Les snapshots anciens compatibles restent inchangés. La génération utilise les projections existantes, notamment `workspaceModel`, pour produire le nouveau contrat ; les qualifications historiques restent conservées.
- Les nouveaux HTML ne dépendront plus de `window.__SNAPSHOT__`. Les anciens dossiers générés restent utilisables avec leurs propres assets ; mélanger des HTML et assets de générations différentes n'est pas supporté et doit conduire à une explication, pas à une interprétation silencieuse d'un contrat inconnu.
- URL, dimensions de contexte, liens ciblés, contenus et règles des CSV restent compatibles. Le RAW ne devient pas un fichier distribué automatiquement avec le dashboard.

## HTTP, file et erreurs

Le dossier `dashboard/` complet, avec ses assets JS/CSS/images, reste l'unité de distribution. Un serveur HTTP statique local suffit ; aucun backend métier ni accès GitHub n'est requis à la consultation. En `file:`, l'explication existante et la désactivation des interactions sont préservées, même si les modules sont bloqués.

Si le contrat est absent, illisible, d'une version inconnue, destiné à une autre page ou dépourvu de détails requis, la page explique la cause et invite à régénérer. Les filtres/exports concernés sont désactivés ; les indicateurs interactifs deviennent indisponibles, sans zéro substitué. Les parties HTML statiques ne sont pas présentées comme un résultat filtré recalculé après cet échec.

## Mesures et validations prévues

Le budget déjà validé avec #81 reste inchangé : 0 % de croissance face à une référence compatible, sans seuil temporel. La cible accueil < 1 Mo n'est pas transformée en décision implicite.

Le benchmark sera complété par un inventaire des fichiers statiques partagés et des ressources réellement utilisées par chaque page : octets HTML, JSON intégré (inclus dans HTML), JS/CSS/images et poids total sans double addition du JSON. Pour une ancienne mesure sans ces champs, leurs valeurs seront indisponibles, jamais inventées à zéro ; la mesure des fichiers de référence sera rejouable. Les ressources communes seront comptées une fois pour la distribution, et leur coût par page restera explicite. Aucun cache ou parsing commun entre navigations n'est supposé.

Avant livraison : tests de contrat et d'absence de RAW/données hors parcours, parité des projections courantes/anciennes, cas de contrat invalide/incomplet, tests PC des KPI/filtres/liens/CSV et du mode `file:`, comparaison de contrôle et de charge de #81/#82, puis `npm run check:dashboard`. La migration sera découpée en projection, lecteur commun, consommateurs puis suppression des anciens transports dans le même patch vérifié. Le commit final citera `Closes #83` et `Refs #77` uniquement après satisfaction des critères.

## État implémenté et vérifié le 19/10/2026

La solution intégrée est implémentée pour les dix pages. Les types de projection sont dans `page-read-model.ts` et `explorer-read-model.ts` ; les sections requises selon l’identité de page sont validées à la lecture dans `assets/page-model.js`. Les anciens transports ont été retirés. `npm.cmd run check:dashboard` a abouti : types, lint, TSDoc, 331 tests unitaires, build, 41 tests Playwright PC, format et TypeDoc. TypeDoc conserve son avertissement préexistant sur `Resource`, sans erreur.

Les mesures et limites sont consignées dans le [protocole et les résultats #83](dashboard-benchmark.md#modèles-de-lecture-par-page-83). Les budgets #81 ne sont pas modifiés. Ce résultat technique ne résout aucun arbitrage métier supplémentaire et ne met pas en œuvre de pagination.
