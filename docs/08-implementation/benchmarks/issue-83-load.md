# Benchmark synthétique load

Protocole dashboard-benchmark-v1, graine 81, fixture dashboard-load-v1, SHA-256 e98fa9b1930ec6540d17ee6d5568ea5d70ff2c228f6038f95e36cf8d50d46b15. Révision 3e816bbd15dd5cb2b54bd0280ce8eac1ab4877b5.

Volumes : {"repositories":3,"issues":1800,"pullRequests":1500,"componentVersions":2300,"diagnostics":3000}.

Conditions : {"node":"v22.23.3","os":"win32","release":"10.0.19045","arch":"x64","cpu":"Intel(R) Core(TM) i3-4130 CPU @ 3.40GHz","logicalCpus":4,"memoryBytes":8461107200} ; navigateur {"version":"155.0.4283.62","viewport":{"width":1440,"height":900}} ; {"channel":"msedge","headless":true,"locale":"fr-FR","timezone":"UTC","workers":1,"runs":3,"warmup":1,"cache":"nouveau contexte par passage, HTTP no-store, routage local uniquement","cpuThrottle":"aucun","network":"loopback uniquement, sans compression","readiness":"DOMContentLoaded pour navigation ; load + h1 visible + fonts.ready + deux requestAnimationFrame pour résultat ; pas une mesure d’interactivité complète","capture":"désactivée","preparation":"processus Node neuf par génération ; préparation normalisation/Analytics et démarrage exclus du temps de génération ; chauffe exclue des séries"}.

Préparation : 14124.6 ms. Génération médiane 9841.1 ms, IQR 1742.1 ms.

Octets non compressés. JSON est inclus dans HTML. Lignes initiales : lignes tbody présentes dans le fichier ; DOM : tous les nœuds après disponibilité du résultat.

| Page               | HTML octets | JSON octets | Lignes initiales | Lignes rendues | Nœuds DOM | Navigation médiane/IQR ms | Résultat médiane/IQR ms | Capture ms |
| ------------------ | ----------: | ----------: | ---------------: | -------------: | --------: | ------------------------: | ----------------------: | ---------: |
| accessibility.html |    33357729 |    23016935 |             3540 |           3544 |     84654 |             4307.7/1058.9 |            5042.5/964.2 | désactivée |
| anomalies.html     |     5688776 |         227 |             1770 |           1770 |    119384 |              4262.9/313.5 |            5001.2/262.5 | désactivée |
| audits.html        |    20634209 |    18105776 |             2360 |           2360 |     71196 |              5235.2/444.8 |            6118.6/622.1 | désactivée |
| components.html    |     3051524 |     3026473 |                0 |            230 |     37475 |                 427.8/9.2 |              792.6/38.5 | désactivée |
| epics.html         |        5483 |         255 |                0 |              0 |       150 |                 195.1/7.3 |              257.8/32.0 | désactivée |
| graph.html         |    12728542 |         223 |             1800 |           1800 |    126558 |              6594.4/587.3 |            7065.7/450.0 | désactivée |
| history.html       |        7779 |         225 |                0 |              0 |       246 |                261.6/13.8 |               396.5/5.1 | désactivée |
| index.html         |       24612 |         223 |                6 |              6 |       444 |                254.7/94.5 |             363.0/101.8 | désactivée |
| issues.html        |     1855489 |     1828301 |                0 |           8880 |    267791 |               732.5/152.7 |            4262.3/802.0 | désactivée |
| quality.html       |     4726026 |         225 |             3006 |           3006 |    149127 |              1975.9/214.1 |            2261.7/235.4 | désactivée |

Copies JSON exactes redondantes : 0 octets sur 45978863. Ne mesure pas les duplications sémantiques RAW/normalisé.

Comparaison des volumes (après − avant) :

```json
[
  {
    "page": "accessibility.html",
    "htmlBytes": -18439484,
    "jsonBytes": -18439506,
    "initialTableRows": 0,
    "domNodes": 0,
    "renderedTableRows": 0
  },
  {
    "page": "anomalies.html",
    "htmlBytes": -41456254,
    "jsonBytes": -41456214,
    "initialTableRows": 0,
    "domNodes": -1,
    "renderedTableRows": 0
  },
  {
    "page": "audits.html",
    "htmlBytes": -23350650,
    "jsonBytes": -23350665,
    "initialTableRows": 0,
    "domNodes": 0,
    "renderedTableRows": 0
  },
  {
    "page": "components.html",
    "htmlBytes": -41456309,
    "jsonBytes": -41456200,
    "initialTableRows": 0,
    "domNodes": -3,
    "renderedTableRows": 0
  },
  {
    "page": "epics.html",
    "htmlBytes": -41456266,
    "jsonBytes": -41456210,
    "initialTableRows": 0,
    "domNodes": -2,
    "renderedTableRows": 0
  },
  {
    "page": "graph.html",
    "htmlBytes": -41456262,
    "jsonBytes": -41456218,
    "initialTableRows": 0,
    "domNodes": -1,
    "renderedTableRows": 0
  },
  {
    "page": "history.html",
    "htmlBytes": -41456258,
    "jsonBytes": -41456216,
    "initialTableRows": 0,
    "domNodes": -1,
    "renderedTableRows": 0
  },
  {
    "page": "index.html",
    "htmlBytes": -41456262,
    "jsonBytes": -41456218,
    "initialTableRows": 0,
    "domNodes": -1,
    "renderedTableRows": 0
  },
  {
    "page": "issues.html",
    "htmlBytes": -41456322,
    "jsonBytes": -41456208,
    "initialTableRows": 0,
    "domNodes": -4,
    "renderedTableRows": 0
  },
  {
    "page": "quality.html",
    "htmlBytes": -41456200,
    "jsonBytes": -41456216,
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
| accessibility.html |         72549 |             33430278 |
| anomalies.html     |         52495 |              5741271 |
| audits.html        |         72549 |             20706758 |
| components.html    |         69339 |              3120863 |
| epics.html         |         56184 |                61667 |
| graph.html         |         54549 |             12783091 |
| history.html       |         52495 |                60274 |
| index.html         |         52495 |                77107 |
| issues.html        |         67869 |              1923358 |
| quality.html       |         72549 |              4798575 |

Assets partagés entre plusieurs pages : 74467 octets. Dossier HTML + tous les assets distribués, dédupliqués par chemin : 82188761 octets. Les empreintes et dépendances statiques par page figurent dans report.json ; les archives sans cette extension ne renseignent pas ces mesures (indisponible, jamais zéro). Aucun cache ni parsing commun entre documents indépendants n’est garanti.
