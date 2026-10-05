# Indicateurs futurs

## 1. Objectif

Cette page conserve les besoins utiles qui ne disposent pas encore des
sources ou définitions nécessaires pour devenir des indicateurs V1
normatifs.

Ils ne doivent pas être supprimés du backlog métier ni simulés avec des
données de substitution.

------------------------------------------------------------------------

## 2. Applications consommatrices

Besoins identifiés :

-   nombre d'Applications utilisant le Design System ;
-   Applications qui devraient l'utiliser mais ne l'utilisent pas ;
-   Packages utilisés ;
-   Versions utilisées ;
-   répartition des Applications par Version ;
-   dette de montée de Version.

Questions associées :

``` text
Q-023 à Q-029
Q-039
```

Les sources ne sont pas encore définies.

------------------------------------------------------------------------

## 3. Usage réel des Components

Besoins identifiés :

-   nombre d'Applications utilisant un Component ;
-   nombre total d'occurrences du Component ;
-   fréquence d'utilisation ;
-   Components les plus utilisés.

Question associée :

``` text
Q-027 / Q-040
```

La méthode d'analyse du code des Applications n'est pas définie.

------------------------------------------------------------------------

## 4. Normalisation des Anomalies par usage

Pistes identifiées :

``` text
Anomalies / occurrences
Anomalies / Applications consommatrices
```

Ces ratios pourraient aider à différencier :

``` text
Component très utilisé avec quelques Anomalies
```

de :

``` text
Component peu utilisé avec beaucoup d'Anomalies
```

Ils restent futurs tant que la donnée d'usage n'est pas disponible et
que leur interprétation n'est pas validée.

------------------------------------------------------------------------

## 5. Erreurs d'intégration par usage

Pistes :

``` text
erreurs d'intégration / occurrences
Applications avec erreur d'intégration / Applications consommatrices
```

Ces indicateurs ne représentent pas la qualité intrinsèque du Design
System.

Ils pourraient mesurer la facilité ou difficulté d'intégration.

------------------------------------------------------------------------

## 6. Qualité d'une Application

Le futur modèle pourra croiser :

``` text
Application
→ Package @ Version
→ Components utilisés
→ qualité connue des Components
```

Les concepts de score, badge ou niveau RGAA/WAI-ARIA d'une Application
ne sont pas définis.

Questions associées :

``` text
Q-032
Q-033
```

------------------------------------------------------------------------

## 7. Audit dès la conception

Besoins historiques :

-   taux de nouveaux Components audités dès la maquette Design ;
-   nombre d'Anomalies détectées sur les maquettes ;
-   répartition par criticité.

Ces indicateurs nécessitent une modélisation plus précise du workflow
CONCEPTION et des Audits de maquette.

------------------------------------------------------------------------

## 8. Scoring

Des scores ont été envisagés pour :

-   Component ;
-   Version ;
-   éventuellement Application.

Aucune formule n'est actuellement établie.

Un score ne doit pas être créé en combinant arbitrairement couverture,
conformité, criticité et traitement.

------------------------------------------------------------------------

## 9. Principe de promotion

Un indicateur futur devient un indicateur normatif seulement lorsque
sont établis :

``` text
question métier
population
numérateur
dénominateur
période
source
règles d'exclusion
fiabilité
interprétation
```
