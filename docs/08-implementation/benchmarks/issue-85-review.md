# Benchmark synthétique control

Protocole dashboard-benchmark-v1, graine 81, fixture dashboard-load-v1, SHA-256 92944855a6f1de050e2677f17b19cd8200242ca557a18e90e8a8f15318e46597. Révision 3fbf500102b5a0d129ee171462200855bd49951b.

Volumes : {"repositories":1,"issues":24,"pullRequests":18,"componentVersions":12,"diagnostics":30}.

Conditions : {"node":"v22.23.3","os":"win32","release":"10.0.19045","arch":"x64","cpu":"Intel(R) Core(TM) i3-4130 CPU @ 3.40GHz","logicalCpus":4,"memoryBytes":8461107200} ; navigateur {"version":"155.0.4283.62","viewport":{"width":1440,"height":900}} ; {"channel":"msedge","headless":true,"locale":"fr-FR","timezone":"UTC","workers":1,"runs":3,"warmup":1,"cache":"nouveau contexte par passage, HTTP no-store, routage local uniquement","cpuThrottle":"aucun","network":"loopback uniquement, sans compression","readiness":"DOMContentLoaded pour navigation ; load + h1 visible + fonts.ready + deux requestAnimationFrame pour résultat ; pas une mesure d’interactivité complète","capture":"désactivée","preparation":"processus Node neuf par génération ; préparation normalisation/Analytics et démarrage exclus du temps de génération ; chauffe exclue des séries"}.

Préparation : 229.4 ms. Génération médiane 323.6 ms, IQR 75.7 ms.

Octets non compressés. JSON est inclus dans HTML. Lignes initiales : lignes tbody présentes dans le fichier ; DOM : tous les nœuds après disponibilité du résultat.

| Page               | HTML octets | JSON octets | Lignes initiales | Lignes rendues | Nœuds DOM | Navigation médiane/IQR ms | Résultat médiane/IQR ms | Capture ms |
| ------------------ | ----------: | ----------: | ---------------: | -------------: | --------: | ------------------------: | ----------------------: | ---------: |
| accessibility.html |      308842 |      171448 |               42 |             46 |      1696 |               574.9/591.3 |             706.1/583.4 | désactivée |
| anomalies.html     |       81336 |         230 |               21 |             21 |      1889 |               611.2/490.9 |             716.2/451.8 | désactivée |
| audits.html        |      173394 |      118067 |               30 |             30 |      1529 |                364.9/99.8 |              480.7/76.7 | désactivée |
| components.html    |       50598 |       37976 |                0 |              4 |       664 |               408.7/144.0 |             523.3/135.5 | désactivée |
| epics.html         |        5486 |         258 |                0 |              0 |       150 |                 205.5/9.1 |              294.9/23.3 | désactivée |
| graph.html         |      172441 |         226 |               24 |             24 |      1840 |                337.5/49.0 |              437.8/54.8 | désactivée |
| history.html       |        7658 |         228 |                0 |              0 |       242 |                210.4/10.1 |              282.1/19.7 | désactivée |
| index.html         |       10867 |         226 |                2 |              2 |       334 |               316.0/111.0 |             501.2/113.7 | désactivée |
| issues.html        |       38724 |       24120 |                0 |            108 |      3705 |                230.7/33.1 |              344.5/45.7 | désactivée |
| quality.html       |       96964 |         228 |               32 |             32 |      3120 |                234.1/12.1 |              330.1/18.5 | désactivée |

Copies JSON exactes redondantes : 0 octets sur 353007. Ne mesure pas les duplications sémantiques RAW/normalisé.

Comparaison des volumes (après − avant) :

```json
[
  {
    "page": "accessibility.html",
    "htmlBytes": 132,
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
    "htmlBytes": 11330,
    "jsonBytes": 0,
    "initialTableRows": 12,
    "domNodes": 217,
    "renderedTableRows": 12
  },
  {
    "page": "components.html",
    "htmlBytes": 210,
    "jsonBytes": 0,
    "initialTableRows": 0,
    "domNodes": 3,
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
    "htmlBytes": -211,
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
    "htmlBytes": -229,
    "jsonBytes": 0,
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
| accessibility.html |         72830 |               381672 |
| anomalies.html     |         52751 |               134087 |
| audits.html        |         75281 |               248675 |
| components.html    |         70084 |               120682 |
| epics.html         |         56440 |                61926 |
| graph.html         |         54805 |               227246 |
| history.html       |         52751 |                60409 |
| index.html         |         52751 |                63618 |
| issues.html        |         68125 |               106849 |
| quality.html       |         72830 |               169794 |

Assets partagés entre plusieurs pages : 74748 octets. Dossier HTML + tous les assets distribués, dédupliqués par chemin : 1058123 octets. Les empreintes et dépendances statiques par page figurent dans report.json ; les archives sans cette extension ne renseignent pas ces mesures (indisponible, jamais zéro). Aucun cache ni parsing commun entre documents indépendants n’est garanti.
