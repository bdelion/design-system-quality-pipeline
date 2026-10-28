# Benchmark synthétique load

Protocole dashboard-benchmark-v1, graine 81, fixture dashboard-load-v1, SHA-256 e98fa9b1930ec6540d17ee6d5568ea5d70ff2c228f6038f95e36cf8d50d46b15. Révision ac6d477c6ca996414cd5d55fd9b5dc659e9705b6.

Volumes : {"repositories":3,"issues":1800,"pullRequests":1500,"componentVersions":2300,"diagnostics":3000}.

Conditions : {"node":"v22.23.3","os":"win32","release":"10.0.19045","arch":"x64","cpu":"Intel(R) Core(TM) i3-4130 CPU @ 3.40GHz","logicalCpus":4,"memoryBytes":8461107200} ; navigateur {"version":"155.0.4283.62","viewport":{"width":1440,"height":900}} ; {"channel":"msedge","headless":true,"locale":"fr-FR","timezone":"UTC","workers":1,"runs":3,"warmup":1,"cache":"nouveau contexte par passage, HTTP no-store, routage local uniquement","cpuThrottle":"aucun","network":"loopback uniquement, sans compression","readiness":"DOMContentLoaded pour navigation ; load + h1 visible + fonts.ready + deux requestAnimationFrame pour résultat ; pas une mesure d’interactivité complète","capture":"désactivée","preparation":"processus Node neuf par génération ; préparation normalisation/Analytics et démarrage exclus du temps de génération ; chauffe exclue des séries"}.

Préparation : 17674.3 ms. Génération médiane 18706.8 ms, IQR 1051.3 ms.

Octets non compressés. JSON est inclus dans HTML. Lignes initiales : lignes tbody présentes dans le fichier ; DOM : tous les nœuds après disponibilité du résultat.

| Page               | HTML octets | JSON octets | Lignes initiales | Lignes rendues | Nœuds DOM | Navigation médiane/IQR ms | Résultat médiane/IQR ms | Capture ms |
| ------------------ | ----------: | ----------: | ---------------: | -------------: | --------: | ------------------------: | ----------------------: | ---------: |
| accessibility.html |    77748077 |    67407244 |             3540 |           3544 |     84656 |              3987.8/255.2 |            4679.6/390.0 | désactivée |
| anomalies.html     |    73095894 |    67407244 |             1770 |           1770 |    119387 |              6241.0/299.4 |            7238.4/373.8 | désactivée |
| audits.html        |    69935723 |    67407244 |             2360 |           2360 |     71198 |              7499.7/597.3 |            8510.6/537.2 | désactivée |
| components.html    |    70458697 |    70433476 |                0 |            230 |     37480 |             9300.0/3464.6 |          10359.0/3375.5 | désactivée |
| epics.html         |    67412613 |    67407268 |                0 |              0 |       154 |              3225.0/550.7 |            4077.1/526.8 | désactivée |
| graph.html         |    80135668 |    67407244 |             1800 |           1800 |    126561 |              9309.4/833.3 |           10432.9/758.4 | désactivée |
| history.html       |    67414901 |    67407244 |                0 |              0 |       249 |              2379.5/108.8 |             3015.3/90.6 | désactivée |
| index.html         |    67431738 |    67407244 |                6 |              6 |       447 |              2486.6/105.3 |            2959.1/206.5 | désactivée |
| issues.html        |    69262675 |    69235312 |                0 |           8880 |    267797 |              3709.2/763.3 |            8004.4/934.9 | désactivée |
| quality.html       |    72133090 |    67407244 |             3006 |           3006 |    149129 |              4188.8/240.3 |            5052.7/247.7 | désactivée |

Copies JSON exactes redondantes : 606665196 octets sur 678926764. Ne mesure pas les duplications sémantiques RAW/normalisé.

Aucune comparaison demandée.

Les durées décrivent cette machine et ce passage ; aucune limite temporelle automatique. Voir report.json pour séries brutes, quantiles et empreintes.
