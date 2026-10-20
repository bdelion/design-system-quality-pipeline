# Benchmark synthétique control

Protocole dashboard-benchmark-v1, graine 81, fixture dashboard-load-v1, SHA-256 92944855a6f1de050e2677f17b19cd8200242ca557a18e90e8a8f15318e46597. Révision 8563654f11589fb530de89e8f41dc69d019bfa9b.

Volumes : {"repositories":1,"issues":24,"pullRequests":18,"componentVersions":12,"diagnostics":30}.

Conditions : {"node":"v22.23.3","os":"win32","release":"10.0.19045","arch":"x64","cpu":"Intel(R) Core(TM) i3-4130 CPU @ 3.40GHz","logicalCpus":4,"memoryBytes":8461107200} ; navigateur {"version":"155.0.4283.62","viewport":{"width":1440,"height":900}} ; {"channel":"msedge","headless":true,"locale":"fr-FR","timezone":"UTC","workers":1,"runs":3,"warmup":1,"cache":"nouveau contexte par passage, HTTP no-store, routage local uniquement","cpuThrottle":"aucun","network":"loopback uniquement, sans compression","readiness":"DOMContentLoaded pour navigation ; load + h1 visible + fonts.ready + deux requestAnimationFrame pour résultat ; pas une mesure d’interactivité complète","capture":"désactivée","preparation":"processus Node neuf par génération ; préparation normalisation/Analytics et démarrage exclus du temps de génération ; chauffe exclue des séries"}.

Préparation : 76.6 ms. Génération médiane 220.1 ms, IQR 69.2 ms.

Octets non compressés. JSON est inclus dans HTML. Lignes initiales : lignes tbody présentes dans le fichier ; DOM : tous les nœuds après disponibilité du résultat.

| Page               | HTML octets | JSON octets | Lignes initiales | Lignes rendues | Nœuds DOM | Navigation médiane/IQR ms | Résultat médiane/IQR ms | Capture ms |
| ------------------ | ----------: | ----------: | ---------------: | -------------: | --------: | ------------------------: | ----------------------: | ---------: |
| accessibility.html |      308817 |      171448 |               42 |             46 |      1689 |               922.2/676.4 |            1031.2/674.5 | désactivée |
| anomalies.html     |       81311 |         230 |               21 |             21 |      1882 |                 205.1/6.2 |               285.2/7.6 | désactivée |
| audits.html        |      173369 |      118067 |               30 |             30 |      1522 |                261.7/15.6 |              327.5/10.7 | désactivée |
| components.html    |       50565 |       37976 |                0 |              4 |       657 |                221.9/34.5 |              333.5/55.8 | désactivée |
| epics.html         |        5461 |         258 |                0 |              0 |       143 |                150.7/23.0 |              241.6/30.5 | désactivée |
| graph.html         |      172341 |         226 |               24 |             24 |      1833 |                288.0/31.5 |              366.2/37.0 | désactivée |
| history.html       |        7633 |         228 |                0 |              0 |       235 |                 173.6/4.6 |              242.9/15.6 | désactivée |
| index.html         |       10841 |         226 |                2 |              2 |       324 |                197.3/27.6 |              257.8/24.8 | désactivée |
| issues.html        |       41324 |       24120 |                0 |             50 |      2375 |                317.5/15.5 |              471.3/30.3 | désactivée |
| quality.html       |      121284 |       10234 |               62 |             62 |      3977 |                340.7/50.0 |              509.4/85.0 | désactivée |

Copies JSON exactes redondantes : 0 octets sur 363013. Ne mesure pas les duplications sémantiques RAW/normalisé.

Aucune comparaison demandée.

Les durées décrivent cette machine et ce passage ; aucune limite temporelle automatique. Voir report.json pour séries brutes, quantiles et empreintes.

## Ressources locales

JSON déjà inclus dans HTML. Assets utilisés mesurés sur une navigation sans cache ; imports communs comptés une seule fois par page.

| Page               | Assets octets | HTML + assets octets |
| ------------------ | ------------: | -------------------: |
| accessibility.html |         77474 |               386291 |
| anomalies.html     |         59510 |               140821 |
| audits.html        |         79925 |               253294 |
| components.html    |         76952 |               127517 |
| epics.html         |         63199 |                68660 |
| graph.html         |         61564 |               233905 |
| history.html       |         59510 |                67143 |
| index.html         |         59510 |                70351 |
| issues.html        |         81819 |               123143 |
| quality.html       |         97762 |               219046 |

Assets partagés entre plusieurs pages : 82156 octets. Dossier HTML + tous les assets distribués, dédupliqués par chemin : 1113971 octets. Les empreintes et dépendances statiques par page figurent dans report.json ; les archives sans cette extension ne renseignent pas ces mesures (indisponible, jamais zéro). Aucun cache ni parsing commun entre documents indépendants n’est garanti.
