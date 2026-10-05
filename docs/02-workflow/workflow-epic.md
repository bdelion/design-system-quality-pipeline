# Workflow EPIC

## 1. Rôle

Une Epic décrit un ensemble cohérent de travail et regroupe des
sous-Issues.

La source historique indique notamment :

-   Issue Type `🚀 Epic` ;
-   au moins un label ;
-   description du périmètre et de l'objectif ;
-   sous-Issues ;
-   possibilité d'être liée à une Iteration et une Milestone ;
-   possibilité de bloquer ou d'être bloquée.

------------------------------------------------------------------------

## 2. Velocity

La source indique qu'une Epic n'est pas pesée directement : la charge
est portée par ses sous-Issues.

``` text
Epic
└── Velocity propre non utilisée pour représenter la somme du travail
```

Cette exception montre pourquoi `velocity > 0` ne peut pas être une
règle universelle pour toutes les Issues `Ready` ou `In progress`.

**Statut : règle source cohérente avec la séparation des profils ;
formalisation globale Q-020.**

------------------------------------------------------------------------

## 3. Branche et Pull Request

La source est explicite :

``` text
Epic
├── branche propre : NON
└── Pull Request propre : NON
```

L'implémentation est réalisée par les sous-Issues.

Une règle DQ générique `Done → PR` ne doit donc pas s'appliquer à une
Epic.

------------------------------------------------------------------------

## 4. Sous-Issues

La source décrit une Epic avec plusieurs sous-Issues.

Les cardinalités et obligations générales des Epics n'ont pas encore été
consolidées dans le registre de décisions au même niveau que les
relations d'Audit.

Cette page ne transforme donc pas la proposition source « 2 à n
sous-Issues » en invariant métier universel.

------------------------------------------------------------------------

## 5. Transitions proposées dans la source

`specifications/gh-workflow.md` propose notamment :

-   passage `Backlog → Ready` lorsque les sous-Issues sont Ready ;
-   passage à `In progress` lorsque la première sous-Issue démarre ;
-   passage potentiel à `In review` lorsque les sous-Issues sont
    terminées et qu'une RC est disponible ;
-   passage potentiel à `Done` après retours clients satisfaisants.

Ces formulations comportent explicitement des mentions telles que « à
déterminer » ou « pourrait ».

**Elles ne sont pas des règles établies.**

------------------------------------------------------------------------

## 6. Matrice EPIC

  Dimension             Règle
  --------------------- --------------------------------------------------
  Issue Type            `🚀 Epic` dans la source
  Grooming              présent à la création dans les scénarios décrits
  Velocity              non pesée dans la source
  Iteration             possible
  Milestone             possible
  Branche propre        non
  Pull Request propre   non
  Sous-Issues           oui ; cardinalité générale à formaliser
  Blocked               possible
  Ready                 déclencheur exact ouvert
  In progress           déclencheur exact ouvert
  In review             déclencheur exact ouvert
  Done                  déclencheur exact ouvert

------------------------------------------------------------------------

## 7. Ce qui reste à décider

Pour rendre `EPIC` pleinement normatif, il reste notamment à établir :

-   les transitions dérivées des sous-Issues ;
-   les conditions exactes de `Done` ;
-   le rôle de l'Iteration ;
-   le rôle obligatoire ou non de la Milestone ;
-   la cardinalité minimale générique des sous-Issues.

Ces décisions relèvent de la consolidation de `Q-020` et ne doivent pas
être inventées par l'implémentation.
