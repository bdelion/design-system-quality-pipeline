# Spécifications et sources de cadrage

Le dossier `specifications/` conserve les **sources métier, demandes initiales, analyses et matériaux de conception** utilisés pour construire la documentation du **Design System Quality Pipeline**.

Il complète `docs/`, mais ne constitue pas une seconde documentation normative concurrente.

## Rôle du dossier

Les fichiers présents ici permettent notamment de :

- conserver la formulation d'origine des besoins ;
- préserver la provenance d'une règle ou d'un indicateur ;
- retrouver les hypothèses et analyses ayant précédé une décision ;
- comparer une demande initiale avec le modèle finalement retenu.

Une information présente dans `specifications/` n'est pas automatiquement une règle métier établie.

Les décisions validées et le modèle consolidé doivent être reflétés dans `docs/`.

## Catégories actuelles

### Sources métier principales

`gh-workflow.md`

Décrit le fonctionnement GitHub et les workflows observés ou souhaités. Ce fichier reste une source métier importante tant que son contenu n'a pas été complètement consolidé dans `docs/02-workflow/` et `docs/03-regles/`.

`indicateurs-souhaites.md`

Recense les indicateurs souhaités, contraintes, règles et demandes client. Ce fichier reste une source métier importante tant que son contenu n'a pas été complètement consolidé dans `docs/04-indicateurs/` et les documents métier associés.

### Analyses et propositions de conception

Les fichiers suivants correspondent à des analyses, revues ou propositions produites pendant la conception :

- `chatgpt-restructuration-repo.md` ;
- `chatgpt-workflow-indicateurs-review.md` ;
- `copilote-retours-20261004.md` ;
- les fichiers actuellement présents sous `save/`.

Ils peuvent contenir des idées utiles, mais ne doivent pas être interprétés isolément comme des décisions validées.

Ils ont vocation à être déplacés ultérieurement dans un espace historique après vérification que leurs informations utiles ont été intégrées ou explicitement écartées.

## Relation avec `docs/`

La règle générale est :

```text
Besoin / source / matériau d'origine
              ↓
       specifications/
              ↓
     analyse et décisions
              ↓
            docs/
              ↓
     modèle courant consolidé
```

`docs/00-cadrage/questions-ouvertes.md` assure la traçabilité des décisions `D-xxx` et questions `Q-xxx`.

Les documents thématiques sous `docs/01-metier/` à `docs/08-implementation/` doivent progressivement devenir suffisants pour comprendre le modèle courant sans devoir reconstruire celui-ci à partir des anciennes analyses.

## Politique de migration

Un fichier de spécification ou d'analyse ne doit pas être supprimé ou déplacé simplement parce que son sujet apparaît dans `docs/`.

Avant son archivage :

1. identifier les informations qu'il apporte ;
2. vérifier lesquelles sont toujours valides ;
3. vérifier leur présence dans la documentation courante ;
4. migrer les informations utiles manquantes ;
5. signaler les contradictions ou décisions non résolues ;
6. seulement ensuite classer le document comme historique.

## Cible future

Après consolidation, une organisation de ce type pourra être utilisée :

```text
specifications/
├── README.md
├── sources/
│   ├── gh-workflow.md
│   └── indicateurs-souhaites.md
└── _historique/
    ├── analyses-chatgpt/
    └── analyses-copilote/
```

Cette structure est une cible de rangement, pas une instruction de déplacement immédiat.

Tant que la migration documentaire n'est pas terminée, les fichiers restent à leur emplacement actuel afin d'éviter toute perte de contexte ou de contenu.
