# Benchmark synthétique control

Protocole dashboard-benchmark-v1, graine 81, fixture dashboard-load-v1, SHA-256 92944855a6f1de050e2677f17b19cd8200242ca557a18e90e8a8f15318e46597. Révision 86bb800b2eb239f370accf5f30db489e59421d07.

Volumes : {"repositories":1,"issues":24,"pullRequests":18,"componentVersions":12,"diagnostics":30}.

Conditions : {"node":"v22.23.3","os":"win32","release":"10.0.19045","arch":"x64","cpu":"Intel(R) Core(TM) i3-4130 CPU @ 3.40GHz","logicalCpus":4,"memoryBytes":8461107200} ; navigateur {"version":"155.0.4283.62","viewport":{"width":1440,"height":900}} ; {"channel":"msedge","headless":true,"locale":"fr-FR","timezone":"UTC","workers":1,"runs":3,"warmup":1,"cache":"nouveau contexte par passage, HTTP no-store, routage local uniquement","cpuThrottle":"aucun","network":"loopback uniquement, sans compression","readiness":"DOMContentLoaded pour navigation ; load + h1 visible + fonts.ready + deux requestAnimationFrame pour résultat ; pas une mesure d’interactivité complète","capture":"viewport, passage distinct hors séries temporelles","preparation":"processus Node neuf par génération ; préparation normalisation/Analytics et démarrage exclus du temps de génération ; chauffe exclue des séries"}.

Préparation : 83.1 ms. Génération médiane 255.7 ms, IQR 65.1 ms.

Octets non compressés. JSON est inclus dans HTML. Lignes initiales : lignes tbody présentes dans le fichier ; DOM : tous les nœuds après disponibilité du résultat.

| Page               | HTML octets | JSON octets | Lignes initiales | Lignes rendues | Nœuds DOM | Navigation médiane/IQR ms | Résultat médiane/IQR ms | Capture ms |
| ------------------ | ----------: | ----------: | ---------------: | -------------: | --------: | ------------------------: | ----------------------: | ---------: |
| accessibility.html |      470264 |      333024 |               42 |             46 |      1696 |                348.6/53.2 |              463.6/45.7 |       81.6 |
| anomalies.html     |      414170 |      333024 |               21 |             21 |      1890 |                 241.8/8.7 |              319.7/15.3 |       77.7 |
| audits.html        |      377006 |      333024 |               18 |             18 |      1312 |                 233.5/7.5 |              340.7/14.4 |      107.0 |
| components.html    |      383344 |      370756 |                0 |              4 |       690 |                211.8/23.1 |              308.3/18.1 |       98.9 |
| epics.html         |      338332 |      333048 |                0 |              0 |       152 |                248.0/30.2 |              342.7/33.0 |       69.5 |
| graph.html         |      505283 |      333024 |               24 |             24 |      1841 |                252.5/28.3 |              348.1/48.9 |       79.7 |
| history.html       |      340496 |      333024 |                0 |              0 |       243 |                 186.2/6.9 |               244.5/5.4 |       73.3 |
| index.html         |      343920 |      333024 |                2 |              2 |       335 |                196.9/22.7 |              258.7/22.6 |       69.6 |
| issues.html        |      371626 |      356908 |                0 |            108 |      3709 |                254.1/32.3 |              426.9/45.9 |       67.8 |
| quality.html       |      429973 |      333024 |               32 |             32 |      3120 |                 333.3/7.9 |              442.4/11.1 |       98.4 |

Copies JSON exactes redondantes : 2997216 octets sur 3391880. Ne mesure pas les duplications sémantiques RAW/normalisé.

Comparaison des volumes (après − avant) :

```json
[
  {
    "page": "accessibility.html",
    "htmlBytes": -185488,
    "jsonBytes": -185427,
    "initialTableRows": 0,
    "domNodes": -2,
    "renderedTableRows": 0
  },
  {
    "page": "anomalies.html",
    "htmlBytes": -185488,
    "jsonBytes": -185427,
    "initialTableRows": 0,
    "domNodes": -2,
    "renderedTableRows": 0
  },
  {
    "page": "audits.html",
    "htmlBytes": -185488,
    "jsonBytes": -185427,
    "initialTableRows": 0,
    "domNodes": -2,
    "renderedTableRows": 0
  },
  {
    "page": "components.html",
    "htmlBytes": -185488,
    "jsonBytes": -185427,
    "initialTableRows": 0,
    "domNodes": -2,
    "renderedTableRows": 0
  },
  {
    "page": "epics.html",
    "htmlBytes": -185488,
    "jsonBytes": -185427,
    "initialTableRows": 0,
    "domNodes": -2,
    "renderedTableRows": 0
  },
  {
    "page": "graph.html",
    "htmlBytes": -185488,
    "jsonBytes": -185427,
    "initialTableRows": 0,
    "domNodes": -2,
    "renderedTableRows": 0
  },
  {
    "page": "history.html",
    "htmlBytes": -185488,
    "jsonBytes": -185427,
    "initialTableRows": 0,
    "domNodes": -2,
    "renderedTableRows": 0
  },
  {
    "page": "index.html",
    "htmlBytes": -185488,
    "jsonBytes": -185427,
    "initialTableRows": 0,
    "domNodes": -2,
    "renderedTableRows": 0
  },
  {
    "page": "issues.html",
    "htmlBytes": -185488,
    "jsonBytes": -185427,
    "initialTableRows": 0,
    "domNodes": -2,
    "renderedTableRows": 0
  },
  {
    "page": "quality.html",
    "htmlBytes": -185488,
    "jsonBytes": -185427,
    "initialTableRows": 0,
    "domNodes": -2,
    "renderedTableRows": 0
  }
]
```

Les durées décrivent cette machine et ce passage ; aucune limite temporelle automatique. Voir report.json pour séries brutes, quantiles et empreintes.
