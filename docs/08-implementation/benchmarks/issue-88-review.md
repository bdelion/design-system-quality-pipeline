# Benchmark synthétique control

Protocole dashboard-benchmark-v1, graine 81, fixture dashboard-load-v1, SHA-256 92944855a6f1de050e2677f17b19cd8200242ca557a18e90e8a8f15318e46597. Révision 83e633d35e05ab75af0a93e3724455cad2581202.

Volumes : {"repositories":1,"issues":24,"pullRequests":18,"componentVersions":12,"diagnostics":30}.

Conditions : {"node":"v22.23.3","os":"win32","release":"10.0.19045","arch":"x64","cpu":"Intel(R) Core(TM) i3-4130 CPU @ 3.40GHz","logicalCpus":4,"memoryBytes":8461107200} ; navigateur {"version":"155.0.4283.62","viewport":{"width":1440,"height":900}} ; {"channel":"msedge","headless":true,"locale":"fr-FR","timezone":"UTC","workers":1,"runs":3,"warmup":1,"cache":"nouveau contexte par passage, HTTP no-store, routage local uniquement","cpuThrottle":"aucun","network":"loopback uniquement, sans compression","readiness":"DOMContentLoaded pour navigation ; load + h1 visible + fonts.ready + deux requestAnimationFrame pour résultat ; pas une mesure d’interactivité complète","capture":"désactivée","preparation":"processus Node neuf par génération ; préparation normalisation/Analytics et démarrage exclus du temps de génération ; chauffe exclue des séries"}.

Préparation : 100.3 ms. Génération médiane 147.3 ms, IQR 13.2 ms.

Octets non compressés. JSON est inclus dans HTML. Lignes initiales : lignes tbody présentes dans le fichier ; DOM : tous les nœuds après disponibilité du résultat.

| Page               | HTML octets | JSON octets | Lignes initiales | Lignes rendues | Nœuds DOM | Navigation médiane/IQR ms | Résultat médiane/IQR ms | Capture ms |
| ------------------ | ----------: | ----------: | ---------------: | -------------: | --------: | ------------------------: | ----------------------: | ---------: |
| accessibility.html |      308817 |      171448 |               42 |             46 |      1689 |              1339.9/658.9 |            1423.0/657.6 | désactivée |
| anomalies.html     |       81311 |         230 |               21 |             21 |      1882 |                215.8/24.4 |              284.7/33.6 | désactivée |
| audits.html        |      173369 |      118067 |               30 |             30 |      1522 |                250.4/42.8 |              325.2/50.7 | désactivée |
| components.html    |       50565 |       37976 |                0 |              4 |       657 |                251.1/43.1 |              330.1/37.6 | désactivée |
| epics.html         |        5461 |         258 |                0 |              0 |       143 |                173.9/31.7 |              235.4/55.5 | désactivée |
| graph.html         |      172341 |         226 |               24 |             24 |      1833 |                415.7/86.5 |             491.1/104.6 | désactivée |
| history.html       |        7633 |         228 |                0 |              0 |       235 |                172.8/21.2 |              261.5/27.8 | désactivée |
| index.html         |       10841 |         226 |                2 |              2 |       324 |                184.5/16.2 |              246.5/23.4 | désactivée |
| issues.html        |       39196 |       24120 |                0 |             50 |      1968 |                233.6/21.8 |              357.4/26.5 | désactivée |
| quality.html       |      121284 |       10234 |               62 |             62 |      3977 |               251.3/106.8 |             442.2/114.3 | désactivée |

Copies JSON exactes redondantes : 0 octets sur 363013. Ne mesure pas les duplications sémantiques RAW/normalisé.

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
    "htmlBytes": 21709,
    "jsonBytes": 0,
    "initialTableRows": 30,
    "domNodes": 847,
    "renderedTableRows": 30
  }
]
```

Les durées décrivent cette machine et ce passage ; aucune limite temporelle automatique. Voir report.json pour séries brutes, quantiles et empreintes.

## Ressources locales

JSON déjà inclus dans HTML. Assets utilisés mesurés sur une navigation sans cache ; imports communs comptés une seule fois par page.

| Page               | Assets octets | HTML + assets octets |
| ------------------ | ------------: | -------------------: |
| accessibility.html |         75511 |               384328 |
| anomalies.html     |         57547 |               138858 |
| audits.html        |         77962 |               251331 |
| components.html    |         74989 |               125554 |
| epics.html         |         61236 |                66697 |
| graph.html         |         59601 |               231942 |
| history.html       |         57547 |                65180 |
| index.html         |         57547 |                68388 |
| issues.html        |         76295 |               115491 |
| quality.html       |         95547 |               216831 |

Assets partagés entre plusieurs pages : 80193 octets. Dossier HTML + tous les assets distribués, dédupliqués par chemin : 1106067 octets. Les empreintes et dépendances statiques par page figurent dans report.json ; les archives sans cette extension ne renseignent pas ces mesures (indisponible, jamais zéro). Aucun cache ni parsing commun entre documents indépendants n’est garanti.
