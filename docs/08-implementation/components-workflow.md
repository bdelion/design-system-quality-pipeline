# Parcours Composants sur PC (#84)

## État et périmètre

**IMPLÉMENTÉ**, 19/10/2026, depuis `develop` à `4651d2d`, après #83. Cette évolution concerne l’ergonomie PC de Composants et versions. Elle conserve les read models, calculs, identités, qualifications, tris de #65 et fonctions du tableau de #20. Les libellés des populations et leurs preuves restent le sujet distinct de #85 ; aucun effectif n’est corrigé pour rendre des compteurs égaux.

## Un seul périmètre

Repository, composant et version cible sont sélectionnés une seule fois dans le bandeau commun. L’URL constitue la source du périmètre : les liens existants, noms ou identités canoniques, chargement direct, rechargement et navigation précédente/suivante restent reconnus. Une référence inconnue reste visible et donne un résultat vide ; elle n’est pas remplacée par « tous ».

Les composants découverts par labels hors catalogue et les versions des faits restent disponibles dans ce même sélecteur. Les dimensions ciblées `issue`, `audit`, `anomaly` et `family` continuent de restreindre les preuves selon le contrat existant.

Le panneau **Affiner les résultats** contient seulement la recherche locale, les états/résultats d’audit et le choix avec/sans issues ouvertes. Ces contrôles affinent le périmètre, comme les filtres de colonnes. Le résumé unique, annoncé comme statut, présente repository, composant, version, composants visibles, sélection éventuelle et issues distinctes. Les statistiques utilisent toujours les faits du résultat ou de la sélection ; le CSV conserve son contrat et le résultat filtré/trié.

- **Effacer le périmètre** retire les dimensions partagées de l’URL ; les affinements locaux explicitement visibles restent actifs.
- **Réinitialiser la vue** retire le périmètre et les affinements locaux, vide la sélection et restaure le tri initial repository puis composant. Les indications de tri accessibles sont réinitialisées aussi.
- **Réinitialiser la sélection** revient aux statistiques de tout le résultat visible, sans modifier le périmètre.

## Résultats et aide

Le tableau suit directement les filtres et leur résumé. Les délais restent consultables après le tableau dans **Délais des issues du résultat ou de la sélection**. Les explications originales sont conservées dans **Comprendre les résultats et les liens GitHub** : approximations des recherches GitHub, différences Done/Closed/Cancelled, PR par références, version cible, résultat définitif et publication. Ces sections utilisent `details`/`summary`, activables au clavier avec Entrée ou Espace.

Les contrôles locaux reviennent à la ligne selon la largeur disponible ; le tableau conserve sa zone de défilement horizontal accessible au clavier. Aucun scénario mobile n’est ajouté.

## Cible de visibilité validée

**VALIDÉ PAR L’UTILISATEUR LE 19/10/2026**, après explication et présentation du rendu préparé : conserver le début du tableau **avant 900 px** à **1 440 × 1 000**, aide fermée. Ce seuil désigne la position verticale du haut de la table depuis le haut du document, et non la hauteur de ses lignes.

Sur le scénario synthétique de consolidation, avant modification : **1 263,64 px** ; après : **832,89 px**. Les en-têtes et le début de la première ligne sont visibles à l’ouverture. La mesure est propre à cette taille d’écran et à ce scénario, sans promesse pour une taille de police personnalisée ou une autre résolution. Le test protège l’ouverture et l’état après remise à zéro, et joint la mesure et une capture PC aux artefacts locaux Playwright.

## Validation

`tests/browser/components-workflow.spec.ts` couvre le sélecteur unique, URL et résumé, rechargement, inconnus, précédent/suivant, reset, sélection, aide au clavier et position de la table. Un agrandissement CSS à 200 % du viewport PC vérifie les contrôles, le tri au clavier, le défilement horizontal et le CSV filtré ; il ne simule pas le zoom natif du navigateur. Les scénarios existants de KPI, tri, URL ciblées et liens GitHub sont conservés en utilisant les sélecteurs uniques.

Les budgets validés de croissance nulle sur HTML/JSON/lignes/DOM restent inchangés ; le contrôle compare ce patch à #83 sans régénérer la baseline. Les mesures des assets restent distinctes des budgets, conformément au protocole existant. La validation de livraison exige `npm.cmd run check:dashboard`.

### Mesure du contrôle le 19/10/2026

Le [rapport de contrôle](benchmarks/issue-84-control.md) et ses [mesures JSON](benchmarks/issue-84-control.json) conservent trois passages et une chauffe, fixture et navigateur compatibles avec #83. Les budgets de 0 % passent : HTML Composants de 50 455 à 50 388 octets, JSON inchangé à 37 976 octets, DOM de 687 à 661 nœuds, lignes inchangées. Les neuf autres pages gardent les mêmes octets HTML/JSON et comptes de lignes/DOM. Aucun seuil temporel n’est utilisé.

Les ajustements de contrôles et de retour à la ligne ajoutent 745 octets d’assets à Composants ; son total HTML + assets passe de 119 794 à 120 472 octets. Cette évolution vise la visibilité et la cohérence du parcours, sans prétendre réduire le poids des assets. Leur mesure reste séparée des cinq métriques soumises aux budgets validés ; aucune référence n’a été remplacée.

### Validation de livraison effectuée

`npm.cmd run check:dashboard` a abouti : contrôle du kit IA, typecheck, lint, TSDoc, **331 tests unitaires**, build, **44 tests Playwright PC**, format et TypeDoc. TypeDoc conserve son avertissement préexistant sur `Resource` dans `github-requests.ts`, sans erreur. Le benchmark de contrôle avec les budgets de 0 % a également abouti. Les captures et mesures de position produites par Playwright restent dans les artefacts locaux ignorés par Git.
