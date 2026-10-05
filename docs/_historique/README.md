# Documentation historique

Ce dossier conserve les documents qui ne constituent plus la référence documentaire courante du **Design System Quality Pipeline**, mais dont la conservation reste utile pour la traçabilité du projet.

## Ce qui peut être archivé ici

Un document peut être déplacé dans `_historique/` lorsqu'il a été remplacé par une documentation courante et que son contenu encore utile a été vérifié.

Exemples futurs :

- ancienne génération de documentation technique ;
- rapports ponctuels devenus historiques ;
- documents de migration ou d'inventaire arrivés à leur terme.

## Ce qui ne doit pas être archivé prématurément

Ne pas déplacer ici un document simplement parce qu'un fichier portant un sujet similaire existe dans la nouvelle arborescence.

Avant archivage, il faut vérifier que :

1. les informations encore valides sont présentes dans la documentation courante ;
2. les informations uniques utiles ont été migrées ou volontairement conservées ;
3. les contradictions éventuelles ont été identifiées ;
4. les liens vers le document ont été corrigés ;
5. le document archivé n'est plus nécessaire comme source courante.

## Statut des documents historiques

Un document présent dans ce dossier :

- n'est plus normatif ;
- ne doit pas être utilisé comme définition courante du modèle métier ou de l'architecture ;
- peut être consulté pour comprendre l'évolution du projet et l'origine d'une décision ;
- reste soumis à l'historique Git.

En cas de contradiction avec la documentation courante, la documentation courante et le registre des décisions priment pour décrire la cible actuelle.

## Organisation cible

L'organisation pourra évoluer selon les besoins. La structure envisagée est :

```text
_historique/
├── README.md
├── documentation-v1/
└── rapports/
```

Les sous-dossiers ne doivent être créés que lorsqu'un premier document doit réellement y être archivé.
