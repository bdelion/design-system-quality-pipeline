# Catalogue des composants

`config/catalogue.yaml` est la référence des composants connus. Chaque entrée décrit le nom, le stream, l'équipe responsable, le statut, le niveau RGAA, les tags, les liens et l'audit éventuel.

## Ajouter un composant détecté

Lorsqu'une issue GitHub contient un label de composant qui n'existe pas encore dans le catalogue, le pipeline crée tout de même le composant avec `discoverySource: suggested` et produit une alerte `DQ-006`. Le composant n'est pas perdu : il est conservé pour permettre sa qualification.

Pour l'ajouter à la référence :

1. Relever le nom exact du composant affiché dans l'alerte ou le label GitHub, en respectant la casse utilisée par le système de design.
2. Vérifier qu'il ne figure pas déjà dans `config/catalogue.yaml`.
3. Ajouter une entrée sous `components`.
4. Renseigner les champs obligatoires et les métadonnées connues.
5. Valider le fichier avec le pipeline.
6. Relancer la collecte ou le pipeline pour que les composants détectés soient enrichis.

Exemple minimal complet :

```yaml
	- name: Tooltip
		stream: React
		owner: Communs du Dev
		squad: Plume
		status: stable
		rgaaLevel: AA
		tags:
			- feedback
			- accessibility
```

Exemple avec liens et audit :

```yaml
	- name: Select
		stream: React
		owner: Communs du Dev
		squad: Plume
		status: stable
		rgaaLevel: AA
		figmaUrl: https://figma.example.com/select
		documentationUrl: https://plume.example.com/select
		tags:
			- form
			- selection
		audit:
			frequency: quarterly
			lastAuditDate: 2026-09-01
```

Les statuts autorisés sont `stable`, `experimental`, `deprecated` et `removed`. Les fréquences d'audit autorisées sont `monthly`, `quarterly` et `yearly`. Les URLs doivent utiliser `http` ou `https`, et les dates doivent être au format `YYYY-MM-DD`.

## Valider et publier la modification

Depuis le dossier `implementation` :

```bash
npm run typecheck
npm test
npm run pipeline
```

Le pipeline recharge le catalogue, valide l'entrée et met à jour le snapshot ainsi que le dashboard. Après la relance, le composant correspondant à l'issue doit apparaître avec `discoverySource: catalogue`, ses métadonnées et la disparition de `DQ-006` pour ce composant.

## Copier la structure depuis le dashboard

Pour une alerte `DQ-006`, la page **Anomalies** affiche le bouton **Copier le YAML** dans la cible du composant. Le bouton place dans le presse-papiers une entrée YAML déjà indentée sous `components`, par exemple :

```yaml
	- name: Tooltip
		stream: TODO
		owner: TODO
		squad: TODO
		status: experimental
		rgaaLevel: TODO
		tags: []
```

Les informations connues sont reprises automatiquement. Les champs absents sont marqués `TODO` pour attirer l'attention avant validation. Après collage dans `config/catalogue.yaml`, il faut compléter ces valeurs et relancer le pipeline.

## Peut-on modifier le catalogue depuis le dashboard ?

Pas directement. Le dashboard est généré en HTML statique à partir du snapshot et fonctionne en lecture seule : il ne contient ni formulaire d'édition, ni API serveur, ni code capable d'écrire dans `config/catalogue.yaml`. Il permet uniquement de copier la structure YAML générée.

Le flux actuel est donc :

```text
Issue GitHub détectée
				↓
DQ-006 et composant suggéré
	↓
Bouton « Copier le YAML »
	↓
Collage et modification de config/catalogue.yaml
				↓
Validation et pipeline
				↓
Dashboard régénéré avec le composant catalogué
```

Une édition depuis le dashboard demanderait une évolution distincte : endpoint sécurisé d'écriture, validation côté serveur, gestion des droits, journalisation et mécanisme de commit ou de pull request. Il ne serait pas recommandé d'écrire directement dans le YAML depuis le navigateur.

## Validation

Le chargement refuse :

- une structure sans `version` ou `components` ;
- un champ obligatoire vide ;
- un statut ou une fréquence inconnue ;
- des tags qui ne sont pas des chaînes non vides ;
- une URL qui n'est pas HTTP ou HTTPS ;
- une date d'audit qui n'est pas au format ISO ;
- deux composants portant le même nom.

## Enrichissement

Lorsqu'un label GitHub correspond à un nom du catalogue, le composant normalisé reçoit ses métadonnées et `discoverySource: catalogue`. Un composant détecté dans GitHub mais absent du catalogue reçoit `discoverySource: suggested` et déclenche `DQ-006`.

Les composants présents uniquement dans le YAML ne sont pas encore instanciés dans `NormalizedData.components` : le catalogue enrichit les composants découverts par les sources, il ne simule pas une découverte GitHub.
