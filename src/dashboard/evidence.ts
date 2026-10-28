import { metricFormula } from '../analytics/catalog.js';
import { issueFacts } from './read-model.js';
import type { Snapshot } from '../domain/types.js';

/** Échappe toute valeur injectée dans du texte ou un attribut HTML. */
function escape(value: unknown): string {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!
  );
}

/** Sérialise les dimensions explicites d'un fait pour les filtres communs. */
export function contextAttribute(fact: unknown): string {
  return `data-context="${escape(JSON.stringify(fact))}"`;
}

/** Affiche uniquement les URL HTTPS sûres, sans inventer de destination pour une référence orpheline. */
function sourceLink(url: string | undefined, label: string): string {
  return url && /^https:\/\/[^\s"<>]+$/.test(url)
    ? `<a data-review-slot="s6y" href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(label)} ↗</a>`
    : `<span data-review-slot="s6z">${escape(label)} · source non résolue</span>`;
}

/** Construit le périmètre partagé ; une vue peut présenter son résumé et son reset avec ses résultats. */
export function contextToolbar(
  snapshot: Snapshot,
  dimensions = ['repository', 'component', 'version'],
  settings: { feedback?: boolean; resetLabel?: string } = {}
): string {
  const options = {
    repository: snapshot.normalizedData.libraries.map((item) => item.repository),
    component: snapshot.normalizedData.components.map((item) => item.name),
    version: (snapshot.normalizedData.versions ?? []).map((item) => item.number)
  };
  return `<section data-review-slot="s70" class="workspace-filters" aria-label="Filtres de cette vue"><div data-review-slot="s71" class="filter-bar">${Object.entries(
    options
  )
    .filter(([key]) => dimensions.includes(key))
    .map(
      ([key, values]) =>
        `<label data-review-slot="s72" data-review-key="${key}">${({ repository: 'Repository', component: 'Composant', version: 'Version cible' } as Record<string, string>)[key]}<select data-review-slot="s73" data-context-filter="${key}"><option data-review-slot="s74" value="">${key === 'version' ? 'Versions courantes / stock complet' : 'Tous'}</option>${[
          ...new Set(values)
        ]
          .sort()
          .map((value) => `<option data-review-slot="s75" value="${escape(value)}">${escape(value)}</option>`)
          .join('')}</select></label>`
    )
    .join(
      ''
    )}<button data-review-slot="s76" type="button" class="reset-button" data-clear-context>${escape(settings.resetLabel ?? 'Effacer les filtres')}</button></div>${settings.feedback === false ? '' : '<p data-review-slot="s77" role="status" aria-live="polite" data-filter-feedback></p>'}</section>`;
}

/** Restitue les preuves et les liens de PR avec la base GitHub capturée, y compris Enterprise. */
export function traceabilityContent(snapshot: Snapshot, githubUrl = 'https://github.com'): string {
  const data = snapshot.normalizedData;
  const rows = issueFacts(snapshot)
    .map((fact) => {
      const anomalies = data.anomalies.filter((item) => fact.anomalyIds.includes(item.anomalyId));
      const auditLabels = fact.auditIds
        .map((id) => {
          const audit = data.audits.find((item) => item.auditId === id)!;
          return `<a data-review-slot="s78" data-review-key="${escape(id)}" href="audits.html?audit=${encodeURIComponent(id)}">${escape(id)}</a> · ${escape(audit.lifecycle ?? audit.status)}`;
        })
        .join('<br data-review-slot="s79">');
      const missing = anomalies.flatMap((item) =>
        item.origin === 'UNDETERMINED'
          ? [`Origine non résolue (${item.parentRefs.join(', ') || 'parent absent'})`]
          : []
      );
      const prs = [
        ...new Set([
          ...fact.prs,
          ...data.pullRequests
            .filter((pr) => pr.relatedIssueIds.includes(fact.id))
            .map((pr) => pr.pullRequestId)
        ])
      ];
      return `<tr data-review-slot="s7a" data-trace-row ${contextAttribute(fact)}><td data-review-slot="s7b">${sourceLink(fact.url, fact.key)}<small data-review-slot="s7c">${escape(fact.title)}</small></td><td data-review-slot="s7d">${escape(fact.familyLabel)}<small data-review-slot="s7e">${escape(fact.status)} / GitHub ${escape(fact.githubState)}</small></td><td data-review-slot="s7f">${fact.anomalyIds.map((id) => `<a data-review-slot="s7g" data-review-key="${escape(id)}" href="anomalies.html?anomaly=${encodeURIComponent(id)}">${escape(id)}</a>`).join('<br data-review-slot="s7h">') || 'Aucune spécialisation anomalie'}${missing.map((reason) => `<small data-review-slot="s7i">${escape(reason)}</small>`).join('')}</td><td data-review-slot="s7j">${auditLabels || 'Aucun audit explicitement relié'}</td><td data-review-slot="s7k">${escape(fact.versions.join(', ') || 'Version non déterminée')}</td><td data-review-slot="s7l">${escape(fact.components.join(', ') || 'Issue transverse / composant non déterminé')}</td><td data-review-slot="s7m">${escape(fact.repo)}</td><td data-review-slot="s7n">${
        prs
          .map((id) => {
            const pr = data.pullRequests.find((item) => item.pullRequestId === id);
            const rawRepo = snapshot.rawData.repositories.find((repo) =>
              repo.pullRequests.some((item) => item.id === id)
            );
            const rawPr = rawRepo?.pullRequests.find((item) => item.id === id);
            return sourceLink(
              rawRepo && rawPr
                ? `${githubUrl.replace(/\/+$/, '')}/${encodeURIComponent(rawRepo.owner)}/${encodeURIComponent(rawRepo.name)}/pull/${rawPr.number}`
                : undefined,
              `${id}${pr ? ` (${pr.state})` : ''}`
            );
          })
          .join('<br data-review-slot="s7o">') || 'Aucune PR explicitement reliée'
      }</td></tr>`;
    })
    .join('');
  return `<article data-review-slot="s7p" class="panel table-panel" id="traceability"><h2 data-review-slot="s7q">Chaîne de preuve exhaustive</h2><p data-review-slot="s7r">Issue → anomalie → audit → version → composant → repository → PR. Une absence ou une référence orpheline reste visible ; le partage d'un composant n'attribue aucune anomalie à un audit.</p><div data-review-slot="s7s" class="table-wrap" tabindex="0" role="region" aria-label="Tableau défilant"><table data-review-slot="s7t"><caption data-review-slot="s7u">Relations explicites de toutes les issues normalisées</caption><thead data-review-slot="s7v"><tr data-review-slot="s7w">${['Issue source', 'Famille et état', 'Anomalie', 'Audit', 'Version', 'Composant', 'Repository', 'PR'].map((label, field) => `<th data-review-key="${field}" data-review-slot="s7x" scope="col">${label}</th>`).join('')}</tr></thead><tbody data-review-slot="s7y">${rows || '<tr data-review-slot="s7z"><td data-review-slot="s80" colspan="8">Aucune issue normalisée.</td></tr>'}</tbody></table></div></article>`;
}

/** Expose formule, population, sources, exclusions et alertes de chaque métrique conservée dans Analytics. */
export function metricExplanationContent(snapshot: Snapshot): string {
  const facts = issueFacts(snapshot);
  const metrics = { ...snapshot.analytics.metrics, ...snapshot.analytics.flows };
  return `<section data-review-slot="s81" class="panel" id="metrics"><h2 data-review-slot="s82">Définitions et diagnostics des indicateurs</h2><p data-review-slot="s83">Un effectif nul n'est pas une donnée inconnue. Sans date métier prouvée, aucune date de réalisation d'audit n'est inventée. Les délais estimés sont séparés des dates Done.</p>${Object.values(
    metrics
  )
    .map((metric) => {
      const sources =
        metric.sourceEntityIds
          .map((id) => {
            const fact = facts.find(
              (item) => item.id === id || item.auditIds.includes(id) || item.anomalyIds.includes(id)
            );
            if (fact)
              return `<a data-review-slot="s84" data-review-key="${escape(id)}" href="graph.html?issue=${encodeURIComponent(fact.id)}#traceability">${escape(id)}</a>`;
            const relation = snapshot.normalizedData.componentVersions?.find(
              (item) => item.componentVersionId === id
            );
            const component = snapshot.normalizedData.components.find(
              (item) => item.componentId === (relation?.componentId ?? id)
            );
            return component
              ? `<a data-review-slot="s85" data-review-key="${escape(id)}" href="audits.html?component=${encodeURIComponent(component.componentId)}${relation ? '&version=' + encodeURIComponent(relation.versionId) : ''}#component-versions">${escape(id)}</a>`
              : escape(id);
          })
          .join(', ') || 'Population vide';
      const issues = metric.reliability.issueIds
        .map((id) => snapshot.dataQuality.issues.find((issue) => issue.id === id))
        .filter((issue) => issue !== undefined);
      return `<details data-review-slot="s86" id="metric-${escape(metric.id)}"><summary data-review-slot="s87">${escape(metric.id)} · ${escape(metric.value)} ${escape(metric.unit)} · ${escape(metric.reliability.status)}</summary><p data-review-slot="s88">${escape(metric.definition)}</p><p data-review-slot="s89">Formule : ${escape(metricFormula(metric.id))}</p><p data-review-slot="s8a">Périmètre : ${escape(metric.scope)} · Numérateur : ${escape(metric.numerator ?? 'inconnu')} · Dénominateur : ${escape(metric.denominator ?? 'inconnu')}${metric.period ? ` · Période : ${escape(metric.period.from)} → ${escape(metric.period.to)}` : ''}</p><p data-review-slot="s8b">Sources retenues : ${sources}</p><p data-review-slot="s8c">Exclusions : ${metric.exclusions.map((item) => `${escape(item.entityId)} (${escape(item.ruleId)})`).join(', ') || 'Aucune'}</p><ul data-review-slot="s8d">${issues
        .map(
          (issue) =>
            `<li data-review-slot="s8e" data-review-key="${escape(issue.id)}">${escape(issue.ruleId)} : ${escape(issue.message)} · ${issue.impacts
              .filter((impact) => impact.metricId === metric.id || impact.metricId.endsWith('*'))
              .map((impact) => escape(impact.reason))
              .join('; ')}</li>`
        )
        .join('')}</ul></details>`;
    })
    .join('')}</section>`;
}

/** Présente les changements observés sans leur attribuer artificiellement une date métier. */
export function transitionJournalContent(snapshot: Snapshot): string {
  const journal = snapshot.analytics.transitions;
  if (!journal)
    return '<article data-review-slot="s8f" class="panel"><h2 data-review-slot="s8g">Journal des transitions métier</h2><p data-review-slot="s8h">Aucune comparaison disponible ; transitions inconnues, pas zéro transition.</p></article>';
  const facts = issueFacts(snapshot);
  return `<article data-review-slot="s8i" class="panel table-panel"><h2 data-review-slot="s8j">Journal des transitions métier</h2><p data-review-slot="s8k">Observé à = capture du snapshot. Date métier = événement Project prouvé dans la période. Issues et anomalies ne s'additionnent pas.</p><div data-review-slot="s8l" class="table-wrap"><table data-review-slot="s8m"><thead data-review-slot="s8n"><tr data-review-slot="s8o">${['Entité', 'Avant', 'Après', 'Date métier', 'Observé à', 'Snapshots'].map((label, field) => `<th data-review-key="${field}" data-review-slot="s8p" scope="col">${label}</th>`).join('')}</tr></thead><tbody data-review-slot="s8q">${
    journal
      .map((entry) => {
        const fact = facts.find((item) => item.id === entry.issueId);
        return `<tr data-review-slot="s8r" data-review-key="${escape(JSON.stringify([entry.entityId, entry.fromSnapshotId, entry.toSnapshotId, entry.from, entry.to]))}" data-transition-row ${contextAttribute(fact ?? { id: entry.entityId })}><td data-review-slot="s8s"><a data-review-slot="s8t" href="graph.html?issue=${encodeURIComponent(entry.issueId ?? entry.entityId)}#traceability">${escape(entry.entityType)} · ${escape(entry.entityId)}</a></td><td data-review-slot="s8u">${escape(entry.from)}</td><td data-review-slot="s8v">${escape(entry.to)}</td><td data-review-slot="s8w">${escape(entry.businessAt ?? 'Non déterminée')}</td><td data-review-slot="s8x">${escape(entry.observedAt)}</td><td data-review-slot="s8y">${escape(entry.fromSnapshotId)} → ${escape(entry.toSnapshotId)}</td></tr>`;
      })
      .join('') ||
    '<tr data-review-slot="s8z"><td data-review-slot="s90" colspan="6">Aucune transition observée entre les deux snapshots comparables.</td></tr>'
  }</tbody></table></div></article>`;
}
