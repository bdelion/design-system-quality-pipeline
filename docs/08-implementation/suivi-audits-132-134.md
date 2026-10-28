# Suivi des audits (#132–#134)

## Configuration — D-247

**ÉTABLI le 28 octobre 2026 :** le suivi commence à une version minimale SemVer
inclusive par `owner/repository`. Un dépôt non renseigné est exclu du suivi.
Les anciennes données restent disponibles pour l’activité et l’historique.

**IMPLÉMENTÉ :** `github.auditTracking` dans le profil contient ces correspondances.
Le profil partagé contient un objet vide : aucun dépôt privé n’est présumé.
Copier [l’exemple](../../config/audit-tracking.example.json) dans un fichier local :

```json
{ "example-owner/demo-react": "1.7.1" }
```

Les clés doivent correspondre exactement à l’entrée : noms réels pour la collecte,
alias pour le rejeu anonymisé. La préparation des fixtures transpose les bornes
embarquées avec les mêmes alias que les dépôts. Un objet vide exclut tous les dépôts.

```powershell
npm.cmd run collect -- --repositories config/local/repositories.json --output data/raw/nouvelle-collecte.json --audit-tracking config/local/audit-tracking.json
npm.cmd run pipeline -- --dataset datasets/mon-dataset --output data/output/mon-rejeu --audit-tracking config/local/audit-tracking-anonymise.json
```

Conserver aussi les options historiques du [guide de reprise](reprise-locale-dashboards.md).
La collecte embarque le paramètre dans son contexte ; le rejeu le remplace pour
cette exécution seulement. Aucun fichier local n’est chargé implicitement.
Les anciennes fixtures/snapshots sans le champ conservent leur contrat sans borne :
rejouer avec l’option pour appliquer le nouveau périmètre. Les entrées et les
anciens snapshots restent intacts. La page détaillée d’audit reçoit aussi une
projection Analytics bornée, y compris ses indicateurs et choix de versions.

## Vue « Latest version » — D-248

**ÉTABLI et IMPLÉMENTÉ :** les quatre tableaux de « Audits par version » proposent
une case indépendante, initialement désactivée. La version indiquée est la plus
haute selon SemVer parmi les versions publiées (tag PROD prouvé) ou explicitement
déclarées en développement, pour chaque dépôt suivi. Une simple référence future
ne suffit pas : le dataset actuel retient 1.8.0 et non 1.9.0. Les audits au-delà
de latest ne sont pas inclus dans le cumul.
Le filtre Repository reste actif ; le filtre Version est explicitement ignoré
par un tableau en mode latest. Recherche, tri, pagination, preuves et CSV suivent
la même population.

Les répartitions cumulent les issues distinctes des audits suivis par dépôt et
dimension. Une issue multi-critères peut apparaître dans plusieurs groupes.
Traités reste `(Réalisé + Annulées) / Total`, avec statuts inconnus séparés.
Le navigateur restitue les agrégats préparés dans Analytics.

La campagne utilise seulement le catalogue latest pour compter les composants.
Les audits sont cumulés, les composants dédupliqués. Le verdict de la cohorte
terminée applicable prévaut ; un audit incomplet ou le traitement de ses anomalies
ne rend pas un composant conforme. Les déclarations restent distinctes des
verdicts (D-246). Plusieurs audits par composant peuvent produire plus de 100 %
dans le ratio audits/composants ; ce ratio n’est pas une couverture distincte.

## Composants à auditer — D-249

**ÉTABLI et IMPLÉMENTÉ :** la section utilise le catalogue latest et cumule les
motifs observés : aucun audit terminé dans le périmètre suivi, évolution explicite
(`added`, `modified`, `renamed`) dans la version en développement, ou retours du
dernier audit applicable tous traités après ce dernier audit terminé.

Le traitement exige une correction confirmée ou une annulation Project. Les dates
de transition et de fusion sont utilisées ; la clôture est un repli si la
transition manque. Un audit terminé après les traitements évite une relance
inutile. Sans chronologie suffisante, le besoin reste à confirmer. Un statut
inconnu empêche de conclure que tout est traité.

Les audits planifiés/en cours sont visibles. Une présence sans changement connu
n’est pas une évolution technique : réserve « Évolution non renseignée ».
Les lignes à confirmer se distinguent des motifs démontrés et ne prouvent pas une
non-conformité. Aucune issue GitHub n’est créée.

## Vérification

**REJEU EFFECTUÉ — 28 octobre 2026 :** le dataset anonymisé avec les déclarations
historiques locales donne latest 1.8.0, 76 composants et 39 audits cumulés.
Les verdicts sont 11 conformes, 17 non conformes et 48 non couverts. Pour la
criticité Majeure : 34 anomalies distinctes, 29 à faire, 5 réalisées, aucune
annulée ou inconnue, soit 5/34 = 14,7 % traités, conformément à l’exemple de #133.

La liste à auditer contient 75 composants distincts : 48 sans audit terminé dans
le périmètre, 72 avec évolution explicitement renseignée en développement et
1 avec retours tous traités nécessitant un réaudit. Les motifs se recoupent :
leurs nombres ne s’additionnent pas. Aucun de ces 75 composants n’est présent
uniquement pour une réserve. Les cinq espaces synthétiques ont été ouverts avec
les quatre vues latest activées, sans erreur JavaScript ; le dataset source est
resté intact.

Tests dédiés : `tests/issues-132-134.test.ts`,
`tests/anonymization-config.test.ts`, `tests/historical-declarations.test.ts` et
`tests/browser/issues-132-134.spec.ts` (preuves, CSV, accessibilité et mobile).
La référence de poids est mesurée sur control/81 inchangée ; aucun budget
classique n’est élargi et la croissance hors fonctionnalités reste à 0 %.
