# Lisibilité des tableaux sur PC — #90

**IMPLÉMENTÉ dans le patch.** Les en-têtes des panneaux de tableaux héritaient encore de la règle historique `10px ui-monospace` et de capitales forcées. Le test de régression a reproduit ce rendu avant correction sur `develop` à `c33e69b`.

## Présentation

Les en-têtes et cellules utilisent désormais la typographie courante à 14 px, avec une hauteur de ligne de 1,5. Les en-têtes restent gras et les informations secondaires passent à 12 px ; les légendes sont à 13 px. La palette et les états textuels existants sont conservés. Ces tailles sont des choix de présentation du patch, examinés sur les captures synthétiques ci-dessous ; elles ne constituent pas une nouvelle revendication de conformité.

Les colonnes ont une largeur minimale de 8 rem pour éviter les mots découpés dans les en-têtes ; les cases de sélection gardent une colonne plus étroite. Les tableaux larges défilent dans leur région existante, accessible au clavier avec focus visible. Les libellés et boutons de tri peuvent revenir à la ligne. Les identifiants longs restent sécables, sans ellipse ni masquage des preuves ; les codes DQ et identifiants techniques ciblés gardent une police monospace à 14 px.

Les colonnes d'effectifs et de délais de l'accueil, des explorateurs Activité et Composants, de la synthèse d'audits, de la répartition par criticité et des causes DQ sont alignées à droite. Les nombres utilisent des chiffres tabulaires ; une valeur et son unité existante, par exemple `1234567.8 j`, restent sur la même ligne. Les textes `Indisponible`, `inconnu` et `—` restent distincts d'un zéro mesuré : aucun remplacement, formatage métier ni calcul n'est introduit. Les périodes en jours calendaires restent celles indiquées par les titres, légendes et valeurs existants.

Le patch modifie exclusivement la feuille de style de production. Les règles de colonnes numériques ciblent les contrats de tableaux existants ; un changement ultérieur de leur ordre doit mettre à jour ces sélecteurs et leurs tests. Aucun changement de snapshot, JSON, template HTML, filtre, export ou palette n'est nécessaire.

## Revue et tests PC

`tests/browser/table-readability.spec.ts` génère une capture fictive avec un effectif à 13 chiffres, un délai important, un délai nul et une donnée inconnue. Il vérifie la typographie calculée, la conservation de ces textes, les alignements, les en-têtes longs, le tri au clavier, le focus, le défilement horizontal et axe-core. Il vérifie aussi l'absence de modification de la capture par le générateur.

| Écran PC      | Agrandissement | Accueil, nombres et unités                              | Composants, en-tête long et focus                         |
| ------------- | -------------- | ------------------------------------------------------- | --------------------------------------------------------- |
| 1 280 × 720   | 100 %          | [Capture](captures/issue-90/1280-720-100-overview.png)  | [Capture](captures/issue-90/1280-720-100-components.png)  |
| 1 280 × 720   | 200 %          | [Capture](captures/issue-90/1280-720-200-overview.png)  | [Capture](captures/issue-90/1280-720-200-components.png)  |
| 1 440 × 1 000 | 100 %          | [Capture](captures/issue-90/1440-1000-100-overview.png) | [Capture](captures/issue-90/1440-1000-100-components.png) |
| 1 440 × 1 000 | 200 %          | [Capture](captures/issue-90/1440-1000-200-overview.png) | [Capture](captures/issue-90/1440-1000-200-components.png) |

L'agrandissement automatisé applique `zoom: 2` sur le document du navigateur PC ; il ne constitue pas une validation manuelle de tous les modes de zoom de tous les navigateurs. Les captures montrent une fenêtre de consultation du tableau, dont les autres colonnes restent accessibles par défilement. Aucun scénario mobile n'est ajouté. La revue des captures et axe-core ne remplacent pas un audit RGAA manuel.

Reproduction :

```powershell
npx.cmd playwright test tests/browser/table-readability.spec.ts
npm.cmd run check:dashboard
```

Les captures sont produites dans `data/browser-results/` puis archivées dans ce dossier documentaire. Les contrôles des budgets HTML/JSON, lignes et nœuds DOM conservent la référence approuvée de #88 et le seuil de croissance de 0 % ; la taille de l'asset CSS est exposée séparément dans le benchmark.

Le [contrôle synthétique #90](benchmarks/issue-90-control.md), graine 81 et trois passages, ne présente aucun dépassement face au contrôle #88 : HTML/JSON, lignes initiales/rendues et nœuds DOM sont identiques sur les dix pages. La feuille de style passe de 30 732 à 32 562 octets (+1 830 octets), mesurés séparément des budgets validés. Aucune baseline ni aucun seuil n'est actualisé ; aucune conclusion de rapidité n'est déduite des durées de ce passage.

Validation du patch le 19/10/2026 : `npm.cmd run check:dashboard` passe avec 350 tests unitaires et 61 tests navigateur, ainsi que les contrôles IA, types, lint, TSDoc, build, format et génération TypeDoc. Seul subsiste l'avertissement TypeDoc préexistant sur `Resource`.
