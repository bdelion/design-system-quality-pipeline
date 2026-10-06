# Modèle normalisé

## Objectif

Le modèle normalisé traduit les données RAW en objets exploitables par
le métier sans exposer directement la structure de l'API GitHub.

Il constitue la frontière entre :

``` text
formats des sources
        ↓
normalisation
        ↓
concepts utilisés par le pipeline
```

## État actuellement implémenté

Le modèle TypeScript actuel contient principalement :

-   `Library` ;
-   `Component` ;
-   `Audit` ;
-   `Anomaly` ;
-   `PullRequest`.

Cet inventaire décrit **l'état du code actuel**. Il ne doit pas être
interprété comme le modèle métier cible complet.

La décision D-145 établit que le modèle cible doit également contenir
une entité générique `Issue` pour chaque Issue GitHub collectée. Les
objets spécialisés tels que `Audit`, `Anomaly` ou une Improvement
d'Audit sont dérivés des Issues concernées sans supprimer leur
représentation générique.

Conformément à D-146, cette entité générique conserve le type d’Issue GitHub/métier collecté dans un champ `issueType`. Ce champ fait partie du contrat normalisé de l’Issue et ne doit pas être perdu pendant la transformation `RawIssue → Issue`.

Conformément à D-147, les Issue Types forment un vocabulaire global au système et non une configuration propre à chaque repository. Les valeurs observées peuvent être inventoriées à partir du dataset collecté. La reconnaissance des notions métier est pilotée par une configuration globale associant une notion canonique à plusieurs valeurs ou mots-clés acceptés, dans la continuité de `github.issueTypes.keywords` dans `system.yaml`. Conformément à D-148, une valeur non reconnue reste conservée telle qu’elle a été collectée. L’Issue normalisée n’est ni supprimée ni invalidée pour ce motif. La Data Quality doit signaler le cas par un élément « issueType à déclarer » contenant au minimum la valeur brute concernée et un lien vers l’Issue GitHub source. Cette réserve est non bloquante pour le pipeline. Conformément à D-149, le modèle normalisé porte séparément la valeur brute remontée par GitHub et la notion canonique reconnue par le pipeline ; la canonicalisation ne remplace jamais la donnée source. Conformément à D-150, la notion canonique est optionnelle : si aucune notion n’est reconnue, elle est absente et aucune valeur `UNKNOWN` n’est injectée. Conformément à D-151, cette notion canonique est dérivée à chaque exécution depuis la valeur brute et la configuration courante ; elle n’est pas une vérité historique indépendante à conserver lorsque la configuration évolue. La liste définitive des notions canoniques reste à préciser.

Les décisions métier ont également établi ou introduit des concepts
supplémentaires, notamment autour des Packages, Versions, Improvements,
Catalogues historiques et Audits applicables. Leur traduction dans le
modèle normalisé est réalisée progressivement dans les lots
d'implémentation V1.

## Relations

Les objets normalisés sont reliés par des identifiants stables.

Le normaliseur peut ainsi établir des relations entre :

-   Library et Issues ;
-   Library et Components ;
-   Issues et objets métier spécialisés dérivés ;
-   Components et Audits ;
-   Audits et Anomalies ;
-   Issues et Pull Requests selon les données disponibles.

Les cardinalités métier cibles ne doivent pas être déduites uniquement
des structures TypeScript actuelles.

## Identifiants stables

L'implémentation utilise `stableId(prefix, value)` pour produire des
identifiants déterministes.

À entrée équivalente, le même objet logique reçoit donc le même
identifiant stable.

Ce mécanisme facilite notamment :

-   les relations entre objets normalisés ;
-   les comparaisons de Snapshots ;
-   la détection de changements entre exécutions.

Un identifiant stable technique ne remplace pas pour autant la
définition d'une identité métier. Cette dernière doit rester documentée
pour chaque objet.

## Provenance

Les entités normalisées conservent une provenance permettant de remonter
vers les données ayant servi à leur construction.

Le modèle actuel utilise notamment des informations telles que :

-   `source` ;
-   `sourceId` ;
-   `collectedAt`.

La provenance permet d'expliquer :

-   l'origine d'une entité ;
-   l'origine d'une alerte DQ ;
-   les entités ayant contribué à une métrique.

## État de qualité

Le contrat actuel définit les statuts :

``` text
reliable
partial
unknown
invalid
```

Ils permettent de distinguer plusieurs situations qui ne doivent pas
être confondues.

Par exemple, une information absente ne doit pas être transformée
artificiellement en valeur zéro.

La stratégie cible de fiabilité est métrique-spécifique : une
incohérence sur une dimension ne doit pas automatiquement rendre toutes
les métriques du Snapshot partielles.

## Exemple : valeur inconnue

Si la date nécessaire au calcul d'un délai n'est pas disponible, le
pipeline doit représenter le délai comme inconnu plutôt que comme nul.

``` text
absence de preuve
≠
valeur métier égale à zéro
```

## Indépendance vis-à-vis des sources

Le modèle normalisé est la couche destinée à accueillir d'autres sources
que GitHub.

Une nouvelle source doit être adaptée vers les concepts normalisés au
moyen d'un mapping explicite, sans imposer son schéma propre au moteur
de métriques ou au dashboard.

## Évolution du modèle

L'enrichissement du modèle doit suivre l'ordre suivant :

1.  décision ou définition métier ;
2.  cardinalités et règles ;
3.  contrat normalisé ;
4.  mapping depuis le RAW ;
5.  Data Quality ;
6.  métriques ;
7.  restitution.

Le code existant ne doit donc pas être utilisé pour limiter
artificiellement le modèle métier cible.
