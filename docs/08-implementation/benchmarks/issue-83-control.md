# Benchmark synthétique control

Protocole dashboard-benchmark-v1, graine 81, fixture dashboard-load-v1, SHA-256 92944855a6f1de050e2677f17b19cd8200242ca557a18e90e8a8f15318e46597. Révision 3e816bbd15dd5cb2b54bd0280ce8eac1ab4877b5.

Volumes : {"repositories":1,"issues":24,"pullRequests":18,"componentVersions":12,"diagnostics":30}.

Conditions : {"node":"v22.23.3","os":"win32","release":"10.0.19045","arch":"x64","cpu":"Intel(R) Core(TM) i3-4130 CPU @ 3.40GHz","logicalCpus":4,"memoryBytes":8461107200} ; navigateur {"version":"155.0.4283.62","viewport":{"width":1440,"height":900}} ; {"channel":"msedge","headless":true,"locale":"fr-FR","timezone":"UTC","workers":1,"runs":3,"warmup":1,"cache":"nouveau contexte par passage, HTTP no-store, routage local uniquement","cpuThrottle":"aucun","network":"loopback uniquement, sans compression","readiness":"DOMContentLoaded pour navigation ; load + h1 visible + fonts.ready + deux requestAnimationFrame pour résultat ; pas une mesure d’interactivité complète","capture":"désactivée","preparation":"processus Node neuf par génération ; préparation normalisation/Analytics et démarrage exclus du temps de génération ; chauffe exclue des séries"}.

Préparation : 121.0 ms. Génération médiane 382.0 ms, IQR 266.5 ms.

Octets non compressés. JSON est inclus dans HTML. Lignes initiales : lignes tbody présentes dans le fichier ; DOM : tous les nœuds après disponibilité du résultat.

| Page               | HTML octets | JSON octets | Lignes initiales | Lignes rendues | Nœuds DOM | Navigation médiane/IQR ms | Résultat médiane/IQR ms | Capture ms |
| ------------------ | ----------: | ----------: | ---------------: | -------------: | --------: | ------------------------: | ----------------------: | ---------: |
| accessibility.html |      308710 |      171448 |               42 |             46 |      1696 |              651.7/1050.5 |            762.3/1035.7 | désactivée |
| anomalies.html     |       81336 |         230 |               21 |             21 |      1889 |                469.0/41.6 |              558.3/40.5 | désactivée |
| audits.html        |      162064 |      118067 |               18 |             18 |      1312 |               358.9/131.3 |             470.5/118.1 | désactivée |
| components.html    |       50455 |       37976 |                0 |              4 |       687 |                232.3/14.3 |              349.7/14.1 | désactivée |
| epics.html         |        5486 |         258 |                0 |              0 |       150 |                248.9/16.4 |              323.2/30.3 | désactivée |
| graph.html         |      172441 |         226 |               24 |             24 |      1840 |                332.0/57.9 |              447.5/75.5 | désactivée |
| history.html       |        7658 |         228 |                0 |              0 |       242 |                264.8/45.4 |              443.0/72.9 | désactivée |
| index.html         |       11078 |         226 |                2 |              2 |       334 |                277.8/64.6 |             336.7/140.8 | désactivée |
| issues.html        |       38724 |       24120 |                0 |            108 |      3705 |                373.5/75.4 |              621.7/53.8 | désactivée |
| quality.html       |       97193 |         228 |               32 |             32 |      3120 |                288.3/87.3 |              444.0/90.0 | désactivée |

Copies JSON exactes redondantes : 0 octets sur 353007. Ne mesure pas les duplications sémantiques RAW/normalisé.

Comparaison des volumes (après − avant) :

```json
[
  {
    "page": "accessibility.html",
    "htmlBytes": -161554,
    "jsonBytes": -161576,
    "initialTableRows": 0,
    "domNodes": 0,
    "renderedTableRows": 0
  },
  {
    "page": "anomalies.html",
    "htmlBytes": -332834,
    "jsonBytes": -332794,
    "initialTableRows": 0,
    "domNodes": -1,
    "renderedTableRows": 0
  },
  {
    "page": "audits.html",
    "htmlBytes": -214942,
    "jsonBytes": -214957,
    "initialTableRows": 0,
    "domNodes": 0,
    "renderedTableRows": 0
  },
  {
    "page": "components.html",
    "htmlBytes": -332889,
    "jsonBytes": -332780,
    "initialTableRows": 0,
    "domNodes": -3,
    "renderedTableRows": 0
  },
  {
    "page": "epics.html",
    "htmlBytes": -332846,
    "jsonBytes": -332790,
    "initialTableRows": 0,
    "domNodes": -2,
    "renderedTableRows": 0
  },
  {
    "page": "graph.html",
    "htmlBytes": -332842,
    "jsonBytes": -332798,
    "initialTableRows": 0,
    "domNodes": -1,
    "renderedTableRows": 0
  },
  {
    "page": "history.html",
    "htmlBytes": -332838,
    "jsonBytes": -332796,
    "initialTableRows": 0,
    "domNodes": -1,
    "renderedTableRows": 0
  },
  {
    "page": "index.html",
    "htmlBytes": -332842,
    "jsonBytes": -332798,
    "initialTableRows": 0,
    "domNodes": -1,
    "renderedTableRows": 0
  },
  {
    "page": "issues.html",
    "htmlBytes": -332902,
    "jsonBytes": -332788,
    "initialTableRows": 0,
    "domNodes": -4,
    "renderedTableRows": 0
  },
  {
    "page": "quality.html",
    "htmlBytes": -332780,
    "jsonBytes": -332796,
    "initialTableRows": 0,
    "domNodes": 0,
    "renderedTableRows": 0
  }
]
```

Les durées décrivent cette machine et ce passage ; aucune limite temporelle automatique. Voir report.json pour séries brutes, quantiles et empreintes.

## Ressources locales

JSON déjà inclus dans HTML. Assets utilisés mesurés sur une navigation sans cache ; imports communs comptés une seule fois par page.

| Page               | Assets octets | HTML + assets octets |
| ------------------ | ------------: | -------------------: |
| accessibility.html |         72549 |               381259 |
| anomalies.html     |         52495 |               133831 |
| audits.html        |         72549 |               234613 |
| components.html    |         69339 |               119794 |
| epics.html         |         56184 |                61670 |
| graph.html         |         54549 |               226990 |
| history.html       |         52495 |                60153 |
| index.html         |         52495 |                63573 |
| issues.html        |         67869 |               106593 |
| quality.html       |         72549 |               169742 |

Assets partagés entre plusieurs pages : 74467 octets. Dossier HTML + tous les assets distribués, dédupliqués par chemin : 1043737 octets. Les empreintes et dépendances statiques par page figurent dans report.json ; les archives sans cette extension ne renseignent pas ces mesures (indisponible, jamais zéro). Aucun cache ni parsing commun entre documents indépendants n’est garanti.
