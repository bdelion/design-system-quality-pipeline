# Cohérence des pages du dashboard

Ce contrat remplace les anciens lots qui assimilaient `Closed` ou le seul `Done` à un traitement.

## Référentiel commun

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
