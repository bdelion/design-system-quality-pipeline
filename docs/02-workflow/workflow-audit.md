# Workflow AUDIT

## 1. Rôle

Le profil `AUDIT` représente l'évaluation d'un Composant dans un
contexte de Version.

Il se distingue d'un travail STANDARD parce qu'il ne correspond pas
directement à une modification du code.

------------------------------------------------------------------------

## 2. Identification

### Actuel

Une Issue d'Audit RGAA est actuellement identifiée par :

``` text
label : Audit RGAA
label : 🧩 Component:xxx
```

### Cible

L'orientation cible est :

``` text
Issue Type      : 🔍 Audit
Famille d'Audit : Accessibilité / RGAA
Composant       : exactement 1
```

La représentation technique de la famille reste ouverte.

------------------------------------------------------------------------

## 3. Composant

Une Issue d'Audit concerne exactement un Composant.

``` text
Audit ── exactement 1 Component
```

Aucun ou plusieurs labels Composant constituent une incohérence pour une
Issue d'Audit.

------------------------------------------------------------------------

## 4. Version et Milestone

La Milestone est obligatoire pour rattacher un Audit terminé à une
Version et produire un verdict de conformité versionné.

### Pré-PROD

``` text
Milestone = M.m.r
Version effectivement auditée = M.m.r-rc.n
```

L'identification précise de la RC réellement auditée reste partiellement
ouverte.

### Rattrapage

``` text
Milestone = M.m.r-Audit
Version auditée = M.m.r
```

`M.m.r-Audit` n'est pas une nouvelle Version.

------------------------------------------------------------------------

## 5. Velocity

La source historique indique :

``` text
Velocity = 0 actuellement
```

pour les Issues d'Audit.

La décision métier générale distingue explicitement :

``` text
null
0
> 0
```

Ces valeurs ne sont pas interchangeables.

La signification définitive de `0` dans tous les profils reste liée à la
formalisation de `Q-020`.

------------------------------------------------------------------------

## 6. Iteration

Le rattachement opérationnel exact d'un Audit à une Iteration n'est pas
suffisamment établi pour devenir une règle universelle.

Il ne faut pas appliquer automatiquement la règle STANDARD « In progress
exige une Iteration » aux Audits.

**Statut : À FORMALISER.**

------------------------------------------------------------------------

## 7. Branche et Pull Request

Un Audit ne constitue pas en lui-même une modification de code.

Le profil AUDIT ne doit donc pas exiger artificiellement :

``` text
branche propre
Pull Request propre
```

Les Anomalies issues de l'Audit suivent ensuite leur propre workflow de
correction et peuvent, elles, nécessiter une branche et une Pull
Request.

------------------------------------------------------------------------

## 8. Réalisation de l'Audit

Un Audit est réalisé lorsque :

``` text
Project Status = Done
ET
GitHub Issue State = Closed
```

La date de réalisation correspond à l'instant où la seconde de ces
conditions devient vraie.

Un Audit `Done` mais encore ouvert n'est pas réalisé au sens métier.

Un Audit fermé mais non `Done` n'est pas réalisé au sens métier.

------------------------------------------------------------------------

## 9. Résultats

Un Audit peut produire :

``` text
0..n Anomalies
0..n Improvements
```

Chaque Anomalie ou Improvement d'Audit appartient à exactement un Audit
parent et concerne exactement le même Composant.

Les Anomalies influencent le verdict de conformité.

Les Improvements n'influencent pas ce verdict.

------------------------------------------------------------------------

## 10. Verdict

Pour un Audit Accessibilité réalisé :

``` text
0 Anomalie
→ AUDITÉ & CONFORME

>= 1 Anomalie
→ AUDITÉ & NON CONFORME
```

La correction ultérieure des Anomalies ne modifie pas rétroactivement ce
verdict.

Une revalidation nécessite un nouvel Audit.

------------------------------------------------------------------------

## 11. Unicité d'un Audit en cours

Pour un même couple :

``` text
Composant × Version
```

il ne doit pas exister plusieurs Audits non terminés simultanément.

Un nouvel Audit en cours ne remplace pas le dernier verdict acquis tant
qu'il n'est pas lui-même `Done + Closed`.

------------------------------------------------------------------------

## 12. Matrice AUDIT

  Dimension             Règle
  --------------------- ---------------------------------------------
  Composant             exactement 1
  Milestone             obligatoire pour verdict versionné
  Velocity              `0` actuellement dans la source
  Iteration             à formaliser
  Branche propre        non
  Pull Request propre   non
  Done seul             insuffisant
  Audit réalisé         `Done + Closed`
  Anomalies             `0..n`, sous-Issues
  Improvements          `0..n`, sous-Issues
  Conformité            déduite des Anomalies lorsque Audit réalisé
  Revalidation          nouvel Audit

------------------------------------------------------------------------

## 13. Conséquence DQ

Les règles AUDIT doivent être évaluées séparément du profil STANDARD.

En particulier, l'absence de branche ou de Pull Request sur une Issue
d'Audit n'est pas une anomalie de workflow.
