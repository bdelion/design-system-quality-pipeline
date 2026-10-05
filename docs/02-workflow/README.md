# Workflow

## 1. Objectif

Ce dossier décrit les workflows du **Design System Quality Pipeline**.

La documentation distingue :

-   le **socle commun** observé pour les Issues ;
-   les **profils de workflow** nécessaires pour éviter d'appliquer les
    mêmes contraintes à tous les types de travail ;
-   les règles déjà établies ;
-   les propositions encore présentes dans les sources mais non
    validées.

Le document source historique principal est
`specifications/gh-workflow.md`.

Il contient à la fois des faits, des intentions, des TODO et des
questions. Une phrase présente dans cette source n'est donc pas
automatiquement une règle normative.

------------------------------------------------------------------------

## 2. Statuts de règle

Les pages de ce dossier utilisent les statuts suivants :

-   **ÉTABLI** : règle suffisamment validée pour être utilisée dans le
    modèle ;
-   **ACTUEL** : comportement observé aujourd'hui, sans garantie qu'il
    constitue la cible ;
-   **ORIENTATION** : fonctionnement souhaité mais pas encore
    entièrement formalisé ;
-   **À FORMALISER** : règle encore ouverte dans le registre D/Q ;
-   **PROPOSITION SOURCE** : idée présente dans
    `specifications/gh-workflow.md` mais non validée.

------------------------------------------------------------------------

## 3. Statuts Project

Les statuts identifiés sont :

``` text
Backlog
Ready
In progress
In review
Done
Blocked
Cancelled
```

Pour le workflow standard, le chemin nominal est :

``` text
Backlog
   ↓
Ready
   ↓
In progress
   ↓
In review
   ↓
Done
```

`Blocked` est un état transversal.

`Cancelled` est une sortie terminale alternative.

Les règles détaillées sont décrites dans `statuts.md`.

------------------------------------------------------------------------

## 4. Pourquoi plusieurs profils

Les contraintes ne sont pas identiques selon la nature du travail.

Exemples établis ou fortement caractérisés par les sources :

-   une Epic n'est pas portée par une branche ou une Pull Request propre
    ;
-   un Audit ne correspond pas à une modification de code et ne doit
    donc pas recevoir artificiellement une branche ou une Pull Request ;
-   une Issue standard de réalisation utilise normalement une branche et
    une Pull Request ;
-   une Release manipule explicitement des branches et une Pull Request
    de publication ;
-   une Conception suit une activité Design dont les règles de passage
    ne sont pas encore suffisamment stabilisées.

Une règle universelle telle que :

``` text
Issue Done
→ PR obligatoire
```

serait donc incorrecte.

------------------------------------------------------------------------

## 5. Profils candidats

Les profils suivants sont retenus comme **grille de consolidation** :

``` text
STANDARD
EPIC
AUDIT
RELEASE
CONCEPTION
```

Leur formalisation définitive comme profils métier reste ouverte dans
`Q-020`.

Ils sont néanmoins documentés séparément afin de rendre visibles les
différences déjà connues.

  Profil       Rôle
  ------------ ------------------------------------------------
  STANDARD     travail de réalisation suivant le flux nominal
  EPIC         regroupement cohérent de sous-Issues
  AUDIT        évaluation d'un Composant
  RELEASE      pilotage d'une publication
  CONCEPTION   travail de conception Design

------------------------------------------------------------------------

## 6. Matrice consolidée

Légende :

-   `OUI` : attendu / établi pour le profil ;
-   `NON` : explicitement non applicable ;
-   `SELON CAS` : dépend du statut ou du contexte ;
-   `OUVERT` : règle insuffisamment stabilisée.

  ----------------------------------------------------------------------------------------
  Dimension   STANDARD        EPIC           AUDIT          RELEASE           CONCEPTION
  ----------- --------------- -------------- -------------- ----------------- ------------
  Backlog /   OUI             OUI dans la    OUI pour       OUVERT            OUI dans la
  Grooming                    source         résultats                        source
                                             d'Audit ;                        
                                             Audit lui-même                   
                                             à consolider                     

  Velocity    `> 0` après     NON / non      ACTUEL : `0`   OUVERT            OUVERT
              pesée dans le   pesée dans la  dans la source                   
              nominal         source                                          

  Iteration   requise pour    SELON CAS      OUVERT         OUVERT            OUVERT
              prise en charge                                                 
              nominale                                                        

  Milestone   selon           possible       requise pour   `M.m.r`           OUVERT
              planification                  rattachement                     
                                             Version de                       
                                             conformité                       

  Branche     OUI à partir de NON            NON            branche de        OUVERT
  propre      la réalisation                                release/hotfix,   
              nominale                                      sémantique        
                                                            spécifique        

  Pull        OUI dans le     NON            NON            OUI dans le       OUVERT
  Request     traitement                                    processus de      
  propre      nominal                                       publication       
                                                            décrit            

  In review   lié à la revue  transitions    ne doit pas    processus         OUVERT
              de PR           spécifiques    être déduit    spécifique        
                              non            d'une PR                         
                              stabilisées                                     

  Done        réalisation     dépend des     doit être      processus         OUVERT
              terminée        sous-Issues,   combiné avec   spécifique        
                              règle exacte   Issue Closed                     
                              ouverte        pour Audit                       
                                             réalisé                          

  Blocked     transversal     possible       possible en    présent dans la   OUVERT
                                             principe,      source,           
                                             règle          transition exacte 
                                             détaillée non  ouverte           
                                             formalisée                       

  Cancelled   terminal        possible       non spécifié   non spécifié      non spécifié
              alternatif                                                      
  ----------------------------------------------------------------------------------------

Cette matrice ne ferme pas `Q-020`, `Q-021` ou `Q-022`.

------------------------------------------------------------------------

## 7. Règles communes suffisamment stables

### Backlog

Dans le workflow standard source :

-   label `🔎 Grooming` ;
-   Velocity vide ;
-   aucune Iteration ;
-   aucune Milestone ;
-   aucune branche ;
-   aucune Pull Request ;
-   Issue ouverte.

Ces règles constituent le fonctionnement nominal de préparation d'une
Issue standard.

Les profils spéciaux peuvent nécessiter des exceptions.

### Ready

Dans le nominal standard :

-   `🔎 Grooming` retiré ;
-   Issue pesée ;
-   aucune branche ;
-   aucune Pull Request ;
-   Issue ouverte.

L'Iteration et la Milestone relèvent de la planification.

### In progress

Dans le nominal standard, l'Issue est prise en charge et dispose des
éléments nécessaires à sa réalisation.

La source associe notamment ce statut à :

-   une Iteration ;
-   une Milestone ;
-   un assignee ;
-   une branche pour les travaux de code.

Ces exigences ne doivent pas être transposées à Epic ou Audit.

### In review

Pour le profil STANDARD, ce statut correspond à la revue de la
modification portée par Pull Request.

### Done

Pour un travail STANDARD de code, la Pull Request mergée constitue un
élément attendu de la finalisation.

Pour un Audit, la réalisation métier nécessite :

``` text
Project Status = Done
ET
GitHub Issue State = Closed
```

Il n'existe donc pas de définition universelle de `Done` indépendante du
profil.

------------------------------------------------------------------------

## 8. Blocked

`Blocked` est transversal.

La source indique qu'une Issue bloquée par une autre Issue non terminée
peut être placée en `Blocked`.

Les transitions détaillées et la manière de restaurer le statut
précédent devront être formalisées avant d'en faire une machine à états
stricte.

------------------------------------------------------------------------

## 9. Cancelled

`Cancelled` est un statut terminal alternatif.

Un cas métier est déjà établi : lorsqu'une remontée client est analysée
comme une erreur d'intégration exclusivement côté client et non comme un
défaut du Design System, l'Issue doit passer à `Cancelled`.

Les propriétés génériques interdites ou autorisées pour toute Issue
`Cancelled` restent ouvertes dans `Q-022`.

Il ne faut donc pas créer une règle DQ universelle plus forte à ce
stade.

------------------------------------------------------------------------

## 10. Réouverture

La source historique envisage qu'une Issue réouverte repasse par
`Backlog` et `Grooming`, mais formule explicitement une interrogation
sur le choix entre réouverture et création d'une nouvelle Issue.

Cette proposition n'est pas normative.

**Statut : À FORMALISER si le besoin V1 l'exige.**

------------------------------------------------------------------------

## 11. Ordre de consolidation

Les règles de workflow doivent être définies selon l'ordre :

``` text
profil
  ↓
statut
  ↓
préconditions / propriétés attendues
  ↓
relations autorisées ou interdites
  ↓
règles DQ
  ↓
indicateurs
```

La prochaine étape de M3 pourra convertir les règles stabilisées en
matrice de règles métier et DQ sans imposer les points encore ouverts.
