import { componentActivityTable } from './component-activity.js';
import type { Snapshot } from '../domain/types.js';
import { auditProgress, currentProjectStatus } from '../domain/business.js';
import { processingDuration } from './processing-duration.js';
import { auditDistributionTables } from './audit-evidence.js';
import { repositoryActivity } from './repository-activity.js';
import { projectIssueFacts } from './issues.js';
import { businessReview } from './business-review.js';
import { quantile } from './statistics.js';

/** Valeur affichée et preuves exactes ; une absence reste distincte de zéro. */
export interface SimpleCell {
  /** Navigation actuelle de périmètre, explicitement distincte des preuves exactes du snapshot. */
  searchApproximate?: boolean;
  value: string | number | null;
  refs?: string[];
  /** Recherche GitHub du périmètre du compteur, prioritaire sur la recherche par références. */
  url?: string;
  note?: string;
  sortValue?: string | number | null;
}
/** Ligne filtrable dont les preuves restent dans le même écran. */
export interface SimpleRow {
  /** Identité métier permanente, indépendante des libellés et du tri. */
  reviewKey: string;
  repository: string;
  version: string;
  cells: SimpleCell[];
}
/** Contrat d’un tableau, indépendant de sa pagination dans le navigateur. */
export interface SimpleTable {
  /** Colonnes de populations proposées au filtre et au graphique de répartition. */
  populationColumns?: number[];
  id: string;
  title: string;
  description: string;
  headers: string[];
  rows: SimpleRow[];
}
/** Prépare une cellule, sans transformer une population inconnue en vide. */
function cell(value: SimpleCell['value'], refs?: string[]): SimpleCell {
  return refs ? { value, refs: [...new Set(refs)] } : { value };
}
/** Conserve uniquement une URL HTTP(S) source, jamais un protocole exécutable. */
export function safeSourceUrl(value: string | undefined): string {
  try {
    const url = new URL(value ?? '');
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : '';
  } catch {
    return '';
  }
}
/** Agrège des durées admissibles avec leurs effectifs et exclusions explicites. */
function delays(values: { id: string; value: number | null }[]) {
  const measured = values.filter((row) => row.value !== null && Number.isFinite(row.value) && row.value >= 0);
  const numbers = measured.map((row) => row.value!);
  return {
    median: quantile(numbers, 0.5),
    p90: quantile(numbers, 0.9),
    refs: measured.map((row) => row.id),
    excluded: values.length - measured.length,
    excludedRefs: values.filter((row) => !measured.includes(row)).map((row) => row.id)
  };
}
/** Mesure un intervalle daté sans reconstituer une date absente. */
function elapsed(start: string | undefined, end: string | undefined): number | null {
  const value = (Date.parse(end ?? '') - Date.parse(start ?? '')) / 86400000;
  return Number.isFinite(value) && value >= 0 ? value : null;
}
/** Projette les métriques en cinq espaces et explicite leurs périmètres, sans modifier les verdicts. */
export function simplifiedModel(snapshot: Snapshot) {
  const sourceMilestones = new Map(
    snapshot.rawData.repositories.flatMap((repository) =>
      repository.issues.flatMap((issue) =>
        issue.url && issue.milestone ? [[issue.url, issue.milestone.title] as const] : []
      )
    )
  );
  const data = snapshot.normalizedData;
  const issues = data.issues ?? [];
  const issueMap = new Map(issues.map((row) => [row.issueId, row]));
  const facts = projectIssueFacts(data, snapshot.dataQuality.issues);
  const review = snapshot.analytics.businessReview ?? businessReview(data);
  const repositories =
    snapshot.analytics.repositoryActivity ?? repositoryActivity(data, snapshot.dataQuality.issues);
  const tables: SimpleTable[] = [componentActivityTable(snapshot)];
  /** Résout le repository d’une librairie normalisée. */
  const repo = (id: string) =>
    data.libraries.find((row) => row.libraryId === id)?.repository ?? 'Repository inconnu';
  /** Extrait les identifiants d’une population déjà sélectionnée. */
  const ids = (rows: readonly { issueId: string }[]) => rows.map((row) => row.issueId);
  const componentRows = review.components.map((row): SimpleRow => {
    const related = issues.filter((issue) => issue.componentIds.includes(row.componentId));
    const bugs = related.filter((issue) =>
      data.anomalies.some((anomaly) => anomaly.issueId === issue.issueId)
    );
    const audit = data.audits.find((item) => item.auditId === row.latestAuditId);
    const reviewed = data.issues !== undefined && bugs.every((issue) => issue.review !== undefined);
    return {
      reviewKey: row.componentId,
      repository: repo(row.libraryId),
      version: audit?.version ?? '',
      cells: [
        cell(row.name, ids(related)),
        cell(audit?.version ?? 'Aucun audit terminé', audit ? [audit.issueId] : []),
        cell(
          reviewed ? row.accessibility : null,
          ids(
            bugs.filter((issue) => issue.review?.kinds.includes('accessibility') && !issue.review.neutralized)
          )
        ),
        cell(
          reviewed
            ? bugs.filter(
                (issue) =>
                  issue.review?.kinds.includes('accessibility') &&
                  !issue.review.neutralized &&
                  issue.review.correctionConfirmed
              ).length
            : null,
          ids(
            bugs.filter(
              (issue) =>
                issue.review?.kinds.includes('accessibility') &&
                !issue.review.neutralized &&
                issue.review.correctionConfirmed
            )
          )
        ),
        cell(
          data.issues ? row.withoutAudit : null,
          ids(
            bugs.filter(
              (issue) => !data.anomalies.find((anomaly) => anomaly.issueId === issue.issueId)?.auditId
            )
          )
        ),
        cell(
          reviewed ? row.pendingAccessibility : null,
          ids(
            bugs.filter(
              (issue) =>
                issue.review?.kinds.includes('accessibility') &&
                !issue.review.neutralized &&
                issue.review.verification !== 'verified'
            )
          )
        )
      ]
    };
  });
  tables.push({
    id: 'components',
    title: 'État des composants',
    description:
      'Bugs connus et corrections ne s’additionnent pas. Une correction ne prouve pas la conformité. Les bugs sans audit incluent les natures fonctionnelles et inconnues.',
    headers: [
      'Composant',
      'Dernier audit terminé',
      'Bugs d’accessibilité',
      'Corrections d’accessibilité confirmées',
      'Bugs sans audit',
      'Accessibilité sans vérification'
    ],
    rows: componentRows
  });
  tables.push({
    id: 'priorities',
    title: 'Actions à examiner',
    description:
      'Composants avec des bugs d’accessibilité sans vérification. Les liens donnent les issues concernées ; aucun classement automatique de criticité.',
    headers: ['Composant', 'Situation', 'Prochaine action'],
    rows: componentRows
      .filter((row) => row.cells[5]?.value === null || Number(row.cells[5]?.value) > 0)
      .map((row) => ({
        reviewKey: row.reviewKey,
        repository: row.repository,
        version: row.version,
        cells: [
          row.cells[0]!,
          cell(
            row.cells[5]?.value === null
              ? 'Qualification métier indisponible'
              : Number(row.cells[3]?.value) > 0
                ? 'Corrections à vérifier et bugs à examiner'
                : 'Anomalies à traiter',
            row.cells[5]?.refs
          ),
          cell(
            row.cells[5]?.value === null
              ? 'Vérifier la qualification et les preuves dans la vue détaillée'
              : Number(row.cells[3]?.value) > 0
                ? 'Vérifier les corrections par audit et traiter les bugs restants'
                : 'Examiner et traiter les anomalies',
            row.cells[5]?.refs
          )
        ]
      }))
  });
  tables.push({
    id: 'repositories',
    title: 'Patrimoine et activité par repository',
    description:
      'Stocks du snapshot, toutes dates confondues. Issues et PR distinctes ; les composants ne sont pas additionnés aux issues.',
    headers: ['Repository', 'Composants', 'Issues', 'Issues ouvertes', 'PR', 'PR fusionnées'],
    rows: repositories.map((row) => {
      const selected = issues.filter((issue) => issue.libraryId === row.libraryId);
      return {
        reviewKey: row.repository,
        repository: row.repository,
        version: '',
        cells: [
          cell(row.repository),
          {
            ...cell(row.components, ids(selected.filter((issue) => issue.componentIds.length > 0))),
            note: 'Ce nombre compte les composants du catalogue ; la liste présente les issues liées aux composants de ce repository, pas une issue par composant.'
          },
          {
            ...cell(row.issues === 'unknown' ? null : row.issues, data.issues ? ids(selected) : undefined),
            url: repositoryUrl(snapshot, row.repository, 'issues?q=is%3Aissue')
          },
          {
            ...cell(
              row.openIssues === 'unknown' ? null : row.openIssues,
              data.issues ? ids(selected.filter((issue) => issue.state === 'OPEN')) : undefined
            ),
            url: repositoryUrl(snapshot, row.repository, 'issues?q=is%3Aissue%20is%3Aopen')
          },
          {
            value: row.pullRequests,
            note: 'Stock de PR distinctes dans le snapshot. Le lien GitHub affiche leur état actuel.',
            url: repositoryUrl(snapshot, row.repository, 'pulls?q=is%3Apr')
          },
          {
            value: row.mergedPullRequests,
            note: 'PR fusionnées connues dans le snapshot ; la recherche GitHub est actuelle.',
            url: repositoryUrl(snapshot, row.repository, 'pulls?q=is%3Apr%20is%3Amerged')
          }
        ]
      };
    })
  });
  tables.push({
    id: 'activity',
    title: 'Travail des équipes',
    description:
      'Issues du snapshot. Le statut Project est distinct de la fermeture GitHub ; les filtres de dates portent sur la création de l’issue.',
    headers: ['Issue', 'Nature', 'Composants', 'GitHub', 'Project', 'Traitement', 'Création'],
    rows: facts.map((fact) => ({
      reviewKey: fact.id,
      repository: fact.repo,
      version: fact.versions.join(', '),
      cells: [
        cell('#' + fact.number + ' · ' + fact.title, [fact.id]),
        cell(fact.familyLabel),
        cell(fact.components.join(', ') || 'Non renseigné'),
        cell(fact.githubState === 'OPEN' ? 'Ouverte' : 'Fermée'),
        cell(
          fact.projectContexts
            .map((context) => currentProjectStatus(context) ?? 'Statut inconnu')
            .join(', ') || 'Sans Project'
        ),
        cell(fact.review?.correctionLabel ?? 'Non confirmée'),
        cell(fact.createdAt)
      ]
    }))
  });
  const delayRows: SimpleRow[] = [];
  for (const library of data.libraries) {
    const selected = issues.filter((issue) => issue.libraryId === library.libraryId);
    const cohorts = [
      {
        key: 'github-closure',
        name: 'Fermeture des issues',
        values: selected
          .filter((issue) => issue.state === 'CLOSED')
          .map((issue) => ({ id: issue.issueId, value: elapsed(issue.createdAt, issue.closedAt) }))
      },
      {
        key: 'business-treatment',
        name: 'Traitement métier — dates Done / estimées',
        values: facts
          .filter((fact) => fact.repo === library.repository && fact.status === 'closed')
          .map((fact) => ({ id: fact.id, value: fact.delay }))
      },
      {
        key: 'confirmed-correction',
        name: 'Correction confirmée des bugs — In progress → Done',
        values: selected
          .filter(
            (issue) =>
              issue.review?.correctionConfirmed &&
              data.anomalies.some((anomaly) => anomaly.issueId === issue.issueId)
          )
          .map((issue) => ({ id: issue.issueId, value: processingDuration(issue).value }))
      }
    ];
    for (const cohort of cohorts) {
      const summary = delays(cohort.values);
      const note =
        cohort.key === 'confirmed-correction'
          ? 'Premier In progress → dernier Done. Sans paire Project datée : création → clôture GitHub. PR fusionnée exigée pour la population, pas pour la date. Bornes et provenance dans le détail et le CSV.'
          : cohort.key === 'github-closure'
            ? 'Issues Closed : création → clôture GitHub. Les dates manquantes ou inversées sont exclues.'
            : 'Issues Done ET Closed ; création → dernière date Done, ou clôture estimée admissible. Les annulations et exclusions DQ sont séparées. Cette population diffère des seules issues Closed.';
      delayRows.push({
        reviewKey: library.libraryId + ':' + cohort.key,
        repository: library.repository,
        version: '',
        cells: [
          cell(library.repository),
          { ...cell(cohort.name, summary.refs), note },
          { ...cell(summary.median, summary.refs), note },
          { ...cell(summary.p90, summary.refs), note },
          { ...cell(summary.refs.length, summary.refs), note },
          {
            ...cell(summary.excluded, summary.excludedRefs),
            note: 'Dossiers de la cohorte exclus du calcul : date absente, inversée ou exclusion DQ. Aucun délai nul n’est fabriqué.'
          }
        ]
      });
    }
    for (const [cohortKey, name] of [
      ['pr-fusion', 'Fusion des PR — date d’ouverture absente'],
      ['audit-completion', 'Réalisation des audits — date de début absente']
    ] as const)
      delayRows.push({
        reviewKey: library.libraryId + ':' + cohortKey,
        repository: library.repository,
        version: '',
        cells: [cell(library.repository), cell(name), cell(null), cell(null), cell(0), cell(null)]
      });
  }
  tables.push({
    id: 'delays',
    title: 'Délais de traitement',
    description:
      'Jours calendaires, médiane et P90. Cohortes terminées, toutes dates confondues ; la fermeture ne prouve pas une correction. Les sources actuelles ne donnent pas les dates de début des PR et audits.',
    headers: [
      'Repository',
      'Mesure',
      'Médiane (jours)',
      'P90 (jours)',
      'Dossiers mesurables',
      'Dossiers exclus'
    ],
    rows: delayRows
  });
  const campaigns: SimpleRow[] = [];
  const keys = new Set([
    ...data.audits.map((audit) => JSON.stringify([audit.libraryId, audit.version])),
    ...(data.versions ?? []).map((version) => JSON.stringify([version.libraryId, version.number]))
  ]);
  for (const key of keys) {
    const [libraryId, version] = JSON.parse(key) as [string, string];
    const audits = data.audits.filter(
      (audit) =>
        audit.libraryId === libraryId &&
        audit.version === version &&
        issueMap.get(audit.issueId)?.issueType !== 'EPIC'
    );
    /** Sélectionne les audits selon leur progression déjà normalisée. */
    const unknown = audits.filter((audit) => {
      const source = issueMap.get(audit.issueId);
      return (
        source &&
        (!source.projectContexts.length ||
          source.projectContexts.some((context) => !currentProjectStatus(context)))
      );
    });
    /** Compte les progressions connues séparément des statuts manquants. */
    const state = (name: string) =>
      audits.filter((audit) => !unknown.includes(audit) && auditProgress(audit, issues) === name);
    const waiting = state('ongoing').filter((audit) =>
      issueMap
        .get(audit.issueId)
        ?.projectContexts.some((context) => currentProjectStatus(context) === 'BLOCKED')
    );
    const versionIds = (data.versions ?? [])
      .filter((item) => item.libraryId === libraryId && item.number === version)
      .map((item) => item.versionId);
    const relations = [
      ...new Map(
        (data.componentVersions ?? [])
          .filter((item) => versionIds.includes(item.versionId))
          .map((item) => [item.componentId, item])
      ).values()
    ];
    const auditIds = new Set(audits.map((audit) => audit.auditId));
    const improvements = [
      ...new Set(
        (data.auditImprovements ?? [])
          .filter((item) => auditIds.has(item.auditId))
          .map((item) => item.issueId)
      )
    ];
    /** Liste les preuves applicables, y compris les audits hérités d’une version antérieure. */
    const verdict = (name: string) => {
      const members = relations.filter((item) => (item.verdict ?? 'NON_COUVERT') === name);
      const proofIds = new Set(members.flatMap((item) => item.applicableAuditIds ?? []));
      const sources = data.audits.filter((audit) => proofIds.has(audit.auditId));
      const names = members.map(
        (item) =>
          data.components.find((component) => component.componentId === item.componentId)?.name ??
          item.componentId
      );
      return {
        ...cell(relations.length ? members.length : null, ids(sources)),
        note: relations.length
          ? 'Composants : ' + (names.join(', ') || 'aucun') + '. Audits directs ou hérités.'
          : 'Catalogue historique indisponible : aucun total de composants ne peut être établi.'
      };
    };
    const completed = state('completed');
    const declarationsKnown = completed.every((audit) => audit.declaredRgaaBugIssueIds !== undefined);
    const declaredBugs = [...new Set(completed.flatMap((audit) => audit.declaredRgaaBugIssueIds ?? []))];
    const directGroups = [...new Set(completed.map((audit) => audit.componentId))].map((id) =>
      completed.filter((audit) => audit.componentId === id)
    );
    const withoutDeclaredBug = directGroups.filter((group) =>
      group.every((audit) => audit.declaredRgaaBugIssueIds?.length === 0)
    );
    const withDeclaredBug = directGroups.filter((group) =>
      group.some((audit) => (audit.declaredRgaaBugIssueIds?.length ?? 0) > 0)
    );
    const declarationNote = declarationsKnown
      ? 'Audits terminés uniquement ; type GitHub BUG explicite et label RGAA du profil. Le lien parent est conservé même si le composant diffère. Sans BUG déclaré ne prouve pas la conformité métier.'
      : 'Déclarations indisponibles : rejouer le pipeline. Aucun zéro déduit.';
    const absenceVerdicts = withoutDeclaredBug.map((group) => {
      const relation = relations.find((item) => item.componentId === group[0]!.componentId);
      return relation ? (relation.verdict ?? 'NON_COUVERT') : 'HORS_CATALOGUE';
    });
    const absenceNote =
      declarationNote +
      (relations.length && declarationsKnown
        ? ` Parmi ces composants sans déclaration : ${absenceVerdicts.filter((value) => value === 'CONFORME').length} conformes métier, ${absenceVerdicts.filter((value) => value === 'NON_CONFORME').length} non conformes, ${absenceVerdicts.filter((value) => value === 'HORS_CATALOGUE').length} hors catalogue ; les autres sont non couverts.`
        : '');
    const completedComponents = new Set(completed.map((audit) => audit.componentId));
    const conformAudited = relations.filter(
      (item) => item.verdict === 'CONFORME' && completedComponents.has(item.componentId)
    );
    const conform = verdict('CONFORME');
    conform.note += ' Métier : les anomalies non levées bloquent la conformité.';
    const nonConform = verdict('NON_CONFORME');
    const waitingAudits = [...state('pending'), ...waiting];
    const proofOfAuditedConform = ids(
      completed.filter((audit) => conformAudited.some((item) => item.componentId === audit.componentId))
    );
    const allAuditRefs = ids(audits);
    /** Garde un ratio numérique et ses deux populations, sans faux zéro ni plafonnement. */
    const ratio = (
      numerator: number | null,
      denominator: number,
      refs: string[],
      explanation: string
    ): SimpleCell => ({
      ...cell(numerator !== null && denominator > 0 ? (100 * numerator) / denominator : null, refs),
      note:
        explanation +
        ' Numérateur : ' +
        (numerator ?? 'indisponible') +
        ' ; dénominateur : ' +
        denominator +
        '.'
    });
    campaigns.push({
      reviewKey: JSON.stringify([libraryId, version]),
      repository: repo(libraryId),
      version,
      cells: [
        cell(repo(libraryId), allAuditRefs),
        cell(version, allAuditRefs),
        {
          ...cell(relations.length ? relations.length : null, allAuditRefs),
          note:
            'Catalogue : composants distincts, pas des issues d’audit. ' +
            (relations.length
              ? `Réconciliation : ${Number(conform.value)} conformes + ${Number(nonConform.value)} non conformes + ${Number(verdict('NON_COUVERT').value)} non couverts = ${relations.length}. `
              : '') +
            `Audits : ${audits.length} issues sur ${new Set(audits.map((audit) => audit.componentId)).size} composants ; ${new Set(audits.filter((audit) => !relations.some((relation) => relation.componentId === audit.componentId)).map((audit) => audit.componentId)).size} hors catalogue connu.`
        },
        cell(audits.length, allAuditRefs),
        cell(waitingAudits.length, ids(waitingAudits)),
        cell(
          state('ongoing').length - waiting.length,
          ids(state('ongoing').filter((audit) => !waiting.includes(audit)))
        ),
        cell(completed.length, ids(completed)),
        ratio(
          completed.length,
          relations.length,
          ids(completed),
          'Audits terminés / composants de la version. Plusieurs audits d’un même composant peuvent donner plus de 100 %.'
        ),
        conform,
        nonConform,
        ratio(
          relations.length ? conformAudited.length : null,
          completed.length,
          proofOfAuditedConform,
          'Verdict métier conforme sur les composants audités / audits terminés. Sans BUG déclaré est une autre population ; les conformités héritées seules sont exclues.'
        ),
        ratio(
          relations.length ? Number(conform.value) : null,
          relations.length,
          conform.refs ?? [],
          'Composants conformes cumulés / tous les composants de la version. Comprend les conformités héritées calculées par le pipeline.'
        ),
        {
          ...cell(declarationsKnown ? declaredBugs.length : null, declarationsKnown ? declaredBugs : []),
          note: declarationNote
        },
        cell(improvements.length, improvements),
        verdict('NON_COUVERT'),
        cell(state('cancelled').length, ids(state('cancelled'))),
        cell(unknown.length, ids(unknown)),
        {
          ...cell(declarationsKnown ? withoutDeclaredBug.length : null, ids(withoutDeclaredBug.flat())),
          note: absenceNote
        },
        {
          ...cell(declarationsKnown ? withDeclaredBug.length : null, ids(withDeclaredBug.flat())),
          note: declarationNote
        }
      ]
    });
  }
  tables.push({
    id: 'campaigns',
    title: 'Audits et composants par version',
    description:
      'En attente : audits non démarrés et Project Blocked. Conformes/non conformes : verdicts cumulés calculés par le pipeline. Le ratio sur les audits terminés ne prend que les composants conformes effectivement audités sur cette version ; le ratio sur tous les composants conserve l’héritage. Les ratios sont indisponibles si leur dénominateur est nul ou inconnu.',
    headers: [
      'Librairie',
      'Version',
      'Composants',
      'Audits total',
      'Audits en attente',
      'Audits en cours',
      'Audits terminés',
      'Audits terminés / composants (%)',
      'Composants conformes cumulés',
      'Composants non conformes cumulés',
      'Conformes audités / audits terminés (%)',
      'Conformes cumulés / composants (%)',
      'BUG RGAA déclarés — audits terminés',
      'Améliorations liées aux audits',
      'Composants non couverts',
      'Audits annulés',
      'Statuts inconnus',
      'Composants sans BUG RGAA déclaré — version',
      'Composants avec BUG RGAA déclaré — version'
    ],
    rows: campaigns
  });
  tables.push(...auditDistributionTables(data));
  return {
    version: 1,
    capturedAt: snapshot.capturedAt,
    reliability: snapshot.reliability,
    diagnostics: snapshot.dataQuality.issues.length,
    repositories,
    campaigns,
    tables,
    issues: issues.map((issue) => ({
      id: issue.issueId,
      repository: repo(issue.libraryId),
      title: '#' + issue.number + ' · ' + issue.title,
      url: safeSourceUrl(issue.url),
      createdAt: issue.createdAt,
      state: issue.state,
      labels: issue.labels,
      ...(issue.review?.correctionConfirmed && data.anomalies.some((item) => item.issueId === issue.issueId)
        ? { processing: processingDuration(issue) }
        : {}),
      ...(sourceMilestones.has(issue.url) ? { milestone: sourceMilestones.get(issue.url)! } : {}),
      correction: issue.review?.correctionLabel ?? 'Non confirmée',
      warnings: issue.review?.warnings ?? []
    }))
  };
}
/** Construit uniquement un lien de recherche courant pour un repository source effectivement identifié. */
function repositoryUrl(snapshot: Snapshot, repository: string, suffix: string): string {
  const source = snapshot.normalizedData.issues?.find(
    (issue) =>
      /^https:\/\/[^/@?#:\s]+(?::\d+)?\/[^/]+\/[^/]+\/issues\/\d+$/.test(safeSourceUrl(issue.url)) &&
      !/\.(invalid|test|example)$/.test(new URL(issue.url!).hostname) &&
      snapshot.normalizedData.libraries.some(
        (library) => library.libraryId === issue.libraryId && library.repository === repository
      )
  );
  const url = safeSourceUrl(source?.url);
  return /^https:\/\/[^/@?#:\s]+(?::\d+)?\/[^/]+\/[^/]+\/issues\/\d+$/.test(url)
    ? url.replace(/\/issues\/\d+$/, '/' + suffix)
    : '';
}
