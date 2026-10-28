# Benchmark synthétique control

Protocole dashboard-benchmark-v1, graine 81, fixture dashboard-load-v1, SHA-256 92944855a6f1de050e2677f17b19cd8200242ca557a18e90e8a8f15318e46597. Révision 4651d2ddbc82562d23bd1a139b75e2a3dd14cf8f.

Volumes : {"repositories":1,"issues":24,"pullRequests":18,"componentVersions":12,"diagnostics":30}.

Conditions : {"node":"v22.23.3","os":"win32","release":"10.0.19045","arch":"x64","cpu":"Intel(R) Core(TM) i3-4130 CPU @ 3.40GHz","logicalCpus":4,"memoryBytes":8461107200} ; navigateur {"version":"155.0.4283.62","viewport":{"width":1440,"height":900}} ; {"channel":"msedge","headless":true,"locale":"fr-FR","timezone":"UTC","workers":1,"runs":3,"warmup":1,"cache":"nouveau contexte par passage, HTTP no-store, routage local uniquement","cpuThrottle":"aucun","network":"loopback uniquement, sans compression","readiness":"DOMContentLoaded pour navigation ; load + h1 visible + fonts.ready + deux requestAnimationFrame pour résultat ; pas une mesure d’interactivité complète","capture":"désactivée","preparation":"processus Node neuf par génération ; préparation normalisation/Analytics et démarrage exclus du temps de génération ; chauffe exclue des séries"}.

Préparation : 248.7 ms. Génération médiane 207.2 ms, IQR 33.1 ms.

Octets non compressés. JSON est inclus dans HTML. Lignes initiales : lignes tbody présentes dans le fichier ; DOM : tous les nœuds après disponibilité du résultat.

| Page               | HTML octets | JSON octets | Lignes initiales | Lignes rendues | Nœuds DOM | Navigation médiane/IQR ms | Résultat médiane/IQR ms | Capture ms |
| ------------------ | ----------: | ----------: | ---------------: | -------------: | --------: | ------------------------: | ----------------------: | ---------: |
| accessibility.html |      308710 |      171448 |               42 |             46 |      1696 |              331.4/1728.2 |            445.1/1809.2 | désactivée |
| anomalies.html     |       81336 |         230 |               21 |             21 |      1889 |                271.4/24.8 |              346.5/27.1 | désactivée |
| audits.html        |      162064 |      118067 |               18 |             18 |      1312 |                 236.4/9.3 |               306.3/6.8 | désactivée |
| components.html    |       50388 |       37976 |                0 |              4 |       661 |                 167.1/7.9 |              264.3/17.9 | désactivée |
| epics.html         |        5486 |         258 |                0 |              0 |       150 |                184.9/17.3 |               244.0/4.6 | désactivée |
| graph.html         |      172441 |         226 |               24 |             24 |      1840 |                325.7/20.9 |              437.5/25.6 | désactivée |
| history.html       |        7658 |         228 |                0 |              0 |       242 |                 226.1/9.3 |               330.8/9.1 | désactivée |
| index.html         |       11078 |         226 |                2 |              2 |       334 |                250.9/15.8 |              326.6/21.0 | désactivée |
| issues.html        |       38724 |       24120 |                0 |            108 |      3705 |                285.2/22.3 |              460.2/50.3 | désactivée |
| quality.html       |       97193 |         228 |               32 |             32 |      3120 |                 247.2/7.9 |              346.1/21.4 | désactivée |

Copies JSON exactes redondantes : 0 octets sur 353007. Ne mesure pas les duplications sémantiques RAW/normalisé.

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
    "htmlBytes": -67,
    "jsonBytes": 0,
    "initialTableRows": 0,
    "domNodes": -26,
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

## Ressources locales

JSON déjà inclus dans HTML. Assets utilisés mesurés sur une navigation sans cache ; imports communs comptés une seule fois par page.

| Page               | Assets octets | HTML + assets octets |
| ------------------ | ------------: | -------------------: |
| accessibility.html |         72805 |               381515 |
| anomalies.html     |         52751 |               134087 |
| audits.html        |         72805 |               234869 |
| components.html    |         70084 |               120472 |
| epics.html         |         56440 |                61926 |
| graph.html         |         54805 |               227246 |
| history.html       |         52751 |                60409 |
| index.html         |         52751 |                63829 |
| issues.html        |         68125 |               106849 |
| quality.html       |         72805 |               169998 |

Assets partagés entre plusieurs pages : 74723 octets. Dossier HTML + tous les assets distribués, dédupliqués par chemin : 1044415 octets. Les empreintes et dépendances statiques par page figurent dans report.json ; les archives sans cette extension ne renseignent pas ces mesures (indisponible, jamais zéro). Aucun cache ni parsing commun entre documents indépendants n’est garanti.
