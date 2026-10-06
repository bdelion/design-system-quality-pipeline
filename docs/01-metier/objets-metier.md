# Objets métier

## 1. Objectif

Ce document recense les objets du **Design System Quality Pipeline** et
précise leur rôle dans le modèle consolidé.

Les cardinalités sont centralisées dans `relations.md`.

Quatre statuts sont utilisés :

-   **ÉTABLI** : définition métier suffisamment stabilisée ;
-   **ACTUEL** : représentation observée aujourd'hui ;
-   **À CONFIRMER** : abstraction ou propriété encore ouverte ;
-   **FUTUR** : objet volontairement hors V1.

------------------------------------------------------------------------

## 2. Design System

Le **Design System** est l'ensemble cohérent de ressources, Composants,
règles et Librairies mis à disposition des produits de l'entreprise.

Il constitue la racine métier du périmètre suivi.

**Statut : ÉTABLI.**

------------------------------------------------------------------------

## 3. Librairie

Une **Librairie** est une unité métier du Design System mise à
disposition des Applications consommatrices.

### Actuel

``` text
1 Repository = 1 Librairie
1 Librairie = 1 Package
```

### Cible

``` text
1 Repository = 1..n Librairies
1 Librairie = 1..n Packages
```

La Librairie possède donc une identité métier qui ne doit pas être
réduite à celle du Repository.

**Statut : ÉTABLI pour l'objet et l'orientation cible.**

------------------------------------------------------------------------

## 4. Repository

Le **Repository** est un conteneur technique GitHub.

Il fournit notamment :

-   Issues ;
-   Pull Requests ;
-   Milestones ;
-   branches ;
-   tags ;
-   Releases ;
-   informations de Projects.

Il constitue une source et un périmètre technique, pas l'identité métier
définitive d'une Librairie.

**Statut : ÉTABLI.**

------------------------------------------------------------------------

## 5. Package

Le **Package** est une unité distribuable pouvant être référencée comme
dépendance par une Application.

Éléments déjà établis :

-   il possède un nom ;
-   il possède des Versions ;
-   ses artefacts sont publiés dans Nexus ;
-   une Application le consomme dans une Version donnée.

Aujourd'hui, une Librairie correspond à un Package.

À terme, une Librairie pourra être distribuée par plusieurs Packages.

Les propriétés définitives et les cas multi-Packages restent à
instruire.

**Statut : PARTIELLEMENT ÉTABLI --- Q-001, Q-002.**

------------------------------------------------------------------------

## 6. Version

Une **Version** identifie un état versionné d'un Package.

Les formes actuellement établies sont notamment :

``` text
M.m.r-SNAPSHOT
M.m.r-rc.n
M.m.r-hc.n
M.m.r
```

Il faut distinguer :

-   Version déclarée dans `package.json` ;
-   Version d'artefact construite ou publiée par Jenkins.

Une Version PROD :

-   est de forme `M.m.r` ;
-   n'a pas de suffixe ;
-   est publiée dans l'espace Nexus PROD ;
-   possède un Tag Git correspondant ;
-   doit disposer d'une Milestone `M.m.r` ;
-   possède normalement une Release GitHub, dont le caractère
    obligatoire reste à confirmer.

**Statut : ÉTABLI, sauf Release GitHub obligatoire.**

------------------------------------------------------------------------

## 7. Build Jenkins

Le **Build Jenkins** est une exécution technique participant à la
construction et à la publication des Versions.

Son numéro intervient dans les suffixes `rc.n` et `hc.n`.

Il reste un objet de source technique et n'est pas nécessairement un
objet métier autonome du futur modèle normalisé.

**Statut : ACTUEL / technique.**

------------------------------------------------------------------------

## 8. Composant

Le **Composant** est une unité fonctionnelle réutilisable appartenant à
une Librairie.

Il peut être concerné par :

-   des Issues ;
-   des Audits ;
-   des Anomalies ;
-   des Improvements ;
-   des Versions ;
-   des informations de qualité.

Le Catalogue constitue la référence des Composants connus.

Le rattachement futur exact du Composant aux Packages d'une Librairie
multi-Packages reste ouvert.

**Statut : ÉTABLI pour l'objet ; relation Package À CONFIRMER.**

------------------------------------------------------------------------

## 9. Issue

Une **Issue** est un élément de travail actuellement matérialisé dans
GitHub.

Elle peut notamment porter :

-   Issue Type ;
-   labels ;
-   Status ;
-   Velocity ;
-   Iteration ;
-   Milestone ;
-   relations avec d'autres Issues ;
-   relations avec des Pull Requests ;
-   zéro, un ou plusieurs Composants selon sa nature.

Une Issue n'est pas automatiquement une Anomalie.

Toutes les Issues GitHub collectées sont conservées dans le modèle
normalisé sous la forme d'une entité générique `Issue`, y compris
lorsqu'elles ne correspondent à aucun objet métier spécialisé.

Lorsqu'une Issue satisfait les règles d'un objet spécialisé, cet objet
est dérivé de l'Issue sans la remplacer. Une même donnée source peut
donc être représentée par l'`Issue` normalisée et par l'objet métier
spécialisé correspondant, reliés par leur identité ou leur provenance.

Une Issue qui concerne effectivement un Composant doit porter le label
correspondant. Une Issue réellement transverse peut ne porter aucun
Composant.

L’`Issue` normalisée conserve son type d’Issue GitHub/métier collecté dans un champ `issueType`. Ce type participe, avec les relations de l’Issue et les autres règles métier applicables, à la dérivation éventuelle des objets spécialisés.

La liste définitive des valeurs autorisées de `issueType` et leur sémantique détaillée restent à préciser.

**Statut : ÉTABLI pour la conservation exhaustive et la conservation du type ; valeurs de `issueType` À CONFIRMER.**

------------------------------------------------------------------------

## 10. Audit

Un **Audit** représente l'évaluation d'un Composant dans un contexte de
Version.

Aujourd'hui, le travail est matérialisé par une Issue GitHub d'Audit.

Une Issue d'Audit :

-   concerne exactement un Composant ;
-   peut produire zéro à plusieurs Anomalies ;
-   peut produire zéro à plusieurs Improvements ;
-   est réalisée lorsqu'elle est à la fois `Project Status = Done` et
    `GitHub Issue State = Closed`.

Pour un Audit Accessibilité terminé :

``` text
0 Anomalie
→ AUDITÉ & CONFORME

1..n Anomalies
→ AUDITÉ & NON CONFORME
```

Les Improvements n'affectent pas ce verdict.

Il reste à décider si `Audit` doit être un objet métier indépendant de
l'Issue GitHub qui le matérialise.

**Statut : PARTIELLEMENT ÉTABLI --- Q-015.**

------------------------------------------------------------------------

## 11. Famille d'Audit

La **Famille d'Audit** décrit la nature de l'évaluation réalisée.

La nature de l'Issue et la famille sont deux dimensions distinctes :

``` text
Issue Type = Audit
Famille     = Accessibilité / RGAA actuellement
```

La représentation technique de cette famille reste à décider.

**Statut : principe ÉTABLI ; représentation À CONFIRMER.**

------------------------------------------------------------------------

## 12. Campagne d'Audit

Une **Campagne d'Audit** est une abstraction potentielle permettant de
regrouper plusieurs Audits.

Aujourd'hui, une Milestone peut jouer ce rôle de regroupement pour :

-   une future Version PROD ;
-   un Audit de rattrapage.

Il n'est pas établi qu'une Campagne doive devenir un objet métier
autonome.

**Statut : À CONFIRMER --- Q-016.**

------------------------------------------------------------------------

## 13. Anomalie

Une **Anomalie** est un problème identifié sur le Design System.

Pour les Anomalies provenant d'un Audit, le modèle est désormais strict
:

-   une Issue GitHub qualifiée comme Anomalie compte pour une Anomalie ;
-   elle est sous-Issue d'exactement un Audit ;
-   son Issue Type est `🐛 Bug` ;
-   elle concerne exactement le même Composant que son Audit parent ;
-   pour un Audit Accessibilité, elle possède exactement une criticité
    RGAA et exactement une catégorie `a11y`.

Une Issue peut regrouper plusieurs occurrences du même problème : le
dashboard ne cherche pas à compter ces occurrences internes.

Pour les Anomalies hors Audit, l'identification configurable, les
origines et certaines propriétés restent à consolider.

**Statut : ÉTABLI pour l'Anomalie d'Audit ; PARTIEL pour l'Anomalie
générale.**

------------------------------------------------------------------------

## 14. Improvement

Une **Improvement** issue d'un Audit est une proposition d'amélioration
qui ne constitue pas une non-conformité.

Elle :

-   est une sous-Issue d'exactement un Audit ;
-   possède l'Issue Type `✨ Feature` ;
-   concerne exactement le même Composant que l'Audit ;
-   ne porte aucune criticité RGAA ;
-   peut porter une catégorisation `a11y`, mais celle-ci est facultative
    ;
-   n'affecte pas le verdict de conformité.

La cardinalité maximale des catégories `a11y` d'une Improvement reste à
confirmer.

**Statut : ÉTABLI sauf cardinalité maximale a11y.**

------------------------------------------------------------------------

## 15. Criticité

La **Criticité** qualifie la gravité d'un problème dans un domaine
déterminé.

Les domaines identifiés comprennent :

-   accessibilité / RGAA / WAI-ARIA ;
-   métier ;
-   fonctionnalité ;
-   technique ;
-   Developer Experience ;
-   Designer Experience.

Les labels RGAA `bloquante`, `majeure`, `mineure` sont strictement
réservés aux Anomalies provenant d'un Audit Accessibilité.

**Statut : ÉTABLI.**

------------------------------------------------------------------------

## 16. Catégorie a11y

Une **catégorie a11y** décrit une thématique d'accessibilité.

Elle est transverse à la nature et à l'origine de l'Issue.

Elle peut donc apparaître sur :

-   Anomalie d'Audit ;
-   Improvement d'Audit ;
-   Issue hors Audit.

Elle ne suffit jamais à conclure qu'une Issue est une Anomalie ou
provient d'un Audit.

**Statut : ÉTABLI.**

------------------------------------------------------------------------

## 17. Pull Request

Une **Pull Request** représente une proposition de modification du code.

Elle peut être liée à une ou plusieurs Issues.

Son caractère obligatoire dépend du profil de workflow : une règle
générale ne doit pas être appliquée indistinctement aux Issues STANDARD,
EPIC, AUDIT, RELEASE ou CONCEPTION.

**Statut : objet ÉTABLI ; obligations À FORMALISER.**

------------------------------------------------------------------------

## 18. Iteration

Une **Iteration** représente une fenêtre de planification
opérationnelle, actuellement assimilée au Sprint dans le fonctionnement
de la Squad.

Son usage et son obligation dépendent du statut et du profil de
workflow.

**Statut : ÉTABLI comme objet source ; règles À FORMALISER.**

------------------------------------------------------------------------

## 19. Milestone

Une **Milestone** est un regroupement GitHub dont la sémantique est
polymorphe.

Elle peut notamment représenter :

-   une Version `M.m.r` ;
-   un Audit de rattrapage `M.m.r-Audit` ;
-   un horizon trimestriel ou semestriel ;
-   un lot de priorité Design.

Une Milestone doit donc être classifiée avant d'être interprétée.

`M.m.r-Audit` ne constitue pas une Version supplémentaire.

**Statut : ÉTABLI.**

------------------------------------------------------------------------

## 20. Release GitHub

Une **Release GitHub** peut correspondre à une Version PROD.

Son existence est actuellement considérée comme normale mais son
caractère obligatoire et son mécanisme exact de création ne sont pas
établis.

**Statut : À CONFIRMER --- Q-007.**

------------------------------------------------------------------------

## 21. Tag Git

Un **Tag Git** `M.m.r` constitue l'un des éléments permettant
d'identifier une Version PROD.

Pour le processus nominal établi, Jenkins produit le Tag lors de la
publication PROD.

La règle de traitement d'un Tag attendu mais absent reste à définir.

**Statut : ÉTABLI pour le nominal ; anomalie À INSTRUIRE.**

------------------------------------------------------------------------

## 22. Application consommatrice

Une **Application** est un produit consommant potentiellement un ou
plusieurs Packages du Design System.

Le futur modèle devra pouvoir représenter :

``` text
Application
└── Package @ Version
```

puis l'usage éventuel de Composants.

Les sources et méthodes de détection ne sont pas définies.

**Statut : FUTUR.**

------------------------------------------------------------------------

## 23. Consommation

La **Consommation** est un futur objet ou une future relation permettant
de représenter qu'une Application utilise un Package dans une Version
donnée.

Elle pourra éventuellement porter d'autres informations d'observation ou
d'environnement.

Sa forme technique n'est pas arrêtée.

**Statut : FUTUR.**

------------------------------------------------------------------------

## 24. Snapshot

Un **Snapshot** représente l'état connu du pipeline à un instant de
capture.

Il contient notamment les données sources projetées, données
normalisées, résultats DQ et métriques.

Il ne doit pas être confondu avec un événement métier.

**Statut : ÉTABLI techniquement.**

------------------------------------------------------------------------

## 25. Data Quality Issue

Une **Data Quality Issue** signale une incohérence, une absence ou une
réserve sur les données exploitées.

Elle ne corrige pas silencieusement les données sources.

Son impact doit être déterminé au niveau des métriques concernées plutôt
que dégrader arbitrairement toutes les métriques.

**Statut : ÉTABLI comme principe analytique.**

------------------------------------------------------------------------

## 26. Objets à ne pas confondre

Le modèle impose notamment les distinctions suivantes :

``` text
Repository ≠ Librairie

Librairie ≠ Package

Version déclarée ≠ Version d'artefact

Milestone ≠ Version

Issue ≠ Anomalie

Audit métier ? Issue d'Audit
    → identité exacte encore ouverte

Anomalie ≠ Improvement

criticité RGAA ≠ catégorie a11y

Snapshot ≠ événement métier
```

Ces distinctions doivent rester visibles dans le modèle normalisé.

------------------------------------------------------------------------

## Anomalie --- identification générale

Une Issue GitHub dont l'Issue Type est `🐛 Bug` représente une
**Anomalie hors Audit**.

Une Anomalie découverte dans le cadre d'un Audit reste également une
Issue de type `🐛 Bug`, mais elle est distinguée par sa relation de
sub-Issue avec l'Issue d'Audit d'origine.

``` text
Anomalie
├── hors Audit
└── issue d'un Audit
```

La relation à l'Audit qualifie l'origine de l'Anomalie ; elle ne change
pas la nature `Anomalie` de l'Issue.

------------------------------------------------------------------------

## Anomalie --- origine en V1

Pour la V1, l'origine d'une Anomalie est volontairement limitée à deux
valeurs métier :

``` text
AUDIT
HORS_AUDIT
```

Une Anomalie `HORS_AUDIT` n'est pas subdivisée davantage en V1.

La provenance plus détaillée d'une Anomalie hors Audit constitue un
besoin V2. Les dimensions à challenger comprennent notamment le fait
qu'une Anomalie soit remontée depuis l'extérieur de la Squad ou depuis
la Squad elle-même.

La taxonomie V2 et les indicateurs associés ne sont pas encore définis.

------------------------------------------------------------------------

## Anomalie --- date de détection

Pour une Anomalie, la date métier de détection est la date de création
de l'Issue `🐛 Bug` dans GitHub.

``` text
Anomalie.detectedAt = GitHub Issue.createdAt
```

Cette règle s'applique aux Anomalies issues d'un Audit comme aux
Anomalies hors Audit. Le modèle ne reconstruit pas une éventuelle
constatation antérieure à la création de l'Issue.

------------------------------------------------------------------------

## Anomalie --- date de correction

La date métier de correction d'une Anomalie est la date à laquelle
l'Issue `🐛 Bug` passe au statut Project `Done`.

``` text
Anomalie.correctedAt = date du passage de l'Issue à Done
```

Dans le fonctionnement nominal, cet événement doit être cohérent avec
la fermeture (`Closed`) de l'Issue et le merge de la Pull Request de
correction lorsqu'une Pull Request est requise.

`Done` reste toutefois l'événement métier de référence pour
`correctedAt`. Un écart temporel ou d'état avec `Closed` ou avec le merge
de la Pull Request relève d'un contrôle de cohérence des données et ne
change pas la définition de `correctedAt`.

------------------------------------------------------------------------

## Audit --- date de fin

La date métier de fin d'un Audit est la date à laquelle son Issue d'Audit passe au statut Project `Done`.

``` text
Audit.completedAt = date du passage de l'Issue d'Audit à Done
```

Dans le fonctionnement nominal, l'Issue doit également être `Closed` de manière cohérente. C'est à `completedAt` que le Component concerné est considéré comme audité pour les calculs historiques.

La date de début d'un Audit n'est pas déduite de cette décision.

------------------------------------------------------------------------

## Audit --- artefact réellement audité

Un Audit pré-PROD porte deux références de Version complémentaires :

``` text
targetVersion
→ Version cible portée par la Milestone, de forme M.m.r

auditedReleaseCandidate
→ champ explicite porté par l'Issue d'Audit, de forme M.m.r-rc.n
```

`auditedReleaseCandidate` identifie l'artefact réellement soumis à l'Audit.

La Milestone reste nécessaire pour rattacher l'Audit à sa Version cible. Elle ne remplace pas le champ explicite de RC auditée.

------------------------------------------------------------------------

## Version --- Catalogue historique applicable

Une Version PROD possède un Catalogue historique applicable.

Pour `M.m.r`, ce Catalogue est reconstruit depuis l'état du Repository
au Git tag `M.m.r`.

Il représente le périmètre des Components de cette Version et sert
notamment de dénominateur aux indicateurs historiques de couverture
d'Audit.

------------------------------------------------------------------------

## Version --- date de Release

Une Version PROD `M.m.r` possède une date métier de Release définie par la date de création de son Git tag `M.m.r`.

``` text
releasedAt = GitTag(M.m.r).createdAt
```

`releasedAt` sert d'instant de coupure pour reconstruire l'état connu à la Release.

