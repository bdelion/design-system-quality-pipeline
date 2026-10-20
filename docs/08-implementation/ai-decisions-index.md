# Index de recherche des décisions et questions

Index non normatif généré depuis le registre. Rechercher le titre ou l’ID, puis lire
le texte source et son statut. Les lignes sont indicatives ; régénérer cet index
après toute modification du registre avec `npm run ai:index:update`.

Source : `docs/00-cadrage/questions-ouvertes.md` depuis la racine.

| Ligne initiale | Titre                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| 40             | D-001 — Repository et Librairie                                                                               |
| 58             | D-002 — Librairie et Package                                                                                  |
| 76             | D-003 — Package et Version                                                                                    |
| 89             | D-004 — Version déclarée dans `package.json`                                                                  |
| 119            | D-005 — Version SNAPSHOT                                                                                      |
| 144            | D-006 — Release Candidate                                                                                     |
| 164            | D-007 — Hotfix Candidate                                                                                      |
| 184            | D-008 — Production PROD depuis une release                                                                    |
| 206            | D-009 — Production PROD depuis un hotfix                                                                      |
| 226            | D-010 — Caractéristiques d'une Version PROD                                                                   |
| 243            | D-011 — Nexus ne contient pas uniquement des Versions PROD                                                    |
| 260            | D-012 — Audit cible avant PROD                                                                                |
| 280            | D-013 — Milestone des Audits pré-PROD                                                                         |
| 292            | D-014 — Milestone `M.m.r-Audit`                                                                               |
| 308            | D-015 — Contenu d'une Milestone d'Audit de rattrapage                                                         |
| 320            | D-016 — Traitement des Anomalies découvertes lors d'un Audit                                                  |
| 340            | D-017 — Temporalité des Audits                                                                                |
| 364            | D-018 — Identification actuelle d'une Issue d'Audit RGAA                                                      |
| 377            | D-019 — Identification cible d'une Issue d'Audit                                                              |
| 391            | D-020 — Nature et famille d'Audit                                                                             |
| 406            | D-021 — Composant non audité                                                                                  |
| 422            | D-022 — Couverture et conformité                                                                              |
| 444            | D-023 — Vélocité vide et vélocité zéro                                                                        |
| 458            | D-024 — Criticité                                                                                             |
| 473            | D-025 — Anomalie et Amélioration                                                                              |
| 481            | D-026 — Version déclarée et Version d'artefact                                                                |
| 505            | D-027 — Famille actuelle d'Audit                                                                              |
| 515            | D-028 — Fin d'un Audit                                                                                        |
| 529            | D-029 — Conformité déduite de l'Audit                                                                         |
| 549            | D-030 — Classification des sub-Issues d'un Audit d'Accessibilité                                              |
| 576            | D-031 — Catégories Accessibilité des Anomalies d'Audit                                                        |
| 603            | D-032 — Criticité RGAA d'une Anomalie d'Audit                                                                 |
| 625            | D-033 — Référentiel de criticité partagé avec l'auditeur                                                      |
| 643            | D-034 — Orientation de catégorisation des Améliorations d'Audit                                               |
| 664            | D-035 — Absence d'impact des Améliorations sur la conformité                                                  |
| 686            | D-036 — Revue de l'auditeur dans la Definition of Done d'une Anomalie                                         |
| 700            | D-037 — Hypothèse de clôture d'une Anomalie après merge de la PR                                              |
| 716            | D-038 — Revalidation de conformité par une nouvelle Issue d'Audit                                             |
| 744            | D-039 — Distinction entre correction et conformité                                                            |
| 764            | D-040 — Déclenchement collectif de l'Audit de revalidation                                                    |
| 783            | D-041 — Nouvelles Anomalies lors d'un Audit de revalidation                                                   |
| 805            | D-042 — Absence de lien direct entre Anomalies successives                                                    |
| 827            | D-043 — Continuité des Audits d'un Composant sans relation directe                                            |
| 851            | D-044 — Conformité historisée par Composant et Version                                                        |
| 866            | D-045 — Séparer le verdict d'Audit et l'état des corrections                                                  |
| 876            | D-046 — Dernier Audit comme état de conformité courant                                                        |
| 904            | D-047 — Date de réalisation d'un Audit                                                                        |
| 921            | D-048 — Un Audit en cours ne remplace pas le dernier verdict acquis                                           |
| 949            | D-049 — Séparer conformité courante et activité d'Audit en cours                                              |
| 976            | D-050 — Unicité de l'Audit non terminé par Composant et Version                                               |
| 993            | D-051 — Version auditée obligatoire                                                                           |
| 1007           | D-052 — Milestone comme référence de Version et Version auditée dans le template                              |
| 1046           | D-053 — Cohérence entre Milestone et Version auditée                                                          |
| 1079           | D-054 — Milestone prioritaire et Version auditée complémentaire                                               |
| 1099           | D-055 — Milestone obligatoire et bloquante pour la conformité                                                 |
| 1123           | D-056 — Audit sans Milestone comptabilisé dans l'activité                                                     |
| 1145           | D-057 — Un Audit n'est pas nécessairement requis à chaque Version                                             |
| 1167           | D-058 — Héritage d'un Audit lorsque le Composant est inchangé                                                 |
| 1197           | D-059 — État des lieux des Composants entre deux Versions                                                     |
| 1216           | D-060 — La décision d'ouvrir un Audit reste à la Squad                                                        |
| 1230           | D-061 — Comparaison des Composants reportée à une évolution ultérieure                                        |
| 1242           | D-062 — Cible d'automatisation de la comparaison entre tags                                                   |
| 1261           | D-063 — Restitution future des évolutions de Composants dans le Dashboard                                     |
| 1273           | D-064 — Couverture d'Audit calculée sur le Catalogue de Composants                                            |
| 1304           | D-065 — Taux de conformité calculé uniquement sur les Composants audités                                      |
| 1335           | D-066 — Catalogue historique propre à chaque Version                                                          |
| 1362           | D-067 — Décommissionnement logique d'un Composant dans le Catalogue                                           |
| 1388           | D-068 — Réactivation exceptionnelle d'un Composant explicitée dans le Catalogue                               |
| 1402           | D-069 — Distinguer Audit réalisé sur une Version et couverture héritée                                        |
| 1430           | D-070 — La couverture peut inclure un verdict antérieur non conforme                                          |
| 1444           | D-071 — Héritage transitif d'un verdict d'Audit applicable                                                    |
| 1476           | D-072 — Une évolution de Composant ne rompt pas automatiquement le verdict applicable                         |
| 1503           | D-073 — Qualification par la Squad de l'impact d'une évolution sur le besoin d'Audit                          |
| 1517           | D-074 — Page cible de suivi du patrimoine pour la Squad                                                       |
| 1534           | D-075 — États de qualification d'une évolution vis-à-vis d'un Audit                                           |
| 1570           | D-076 — Un nouveau Composant doit être audité avant sa mise à disposition                                     |
| 1599           | D-077 — État `AUDIT RÉALISÉ` dans le suivi du patrimoine                                                      |
| 1616           | D-078 — Le verdict de conformité prime dans la restitution qualité                                            |
| 1647           | D-079 — Les corrections ne remplacent pas le verdict de conformité                                            |
| 1657           | D-080 — Taux de traitement des Anomalies distinct du verdict                                                  |
| 1671           | D-081 — Une Anomalie est traitée lorsqu'elle est Done et Closed                                               |
| 1689           | D-082 — Le suivi du traitement porte sur le stock historique d'Anomalies du Composant                         |
| 1703           | D-083 — Taux historique de traitement des Anomalies d'un Composant                                            |
| 1739           | D-084 — Affichage du stock restant d'Anomalies                                                                |
| 1756           | D-085 — Répartition du stock restant par criticité RGAA                                                       |
| 1781           | D-086 — Taux de traitement par criticité RGAA                                                                 |
| 1811           | D-087 — Agrégation du suivi des Anomalies au niveau de la Librairie                                           |
| 1843           | D-088 — Vue latest : stock historique pertinent du patrimoine actif                                           |
| 1860           | D-089 — Consultation des indicateurs par Version de Librairie                                                 |
| 1884           | D-090 — Une vue historique de Version restitue l'état à sa date de sortie                                     |
| 1911           | D-091 — La photographie d'une Version PROD reste immuable après sa sortie                                     |
| 1923           | D-092 — Une Milestone de Version PROD close ne reçoit pas rétroactivement de nouvelles Anomalies              |
| 1951           | D-093 — Une Milestone d'Audit post-PROD porte le contexte de la Version affectée                              |
| 1981           | D-094 — Un Bug hors périmètre accessibilité renseigne obligatoirement sa Version affectée dans sa description |
| 1995           | D-095 — Un Bug hors accessibilité peut affecter plusieurs Versions                                            |
| 2027           | D-096 — Distinguer Version observée et Version affectée pour une remontée client                              |
| 2057           | D-097 — Une erreur d'implémentation client impose l'état Cancelled                                            |
| 2074           | D-098 — Suivre séparément les erreurs d'intégration client dans la vue Squad                                  |
| 2101           | D-099 — Ventiler les erreurs d'intégration client par Composant                                               |
| 2128           | D-100 — Mettre en perspective les Issues d'un Composant avec son niveau d'usage                               |
| 2140           | D-101 — Mesurer le nombre total d'Issues par Composant                                                        |
| 2150           | D-102 — Mesurer le nombre d'applications utilisatrices d'un Composant                                         |
| 2160           | D-103 — Mesurer les occurrences d'un Composant par application et globalement                                 |
| 2184           | D-104 — Ne pas figer immédiatement les ratios d'usage comme KPI définitifs                                    |
| 2196           | D-105 — Instruire en priorité le ratio Issues / occurrences globales                                          |
| 2215           | D-106 — Conserver Issues / applications utilisatrices comme ratio candidat                                    |
| 2233           | D-107 — Le label Composant est obligatoire pour toute Issue concernant un Composant                           |
| 2247           | D-108 — Une Issue multi-Composants porte tous les labels Composant concernés                                  |
| 2265           | D-109 — Privilégier une Issue distincte par Composant                                                         |
| 2282           | D-110 — Une Issue multi-Composants compte une fois pour chaque Composant concerné                             |
| 2306           | D-111 — Distinguer les différents comptages d'Issues au niveau Bibliothèque                                   |
| 2349           | D-112 — Une Issue sans Composant peut être légitimement transverse                                            |
| 2361           | D-113 — Ne pas déduire automatiquement qu'un label Composant est manquant                                     |
| 2378           | D-114 — Ne pas imposer de label dédié aux Issues sans Composant                                               |
| 2390           | D-115 — Prévoir une page d'analyse dynamique des Issues                                                       |
| 2410           | D-116 — Permettre le croisement de plusieurs critères dans l'analyse dynamique                                |
| 2434           | D-117 — Une Issue d'Audit concerne exactement un Composant                                                    |
| 2457           | D-118 — Contrôler la cohérence du Composant des Anomalies d'Audit                                             |
| 2495           | D-119 — Contrôler la cohérence du Composant des Improvements d'Audit                                          |
| 2515           | D-120 — Une Improvement d'Audit doit être une sous-Issue de l'Audit                                           |
| 2546           | D-121 — Une Anomalie d'Audit doit être une sous-Issue de l'Audit                                              |
| 2558           | D-122 — Règle commune de traçabilité des résultats d'Audit                                                    |
| 2576           | D-123 — Les types connus de sous-Issues d'Audit ne constituent pas une liste fermée                           |
| 2600           | D-124 — Une Anomalie d'Audit doit avoir l'Issue Type Bug                                                      |
| 2622           | D-125 — Une Improvement d'Audit doit avoir l'Issue Type Feature                                               |
| 2654           | D-126 — Les criticités RGAA sont réservées aux Anomalies d'Audit                                              |
| 2685           | D-127 — Les labels a11y sont transverses à la nature et à l'origine des Issues                                |
| 2715           | D-128 — Un seul label a11y par Issue est l'hypothèse métier actuelle                                          |
| 2731           | D-129 — Une Anomalie d'Audit Accessibilité doit avoir exactement un label a11y                                |
| 2753           | D-130 — La catégorie a11y est facultative pour une Improvement d'Audit Accessibilité                          |
| 2774           | D-131 — La cardinalité maximale a11y d'une Improvement d'Audit reste ouverte                                  |
| 2791           | D-132 — Les criticités RGAA sont strictement réservées aux Anomalies provenant d'un Audit                     |
| 2826           | D-133 — Un même problème peut être regroupé dans une ou plusieurs Anomalies d'Audit                           |
| 2845           | D-134 — L'unité de comptage d'une Anomalie est l'Issue GitHub                                                 |
| 2868           | D-135 — Une Anomalie d'Audit appartient à un seul Audit parent                                                |
| 2887           | D-136 — Une Improvement d'Audit appartient à un seul Audit parent                                             |
| 2911           | D-137 --- Identification générale d'une Anomalie                                                              |
| 2925           | D-138 --- Origine d'une Anomalie en V1                                                                        |
| 2947           | D-139 --- Date de détection d'une Anomalie                                                                    |
| 2964           | D-140 --- Date de correction d'une Anomalie                                                                   |
| 2985           | D-141 --- Date de fin d'un Audit                                                                              |
| 3006           | D-142 --- Identification de la Release Candidate auditée                                                      |
| 3033           | D-143 --- Reconstruction du Catalogue historique                                                              |
| 3057           | D-144 --- Date métier de Release                                                                              |
| 3077           | D-145 --- Conservation exhaustive des Issues dans le modèle normalisé                                         |
| 3103           | D-146 --- Conservation du type d’Issue dans le modèle normalisé                                               |
| 3127           | D-147 --- Vocabulaire global des Issue Types et reconnaissance configurable                                   |
| 3159           | D-148 --- Conservation et signalement des Issue Types non déclarés                                            |
| 3178           | D-149 --- Séparation de la valeur brute et de la notion canonique d’Issue Type                                |
| 3195           | D-150 --- Absence de notion canonique pour un Issue Type non reconnu                                          |
| 3216           | D-151 --- Recalcul de la notion canonique avec la configuration courante                                      |
| 3230           | D-152 --- Absence de priorité implicite en cas de correspondance ambiguë d’Issue Type                         |
| 3248           | D-153 --- Correspondance stricte des variantes d’Issue Type                                                   |
| 3261           | D-154 --- Normalisation de casse et d’espaces pour la correspondance des Issue Types                          |
| 3278           | D-155 --- Conservation et signalement d’une Issue sans Issue Type                                             |
| 3300           | D-156 — Conservation du titre dans l’Issue normalisée                                                         |
| 3310           | D-157 — Conservation de l’état GitHub dans l’Issue normalisée                                                 |
| 3320           | D-158 — Conservation des dates GitHub natives de l’Issue normalisée                                           |
| 3333           | D-159 — Conservation exhaustive des labels GitHub de l’Issue normalisée                                       |
| 3343           | D-160 — Rattachement explicite de l’Issue normalisée au repository                                            |
| 3353           | D-161 — Conservation de l’URL GitHub de l’Issue normalisée                                                    |
| 3363           | D-162 — Conservation du rattachement à la Milestone dans l’Issue normalisée                                   |
| 3373           | D-163 — Conservation des statuts GitHub Projects de l’Issue normalisée                                        |
| 3383           | D-164 — Conservation des relations parent / sous-Issues                                                       |
| 3393           | D-165 — Conservation des Pull Requests liés à l’Issue                                                         |
| 3401           | D-166 — Conservation de l’Iteration GitHub Projects                                                           |
| 3409           | D-167 — Conservation du champ Velocity GitHub Projects                                                        |
| 3417           | D-168 — Conservation du champ Scheduling GitHub Projects                                                      |
| 3425           | D-169 — Conservation des Components dérivés dans l’Issue normalisée                                           |
| 3435           | D-170 — Conservation des criticités reconnues dans l’Issue normalisée                                         |
| 3445           | D-171 — Conservation des catégories Accessibility reconnues dans l’Issue normalisée                           |
| 3455           | D-172 — Structuration des données GitHub Projects par Project d’origine                                       |
| 3465           | D-173 — Conservation et signalement des valeurs GitHub Projects non reconnues                                 |
| 3475           | D-174 — Conservation de l’identité du GitHub Project                                                          |
| 3485           | D-175 — Séparation du statut Project brut et du statut canonique                                              |
| 3495           | D-176 — Recalcul du statut Project canonique avec la configuration courante                                   |
| 3505           | D-177 — Correspondance stricte des variantes de statut Project                                                |
| 3515           | D-178 — Gestion d’une correspondance ambiguë de statut Project                                                |
| 3525           | D-179 — Conservation des données source de l’Iteration GitHub Projects                                        |
| 3535           | D-180 — Rattachement de l’Iteration au contexte GitHub Project                                                |
| 3543           | D-181 — Séparation de la Velocity brute et de la valeur numérique normalisée                                  |
| 3551           | D-182 — Traitement d’une Velocity non interprétable                                                           |
| 3561           | D-183 — Conservation systématique de la valeur brute Scheduling                                               |
| 3569           | D-184 — Conservation de l’historique des statuts GitHub Projects                                              |
| 3577           | D-185 — Contenu minimal d’une transition de statut Project                                                    |
| 3587           | D-186 — Canonicalisation des statuts dans l’historique Project                                                |
| 3595           | D-187 — Conservation exhaustive des transitions Project                                                       |
| 3603           | D-188 — Gestion d’un historique Project incomplet ou indisponible                                             |
| 3613           | D-189 — Audit comme spécialisation référencée de l’Issue                                                      |
| 3623           | D-190 — Anomaly comme spécialisation référencée de l’Issue                                                    |
| 3633           | D-191 — AuditImprovement comme spécialisation référencée de l’Issue                                           |
| 3641           | D-192 — Identifiants métier propres aux spécialisations                                                       |
| 3651           | D-193 — Relation optionnelle Anomaly vers Audit selon son origine                                             |
| 3661           | D-194 — Relation obligatoire AuditImprovement vers Audit                                                      |
| 3669           | D-195 — Component explicite sur Audit                                                                         |
| 3679           | D-196 — Component explicite sur une Anomaly d’Audit                                                           |
| 3689           | D-197 — Gestion d’une incohérence de Component entre Audit et anomalie                                        |
| 3699           | D-198 — Conservation d’une Anomaly malgré un parent Audit absent ou invalide                                  |
| 3711           | D-199 — Identifiant métier stable de Version                                                                  |
| 3719           | D-200 — Numéro PROD canonique de Version                                                                      |
| 3727           | D-201 — Git tag PROD requis pour considérer une Version publiée                                               |
| 3735           | D-202 — Git tag PROD comme source de vérité de releasedAt                                                     |
| 3745           | D-203 — Conservation d’une Version identifiable sans tag PROD                                                 |
| 3755           | D-204 — Rattachement de la Milestone PROD à la Version                                                        |
| 3763           | D-205 — Séparation entre Version PROD cible et RC auditée                                                     |
| 3771           | D-206 — Conservation du Git tag de la RC auditée                                                              |
| 3779           | D-207 — Gestion d’une RC auditée indéterminable                                                               |
| 3789           | D-208 — Version cible d’un Audit de rattrapage                                                                |
| 3797           | D-209 — Catalogue historique propre à chaque Version PROD                                                     |
| 3803           | D-210 — Catalogue historique lu dans le Git tree du tag PROD                                                  |
| 3809           | D-211 — Catalogue indéterminable lorsqu’un tag PROD manque                                                    |
| 3815           | D-212 — Catalogue absent ou illisible au tag PROD                                                             |
| 3821           | D-213 — Conservation historique d’un Component supprimé                                                       |
| 3827           | D-214 — Absence historique d’un Component ajouté ultérieurement                                               |
| 3833           | D-215 — Identifiant métier stable de Component                                                                |
| 3839           | D-216 — Identité d’un Component conservée entre Versions continues                                            |
| 3845           | D-217 — Renommage explicite d’un Component                                                                    |
| 3851           | D-218 — Nouvelle identité après disparition puis réapparition                                                 |
| 3857           | D-219 — Matérialisation de la relation Component × Version                                                    |
| 3863           | D-220 — Couverture fondée sur au moins un Audit terminé applicable                                            |
| 3869           | D-221 — Audit incomplet insuffisant pour la couverture                                                        |
| 3875           | D-222 — Verdict courant agrégé sur l’ensemble des Audits terminés applicables                                 |
| 3881           | D-223 — Un Audit incomplet ne modifie pas le verdict acquis                                                   |
| 3887           | D-224 — Conformité conditionnée à l’absence d’anomalie d’Audit ouverte pertinente                             |
| 3893           | D-225 — AuditImprovement sans effet sur le verdict de conformité                                              |
| 3899           | D-226 — Correction d’une anomalie insuffisante pour rétablir la conformité                                    |
| 3905           | D-227 — Anomalie HORS_AUDIT sans effet direct sur la conformité d’Audit                                       |
| 3911           | D-228 — État NON_COUVERT en absence d’Audit terminé applicable                                                |
| 3917           | D-229 — Issue Audit sans Component reconnu                                                                    |
| 3923           | D-230 — Issue Audit avec plusieurs Components reconnus                                                        |
| 3929           | D-231 — Issue Audit sans Version PROD cible déterminable                                                      |
| 3935           | D-232 — Conservation des anomalies enfants d’un Audit invalide                                                |
| 3941           | D-233 — Feature enfant sans Audit parent valide                                                               |
| 3947           | D-234 — Bug rattaché à plusieurs Audits valides                                                               |
| 3953           | D-235 — Feature rattachée à plusieurs Audits valides                                                          |
| 3959           | D-236 — Origine indéterminée d’une anomalie à relation Audit non validable                                    |
| 3965           | D-237 — Trois valeurs canoniques pour Anomaly.origin                                                          |
| 3971           | D-238 — Cardinalité Component des anomalies HORS_AUDIT                                                        |
| 3977           | D-239 — Cardinalité Component des anomalies UNDETERMINED                                                      |
| 3983           | D-240 — Unicité des spécialisations par Issue                                                                 |
| 3989           | D-241 — Intégrité référentielle du modèle normalisé                                                           |
| 3995           | D-242 — Déterminisme de la normalisation                                                                      |
| 4001           | D-243 — Clôture conditionnelle du lot I1 avant implémentation                                                 |
| 4011           | Q-001 — Propriétés du Package                                                                                 |
| 4019           | Q-002 — Plusieurs Packages pour une Librairie                                                                 |
| 4027           | Q-003 — Plusieurs Librairies dans un Repository                                                               |
| 4035           | Q-004 — Composants et Packages                                                                                |
| 4045           | Q-005 — Cycle Release Candidate vers PROD                                                                     |
| 4055           | Q-006 — Cycle Hotfix Candidate vers PROD                                                                      |
| 4063           | Q-007 — Release GitHub                                                                                        |
| 4071           | Q-008 — Milestone PROD manquante                                                                              |
| 4079           | Q-009 — Tag Git manquant                                                                                      |
| 4087           | Q-010 — Version d'Audit                                                                                       |
| 4099           | Q-011 --- Définition d'une Anomalie                                                                           |
| 4112           | Q-012 --- Origine d'une Anomalie                                                                              |
| 4131           | Q-013 --- Date de détection                                                                                   |
| 4144           | Q-014 --- Date de correction                                                                                  |
| 4163           | Q-015 — Objet Audit                                                                                           |
| 4171           | Q-016 — Campagne d'Audit                                                                                      |
| 4179           | Q-017 — Résultat d'un Audit                                                                                   |
| 4215           | Q-018 — Version auditée                                                                                       |
| 4227           | Q-019 --- Temporalité exacte de l'Audit                                                                       |
| 4250           | Q-020 — Profils de workflow                                                                                   |
| 4258           | Q-021 — Exceptions aux règles de Pull Request                                                                 |
| 4266           | Q-022 — Statut Cancelled                                                                                      |
| 4276           | Q-023 — Identification des Applications                                                                       |
| 4284           | Q-024 — Détection des Packages utilisés                                                                       |
| 4292           | Q-025 — Détection de la Version utilisée                                                                      |
| 4300           | Q-026 — Versions non-PROD utilisées par les consommateurs                                                     |
| 4308           | Q-027 — Détection des Composants utilisés                                                                     |
| 4316           | Q-028 — Dette de montée de Version                                                                            |
| 4324           | Q-029 — Alertes aux Squads                                                                                    |
| 4334           | Q-030 — Qualité d'une Version                                                                                 |
| 4342           | Q-031 — Qualité d'un Composant                                                                                |
| 4350           | Q-032 — Badge ou note d'une Application                                                                       |
| 4358           | Q-033 — RGAA / WAI-ARIA d'une Application                                                                     |
| 4368           | Q-034 — Granularité historique                                                                                |
| 4376           | Q-035 — Historisation de la connaissance de la qualité                                                        |
| 4384           | Q-036 — Conservation                                                                                          |
| 4394           | Q-037 — Nexus                                                                                                 |
| 4402           | Q-038 — Jenkins                                                                                               |
| 4410           | Q-039 — Applications consommatrices                                                                           |
| 4418           | Q-040 — Usage des Composants                                                                                  |
| 4428           | Q-041 — Backend                                                                                               |
| 4436           | Q-042 — Stockage historique                                                                                   |
| 4444           | Q-043 — Multi-source                                                                                          |
| 4464           | Q-044 — Familles d'Audit                                                                                      |
| 4488           | Q-045 — Représentation de la famille d'Audit                                                                  |
| 4508           | Q-046 — Cardinalité de la famille d'Audit                                                                     |
| 4516           | Q-047 — Cardinalité du Composant                                                                              |
| 4526           | Q-048 --- Release Candidate réellement auditée                                                                |
| 4540           | Q-049 — Fin d'une Issue d'Audit                                                                               |
| 4556           | Q-050 — Relation Issue d'Audit / Anomalie                                                                     |
| 4571           | Q-051 — Passage en PROD et couverture des Audits                                                              |
| 4579           | Q-052 — Passage en PROD et Anomalies détectées                                                                |
| 4587           | Q-053 — Migration vers l'Issue Type `🔍 Audit`                                                                |
| 4607           | Q-054 — Valeur de Version dans `package.json`                                                                 |
| 4646           | Q-055 — Template d'Issue d'Audit                                                                              |
| 4665           | Q-056 — Catégorisation des Améliorations d'Audit                                                              |
| 4683           | Q-057 — Cardinalité des catégories Accessibilité d’une Anomalie                                               |
| 4700           | Q-058 — Évolution du référentiel de criticité RGAA                                                            |
| 4712           | Q-059 — Critères d'attribution des criticités RGAA                                                            |
| 4732           | Q-060 — Revalidation d'un Composant après correction des Anomalies                                            |
| 4751           | Q-061 — Responsable et déclencheur de la clôture d'une Anomalie                                               |
| 4769           | Q-062 — Déclenchement de l'Audit de revalidation                                                              |
| 4790           | Q-063 — Matérialisation de la décision de revalidation                                                        |
| 4802           | Q-064 — Lien entre Anomalies successives portant sur un même problème                                         |
| 4821           | Q-065 — Changement de Version entre deux Audits successifs                                                    |
| 4837           | Q-066 — Annotation d'une Version non conforme dont les Anomalies sont corrigées                               |
| 4849           | Q-067 — Traitement de plusieurs Audits d'un même Composant et d'une même Version                              |
| 4864           | Q-068 — Disponibilité de la date de passage au statut Done                                                    |
| 4874           | Q-069 — Présentation d'un Audit en cours à côté du verdict courant                                            |
| 4894           | Q-070 — Sévérité de plusieurs Audits non terminés pour un même Composant et une même Version                  |
| 4904           | Q-071 — Source de la Version effectivement auditée                                                            |
| 4930           | Q-072 — Cohérence entre Milestone et champ Version auditée                                                    |
| 4956           | Q-073 — Sévérité d'une incohérence de Version d'Audit                                                         |
| 4966           | Q-074 — Représentation d'une Version auditée manquante                                                        |
| 4976           | Q-075 — Traitement d'un Audit bloqué par l'absence de Milestone                                               |
| 4988           | Q-076 — Dénominateur et héritage de la couverture d'Audit                                                     |
| 5010           | Q-077 — Détermination d'un Composant inchangé entre deux Versions                                             |
| 5022           | Q-078 — Référentiel permettant d'identifier les Composants entre deux Versions                                |
| 5034           | Q-079 — Règle SemVer de sélection du tag précédent                                                            |
| 5044           | Q-080 — Version du Catalogue utilisée comme dénominateur                                                      |
| 5054           | Q-081 --- Construction du Catalogue historique                                                                |
| 5066           | Q-082 — Réactivation d'un Composant décommissionné                                                            |
| 5078           | Q-083 — Représentation d'une réactivation dans le Catalogue                                                   |
| 5088           | Q-084 — Restitution de l'origine du verdict applicable                                                        |
| 5098           | Q-085 — Rupture de l'héritage lorsqu'un Composant évolue                                                      |
| 5110           | Q-086 — États de qualification d'une évolution vis-à-vis d'un Audit                                           |
| 5126           | Q-087 — Qualification initiale d'un nouveau Composant                                                         |
| 5140           | Q-088 — Traitement d'un nouveau Composant audité avant sa mise à disposition                                  |
| 5150           | Q-089 — Priorité visuelle entre conformité et suivi d'Audit                                                   |
| 5160           | Q-090 — Définition d'une Anomalie traitée                                                                     |
| 5176           | Q-091 — Dénominateur temporel du taux de traitement des Anomalies                                             |
| 5190           | Q-092 — Périmètre de la ventilation par criticité RGAA                                                        |
| 5205           | Q-093 — Agrégation du suivi des Anomalies au niveau supérieur                                                 |
| 5217           | Q-094 — Périmètre versionné de l'agrégation au niveau Librairie                                               |
| 5230           | Q-095 — Date de référence des indicateurs d'une ancienne Version                                              |
| 5242           | Q-096 --- Date exacte de Release                                                                              |
| 5255           | Q-097 — Versions affectées par une Anomalie découverte après une release                                      |
| 5267           | Q-098 — Version affectée pour une Anomalie découverte hors Audit                                              |
| 5279           | Q-099 — Format de la Version affectée dans la description d'un Bug hors accessibilité                         |
| 5289           | Q-100 — Sémantique de la Version renseignée lors d'une remontée client                                        |
| 5301           | Q-101 — Caractère systématique de Cancelled pour une erreur d'implémentation client                           |
| 5311           | Q-102 — Traitement des remontées Cancelled dans les indicateurs                                               |
| 5323           | Q-103 — Ventilation des erreurs d'intégration client pour la Squad                                            |
| 5335           | Q-104 — Normalisation par le niveau d'usage du Composant                                                      |
| 5345           | Q-105 — Ratios d'usage et d'Issues à retenir                                                                  |
| 5362           | Q-106 — Autres ratios candidats autour des Issues et de l'usage                                               |
| 5381           | Q-107 — Cas où une Issue peut légitimement ne concerner aucun Composant                                       |
| 5391           | Q-108 — Comptabilisation d'une Issue multi-Composants dans les indicateurs                                    |
| 5401           | Q-109 — Comptage global des Issues au niveau Bibliothèque                                                     |
| 5416           | Q-110 — Nature des Issues sans Composant                                                                      |
| 5428           | Q-111 — Mécanisme d'identification d'un Composant manquant suspecté                                           |
| 5440           | Q-112 — Dimensions disponibles dans la page d'analyse dynamique                                               |
| 5460           | Q-113 — Futurs types de sous-Issues d'Audit                                                                   |
| 5470           | Q-114 — Nombre d'occurrences regroupées dans une Anomalie d'Audit                                             |
| 5505           | D-244 — Revue métier des issues, corrections et audits du 19 octobre 2026                                     |
