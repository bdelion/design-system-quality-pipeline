import type { Snapshot } from '../domain/types.js';
import { workspaceModel } from './workspaces.js';
import { contextAttribute } from './evidence.js';

/** Projette les preuves nominatives existantes ; ne modifie aucun effectif ou verdict Analytics. */
export function componentPopulationRows(snapshot: Snapshot) {
  const data = snapshot.normalizedData;
  const selection = workspaceModel(snapshot).scopes.find(
    (scope) => !scope.repository && !scope.component && !scope.version
  )?.summary.versionSelection;
  return data.components.flatMap((component) => {
    const library = data.libraries.find((item) => item.libraryId === component.libraryId);
    const repository = library?.repository ?? component.libraryId;
    const raw = snapshot.rawData.repositories.find((item) => `${item.owner}/${item.name}` === repository);
    const versions = (data.versions ?? []).filter((version) => version.libraryId === component.libraryId);
    const selected = selection?.versions.filter((version) => version.repository === repository) ?? [];
    const targets = [...versions, ...(!selected.length ? [undefined] : [])];
    return targets.map((version) => {
      const relations = version
        ? (data.componentVersions ?? []).filter(
            (relation) =>
              relation.componentId === component.componentId && relation.versionId === version.versionId
          )
        : [];
      const catalogue =
        version &&
        version.channel !== 'development' &&
        version.prodTag?.name === version.number &&
        /^\d+\.\d+\.\d+$/.test(version.number)
          ? raw?.historicalCatalogues?.find(
              (item) => item.tagName === version.prodTag!.name && item.status === 'available'
            )
          : undefined;
      const absent =
        catalogue &&
        ![component.name, ...component.aliases].some((name) => catalogue.componentNames.includes(name));
      const presence = relations.length
        ? ('present' as const)
        : absent
          ? ('absent' as const)
          : ('unknown' as const);
      const proof = relations.length
        ? relations
            .map(
              (relation) =>
                `${relation.componentVersionId} · ${relation.provenance.source} · ${relation.provenance.sourceId ?? 'référence non renseignée'}`
            )
            .join(' ; ')
        : absent
          ? `Catalogue complet du tag ${catalogue!.tagName} : nom et alias absents.`
          : !version
            ? 'PROD non démontrée : aucune version de remplacement.'
            : 'Relation non matérialisée ; aucune absence prouvée pour cette identité.';
      return {
        repository,
        componentId: component.componentId,
        name: component.name,
        aliases: component.aliases,
        active: component.status === 'active',
        status: component.status,
        source: `${component.provenance.source} · ${component.provenance.sourceId ?? 'référence non renseignée'}`,
        version: version?.number ?? 'PROD indéterminée',
        versionId: version?.versionId ?? '',
        current: !version || selected.some((item) => item.versionId === version.versionId),
        presence,
        proof,
        verdict: relations.length === 1 ? relations[0]!.verdict : undefined,
        auditIds: [...new Set(relations.flatMap((relation) => relation.applicableAuditIds ?? []))],
        exclusions: Object.values(snapshot.analytics.metrics).flatMap((metric) =>
          metric.exclusions
            .filter(
              (exclusion) =>
                exclusion.entityId === component.componentId ||
                relations.some((relation) => relation.componentVersionId === exclusion.entityId)
            )
            .map((exclusion) => `${metric.id} : ${exclusion.entityId} (${exclusion.ruleId})`)
        )
      };
    });
  });
}

/** Échappe les identités, preuves et paramètres avant leur insertion dans le document. */
function html(value: unknown): string {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!
  );
}

/** Rend un détail filtrable des populations et exclusions, distinct des formules de couverture. */
export function componentPopulationContent(snapshot: Snapshot): string {
  const rows = componentPopulationRows(snapshot);
  return `<details data-review-slot="s5t" class="panel" id="component-populations"><summary data-review-slot="s5u">Patrimoine historique, actifs et présences par version : preuves et exclusions</summary><p data-review-slot="s5v">Identités distinctes par componentId, jamais fusionnées par nom. Actifs : statut active uniquement. Présences : relations Component × Version matérialisées ; absence : catalogue complet du tag exact sans nom ni alias. Sans preuve, présence indéterminée, jamais zéro. Les versions PROD courantes sont affichées par défaut ; un filtre de version permet de consulter l’historique. Périmètre catalogue : repository/composant/version, sans filtres d’issues ou d’audits.</p><p data-review-slot="s5w" role="status" data-component-populations-summary></p><div data-review-slot="s5x" class="table-wrap" tabindex="0" role="region" aria-label="Preuves des populations de composants"><table data-review-slot="s5y"><thead data-review-slot="s5z"><tr data-review-slot="s60">${['Repository · identité', 'Statut courant et exclusion des actifs', 'Version · présence', 'Verdict et audits applicables', 'Sources et exclusions DQ'].map((label, field) => `<th data-review-key="${field}" data-review-slot="s61" scope="col">${label}</th>`).join('')}</tr></thead><tbody data-review-slot="s62">${rows.map((row) => `<tr data-review-slot="s63" data-review-key="${html(JSON.stringify([row.componentId, row.versionId]))}" data-component-population-row data-identity="${html(row.componentId)}" data-active="${row.active}" data-current="${row.current}" data-presence="${row.presence}" data-covered="${['CONFORME', 'NON_CONFORME'].includes(row.verdict ?? '')}" data-conform="${row.verdict === 'CONFORME'}" ${contextAttribute({ repository: row.repository, componentIds: [row.componentId], components: [row.name, ...row.aliases], versionIds: [row.versionId], versions: [row.version] })}><td data-review-slot="s64">${html(row.repository)} · ${html(row.name)}<small data-review-slot="s65">${html(row.componentId)}${row.aliases.length ? ' · alias déclarés : ' + html(row.aliases.join(', ')) : ''}</small></td><td data-review-slot="s66">${row.active ? 'Actif : active' : 'Exclu du KPI actifs : ' + html(row.status)}</td><td data-review-slot="s67">${html(row.version)} · ${{ present: 'Présent (relation matérialisée)', absent: 'Absent (catalogue complet)', unknown: 'Présence indéterminée' }[row.presence]}</td><td data-review-slot="s68">${html(row.verdict ?? 'Verdict indéterminé')}${row.auditIds.map((id) => `<a data-review-slot="s69" data-review-key="${html(id)}" href="audits.html?audit=${encodeURIComponent(id)}">${html(id)}</a>`).join(' · ')}</td><td data-review-slot="s6a">${html(row.source)}<small data-review-slot="s6b">${html(row.proof)}</small>${row.exclusions.map((exclusion) => `<small data-review-slot="s6c">${html(exclusion)}</small>`).join('')}</td></tr>`).join('')}</tbody></table></div><p data-review-slot="s6d">Les couples couverts ont un verdict CONFORME ou NON_CONFORME ; NON_COUVERT est distinct d’un verdict indéterminé. La couverture courante utilise les identités non retirées, ou les relations matérialisées avec version explicite : ce dénominateur n’est pas automatiquement le nombre de présences démontrées. Les ratios affichés restent ceux calculés par le pipeline.</p></details>`;
}
