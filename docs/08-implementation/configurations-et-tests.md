# Configurations et tests

**IMPLÉMENTÉ.** Les conventions DSQ sont livrées dans `config/profiles/dsq.json`. Le périmètre vient d’une liste explicite de repositories ; un utilisateur n’a pas à créer un couple `system.yaml`/`catalogue.yaml` avant de collecter.

## Conventions configurables et compatibilité

**IMPLÉMENTÉ.** Le profil DSQ déclare explicitement `github.issuePolicy`, dont
`grooming.labels` et `grooming.prefixes`. Les valeurs du profil priment sur les
replis de `config/defaults/issue-policy.json`. Ces replis conservent le comportement
des anciens datasets et profils partiels ; ils ne sont plus définis en TypeScript.
Le repli historique accepte aussi les préfixes `rgaa:` et `a11y:` sans emoji,
contrairement au profil DSQ courant : cette différence est conservée volontairement.
Une liste vide désactive le matcher concerné. Un matcher explicite remplace le
matcher de repli ; les listes ne sont pas concaténées.

Pour rejouer avec des conventions personnelles, créer par exemple
`config/local/issue-policy.json` contenant un objet **IssuePolicy seul** (sans
enveloppe `github`), puis lancer :

```powershell
npm.cmd run pipeline -- --dataset datasets/mon-jeu --output data/output/mon-jeu --issue-policy config/local/issue-policy.json
```

Cette option remplace l'objet `issuePolicy` du dataset en mémoire. Pour ne changer
que Grooming tout en conservant les autres conventions personnelles, recopier
l'objet `config.github.issuePolicy` du dataset et modifier sa propriété `grooming`.
Le fichier source et son manifeste restent intacts. Les règles effectivement
appliquées sont conservées dans `normalizedData.reviewPolicy.configuration`.
Un fichier `config/local/profiles/dsq.json` n'est **pas chargé automatiquement** :
le rejeu utilise la configuration embarquée du dataset, pas un profil choisi d'après
son nom ou un fichier local implicite.

`github.accessibilityRecognition.labelAllOf` configure les fragments de qualification
explicite dans un même label ; `repositories` permet leur remplacement par repository.
`labelAnyOf` configure les fragments de simple présomption, sans remplacer les preuves
de catégorie, criticité ou relation d'audit. `labelAnyOf: []` désactive ce seul signal.
Les replis historiques sont dans `config/defaults/accessibility-recognition.json`.
Cette configuration est embarquée dans le dataset ; `--issue-policy` ne la remplace pas.

### Résultat de l'examen du code

| Zone                                                                                                  | État implémenté                                                                                            |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Classification, inférence BUG, avis auditeur, Grooming, résolution                                    | Configurables par `issuePolicy`, replis JSON de compatibilité                                              |
| Présomption `rgaa`/`a11y`, qualification `audit` + `rgaa`                                             | Configurables par `accessibilityRecognition`, replis JSON centralisés                                      |
| Types d'audit candidats dans la revue                                                                 | Utilisent `issueTypes.keywords.AUDIT` et `auditDetection.strategies`, sans alias `audit` imposé            |
| Préfixes composants/RGAA, criticités, types et statuts GitHub, milestones                             | Déjà configurables dans le profil/dataset                                                                  |
| Liens du dashboard synthétique sans règles fournies                                                   | Repli explicite sur le profil DSQ livré ; le pipeline transmet ses propres règles                          |
| Contrats historiques des anciennes fixtures                                                           | Compatibilité conservée, notamment en l'absence d'`issuePolicy` ; ce n'est pas une nouvelle convention DSQ |
| Types et états canoniques internes (`BUG`, `AUDIT`, `DONE`), preuves de correction, calcul des délais | Algorithmes et contrats métier du modèle, conservés dans le code                                           |

Cet examen porte sur les conventions de reconnaissance et leurs consommateurs ;
il ne prétend pas rendre chaque constante technique ou règle métier paramétrable.
Les dashboards consomment les faits du pipeline : schéma des sorties et présentation
inchangés. À configuration équivalente, les indicateurs doivent rester identiques ;
changer une convention personnelle peut naturellement changer les populations.

| Usage                          | Sources                                                                                   |
| ------------------------------ | ----------------------------------------------------------------------------------------- |
| Collecte personnelle           | Liste JSON, token, profil DSQ livré ; RAW et contexte dans `data/local`                   |
| Fixture personnelle            | Dossier autonome préparé contenant données, règles et manifeste                           |
| Démonstration                  | `examples/demo/dataset.json`                                                              |
| Tests unitaires et intégration | `tests/fixtures`, `tests/support`, configurations des scénarios versionnées               |
| Tests navigateur               | Snapshot de consolidation synthétique ; sorties dédiées dans `data/browser-consolidation` |

Les tests ne nécessitent pas de collecte préalable. Les références de tests ne sont pas remplacées par vos jeux personnels ; une collecte réelle ne contient pas forcément les scénarios exigés par des assertions métier. La référence V1 et les jeux de réalisme font partie des sources versionnées de tests, indépendantes de la démonstration.

`tests/fixtures/` conserve uniquement dix fichiers effectivement utilisés : les trois couples RAW/configuration/catalogue des scénarios principal (`github.json`), V1 et catalogue complet, ainsi que `my-real-dataset-anonymized.json` pour les tests d’anonymisation. Les anciens profils génériques, catalogues sans consommateur et la collecte datée inutilisée ont été supprimés. Le contrôle du profil livré porte désormais directement sur `config/profiles/dsq.json`.

`fixture:validate --dataset <dossier>` vérifie votre jeu et exécute le pipeline dans un dossier temporaire. Un résultat DQ partiel n’équivaut pas à une incohérence du format. Les tests du logiciel restent exécutés avec `npm test`, `npm run check` et `npm run check:dashboard`.

Aucun profil n’est choisi selon le nom du fichier de votre fixture. Le manifeste et le dataset voyagent ensemble ; une entrée absente ou incompatible est refusée sans repli vers la démonstration. Les helpers de tests chargent exclusivement leurs scénarios versionnés, sans accéder aux configurations personnelles ni aux variables de token.

Voir [le guide débutant](guide-utilisation.md), [le contrat des datasets et la migration](datasets.md), [l’analyse préalable](analyse-parcours-local.md) et [les quotas GitHub](quotas-github.md).
