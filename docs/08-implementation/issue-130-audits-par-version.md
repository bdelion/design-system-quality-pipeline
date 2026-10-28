# Audits par version — correction et réconciliation #130

## Résultat corrigé : primauté des audits applicables

**CONFIRMÉ PAR L’UTILISATEUR ET IMPLÉMENTÉ — 28 octobre 2026.** Le verdict de
`Component × Version` vient de ses audits terminés applicables, conformément à
D-223/D-227/D-228. Le code qui remplaçait ce verdict par NON_CONFORME à cause
d’autres anomalies est supprimé. Ces anomalies et leurs réserves restent visibles.

Après réintégration déclarative de DateBox, regroupement confirmé de A11yProvider
et A11yRegion en une identité métier Live Zone, puis recalcul, `1.7.1` compte
**11 composants conformes, 15 non conformes et 50 non couverts : 76 au total**.
Les 11 conformes sont Button, Input, Label, LinkButton, Live Zone, MediaCard, MultiButton,
NumberInput, StringFormFragment, Tabs et Tag. Button, Input, NumberInput et
StringFormFragment étaient exclus à tort par la surcharge des défauts hors audit.

Les ratios deviennent **11/26 (42,31 %)** et **11/76 (14,47 %)**.
Les 12 sans BUG RGAA déclaré restent une autre population : Radio possède un
BUG reconnu par inférence dans son audit. Live Zone est désormais reconnu dans
le catalogue et les 11 résultats d’audit conformes concernent bien 11 composants
métier présents. Le résultat intermédiaire 10/77, avant regroupement, est remplacé.
Les preuves Excel de A11yProvider et A11yRegion ont des présences identiques depuis
`1.3.0` ; leurs deux cellules sont conservées dans chaque observation du groupe.
Le fichier local `live-zone-grouping-declaration.yaml` consigne la confirmation
utilisateur. Le rejeu final est dans `data/output/audit-precedence-live-zone/`.

La section suivante conserve le diagnostic de l’ancienne capture pour expliquer
le défaut de calcul ; ses 6/24/46 ne sont plus les résultats du pipeline corrigé.

## Historique du diagnostic initial

**CORRECTION DU RÉFÉRENTIEL — 28 octobre 2026.** Les chiffres ci-dessous décrivent
la capture initiale, pas une validation de son catalogue. L’exclusion de DateBox
était une erreur de sélection confirmée par l’utilisateur. Une présence déclarée
depuis `0.0.2`, sans fausse cellule Excel, est ajoutée au référentiel local avec
la référence `datebox-presence-20261028`. Le rejeu dans
`data/output/datebox-declaration/` comporte désormais **77 composants** en `1.7.1`.
Les discussions sur les verdicts d’AnchorDialog et Tooltip restent distinctes
de cette correction de présence ; la réconciliation arithmétique initiale ne
constitue pas une validation de ces verdicts.

**IMPLÉMENTÉ.** Les répartitions commencent sur **Total décroissant**. La colonne
existante `Restant` est nommée **Reste à faire** : elle compte les corrections non
confirmées dont les statuts sont connus, hors annulations. Réalisé exige Done et
une PR fusionnée. Les inconnues restent dans une colonne distincte ; Total n’est
donc pas toujours la somme Reste à faire + Réalisé.

## Navigation GitHub

Les labels communs accidentels, notamment Grooming, ne sont plus utilisés pour
fabriquer les liens de la page. Les répartitions retiennent seulement les labels
sources de leur dimension : criticité, critère ou composant. Aucun changement de
qualification métier des issues Grooming n’est appliqué.

Quand une vue Project est configurée, un filtre `parent-issue` sélectionne les
audits parents observés de la version, combiné au label de la dimension. Aucun
filtre Done n’est imposé à toutes les anomalies. Les parents explicites sont
utilisés plutôt qu’une recherche fictive sur la milestone du parent :
[GitHub documente le filtre Parent issue dans Projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects/understanding-fields/about-parent-issue-and-sub-issue-progress-fields).

Sans vue Project exploitable, le lien ouvre une recherche par label dans le
repository, signalée comme élargie. La liste locale et son CSV restent les preuves
exactes de la version et du traitement. `milestone:` filtre la milestone de
l’issue recherchée, pas celle de son parent ; ce filtre ne peut pas remplacer le
lien parent : [documentation GitHub](https://docs.github.com/en/issues/using-labels-and-milestones-to-track-work/filtering-issues-and-pull-requests-by-milestone).

## Réconciliation de la capture fournie

Le snapshot initial conservé dans
`data/output/20261027-0743-anonymise/runs/snapshot-20261028075208202-6ddd13b8.json`,
capturé le 28 octobre, reproduit exactement les nombres de l’issue pour `1.7.1`.
Il comporte les relations historiques absentes du premier diagnostic du 27 octobre.
Les sources du dataset et le snapshot ont été lus sans modification.

| Lecture                     | Valeur | Ce qui est compté                                                                |
| --------------------------- | -----: | -------------------------------------------------------------------------------- |
| Catalogue historique        |     76 | Identités de composants présents dans cette version                              |
| Verdict conforme cumulé     |      6 | Composants du catalogue conformes selon les règles métier                        |
| Verdict non conforme cumulé |     24 | Composants du catalogue, y compris anomalies non levées hors audit               |
| Non couvert                 |     46 | Composants sans verdict conforme/non conforme établi                             |
| Audits de la version        |     29 | Issues d’audit, pas la taille du catalogue                                       |
| Audits terminés             |     26 | Issues dont la progression est terminée                                          |
| Sans BUG RGAA déclaré       |     12 | Composants des audits terminés sans enfant de type BUG explicite avec label RGAA |
| Avec BUG RGAA déclaré       |     14 | Composants des audits terminés avec au moins un tel enfant                       |

La lecture stricte reste distincte du verdict métier conformément à **D-246**.
Il n’est pas correct de remplacer les 6 conformes par les 12 sans déclaration :

- 6 des 12 sont conformes métier : Label, LinkButton, MediaCard, MultiButton, Tabs, Tag ;
- 5 sont non conformes métier : Button, Input, NumberInput, Radio et StringFormFragment.
  Les quatre premiers hors Radio portent notamment des anomalies hors audit non levées ;
  Radio possède un enfant reconnu par inférence, absent de la sélection par type BUG explicite ;
- Live Zone est le douzième : son audit est terminé mais son composant n’appartient
  pas au catalogue historique de `1.7.1`.

Les ratios métier restent donc **6/26** et **6/76**. Un ratio 12/26 mesurerait une
autre chose : la lecture déclarative, incluant ici un composant hors catalogue.
Ces ratios décrivent l’ancien calcul ; ils sont remplacés par les résultats corrigés ci-dessus.

### Pourquoi 30 verdicts alors que 29 audits, dont 26 terminés ?

Les 29 audits concernent 29 composants distincts dans cette capture :

- 27 appartiennent au catalogue ; DateBox et Live Zone sont hors catalogue ;
- parmi ces 27, RadioGroup reste non couvert (audit en cours) ;
- les 26 autres ont un verdict conforme ou non conforme ; Form est non conforme
  malgré son audit en cours, à cause d’anomalies non levées ;
- 4 autres composants ont un verdict non conforme sans audit de cette version :
  AnchorDialog, CollapsibleDialog, InputPagination et Tooltip, via les anomalies
  qui leur sont rattachées.

On obtient donc **29 − 2 − 1 + 4 = 30** composants avec verdict.
La partition du catalogue est bien **6 + 24 + 46 = 76**. L’addition 29 + 46 ne
constitue pas une partition, car elle mélange des issues d’audit et des verdicts
de composants ; aucun composant n’est perdu dans ce calcul.

Les 24 non conformes cumulés et les 14 avec BUG déclaré ne sont pas interchangeables :
les 14 appartiennent au groupe des composants audités terminés, tandis que les
24 comprennent aussi des réserves hors audit, des anomalies inférées et des
composants sans audit de cette version. Ici, **24 = 14 + 5 + 1 + 4** : 14 avec BUG
déclaré, 5 sans BUG déclaré mais non conformes métier, Form (audit en cours),
et 4 sans audit de cette version. Les preuves locales détaillent chaque
population sans aligner artificiellement les totaux.

Les sorties détaillées de ce diagnostic sont conservées localement dans
`data/output/issue-130/`, sans versionner les données de la capture.
