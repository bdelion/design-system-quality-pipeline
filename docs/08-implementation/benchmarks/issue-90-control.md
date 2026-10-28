# Benchmark synthétique control

Protocole dashboard-benchmark-v1, graine 81, fixture dashboard-load-v1, SHA-256 92944855a6f1de050e2677f17b19cd8200242ca557a18e90e8a8f15318e46597. Révision c33e69bed00e6e594623db22f402ccf1d43cefc8.

Volumes : {"repositories":1,"issues":24,"pullRequests":18,"componentVersions":12,"diagnostics":30}.

Conditions : {"node":"v22.23.3","os":"win32","release":"10.0.19045","arch":"x64","cpu":"Intel(R) Core(TM) i3-4130 CPU @ 3.40GHz","logicalCpus":4,"memoryBytes":8461107200} ; navigateur {"version":"155.0.4283.62","viewport":{"width":1440,"height":900}} ; {"channel":"msedge","headless":true,"locale":"fr-FR","timezone":"UTC","workers":1,"runs":3,"warmup":1,"cache":"nouveau contexte par passage, HTTP no-store, routage local uniquement","cpuThrottle":"aucun","network":"loopback uniquement, sans compression","readiness":"DOMContentLoaded pour navigation ; load + h1 visible + fonts.ready + deux requestAnimationFrame pour résultat ; pas une mesure d’interactivité complète","capture":"désactivée","preparation":"processus Node neuf par génération ; préparation normalisation/Analytics et démarrage exclus du temps de génération ; chauffe exclue des séries"}.

Préparation : 64.5 ms. Génération médiane 199.5 ms, IQR 32.3 ms.

Octets non compressés. JSON est inclus dans HTML. Lignes initiales : lignes tbody présentes dans le fichier ; DOM : tous les nœuds après disponibilité du résultat.

| Page               | HTML octets | JSON octets | Lignes initiales | Lignes rendues | Nœuds DOM | Navigation médiane/IQR ms | Résultat médiane/IQR ms | Capture ms |
| ------------------ | ----------: | ----------: | ---------------: | -------------: | --------: | ------------------------: | ----------------------: | ---------: |
| accessibility.html |      308817 |      171448 |               42 |             46 |      1689 |               264.7/224.8 |             345.1/215.4 | désactivée |
| anomalies.html     |       81311 |         230 |               21 |             21 |      1882 |                294.9/19.3 |              403.0/32.0 | désactivée |
| audits.html        |      173369 |      118067 |               30 |             30 |      1522 |                250.3/16.4 |               327.4/8.6 | désactivée |
| components.html    |       50565 |       37976 |                0 |              4 |       657 |                 196.9/9.0 |               299.6/8.8 | désactivée |
| epics.html         |        5461 |         258 |                0 |              0 |       143 |                143.3/16.7 |              223.8/17.3 | désactivée |
| graph.html         |      172341 |         226 |               24 |             24 |      1833 |                279.9/14.5 |              392.7/18.4 | désactivée |
| history.html       |        7633 |         228 |                0 |              0 |       235 |                 139.6/1.0 |               195.5/7.2 | désactivée |
| index.html         |       10841 |         226 |                2 |              2 |       324 |                148.0/17.5 |              212.6/16.3 | désactivée |
| issues.html        |       39196 |       24120 |                0 |             50 |      1968 |                 189.5/3.7 |               290.7/4.5 | désactivée |
| quality.html       |      121284 |       10234 |               62 |             62 |      3977 |                232.7/12.7 |               342.9/5.7 | désactivée |

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
| accessibility.html |         77341 |               386158 |
| anomalies.html     |         59377 |               140688 |
| audits.html        |         79792 |               253161 |
| components.html    |         76819 |               127384 |
| epics.html         |         63066 |                68527 |
| graph.html         |         61431 |               233772 |
| history.html       |         59377 |                67010 |
| index.html         |         59377 |                70218 |
| issues.html        |         78125 |               117321 |
| quality.html       |         97472 |               218756 |

Assets partagés entre plusieurs pages : 82023 octets. Dossier HTML + tous les assets distribués, dédupliqués par chemin : 1107992 octets. Les empreintes et dépendances statiques par page figurent dans report.json ; les archives sans cette extension ne renseignent pas ces mesures (indisponible, jamais zéro). Aucun cache ni parsing commun entre documents indépendants n’est garanti.
