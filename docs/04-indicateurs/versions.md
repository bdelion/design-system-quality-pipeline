# Indicateurs par Version

## 1. Objectif

La vue Version doit restituer ce qui était connu pour une Version donnée
sans projeter rétroactivement des Audits réalisés après sa publication.

---

## 2. Identité de Version

Le modèle distingue :

```text
Version déclarée
Version d'artefact
Version PROD
Milestone
```

Une Milestone `M.m.r-Audit` est normalisée vers la Version concernée
`M.m.r`, tout en conservant son contexte de rattrapage.

---

## 3. Components du périmètre

Le dénominateur historique doit provenir du Catalogue applicable à cette
Version.

Une modification ultérieure du Catalogue ne doit pas modifier
rétroactivement l'ancien périmètre.

Le mécanisme technique de construction de ce Catalogue historique reste
à définir.

---

## 4. Couverture

Pour une Version :

```text
Components couverts par un Audit applicable
/
Components du Catalogue applicable
```

La couverture ne signifie pas conformité.

---

## 5. Conformité

Pour une Version :

```text
Components conformes
/
Components couverts
```

Les Components non audités sont exclus du dénominateur de conformité.

---

## 6. Audit direct et verdict hérité

La vue doit pouvoir distinguer :

```text
Audit réalisé sur cette Version
```

de :

```text
verdict antérieur encore applicable
```

L'héritage ne doit pas créer fictivement un nouvel Audit historique.

---

## 7. Audit pré-PROD

Dans le fonctionnement cible :

```text
RC M.m.r-rc.n
→ Audit
→ PROD M.m.r
```

L'Audit peut contribuer à la connaissance disponible au moment de la
sortie PROD.

L'identification exacte de la RC auditée reste partiellement ouverte.

---

## 8. Audit de rattrapage

```text
PROD M.m.r
→ Audit ultérieur
```

Ce résultat enrichit la connaissance actuelle de la Version mais ne doit
pas être présenté comme connu lors de la date de publication.

---

## 9. Anomalies

La vue Version peut présenter les Anomalies issues des Audits
applicables :

- détectées ;
- traitées ;
- non traitées ;
- criticité ;
- catégorie.

Il faut conserver la distinction entre état historique à la sortie et
état de traitement actuel.

---

## 10. Score de qualité

Un score global de qualité d'une Version n'est pas encore défini.

`Q-030` reste ouverte.

Aucun taux de couverture, de conformité ou de traitement ne doit être
renommé « score qualité » sans décision métier explicite.

## Analytics V2 — Component × Version

À partir d’I6, chaque relation historique `ComponentVersion` reçoit un verdict calculé à partir des Audits terminés applicables (D-220 à D-228).

- `NON_COUVERT` : aucun Audit terminé applicable ;
- `CONFORME` : le groupe d’Audits terminés applicable ne porte aucune anomalie d’Audit et tous ses résultats objectifs sont conformes ;
- `NON_CONFORME` : au moins un Audit applicable n’est pas conforme ou une anomalie issue de ce groupe d’Audits impose une revalidation.

L’applicabilité est héritée sur les Versions PROD suivantes pour une même identité stable de Component. Lorsqu’un nouveau groupe d’Audits terminés existe sur une Version plus récente, il supersède les groupes plus anciens. Plusieurs Audits terminés visant cette même Version la plus récente sont agrégés ensemble. Un Audit plus récent mais incomplet n’interrompt pas le verdict acquis.

La fermeture ou correction d’une anomalie issue d’un Audit ne restaure jamais à elle seule la conformité : un nouvel Audit terminé applicable doit établir un nouveau verdict. Les `AuditImprovement` et anomalies `HORS_AUDIT` n’interviennent pas dans ce calcul.

Les métriques dédiées sont `componentVersion.total`, `componentVersion.covered`, `componentVersion.auditCoverage`, `componentVersion.conform`, `componentVersion.nonConform` et `componentVersion.conformityRate`. Le dénominateur du taux de conformité est exclusivement constitué des `ComponentVersion` couverts ; `NON_COUVERT` n’est jamais assimilé à `NON_CONFORME`.

Si la preuve historique est insuffisante (Catalogue historique absent/invalide ou Audit structurellement inexploitable), la fiabilité des métriques `componentVersion.*` devient `unknown` plutôt que de produire une précision artificielle.
