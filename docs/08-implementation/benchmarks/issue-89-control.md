# Benchmark synthétique control

Protocole dashboard-benchmark-v1, graine 81, fixture dashboard-load-v1, SHA-256 92944855a6f1de050e2677f17b19cd8200242ca557a18e90e8a8f15318e46597. Révision a1c8954007248120b60f27b612d227bac15882ca.

Volumes : {"repositories":1,"issues":24,"pullRequests":18,"componentVersions":12,"diagnostics":30}.

Conditions : {"node":"v22.23.3","os":"win32","release":"10.0.19045","arch":"x64","cpu":"Intel(R) Core(TM) i3-4130 CPU @ 3.40GHz","logicalCpus":4,"memoryBytes":8461107200} ; navigateur {"version":"155.0.4283.62","viewport":{"width":1440,"height":900}} ; {"channel":"msedge","headless":true,"locale":"fr-FR","timezone":"UTC","workers":1,"runs":3,"warmup":1,"cache":"nouveau contexte par passage, HTTP no-store, routage local uniquement","cpuThrottle":"aucun","network":"loopback uniquement, sans compression","readiness":"DOMContentLoaded pour navigation ; load + h1 visible + fonts.ready + deux requestAnimationFrame pour résultat ; pas une mesure d’interactivité complète","capture":"désactivée","preparation":"processus Node neuf par génération ; préparation normalisation/Analytics et démarrage exclus du temps de génération ; chauffe exclue des séries"}.

Préparation : 87.0 ms. Génération médiane 314.5 ms, IQR 50.2 ms.

Octets non compressés. JSON est inclus dans HTML. Lignes initiales : lignes tbody présentes dans le fichier ; DOM : tous les nœuds après disponibilité du résultat.

| Page               | HTML octets | JSON octets | Lignes initiales | Lignes rendues | Nœuds DOM | Navigation médiane/IQR ms | Résultat médiane/IQR ms | Capture ms |
| ------------------ | ----------: | ----------: | ---------------: | -------------: | --------: | ------------------------: | ----------------------: | ---------: |
| accessibility.html |      308817 |      171448 |               42 |             46 |      1689 |              415.0/1123.4 |            763.0/1131.3 | désactivée |
| anomalies.html     |       81311 |         230 |               21 |             21 |      1882 |                416.2/36.0 |              543.5/25.0 | désactivée |
| audits.html        |      173369 |      118067 |               30 |             30 |      1522 |               485.5/112.2 |              686.9/97.1 | désactivée |
| components.html    |       50565 |       37976 |                0 |              4 |       657 |                303.6/42.7 |              473.1/28.4 | désactivée |
| epics.html         |        5461 |         258 |                0 |              0 |       143 |               235.9/110.5 |             389.3/111.9 | désactivée |
| graph.html         |      172341 |         226 |               24 |             24 |      1833 |                368.9/57.7 |              480.8/71.0 | désactivée |
| history.html       |        7633 |         228 |                0 |              0 |       235 |                221.1/17.1 |              330.9/13.7 | désactivée |
| index.html         |       10841 |         226 |                2 |              2 |       324 |                280.1/33.2 |             378.4/102.3 | désactivée |
| issues.html        |       38699 |       24120 |                0 |            108 |      3698 |                336.1/87.1 |              540.5/79.2 | désactivée |
| quality.html       |       96938 |         228 |               32 |             32 |      3110 |               315.1/120.7 |             463.9/180.9 | désactivée |

Copies JSON exactes redondantes : 0 octets sur 353007. Ne mesure pas les duplications sémantiques RAW/normalisé.

Comparaison des volumes (après − avant) :

```json
[
  {
    "page": "accessibility.html",
    "htmlBytes": -25,
    "jsonBytes": 0,
    "initialTableRows": 0,
    "domNodes": -7,
    "renderedTableRows": 0
  },
  {
    "page": "anomalies.html",
    "htmlBytes": -25,
    "jsonBytes": 0,
    "initialTableRows": 0,
    "domNodes": -7,
    "renderedTableRows": 0
  },
  {
    "page": "audits.html",
    "htmlBytes": -25,
    "jsonBytes": 0,
    "initialTableRows": 0,
    "domNodes": -7,
    "renderedTableRows": 0
  },
  {
    "page": "components.html",
    "htmlBytes": -33,
    "jsonBytes": 0,
    "initialTableRows": 0,
    "domNodes": -7,
    "renderedTableRows": 0
  },
  {
    "page": "epics.html",
    "htmlBytes": -25,
    "jsonBytes": 0,
    "initialTableRows": 0,
    "domNodes": -7,
    "renderedTableRows": 0
  },
  {
    "page": "graph.html",
    "htmlBytes": -100,
    "jsonBytes": 0,
    "initialTableRows": 0,
    "domNodes": -7,
    "renderedTableRows": 0
  },
  {
    "page": "history.html",
    "htmlBytes": -25,
    "jsonBytes": 0,
    "initialTableRows": 0,
    "domNodes": -7,
    "renderedTableRows": 0
  },
  {
    "page": "index.html",
    "htmlBytes": -26,
    "jsonBytes": 0,
    "initialTableRows": 0,
    "domNodes": -10,
    "renderedTableRows": 0
  },
  {
    "page": "issues.html",
    "htmlBytes": -25,
    "jsonBytes": 0,
    "initialTableRows": 0,
    "domNodes": -7,
    "renderedTableRows": 0
  },
  {
    "page": "quality.html",
    "htmlBytes": -26,
    "jsonBytes": 0,
    "initialTableRows": 0,
    "domNodes": -10,
    "renderedTableRows": 0
  }
]
```

Les durées décrivent cette machine et ce passage ; aucune limite temporelle automatique. Voir report.json pour séries brutes, quantiles et empreintes.

## Ressources locales

JSON déjà inclus dans HTML. Assets utilisés mesurés sur une navigation sans cache ; imports communs comptés une seule fois par page.

| Page               | Assets octets | HTML + assets octets |
| ------------------ | ------------: | -------------------: |
| accessibility.html |         76578 |               385395 |
| anomalies.html     |         56499 |               137810 |
| audits.html        |         79029 |               252398 |
| components.html    |         73941 |               124506 |
| epics.html         |         60188 |                65649 |
| graph.html         |         58553 |               230894 |
| history.html       |         56499 |                64132 |
| index.html         |         56499 |                67340 |
| issues.html        |         71873 |               110572 |
| quality.html       |         76578 |               173516 |

Assets partagés entre plusieurs pages : 78496 octets. Dossier HTML + tous les assets distribués, dédupliqués par chemin : 1061645 octets. Les empreintes et dépendances statiques par page figurent dans report.json ; les archives sans cette extension ne renseignent pas ces mesures (indisponible, jamais zéro). Aucun cache ni parsing commun entre documents indépendants n’est garanti.
