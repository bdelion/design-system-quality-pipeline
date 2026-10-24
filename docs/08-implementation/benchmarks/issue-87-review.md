# Benchmark synthétique control

Protocole dashboard-benchmark-v1, graine 81, fixture dashboard-load-v1, SHA-256 92944855a6f1de050e2677f17b19cd8200242ca557a18e90e8a8f15318e46597. Révision a2b36e4ddf77abc764113c03f423a03e34b705e5.

Volumes : {"repositories":1,"issues":24,"pullRequests":18,"componentVersions":12,"diagnostics":30}.

Conditions : {"node":"v22.23.3","os":"win32","release":"10.0.19045","arch":"x64","cpu":"Intel(R) Core(TM) i3-4130 CPU @ 3.40GHz","logicalCpus":4,"memoryBytes":8461107200} ; navigateur {"version":"155.0.4283.62","viewport":{"width":1440,"height":900}} ; {"channel":"msedge","headless":true,"locale":"fr-FR","timezone":"UTC","workers":1,"runs":3,"warmup":1,"cache":"nouveau contexte par passage, HTTP no-store, routage local uniquement","cpuThrottle":"aucun","network":"loopback uniquement, sans compression","readiness":"DOMContentLoaded pour navigation ; load + h1 visible + fonts.ready + deux requestAnimationFrame pour résultat ; pas une mesure d’interactivité complète","capture":"désactivée","preparation":"processus Node neuf par génération ; préparation normalisation/Analytics et démarrage exclus du temps de génération ; chauffe exclue des séries"}.

Préparation : 73.1 ms. Génération médiane 158.2 ms, IQR 30.1 ms.

Octets non compressés. JSON est inclus dans HTML. Lignes initiales : lignes tbody présentes dans le fichier ; DOM : tous les nœuds après disponibilité du résultat.

| Page               | HTML octets | JSON octets | Lignes initiales | Lignes rendues | Nœuds DOM | Navigation médiane/IQR ms | Résultat médiane/IQR ms | Capture ms |
| ------------------ | ----------: | ----------: | ---------------: | -------------: | --------: | ------------------------: | ----------------------: | ---------: |
| accessibility.html |      308817 |      171448 |               42 |             46 |      1689 |             1899.0/1109.6 |           1984.5/1105.3 | désactivée |
| anomalies.html     |       81311 |         230 |               21 |             21 |      1882 |                199.6/17.9 |              276.5/27.7 | désactivée |
| audits.html        |      173369 |      118067 |               30 |             30 |      1522 |                236.4/15.5 |               330.2/7.8 | désactivée |
| components.html    |       50565 |       37976 |                0 |              4 |       657 |                226.7/12.9 |              344.2/14.1 | désactivée |
| epics.html         |        5461 |         258 |                0 |              0 |       143 |                163.6/13.8 |              226.2/23.2 | désactivée |
| graph.html         |      172341 |         226 |               24 |             24 |      1833 |                216.5/13.9 |              288.3/12.8 | désactivée |
| history.html       |        7633 |         228 |                0 |              0 |       235 |                190.8/63.1 |              256.8/71.0 | désactivée |
| index.html         |       10841 |         226 |                2 |              2 |       324 |                219.1/30.5 |              308.6/32.9 | désactivée |
| issues.html        |       39196 |       24120 |                0 |             50 |      1968 |                244.6/39.6 |              372.1/57.4 | désactivée |
| quality.html       |       99575 |       10234 |               32 |             32 |      3130 |               332.8/112.5 |             456.2/109.0 | désactivée |

Copies JSON exactes redondantes : 0 octets sur 363013. Ne mesure pas les duplications sémantiques RAW/normalisé.

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
    "htmlBytes": 472,
    "jsonBytes": 0,
    "initialTableRows": 0,
    "domNodes": -1737,
    "renderedTableRows": -58
  },
  {
    "page": "quality.html",
    "htmlBytes": 2611,
    "jsonBytes": 10006,
    "initialTableRows": 0,
    "domNodes": 10,
    "renderedTableRows": 0
  }
]
```

Les durées décrivent cette machine et ce passage ; aucune limite temporelle automatique. Voir report.json pour séries brutes, quantiles et empreintes.

## Ressources locales

JSON déjà inclus dans HTML. Assets utilisés mesurés sur une navigation sans cache ; imports communs comptés une seule fois par page.

| Page               | Assets octets | HTML + assets octets |
| ------------------ | ------------: | -------------------: |
| accessibility.html |         75370 |               384187 |
| anomalies.html     |         57394 |               138705 |
| audits.html        |         77821 |               251190 |
| components.html    |         74836 |               125401 |
| epics.html         |         61083 |                66544 |
| graph.html         |         59448 |               231789 |
| history.html       |         57394 |                65027 |
| index.html         |         57394 |                68235 |
| issues.html        |         75888 |               115084 |
| quality.html       |         84022 |               183597 |

Assets partagés entre plusieurs pages : 79915 octets. Dossier HTML + tous les assets distribués, dédupliqués par chemin : 1072716 octets. Les empreintes et dépendances statiques par page figurent dans report.json ; les archives sans cette extension ne renseignent pas ces mesures (indisponible, jamais zéro). Aucun cache ni parsing commun entre documents indépendants n’est garanti.
