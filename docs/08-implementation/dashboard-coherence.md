# Cohérence des pages du dashboard

Ce contrat remplace les anciens lots qui assimilaient `Closed` ou le seul `Done` à un traitement.

## Référentiel commun

### Présentation des KPI d’accessibilité (#79)

**IMPLÉMENTÉ.** Les cartes complètes et compactes emploient une présentation commune dans le HTML généré et après filtrage : taux en `%`, délais en `j`, effectifs sans unité ambiguë et population nommée près de la valeur. Exemples synthétiques : « 21,1 % · 16 sur 76 composants présents », « 50 % · 8 sur 16 composants couverts », « 5,2 j · 12 issues mesurables ». Les délais précisent les effectifs de dates Done et d’estimations déjà fournis par Analytics.

Un zéro mesuré reste visible : `0 %` avec un dénominateur positif, ou `0 j` avec une population mesurable. Une valeur absente/non finie, un dénominateur nul ou une présence indéterminée empêchant de conclure restent indisponibles. Aucun agrégat global n’est substitué à un périmètre sans données.

Les réserves sont visibles dans chaque carte, sans imposer l’ouverture de l’aide. Les nombres de réserves DQ sont explicitement ceux du **périmètre**, pas une preuve que chaque KPI est individuellement partiel ; les présences/verdicts indéterminés restent signalés. Le formatage restitue les valeurs et leurs populations pré-calculées ; il ne modifie ni les formules, ni la sélection PROD/développement traitée séparément dans #80.

### Compteurs de l’explorateur Composants (#78)

**IMPLÉMENTÉ.** Le résumé et le retour de filtrage annoncé aux technologies d’assistance utilisent le même rendu de l’explorateur : composants visibles et issues distinctes, sans addition de lignes provenant d’autres tableaux. Une issue liée à plusieurs composants n’est comptée qu’une fois dans la population d’issues.

La sélection conserve les composants visibles et indique séparément combien de composants sont sélectionnés ; le nombre d’issues et les statistiques portent alors sur l’intersection entre sélection et résultats filtrés. « Réinitialiser la sélection » restaure les statistiques de tous les résultats visibles. La recherche, les filtres locaux/par colonne et partagés, les liens ciblés et leur effacement actualisent les deux résumés. Le bouton « Réinitialiser » efface les filtres ; la sélection dispose de son propre bouton.

Un modèle chargé sans résultat affiche zéro composant et zéro issue. Un modèle absent, illisible ou non tabulaire est signalé comme indisponible : ses contrôles sont désactivés et aucun effectif nul n’est présenté comme une mesure. Cette correction ne change ni les règles métier ni les populations Analytics du pipeline.

### Suivi des Epics (#69)

**IMPLÉMENTÉ.** Depuis « Activité des équipes », la sous-navigation « Suivi des Epics » ouvre `epics.html`. La page permet de choisir une Epic du dataset et d'exporter ses lignes en CSV. Les rattachements sont les mentions `#numéro`, `owner/repository#numéro` ou URL d'issue présentes dans la description, sans nécessité de mot-clé de clôture. Ils restent distincts des parents/sub-issues. La collecte conserve uniquement les identifiants référencés ; les descriptions ne sont pas embarquées. L'anonymisation remappe aussi les mentions entre dépôts ; une référence non résolue reste opaque et ne fabrique pas d'Epic.

Le pipeline calcule une ligne par composant préfixé et issue rattachée, avec numéro et lien de l'issue, vélocité du Project, premier passage à In progress, dernier passage à Done et durée en heures. La durée est **calendaire**, sans retrait des pauses, week-ends ou réouvertures ; elle ne mesure pas une charge de travail. Elle ne dépend pas de `closedAt`, de l'état GitHub courant ou des critères de fin d'audit. Les versions futures, comme 1.9.0 pour un package 1.8.0, restent incluses dans cette activité.

Les dates sont triées par instant, en tenant compte des fuseaux horaires. Une date de transition requise invalide, un Done antérieur au premier In progress, un historique absent ou une transition manquante sont indiqués dans la cellule du temps passé. La vélocité `0` est conservée ; une valeur absente reste inconnue. Le parcours demandé possède un Project ; si plusieurs contextes sont présents, aucun choix arbitraire n'est fait et le calcul est signalé ambigu. Une issue sans label de composant reste visible avec « Composant absent ». Une issue multi-composants donne plusieurs lignes : ces durées ne doivent pas être additionnées comme des charges distinctes.

Le CSV contient les lignes de l'Epic sélectionnée, le repository et le numéro de l'Epic, les mêmes valeurs et motifs que la page. Il utilise UTF-8 avec BOM, séparateur `;`, échappement des guillemets et protection des cellules interprétables comme formules.

Un historique dont la première transition indique un état précédent In progress prouve que le travail avait déjà commencé avant les événements disponibles : la date du premier passage est alors inconnue et la durée n'est pas fabriquée à partir d'une réentrée ultérieure. Une transition In progress vers In progress ne constitue pas une nouvelle entrée.

**Pour les anciennes fixtures :** un nouveau pipeline crée la page, mais ne peut retrouver les références supprimées lors des anciennes collectes. Refaire une collecte puis préparer une nouvelle fixture. Une collecte partielle est signalée, sans convertir l'absence de capture en preuve qu'aucune issue n'est rattachée. Le jeu `issue-49` existant reste intact et nécessite cette nouvelle collecte pour produire le suivi réel de son Epic.

Exemple depuis la racine du projet, en choisissant des destinations qui n'existent pas encore pour la collecte et la préparation :

```powershell
npm.cmd run collect -- --repositories repositories.json --output data/local/issue-69/raw.json
npm.cmd run fixture:prepare -- --input data/local/issue-69/raw.json --output datasets/issue-69
npm.cmd run pipeline -- --dataset datasets/issue-69 --output data/output/issue-69
npm.cmd run dashboard:serve -- data/output/issue-69/dashboard
```

`repositories.json` contient les noms réels `owner/repository` à collecter, avec le token configuré localement. Ouvrir `http://127.0.0.1:4174/epics.html`, puis choisir l'Epic : son numéro peut avoir changé après anonymisation. Pour conserver les mêmes alias entre captures, utiliser la même graine d'anonymisation selon le [parcours des datasets](datasets.md#anonymisation). Aucun catalogue historique n'est nécessaire pour ce suivi d'activité ; les enrichissements de qualité restent facultatifs et distincts.

La comparaison des repositories sur la page Audits est une synthèse calculée dans le pipeline par repository et version cible : composants distincts avec audit, états des audits, résultats des seuls audits terminés, anomalies distinctes explicitement rattachées et améliorations. Les anomalies hors audit sont exclues de ce tableau ; sa qualité agrège les réserves des preuves concernées. Les repositories sans audit reconnu ne sont pas présentés comme des stocks nuls. Cette synthèse ne dépend pas du catalogue historique et n’est pas une couverture des dernières versions PROD. Un ancien snapshot sans cette synthèse demande un nouveau rejeu, sans recalcul métier dans le dashboard.

Dans « Composants par repository », le résultat affiché porte sur l’audit de la version cible, déterminée par la milestone. Un audit terminé restitue son résultat calculé par le pipeline ; une amélioration n’altère pas sa conformité. Les audits incomplets n’ont pas de résultat définitif. Les versions sont filtrables même sans catalogue historique ; aucun résultat n’est propagé vers une autre version. La publication PROD est indiquée seulement lorsqu’un tag PROD est connu, sinon elle reste non prouvée. Les métriques et verdicts historiques Component × Version restent distincts et exigent leurs preuves de présence.

Les répartitions de critères et de composants sur la page Accessibilité sont triées par défaut par intitulé croissant (locale française, nombres naturels). Chacune propose un choix indépendant : intitulé ou nombre, croissant ou décroissant. Les égalités de nombre sont départagées par intitulé croissant. Le choix reste conservé après filtrage et s’applique aussi aux détails ; l’ordre métier des criticités reste conservé. Le tableau « Composants par repository » s’ouvre trié par repository, puis composant, indépendamment de l’ordre des données (#65). Les tris manuels restent disponibles.

- `src/domain/business.ts` définit la classification exclusive, le statut Project effectif, le traitement `Done ET Closed` et le cycle de vie des audits.
- `src/analytics/issues.ts` projette les mêmes faits sur toutes les issues, indépendamment de leur type. Les labels multi-composants ne multiplient pas leur poids dans les KPI.
- `src/analytics/statistics.js` est partagé sans duplication entre Analytics, le générateur et les deux explorateurs. Les populations réelles et estimées possèdent leurs propres effectifs. Une population vide donne une valeur inconnue, pas zéro.
- `src/dashboard/read-model.ts` met en cache les faits pendant une génération, puis les invalide au début de la génération suivante.

Un `BUG` n'est pas une anomalie RGAA par son seul type. Les anomalies normalisées hors audit, les anomalies d'audit, les Improvements et les autres issues restent distincts. Une origine indéterminée reste signalée.

## Traitement et dates

Le dernier événement Project daté prévaut sur le statut déclaré. Un événement daté non reconnu ne rétablit pas artificiellement un ancien statut connu. Les contextes Project contradictoires ne prouvent pas une terminaison.

`Cancelled` est distinct de `Done` et exclut le délai de traitement. `Closed` sans preuve Project reste non traité / non prouvé, même si une ancienne valeur déclare un résultat conforme.

Une issue `Done ET Closed` sans date Done peut contribuer au stock traité. Son délai utilise éventuellement `closedAt`, avec provenance **estimée**. Les audits n'utilisent jamais cette estimation pour leur date de réalisation ni pour les verdicts historiques. Les durées invalides ou négatives sont exclues.

Les délais historiques d'anomalies corrigées puis rouvertes restent un périmètre distinct des délais des issues actuellement traitées. Comparer des KPI exige une population identique.

## Conformité et traçabilité

La conformité vient des couples `Component × Version` et de leurs `applicableAuditIds`, selon D-220 à D-228. Le tableau identifie **direct** et **hérité**. Une campagne en cours ou annulée ne remplace pas une cohorte terminée et datée. La correction d'une anomalie ne revalide pas la conformité.

La synthèse d'un composant affiche le verdict de sa dernière version canonique, et l'explorateur reprend celui de la version filtrée. Le résultat d'un audit isolé n'est pas un verdict global du composant. Une version sans relation historique reste non couverte.

La cartographie contient une table exhaustive incluant les issues transverses. Chaque audit et chaque anomalie possède un lien ciblé ; une parenté multiple ou contradictoire n'attribue aucune anomalie. Une PR, un composant ou un libellé commun ne prouve pas une relation d'audit.

## Navigation

Les dimensions partagées sont `repository` (owner/name), `component` (nom ou identité canonique), `version` (numéro ou identité canonique), `issue`, `audit`, `anomaly` et `family`.

Les filtres forment une intersection ; une dimension absente d'une preuve ne satisfait pas ce filtre. Une référence inconnue donne une population vide et reste visible dans le sélecteur. Les modifications mettent à jour l'URL, les liens et les vues. Effacer le périmètre supprime ses anciennes dimensions.

Les liens ciblant une issue, un audit ou une anomalie remplacent les anciennes identités, familles et versions afin d'éviter un contexte contradictoire. Les paramètres explicitement écrits dans le lien cible et son ancre sont conservés. Les liens externes et téléchargements restent indépendants.

Les cartes KPI présentent le **snapshot complet**, explicitement indiqué sur chaque page. Les tableaux et statistiques des explorateurs suivent les filtres et la sélection ; ils ne prétendent pas recalculer des verdicts Analytics dans le navigateur.

## Historique et explicabilité

Le journal donne l'entité, l'état avant/après, les deux identifiants de snapshot et la date d'observation. Une date métier n'est présentée que si un événement Project explicite existe dans l'intervalle. Sans comparaison compatible, les flux et transitions sont indisponibles, pas nuls.

La section **Preuves des métriques Analytics** expose définition, périmètre, effectifs, sources, exclusions et diagnostics DQ sur toutes les pages. Les populations issues/anomalies et stocks/flux ne sont pas additives.

## Validation

`tests/dashboard-consolidation.test.ts`, `tests/dashboard-context-filter-contract.test.ts`, les tests I3/I6/I7 et `tests/browser/dashboard.spec.ts` protègent les contrats. Le [rapport de consolidation](dashboard-consolidation-complete.md) contient les résultats effectivement obtenus.

Les photographies `atRelease` déjà présentes dans une capture compatible antérieure à la capture courante sont préservées pour les versions alors publiées. Une annulation ultérieure modifie `currentKnowledge`, sans réécrire la photographie acquise. Les différences de modèle, règles ou périmètre empêchent cette réutilisation.

Le calcul actuel de la date de fin d’audit par dernière transition Done est un comportement implémenté du contrat V3. D-047 définit la date métier comme l’instant où la seconde condition Done + Closed est satisfaite ; l’écart est détaillé dans `docs/01-metier/audits.md` et reste à arbitrer. D-238 ne porte pas sur les dates.
