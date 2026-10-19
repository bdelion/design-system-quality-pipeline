# Benchmark synthétique du dashboard (#81)

## Statut et périmètre

**IMPLÉMENTÉ** : générateur `dashboard-load-v1` et protocole `dashboard-benchmark-v1`, sans collecteur GitHub, RAW interne, token ni identité réelle. Les noms `benchmark/repo-N` et liens `example.invalid` sont fictifs. Les diagnostics `BENCH-SYNTHETIC` chargent les vues : ce ne sont pas des constats du moteur DQ. Aucune décision métier, notamment D-047, n'est modifiée.

| Scénario  | Dépôts | Issues |    PR | Component × Version | Diagnostics |
| --------- | -----: | -----: | ----: | ------------------: | ----------: |
| `control` |      1 |     24 |    18 |                  12 |          30 |
| `load`    |      3 |  1 800 | 1 500 |               2 300 |       3 000 |

Graine par défaut : `81`. Les dates sont fixes ; l'identifiant aléatoire du snapshot est remplacé uniquement dans le générateur de test. Relations, présences, audits et métriques passent par les couches de production. Les diagnostics sont injectés explicitement, indépendamment des erreurs que pourrait trouver le moteur DQ sur ce jeu artificiel. Le rapport enregistre volumes obtenus et empreinte SHA-256 de la capture.

## Rejouer localement

Node 22.23.3, dépendances verrouillées par `package-lock.json`, Edge installé sous Windows ; sous Linux installer Chromium avec `npx playwright install chromium`. La commande ne télécharge pas le navigateur.

```powershell
npm.cmd ci
New-Item -ItemType Directory -Force data/output/benchmarks | Out-Null
npm.cmd run benchmark:dashboard -- --scenario control --seed 81 --runs 3 --output data/output/benchmarks/control-before --screenshots
npm.cmd run benchmark:dashboard -- --scenario load --seed 81 --runs 3 --output data/output/benchmarks/load-before
```

Lancer successivement, autres tâches lourdes arrêtées. Le parent doit exister ; une sortie existante est refusée. Choisir un nom neuf à chaque essai. HTML et captures restent sous `data/output/`, ignoré par Git. La charge peut demander plusieurs minutes, beaucoup de mémoire et plusieurs centaines de Mo de disque. Chaque génération utilise un processus neuf pour éliminer les caches et allocations des passages précédents. Aucun argument ne permet de fournir un dataset privé.

Le serveur écoute `127.0.0.1` uniquement. Toute requête navigateur vers une autre origine est bloquée et invalide le passage. Aucun clic sur les liens des entités n'est effectué. Les erreurs JavaScript et réponses HTTP en erreur invalident également le passage.

## Définitions des mesures

`report.json` contient mesures brutes, empreintes et conditions ; `report.md` présente un tableau par page. Les dix pages HTML sont découvertes et triées.

- **Préparation** : normalisation/Analytics/snapshot avant génération, valeur descriptive de la chauffe.
- **Génération** : durée de `generateDashboard`, hors préparation, démarrage du processus, lecture et mesure des tailles. Une chauffe puis au moins trois passages mesurés, processus neufs ; capture et empreintes des pages doivent être identiques.
- **Navigation** : début de `goto` jusqu'à `DOMContentLoaded`.
- **Résultat disponible** : même début jusqu'à `load`, titre principal visible, polices prêtes et deux opportunités de frame. Ce n'est pas une preuve d'interactivité complète ni d'absence de tâche longue. Une optimisation asynchrone exige un état prêt observable ou une évolution du protocole à rejouer sur les deux révisions.
- **Capture** : optionnelle, viewport seulement, passage supplémentaire hors séries temporelles.

Conditions : PC headless 1 440 × 900, locale `fr-FR`, UTC, un worker, contexte neuf, service workers bloqués, HTTP sans cache ni compression, sans bridage CPU/réseau. Versions Node/navigateur, OS, CPU, mémoire, révision Git et passages sont consignés. Le système n'est pas isolé : les temps décrivent la machine, sans garantie de performance. Séries brutes, médiane, min/max, quartiles interpolés et écart interquartile (IQR) sont conservés.

Les octets HTML sont ceux des fichiers UTF-8 non compressés. Le JSON embarqué (snapshot et scripts `application/json`) est **déjà inclus** dans le HTML. Les payloads sont identifiés et hachés ; les copies exactes sont comptées au sein des pages et entre pages. Ce n'est pas une mesure de recouvrement sémantique RAW/normalisé. Les lignes initiales sont les `tr` des `tbody` du fichier HTML ; lignes rendues et visibles sont mesurées après disponibilité. Les nœuds DOM incluent document, éléments, textes et commentaires ; les éléments sont aussi comptés séparément. Le contenu d'une chaîne JSON n'est pas du DOM.

Depuis #83, l’extension additive `dashboard-resources-v1` recense aussi les JS/CSS/images. Chaque page indique les ressources locales effectivement reçues, leur taille et empreinte, `assetBytes` et `totalBytes` (HTML + assets, sans ajouter une seconde fois le JSON intégré). `resources.pages` décrit en complément les dépendances statiques HTML/JS/CSS ; `sharedAssetBytes` compte une fois les assets référencés par plusieurs pages. `distributionBytes` additionne les dix HTML et tous les fichiers du dossier assets, y compris ceux qui ne sont pas référencés. Les octets sont non compressés, sans hypothèse de cache entre documents.

Les archives #81/#82 ne contiennent pas cette extension : leurs mesures de ressources restent indisponibles, jamais supposées nulles. `directoryResources` permet de recenser un ancien dossier conservé sans le régénérer ni modifier son rapport historique. Les comparaisons et budgets existants continuent à porter sur les cinq métriques déterministes validées ; les coûts des ressources sont présentés séparément pour revue, sans inventer un nouveau budget. Voir [ADR-005](../07-decisions/ADR-005-modeles-lecture-dashboard.md) pour le choix du JSON intégré.

## Budgets et comparaison avant/après

**VALIDÉ PAR L'UTILISATEUR LE 18/10/2026** : « Alerte dès la moindre augmentation », soit **0 % de croissance**, par page sur HTML/JSON, lignes initiales/rendues et nœuds DOM, face à une baseline synthétique compatible. Le choix est enregistré dans `config/benchmark-budgets.json`. Une diminution est permise. Une augmentation attendue pour une fonctionnalité exige une revue explicite et une nouvelle baseline ; ne pas la régénérer silencieusement pour contourner un échec.

**PROPOSITION NON VALIDÉE** : accueil < 1 Mo sur la charge. La baseline actuelle empêche les régressions ; elle n'est pas un niveau de performance jugé satisfaisant. **Aucun budget temporel** n'est activé.

```powershell
npm.cmd run benchmark:dashboard -- --scenario load --seed 81 --runs 3 --output data/output/benchmarks/load-after --compare data/output/benchmarks/load-before/report.json --budgets config/benchmark-budgets.json
```

`--compare` rapporte les deltas après − avant ; `--budgets` fait échouer la commande si le budget est dépassé. Un budget `proposed` est refusé. Protocole, empreinte de capture, navigateur, viewport et pages doivent être identiques. La révision Git peut différer pour comparer une optimisation. Ne pas comparer contrôle/charge, graines, fixtures ou navigateurs différents. Garder l'ancien worktree et ses dépendances pour rejouer la référence sans les optimisations. La revue privée historique n'est pas comparable à ces résultats.

Les tests protègent graine/volumes, répétabilité des pages, UTF-8/duplications, quantiles, compatibilité et budgets. Le test PC vérifie DOM stable, lignes créées par JavaScript, captures séparées et échec HTTP. Les budgets automatiques ciblent le contrôle ; la charge reste une commande locale explicite sans seuil de temps fragile en CI.

La baseline sert aux optimisations #82, #83 et #87. Si le JSON est externalisé, étendre les mesures aux fichiers/réponses JSON externes et rejouer les deux révisions : le protocole courant mesure le JSON embarqué seulement.

## Baseline réellement mesurée le 18/10/2026

Référence de production : `ac6d477` (develop après #80), avec l'outil de cette issue. Node 22.23.3, Windows 10 x64, Intel Core i3-4130, 8 Go, Edge 155.0.4283.62. Les tâches de fond du poste ne sont pas isolées ; les temps sont descriptifs. Une chauffe et trois passages mesurés ont confirmé des empreintes de pages et comptes DOM stables. Le premier essai avec générations répétées dans un même processus a atteint la limite mémoire de Node ; le protocole livré isole chaque génération et a achevé les quatre passages de charge.

| Mesure                           | Contrôle |     Charge |
| -------------------------------- | -------: | ---------: |
| HTML accueil, octets UTF-8       |  529 408 | 67 431 738 |
| HTML cartographie, octets UTF-8  |  690 771 | 80 135 668 |
| Nœuds DOM explorateur des issues |    3 711 |    267 797 |

Sur la charge, les dix pages embarquent 678 926 764 octets JSON au total, dont 606 665 196 octets de copies exactes redondantes. La génération médiane mesurée est d'environ 18,7 s (IQR 1,1 s) ; le résultat disponible varie selon la page, environ 3 à 10,4 s de médiane. Ce sont des observations de ce poste, pas des budgets. Les captures ne sont pas activées sur la charge ; elles sont mesurées séparément sur le contrôle.

Les [résultats de charge](benchmarks/load.md), leur [rapport JSON](benchmarks/load.json), le [contrôle comparé](benchmarks/control.md) et son [rapport JSON](benchmarks/control.json) conservent les agrégats et séries brutes, sans les HTML, snapshots ni captures volumineux. La comparaison du contrôle à sa référence ne montre aucune augmentation ; le budget validé de 0 % passe. La référence des budgets automatiques est `config/benchmark-control-baseline.json` ; son remplacement exige une revue explicite. Ces mesures sont distinctes des observations privées rapportées dans la revue initiale.

## Comparaison de la source unique des espaces (#82)

**MESURÉ LE 18/10/2026** : même protocole v1, graine 81, fixture v1 et Edge 155.0.4283.62 en 1 440 × 900. Les références #81 ci-dessus sont conservées. Le rapport après correspond à `86bb800` avec le patch #82 (arbre de travail modifié, consigné dans le JSON). Les empreintes des captures et du JSON snapshot embarqué sont identiques avant/après sur la charge ; seule la seconde représentation du modèle des espaces est retirée.

| Charge : octets HTML non compressés |   Avant #82 |   Après #82 |   Réduction |
| ----------------------------------- | ----------: | ----------: | ----------: |
| Accueil                             |  67 431 738 |  41 480 874 |  25 950 864 |
| Accessibilité                       |  77 748 077 |  51 797 213 |  25 950 864 |
| Cartographie                        |  80 135 668 |  54 184 804 |  25 950 864 |
| Dix pages cumulées                  | 715 029 076 | 455 520 436 | 259 508 640 |

Chaque page retire 25 950 803 octets JSON et les 61 octets de sa balise redondante. L'accueil est réduit d'environ 38,48 %. Les dix pages conservent exactement les mêmes nombres de lignes initiales/rendues ; le DOM diminue de deux nœuds par page (script JSON et son texte), sans modification des éléments d'interface. Les budgets de 0 % passent. Aucun gain de temps n'est garanti : les durées brutes et leur dispersion sont descriptives, sur un poste non isolé ; les tests fonctionnels/compteurs protègent la parité.

Voir le [rapport de charge après #82](benchmarks/issue-82-load.md) et ses [mesures JSON avec deltas](benchmarks/issue-82-load.json). Le HTML reste volumineux et le snapshot est encore présent dans chaque page ; l'externalisation des données et la pagination ne font pas partie de ce lot.

Le [contrôle après #82](benchmarks/issue-82-control.md) et ses [mesures JSON](benchmarks/issue-82-control.json) confirment aussi le budget : 185 488 octets HTML retirés par page, accueil de 529 408 à 343 920 octets, lignes inchangées et deux nœuds DOM en moins. Les captures viewport sont mesurées séparément des passages chronométrés. Les références et budgets #81 restent inchangés ; les nouveaux tests imposent en plus l'unicité du modèle émis.

## Modèles de lecture par page (#83)

> Depuis #87, les ajouts fonctionnels de pagination et du JSON DQ ont été mesurés puis explicitement approuvés par l’utilisateur comme nouvelle référence automatique, avec un budget toujours à 0 %. Voir les [contrats et mesures de pagination](dashboard-pagination.md#mesures-synthétiques). Les rapports historiques ci-dessous conservent leurs références d’origine.

> Depuis #85, la référence automatique de contrôle a été actualisée après revue et validation explicite du coût du détail nominatif. Le budget reste à 0 %. Les mesures et baselines historiques de cette page sont conservées ; voir le [contrat des populations et la revue de coût](component-populations.md#revue-mesurée-du-coût-fonctionnel).

**MESURÉ LE 19/10/2026**, sur `3e816bb` avec le patch #83 (arbre modifié indiqué dans les rapports). Choix validé avant développement : JSON ciblé intégré, [ADR-005](../07-decisions/ADR-005-modeles-lecture-dashboard.md). Protocole v1, fixture v1, graine 81, Node 22.23.3 et Edge 155.0.4283.62 identiques aux références #82. Une chauffe et trois générations mesurées, puis navigations indépendantes sans cache. Le poste et les tâches de validation ne sont pas isolés : aucune conclusion de rapidité ni seuil de temps n’est tiré de ces séries.

| Charge : octets non compressés         | Avant #83 (après #82) |  Après #83 |
| -------------------------------------- | --------------------: | ---------: |
| HTML accueil                           |            41 480 874 |     24 612 |
| HTML accessibilité                     |            51 797 213 | 33 357 729 |
| HTML cartographie                      |            54 184 804 | 12 728 542 |
| Dix HTML cumulés                       |           455 520 436 | 82 080 169 |
| Assets distribués, une fois par chemin |                99 850 |    108 592 |
| Dix HTML + assets distribués           |           455 620 286 | 82 188 761 |

L’accueil de charge utilise 52 495 octets d’assets, soit 77 107 octets HTML + assets. Sur le contrôle, son HTML passe de 343 920 à 11 078 octets ; le dossier complet passe de 4 074 264 à 1 043 737 octets. Le lecteur et la validation ajoutent du JavaScript : les assets partagés passent de 69 410 à 74 467 octets ; les modules inutiles retirés de chaque page et surtout la réduction des données font baisser le coût total. Ces valeurs sont exposées séparément, sans changer le périmètre des budgets validés.

L’[inventaire avant migration](benchmarks/issue-83-before-resources.json) a été mesuré sur les fichiers conservés de `3e816bb`, sans réécriture des archives #81/#82. Son coût statique des assets, indépendant du scénario, est additionné aux HTML de charge archivés pour calculer le total avant ci-dessus ; ce n’est pas une série réseau historique reconstituée. Les rapports après incluent les ressources réellement reçues par chaque navigation ainsi que les dépendances statiques et leurs empreintes.

Les budgets de croissance nulle passent sur contrôle et charge, par comparaison aux rapports #82 : lignes initiales/rendues identiques, DOM stable ou réduit. Les références #81 et la baseline automatique ne sont pas remplacées. L’ajout de la balise JSON est compensé par le retrait d’un nœud texte d’espacement et des modules hors parcours, sans modification des contrôles visibles. Les tests protègent contrats, immuabilité, échappement, erreurs, qualifications et parité KPI/filtres/liens/CSV.

Voir [contrôle #83](benchmarks/issue-83-control.md), [JSON contrôle](benchmarks/issue-83-control.json), [charge #83](benchmarks/issue-83-load.md) et [JSON charge](benchmarks/issue-83-load.json). Les copies JSON exactement identiques entre pages disparaissent ; cela ne prouve pas l’absence de redondance sémantique. Les synthèses par contexte et les tableaux statiques restent volumineux, notamment en accessibilité : aucune pagination ni taille maximale universelle n’est garantie. La cible accueil < 1 Mo reste une proposition générale, même si ce jeu synthétique est désormais inférieur à cette valeur.
