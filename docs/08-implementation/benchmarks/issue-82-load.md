# Benchmark synthétique load

Protocole dashboard-benchmark-v1, graine 81, fixture dashboard-load-v1, SHA-256 e98fa9b1930ec6540d17ee6d5568ea5d70ff2c228f6038f95e36cf8d50d46b15. Révision 86bb800b2eb239f370accf5f30db489e59421d07.

Volumes : {"repositories":3,"issues":1800,"pullRequests":1500,"componentVersions":2300,"diagnostics":3000}.

Conditions : {"node":"v22.23.3","os":"win32","release":"10.0.19045","arch":"x64","cpu":"Intel(R) Core(TM) i3-4130 CPU @ 3.40GHz","logicalCpus":4,"memoryBytes":8461107200} ; navigateur {"version":"155.0.4283.62","viewport":{"width":1440,"height":900}} ; {"channel":"msedge","headless":true,"locale":"fr-FR","timezone":"UTC","workers":1,"runs":3,"warmup":1,"cache":"nouveau contexte par passage, HTTP no-store, routage local uniquement","cpuThrottle":"aucun","network":"loopback uniquement, sans compression","readiness":"DOMContentLoaded pour navigation ; load + h1 visible + fonts.ready + deux requestAnimationFrame pour résultat ; pas une mesure d’interactivité complète","capture":"désactivée","preparation":"processus Node neuf par génération ; préparation normalisation/Analytics et démarrage exclus du temps de génération ; chauffe exclue des séries"}.

Préparation : 11755.5 ms. Génération médiane 12206.2 ms, IQR 1394.8 ms.

Octets non compressés. JSON est inclus dans HTML. Lignes initiales : lignes tbody présentes dans le fichier ; DOM : tous les nœuds après disponibilité du résultat.

| Page               | HTML octets | JSON octets | Lignes initiales | Lignes rendues | Nœuds DOM | Navigation médiane/IQR ms | Résultat médiane/IQR ms | Capture ms |
| ------------------ | ----------: | ----------: | ---------------: | -------------: | --------: | ------------------------: | ----------------------: | ---------: |
| accessibility.html |    51797213 |    41456441 |             3540 |           3544 |     84654 |              3496.6/299.1 |            3958.4/307.2 | désactivée |
| anomalies.html     |    47145030 |    41456441 |             1770 |           1770 |    119385 |              4069.0/529.4 |            4502.4/561.6 | désactivée |
| audits.html        |    43984859 |    41456441 |             2360 |           2360 |     71196 |              4007.8/504.7 |            4412.6/558.5 | désactivée |
| components.html    |    44507833 |    44482673 |                0 |            230 |     37478 |              3125.3/734.2 |            3740.8/834.4 | désactivée |
| epics.html         |    41461749 |    41456465 |                0 |              0 |       152 |               1621.8/41.0 |             1943.7/50.6 | désactivée |
| graph.html         |    54184804 |    41456441 |             1800 |           1800 |    126559 |             6939.5/1040.2 |           7640.6/1159.6 | désactivée |
| history.html       |    41464037 |    41456441 |                0 |              0 |       247 |               1718.3/68.1 |             2046.3/59.2 | désactivée |
| index.html         |    41480874 |    41456441 |                6 |              6 |       445 |              1769.9/326.0 |            2012.7/330.5 | désactivée |
| issues.html        |    43311811 |    43284509 |                0 |           8880 |    267795 |               2165.5/35.6 |            5600.8/103.2 | désactivée |
| quality.html       |    46182226 |    41456441 |             3006 |           3006 |    149127 |              3670.0/498.8 |            4286.6/500.1 | désactivée |

Copies JSON exactes redondantes : 373107969 octets sur 419418734. Ne mesure pas les duplications sémantiques RAW/normalisé.

Comparaison des volumes (après − avant) :

```json
[
  {
    "page": "accessibility.html",
    "htmlBytes": -25950864,
    "jsonBytes": -25950803,
    "initialTableRows": 0,
    "domNodes": -2,
    "renderedTableRows": 0
  },
  {
    "page": "anomalies.html",
    "htmlBytes": -25950864,
    "jsonBytes": -25950803,
    "initialTableRows": 0,
    "domNodes": -2,
    "renderedTableRows": 0
  },
  {
    "page": "audits.html",
    "htmlBytes": -25950864,
    "jsonBytes": -25950803,
    "initialTableRows": 0,
    "domNodes": -2,
    "renderedTableRows": 0
  },
  {
    "page": "components.html",
    "htmlBytes": -25950864,
    "jsonBytes": -25950803,
    "initialTableRows": 0,
    "domNodes": -2,
    "renderedTableRows": 0
  },
  {
    "page": "epics.html",
    "htmlBytes": -25950864,
    "jsonBytes": -25950803,
    "initialTableRows": 0,
    "domNodes": -2,
    "renderedTableRows": 0
  },
  {
    "page": "graph.html",
    "htmlBytes": -25950864,
    "jsonBytes": -25950803,
    "initialTableRows": 0,
    "domNodes": -2,
    "renderedTableRows": 0
  },
  {
    "page": "history.html",
    "htmlBytes": -25950864,
    "jsonBytes": -25950803,
    "initialTableRows": 0,
    "domNodes": -2,
    "renderedTableRows": 0
  },
  {
    "page": "index.html",
    "htmlBytes": -25950864,
    "jsonBytes": -25950803,
    "initialTableRows": 0,
    "domNodes": -2,
    "renderedTableRows": 0
  },
  {
    "page": "issues.html",
    "htmlBytes": -25950864,
    "jsonBytes": -25950803,
    "initialTableRows": 0,
    "domNodes": -2,
    "renderedTableRows": 0
  },
  {
    "page": "quality.html",
    "htmlBytes": -25950864,
    "jsonBytes": -25950803,
    "initialTableRows": 0,
    "domNodes": -2,
    "renderedTableRows": 0
  }
]
```

Les durées décrivent cette machine et ce passage ; aucune limite temporelle automatique. Voir report.json pour séries brutes, quantiles et empreintes.
