J’ai maintenant une vue beaucoup plus précise du projet. Le socle est bon, mais plusieurs points expliquent pourquoi le dashboard peut être difficile à lire et pourquoi certaines analyses sont difficiles à interpréter.

1. Le pipeline est bien conçu

Le chemin réel est :

GitHub / Fixture
      │
      ▼
   RawDataset
      │
      ▼
 NormalizedData
      │
      ├──────────────┐
      ▼              ▼
 Data Quality     Analytics
      │              │
      └──────┬───────┘
             ▼
          Snapshot
             │
       ┌─────┴─────┐
       ▼           ▼
    JSON        Dashboard

C'est une bonne séparation : le dashboard n'est pas censé recalculer les données. Il reçoit un snapshot déjà analysé.

Le snapshot est même versionné avec ruleVersion et modelVersion, ce qui est une excellente base pour l'historique.

2. Le premier vrai problème : les KPI mélangent plusieurs notions

C'est probablement le chantier prioritaire.

Par exemple :

anomaliesCorrected

est calculé avec :

anomaly.everCorrected

mais sa définition affichée dit :

« Nombre d’anomalies ayant une date de première correction métier. »

Ce n'est pas exactement la même chose.

On a en réalité plusieurs notions :

Anomalie
   │
   ├── créée
   │
   ├── en cours
   │
   ├── techniquement corrigée ?
   │
   ├── première correction métier ?
   │
   ├── PR fusionnée ?
   │
   ├── Done ?
   │
   └── actuellement ouverte ?

Il faut donc séparer explicitement les événements et les états.

3. Je vois une deuxième faiblesse importante : la couverture des audits

Actuellement :

auditsCoverage =
    audits terminés
    ----------------
    nombre de composants

Cela peut devenir problématique si un composant possède plusieurs audits.

Imaginons :

100 composants
120 audits terminés

Le KPI pourrait devenir :

120 %

alors que ce que l'on veut probablement mesurer est :

« Quelle proportion des composants devant être audités possède un audit valide dans la période considérée ? »

Ce n'est donc pas simplement un problème de présentation.

Il faut définir le périmètre temporel et métier de la couverture.

4. La fiabilité est actuellement trop globale

Aujourd'hui, le calcul est essentiellement :

aucune DQ
   → reliable

au moins une DQ
   → partial

Cela signifie qu'une anomalie totalement indépendante d'un KPI peut dégrader sa fiabilité.

Exemple :

DQ-009
Nexus indisponible
        │
        ▼
Conformité des audits
        │
        ▼
reliability = partial

Alors que le problème Nexus concerne potentiellement les informations de release et pas nécessairement le calcul de conformité des audits.

Je pense qu'il faut passer à une fiabilité par KPI.

Par exemple :

KPI	Valeur	Fiabilité	Cause
Anomalies déclarées	6	⚠️ Partielle	DQ-001 : 1 anomalie exclue
Anomalies ouvertes	3	⚠️ Partielle	DQ-001
Conformité audits	100 %	🟢 Fiable	aucune réserve
Couverture audits	85 %	🟢 Fiable	—
Délai moyen	12,4 j	⚠️ Partielle	1 anomalie sans date

Ça change énormément la qualité de compréhension du dashboard.

5. Le dashboard actuel présente surtout des résultats, pas le raisonnement

C'est exactement là que je pense que ton projet peut beaucoup progresser.

Aujourd'hui tu as :

ANOMALIES DÉCLARÉES
6

ANOMALIES CORRIGÉES
...

COUVERTURE DES AUDITS
...

CONFORMITÉ OBJECTIVE
...

C'est propre.

Mais la question suivante n'est pas suffisamment traitée :

« Comment arrive-t-on à ce chiffre ? »

Je voudrais plutôt arriver à quelque chose comme :

                    CONFORMITÉ
                       100 %
                        │
             ┌──────────┴──────────┐
             │                     │
          5 audits             0 exclus
          terminés              DQ
             │
      ┌──────┼──────┐
      ▼      ▼      ▼
    5 OK    0 cond. 0 NC

Et chaque élément serait cliquable.

6. Il y a aussi quelques problèmes techniques faciles à corriger
Version et statut du dashboard codés en dur

Dans generate.ts, on trouve notamment :

À SURVEILLER
V2.1
CP

alors que le snapshot possède déjà :

ruleVersion
modelVersion
reliability

Donc le rendu devrait être entièrement dérivé du snapshot.

Le dashboard annonce trois pages mais en génère quatre

Le commentaire dit :

« Génère les trois pages statiques »

mais le code produit :

index.html
anomalies.html
audits.html
graph.html

C'est mineur, mais révélateur d'une architecture qui commence à évoluer plus vite que sa documentation.

Du CSS semble mort dans generate.ts

Le fichier contient de très gros blocs :

const styles = `...`
const dashboardStyles = `...`

mais le générateur copie désormais les assets externes et fait :

void styles;
void dashboardStyles;

Cela ressemble à une ancienne implémentation conservée après migration.

Je supprimerais cette dette.

7. Mais surtout : je changerais le modèle analytique avant le dashboard

Je pense que c'est le point le plus important de mon analyse.

Aujourd'hui :

NormalizedData
       ↓
calculateKpis()
       ↓
Analytics

Analytics contient directement des résultats :

anomaliesDeclared
anomaliesCorrected
openAnomalies
...

Je ferais évoluer cela vers quelque chose de plus explicatif :

NormalizedData
       │
       ▼
   Evaluations
       │
       ├── périmètre
       ├── exclusions
       ├── règles appliquées
       ├── événements
       ├── agrégations
       └── réserves
              │
              ▼
           Metrics
              │
              ▼
           Snapshot
              │
              ▼
          Dashboard

Chaque métrique pourrait alors savoir :

{
  id: 'anomalies.corrected',
  value: 5,
  numerator: 5,
  denominator: 6,

  scope: {
    entityType: 'anomaly',
    entityIds: [...]
  },

  exclusions: [...],

  reliability: {
    status: 'partial',
    reasons: [...]
  },

  definition: '...',

  breakdowns: {
    criticality: {...},
    repository: {...},
    category: {...}
  }
}

Ce serait beaucoup plus puissant pour ton futur dashboard.

8. Le dashboard que je viserais

Je partirais sur une navigation de ce type :

┌───────────────────────────────────────────────────────────┐
│ DESIGN SYSTEM QUALITY                                     │
│ Snapshot 26/09/2026 · 3 repositories · 7 composants      │
├──────────────┬────────────────────────────────────────────┤
│              │                                            │
│ SYNTHÈSE     │  ÉTAT DU PATRIMOINE                       │
│              │                                            │
│ Patrimoine   │  7 composants                              │
│ Audits       │  5 audités · 2 à auditer                   │
│ Anomalies    │                                            │
│ Qualité data │  ┌────────┐ ┌────────┐ ┌────────┐         │
│              │  │ Audits │ │Conform.│ │Anomalies│        │
│              │  │  71 %  │ │  100 % │ │  6      │        │
│              │  └────────┘ └────────┘ └────────┘         │
│              │                                            │
│              │  POURQUOI ?                                │
│              │  2 composants sans audit                   │
│              │  1 anomalie exclue                         │
│              │  3 anomalies ouvertes                      │
│              │                                            │
│              │  RÉPARTITION                               │
│              │  repository / criticité / catégorie        │
│              │                                            │
└──────────────┴────────────────────────────────────────────┘

Puis une page Anomalies beaucoup plus analytique :

ANOMALIES

6 retenues dans le calcul
1 exclue par DQ-001
3 ouvertes
2 corrigées

             Bloquante  Majeure  Mineure
             ███        █████    ███████

Repository
core        █████
react       ███
docs        ██

Catégorie
focus       █████
keyboard    ███
contrast    ██

Et surtout :

Cliquer sur « 6 anomalies retenues »

ouvre la liste avec :

6 retenues
─────────────────────────────
6 dans le périmètre
1 exclue
0 inconnue

Pourquoi 1 exclue ?

DQ-001
Anomalie sans criticité

Issue #123
Design System React
→ exclue des KPI
→ conservée dans les données

Ça rendrait ton projet beaucoup plus pédagogique.

9. Je vois également un potentiel très intéressant avec les snapshots

Tu conserves déjà :

data/runs/

Donc tu as potentiellement les ingrédients pour faire quelque chose que le dashboard actuel ne fait pas encore vraiment :

L'évolution du patrimoine
                     26/09
                       │
Conformité       82 ───┼── 91 ── 100 %
                       │
Anomalies        12 ───┼──  8 ──   6
                       │
Ouvertes          7 ───┼──  5 ──   3
                       │
Délai moyen      18j ──┼── 14j ── 11j

Et pas seulement une courbe.

On pourrait expliquer les variations :

26 septembre

▼ -2 anomalies
  4 corrigées
  2 nouvelles

▲ +1 audit conforme
  Button

⚠ 1 nouvelle réserve DQ
  DQ-006 / composant Toast

C'est là que ton historique de snapshots devient vraiment intéressant.

10. Ma proposition pour la suite

Je ne toucherais pas encore au HTML.

Je te propose de faire maintenant une V2 du modèle analytique sur papier, à partir de ton modèle actuel.

Je peux te produire un tableau de ce type pour tous les indicateurs actuellement présents :

Indicateur actuel	Ce qu'il mesure réellement	Problème	Définition V2 proposée	Données nécessaires
Anomalies déclarées	...	...	...	...
Anomalies corrigées	...	...	...	...
Anomalies ouvertes	...	...	...	...
Couverture audits	...	...	...	...
Conformité	...	...	...	...
Délai moyen	...	...	...	...
Délai médian	...	...	...	...

Puis nous ferons la même chose pour les règles DQ-001 à DQ-010.

À mon avis, c'est la bonne étape avant de dessiner la nouvelle interface : on définit exactement ce que ton outil sait dire, ce qu'il ne sait pas dire, et pourquoi, puis le dashboard devient la conséquence naturelle de ce modèle.

Go

J’ai fait la passe détaillée. Voici maintenant la V2 du modèle analytique que je te recommande, avant toute refonte graphique.

1. Le modèle actuel : ce qu’il mesure réellement
KPI actuel	Calcul actuel	Ce que cela signifie réellement	Point à revoir
Anomalies déclarées	anomalies non annulées et non exclues par DQ	Nombre d’anomalies retenues dans le calcul	Le terme « déclarées » est ambigu
Anomalies corrigées	everCorrected === true	Nombre d’anomalies ayant déjà été corrigées au moins une fois	Le commentaire parle de firstDoneAt : incohérence à corriger
Anomalies ouvertes	open ou reopened	Stock actuel d’anomalies ouvertes	OK, mais il faut distinguer stock et flux
Par criticité	comptage des anomalies retenues	Répartition du stock d’anomalies	OK
Par catégorie	comptage par catégorie	Répartition des anomalies	Une anomalie peut compter dans plusieurs catégories
Couverture des audits	audits terminés / composants	Nombre d’audits terminés rapporté aux composants	Très discutable : unité du numérateur ≠ unité du dénominateur
Conformité	audits conformes / audits terminés	Part des audits terminés qui sont conformes	OK, mais préciser la période
Délai moyen	moyenne createdAt → firstDoneAt	Temps moyen jusqu'à première correction métier	OK
Délai médian	médiane des mêmes délais	Temps médian jusqu'à première correction	OK

Le problème le plus important est donc la couverture des audits.

2. Je séparerais désormais les indicateurs en 4 familles

C'est à mon avis la clé pour rendre ton dashboard beaucoup plus compréhensible.

A. Patrimoine

Qu'est-ce que nous avons ?

repositories
bibliothèques
composants
composants actifs
composants dépréciés
composants sans catalogue
composants sans audit
B. État qualité

Quel est l'état actuel ?

audits réalisés
audits conformes
audits conditionnels
audits non conformes
anomalies ouvertes
anomalies par criticité
anomalies par catégorie
C. Performance

Comment traite-t-on les problèmes ?

anomalies corrigées
délai moyen
délai médian
délai P90
anomalies créées sur une période
anomalies corrigées sur une période
backlog à date
D. Fiabilité des données

Peut-on faire confiance à ce que nous venons de calculer ?

objets concernés par une DQ
objets exclus
objets inclus avec réserve
DQ par règle
DQ par repository
KPI affectés par une DQ

Cette dernière catégorie devrait être beaucoup plus visible qu'aujourd'hui.

3. Le changement majeur : distinguer STOCK et FLUX

Aujourd'hui le dashboard mélange naturellement :

« Il y a 6 anomalies »

et

« Il y a eu 6 anomalies ».

Ce n'est pas la même information.

Je voudrais donc avoir :

Stock

À la date du snapshot :

Anomalies ouvertes       3
Anomalies en cours       1
Anomalies terminées      5
Anomalies annulées       2
Flux

Sur une période donnée :

Nouvelles anomalies      +4
Anomalies corrigées      -6
Anomalies réouvertes     +1
Variation du backlog     -1

C'est beaucoup plus parlant pour piloter la qualité.

4. La couverture des audits doit être redéfinie

Le calcul actuel :

audits terminés
────────────────────
composants découverts

n'a pas une unité homogène.

Je proposerais plutôt deux indicateurs différents.

Couverture du patrimoine
composants avec audit valide
─────────────────────────────
composants devant être audités

Exemple :

7 composants actifs
5 disposent d'un audit
────────────────────
71 % de couverture
Activité d'audit
Audits terminés
sur la période

Exemple :

12 audits terminés
au cours des 30 derniers jours

Cela sépare enfin :

« avons-nous couvert le patrimoine ? »

de

« combien d'audits avons-nous réalisés ? »

5. Le taux de conformité doit lui aussi être contextualisé

Aujourd'hui :

audits conformes
────────────────
audits terminés

C'est mathématiquement clair.

Mais un affichage :

100 % conforme

peut être très trompeur si seulement 1 audit sur 7 a été réalisé.

Je voudrais donc toujours afficher les deux :

CONFORMITÉ

100 %
5 / 5 audits conformes

COUVERTURE

71 %
5 / 7 composants audités

Là, le lecteur comprend immédiatement la situation.

6. Pour les anomalies, je proposerais cette structure
Stock actuel
                    9 anomalies
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
       Ouvertes      En cours    Terminées
          3             1            5
Criticité
Bloquantes       1
Majeures         4
Mineures         4
Catégories
Clavier          4
Contraste        3
Sémantique       2
Focus            2

Et surtout, ne pas additionner les catégories pour donner un total : une anomalie peut appartenir à plusieurs catégories.

7. Les délais méritent un petit enrichissement

Tu as actuellement moyenne + médiane.

Je conserverais les deux, mais ajouterais :

P90

Le délai sous lequel 90 % des corrections ont été réalisées.

Pourquoi ?

Parce qu'une moyenne peut être fortement influencée par une anomalie extrêmement ancienne.

Exemple :

Moyenne      21 j
Médiane       8 j
P90          47 j

Ça raconte immédiatement une histoire beaucoup plus intéressante :

la correction habituelle est rapide, mais une partie des anomalies reste longtemps en attente.

Je garderais également le plus ancien backlog ouvert.

8. Et surtout : la qualité des données doit devenir une dimension analytique

Aujourd'hui tu as essentiellement :

reliable
partial
unknown

Je conserverais ces états, mais au niveau de chaque KPI.

Par exemple :

┌──────────────────────────────────────────┐
│ CONFORMITÉ                               │
│                                          │
│ 100 %                                    │
│ 5 / 5 audits conformes                   │
│                                          │
│ ● Données fiables                        │
└──────────────────────────────────────────┘

mais :

┌──────────────────────────────────────────┐
│ ANOMALIES CORRIGÉES                      │
│                                          │
│ 5 / 6                                    │
│                                          │
│ ⚠ Données partielles                     │
│                                          │
│ 1 anomalie exclue                        │
│ DQ-001 · criticité absente               │
└──────────────────────────────────────────┘

Et l'utilisateur pourrait cliquer sur le ⚠.

9. Je modifierais donc le modèle TypeScript

Actuellement :

interface KpiValue {
  value;
  numerator;
  denominator;
  reliability;
  definition;
  sourceEntityIds;
}

C'est déjà une bonne base.

Je l'enrichirais vers quelque chose de proche de :

interface Metric {
  id: string;

  value: number | 'unknown';

  unit: 'count' | 'percentage' | 'days';

  numerator?: number | 'unknown';
  denominator?: number | 'unknown';

  scope: {
    entityType: string;
    entityIds: string[];
  };

  reliability: {
    status: DataQualityStatus;
    issueIds: string[];
  };

  definition: string;

  period?: {
    from: string;
    to: string;
  };

  breakdowns?: Record<string, Record<string, number>>;
}

La différence importante est :

Aujourd'hui

KPI = résultat


Demain

Metric =
    résultat
    + unité
    + périmètre
    + période
    + sources
    + fiabilité
    + causes de réserve
    + ventilations

C'est ce qui permettra au dashboard de comprendre lui-même les chiffres, au lieu d'avoir des règles de présentation spécifiques pour chaque KPI.

10. Les DQ deviennent alors extrêmement intéressantes

Je conserverais tes 10 règles.

Mais je leur ajouterais une notion de portée.

Par exemple :

DQ	Problème	Impact
DQ-001	Criticité absente	KPI criticité + anomalies
DQ-002	Plusieurs criticités	KPI criticité + anomalies
DQ-003	Plusieurs parents	KPI anomalies
DQ-004	Done sans PR	performance/correction
DQ-005	PR fusionnée / issue ouverte	état des anomalies
DQ-006	Composant hors catalogue	couverture patrimoine
DQ-007	Label inconnu	analyses par catégorie
DQ-008	Issue annulée + PR	anomalies
DQ-009	Nexus indisponible	informations release
DQ-010	Annulée + milestone	anomalies

Cela permettrait enfin d'éviter ton problème actuel :

une DQ sans rapport avec un KPI rend le KPI partial.

11. Et voici le modèle de dashboard que je viserais

Je partirais sur 5 vues, pas beaucoup plus.

① Synthèse
PATRIMOINE
7 composants · 3 repositories

AUDITS
71 % couverts

CONFORMITÉ
100 % · 5/5

ANOMALIES
3 ouvertes

DÉLAI
8 j médiane

Puis :

« Qu'est-ce qui explique ces chiffres ? »

② Patrimoine

Composants → repositories → statut → audits.

③ Audits

Couverture → résultats → historique → composants non audités.

④ Anomalies

Backlog → criticité → catégories → délais → détails.

⑤ Qualité des données

DQ-001 à DQ-010, avec :

10 règles
│
├── 3 erreurs
├── 8 avertissements
│
├── 4 KPI affectés
│
└── 2 objets exclus
12. Et j'ajouterais une sixième notion : l'historique

Ton système de snapshots le permet déjà.

Le dashboard pourrait avoir :

ÉVOLUTION

                         Juin    Juil    Août    Sept
Couverture                42%     57%     71%     71%
Conformité                80%     86%     100%    100%
Anomalies ouvertes          9       7       5       3
Délai médian               18j     14j     11j      8j

Et au survol :

+2 composants audités

3 audits terminés
1 composant ajouté au patrimoine

C'est à mon avis ce qui transformera ton outil de rapport HTML en véritable outil de pilotage de la qualité du patrimoine.

La trajectoire que je te recommande

Je ferais maintenant les choses dans cet ordre :

ÉTAPE 1  ← nous sommes ici
────────────────────────────
Définir précisément les métriques
                    ↓
ÉTAPE 2
────────────────────────────
Faire évoluer le modèle Analytics
                    ↓
ÉTAPE 3
────────────────────────────
Associer chaque DQ à ses KPI impactés
                    ↓
ÉTAPE 4
────────────────────────────
Ajouter les périodes + historique
                    ↓
ÉTAPE 5
────────────────────────────
Refondre le dashboard
                    ↓
ÉTAPE 6
────────────────────────────
Tests des calculs + tests visuels

Je ne toucherais donc pas encore au CSS.

La prochaine étape utile est beaucoup plus concrète : je peux te construire la spécification complète du nouveau modèle Analytics/Metric, avec les types TypeScript, les nouveaux KPI, leurs formules exactes et les règles DQ qui les affectent. Ce serait quasiment le contrat fonctionnel de la V2 avant de commencer à coder.