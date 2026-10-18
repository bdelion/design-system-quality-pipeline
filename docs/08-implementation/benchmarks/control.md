# Benchmark synthétique control

Protocole dashboard-benchmark-v1, graine 81, fixture dashboard-load-v1, SHA-256 92944855a6f1de050e2677f17b19cd8200242ca557a18e90e8a8f15318e46597. Révision ac6d477c6ca996414cd5d55fd9b5dc659e9705b6.

Volumes : {"repositories":1,"issues":24,"pullRequests":18,"componentVersions":12,"diagnostics":30}.

Conditions : {"node":"v22.23.3","os":"win32","release":"10.0.19045","arch":"x64","cpu":"Intel(R) Core(TM) i3-4130 CPU @ 3.40GHz","logicalCpus":4,"memoryBytes":8461107200} ; navigateur {"version":"155.0.4283.62","viewport":{"width":1440,"height":900}} ; {"channel":"msedge","headless":true,"locale":"fr-FR","timezone":"UTC","workers":1,"runs":3,"warmup":1,"cache":"nouveau contexte par passage, HTTP no-store, routage local uniquement","cpuThrottle":"aucun","network":"loopback uniquement, sans compression","readiness":"DOMContentLoaded pour navigation ; load + h1 visible + fonts.ready + deux requestAnimationFrame pour résultat ; pas une mesure d’interactivité complète","capture":"viewport, passage distinct hors séries temporelles","preparation":"processus Node neuf par génération ; préparation normalisation/Analytics et démarrage exclus du temps de génération ; chauffe exclue des séries"}.

Préparation : 84.8 ms. Génération médiane 303.2 ms, IQR 137.7 ms.

Octets non compressés. JSON est inclus dans HTML. Lignes initiales : lignes tbody présentes dans le fichier ; DOM : tous les nœuds après disponibilité du résultat.

| Page               | HTML octets | JSON octets | Lignes initiales | Lignes rendues | Nœuds DOM | Navigation médiane/IQR ms | Résultat médiane/IQR ms | Capture ms |
| ------------------ | ----------: | ----------: | ---------------: | -------------: | --------: | ------------------------: | ----------------------: | ---------: |
| accessibility.html |      655752 |      518451 |               42 |             46 |      1698 |               303.6/144.5 |             408.2/141.4 |       81.3 |
| anomalies.html     |      599658 |      518451 |               21 |             21 |      1892 |                241.1/47.0 |              317.6/59.5 |       67.4 |
| audits.html        |      562494 |      518451 |               18 |             18 |      1314 |                258.6/31.5 |              332.3/34.0 |       67.1 |
| components.html    |      568832 |      556183 |                0 |              4 |       692 |                199.2/40.1 |              294.1/44.8 |       71.0 |
| epics.html         |      523820 |      518475 |                0 |              0 |       154 |                170.6/10.5 |              240.3/14.6 |       59.5 |
| graph.html         |      690771 |      518451 |               24 |             24 |      1843 |                 262.2/8.8 |               355.4/6.9 |       75.3 |
| history.html       |      525984 |      518451 |                0 |              0 |       245 |                184.1/34.5 |              261.0/40.6 |       68.4 |
| index.html         |      529408 |      518451 |                2 |              2 |       337 |                201.9/67.3 |              265.5/77.3 |      101.2 |
| issues.html        |      557114 |      542335 |                0 |            108 |      3711 |                422.7/73.9 |              588.0/65.3 |       80.7 |
| quality.html       |      615461 |      518451 |               32 |             32 |      3122 |                301.6/30.8 |              407.3/38.1 |       66.0 |

Copies JSON exactes redondantes : 4666059 octets sur 5246150. Ne mesure pas les duplications sémantiques RAW/normalisé.

Comparaison des volumes (après − avant) :

```json
[
  {
    "page": "accessibility.html",
    "htmlBytes": 0,
    "jsonBytes": 0,
    "initialTableRows": 0,
    "domNodes": 0,
    "renderedTableRows": 0
  },
  {
    "page": "anomalies.html",
    "htmlBytes": 0,
    "jsonBytes": 0,
    "initialTableRows": 0,
    "domNodes": 0,
    "renderedTableRows": 0
  },
  {
    "page": "audits.html",
    "htmlBytes": 0,
    "jsonBytes": 0,
    "initialTableRows": 0,
    "domNodes": 0,
    "renderedTableRows": 0
  },
  {
    "page": "components.html",
    "htmlBytes": 0,
    "jsonBytes": 0,
    "initialTableRows": 0,
    "domNodes": 0,
    "renderedTableRows": 0
  },
  {
    "page": "epics.html",
    "htmlBytes": 0,
    "jsonBytes": 0,
    "initialTableRows": 0,
    "domNodes": 0,
    "renderedTableRows": 0
  },
  {
    "page": "graph.html",
    "htmlBytes": 0,
    "jsonBytes": 0,
    "initialTableRows": 0,
    "domNodes": 0,
    "renderedTableRows": 0
  },
  {
    "page": "history.html",
    "htmlBytes": 0,
    "jsonBytes": 0,
    "initialTableRows": 0,
    "domNodes": 0,
    "renderedTableRows": 0
  },
  {
    "page": "index.html",
    "htmlBytes": 0,
    "jsonBytes": 0,
    "initialTableRows": 0,
    "domNodes": 0,
    "renderedTableRows": 0
  },
  {
    "page": "issues.html",
    "htmlBytes": 0,
    "jsonBytes": 0,
    "initialTableRows": 0,
    "domNodes": 0,
    "renderedTableRows": 0
  },
  {
    "page": "quality.html",
    "htmlBytes": 0,
    "jsonBytes": 0,
    "initialTableRows": 0,
    "domNodes": 0,
    "renderedTableRows": 0
  }
]
```

Les durées décrivent cette machine et ce passage ; aucune limite temporelle automatique. Voir report.json pour séries brutes, quantiles et empreintes.
