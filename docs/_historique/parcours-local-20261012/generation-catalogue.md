> HISTORIQUE : parcours remplace le 12 octobre 2026. Voir [le parcours courant](../../08-implementation/datasets.md).

# Générer un brouillon de catalogue depuis le RAW

**IMPLÉMENTÉ.** `catalogue:generate` extrait un inventaire de noms observés dans un fichier RAW local, sans token, accès réseau ni catalogue source. Il produit un **brouillon à compléter**, pas un catalogue métier validé.

```powershell
npm.cmd run catalogue:generate -- --input data/raw/collecte.json --output config/local/catalogue.brouillon.yaml
```

Les deux chemins sont obligatoires. Le dossier parent de sortie est créé si nécessaire. Un fichier existant n’est jamais écrasé, y compris le RAW d’entrée : choisir un autre nom de sortie. La console affiche uniquement le nombre de composants, le chemin et le besoin de complétion.

Le préfixe par défaut est `Component:`. Pour des labels différents :

```powershell
npm.cmd run catalogue:generate -- --input data/raw/collecte.json --output config/local/catalogue.brouillon-widget.yaml --component-prefix "Widget:"
```

## Sources et limites

La commande lit un RAW, pas un snapshot ni une réponse API GitHub non transformée. Elle valide les champs utilisés et refuse leur forme invalide. Les anciens RAW peuvent omettre les catalogues historiques.

| Source RAW                           | Observation conservée                                                      |
| ------------------------------------ | -------------------------------------------------------------------------- |
| `catalogueComponents`                | Nom déclaré, sans association déduite à un repository                      |
| `issues[].component`                 | Nom, repository et numéro d’issue                                          |
| `issues[].labels`                    | Nom après un préfixe placé au début du label, repository et numéro d’issue |
| `historicalCatalogues[]` disponibles | Nom, repository et tag exact                                               |

La casse du préfixe est ignorée, les noms sont nettoyés de leurs espaces de début/fin, puis dédupliqués et triés. Deux noms de casse différente restent distincts. Les preuves identiques ne sont conservées qu’une fois. Les titres, corps, URLs et autres textes d’issues ne sont pas recopiés.

L’union inclut les noms historiques : leur présence ne prouve pas que le composant existe encore dans la version courante. Les catalogues historiques manquants ou invalides ne fournissent aucune preuve. L’absence de nom dans le RAW ne prouve pas l’absence du composant dans le Design System. `catalogueComponents` peut provenir du catalogue utilisé lors de la collecte ; ce champ n’est pas un inventaire indépendant de ce catalogue.

## Compléter avant utilisation

Chaque entrée contient `name`, les métadonnées à `null`, une liste `repositories` avec les noms complets et une liste `evidence` décrivant les observations. `repository` contient le nom simple uniquement lorsqu’un seul repository est observé ; sinon il reste à `null`, même si le RAW ne contient qu’un repository.

Renseigner depuis les sources métier fiables :

- `stream`, `owner`, `squad` et `rgaaLevel` : chaînes non vides ; le propriétaire GitHub n’est pas automatiquement le responsable métier du composant ;
- `status` : `stable`, `experimental`, `deprecated` ou `removed`, après vérification ;
- `tags` : liste de chaînes, éventuellement vide si cette absence est confirmée ;
- `repository` : association vérifiée, particulièrement pour les composants présents dans plusieurs repositories. Supprimer ce champ si aucune association n’est établie.

Vérifier les composants historiques, les homonymes et les associations issues des labels avant de conserver une entrée. Pour constituer le catalogue final, conserver `version` et les entrées métier de `components` ; retirer `draft`, `collectedAt`, `repositories` et `evidence`. Garder le brouillon séparément si sa provenance est utile. Les métadonnées inconnues ne doivent pas être remplacées arbitrairement pour satisfaire le validateur.

Le validateur refuse un fichier marqué `draft: true`, même vide. Après retrait de ce marqueur, les champs obligatoires laissés à `null` restent refusés. Une fois le fichier complété et revu, le vérifier avec la configuration système correspondante :

```powershell
npm.cmd run validate -- --fixture data/raw/collecte.json --system-config config/system.yaml --catalogue-config config/local/catalogue.complete.yaml
```

Cette validation contrôle les configurations et le périmètre ; elle ne confirme pas les métadonnées métier. Le catalogue complété peut ensuite servir au [rejeu local du pipeline](../../08-implementation/guide-utilisation.md) ou à la [préparation des références](../../08-implementation/preparation-references.md). Les noms et repositories réels restent sensibles : placer le brouillon dans `config/local/`, ignoré par Git, et utiliser les scripts d’anonymisation avant partage.
