import { metricFormula } from '../analytics/catalog.js';
import { issueFacts } from './read-model.js';
import type { Snapshot } from '../domain/types.js';

/** Échappe toute valeur injectée dans du texte ou un attribut HTML. */
function escape(value: unknown): string { return String(value ?? '').replace(/[&<>"']/g, (character) => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[character]!)); }

/** Sérialise les dimensions explicites d'un fait pour les filtres communs. */
export function contextAttribute(fact: unknown): string { return `data-context="${escape(JSON.stringify(fact))}"`; }

/** Affiche uniquement les URL HTTPS sûres, sans inventer de destination pour une référence orpheline. */
function sourceLink(url: string | undefined, label: string): string {
  return url && /^https:\/\/[^\s"<>]+$/.test(url) ? `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(label)} ↗</a>` : `<span>${escape(label)} · source non résolue</span>`;
}

/** Construit le sélecteur de périmètre partagé ; les KPI globaux restent explicitement identifiés. */
export function contextToolbar(snapshot: Snapshot): string {
  const options = {repository: snapshot.normalizedData.libraries.map((item) => item.repository), component: snapshot.normalizedData.components.flatMap((item) => [item.name,item.componentId]), version: (snapshot.normalizedData.versions ?? []).flatMap((item) => [item.number,item.versionId])};
  return `<section class="panel context-toolbar" aria-label="Périmètre de navigation"><h2>Périmètre de navigation</h2><div class="filter-bar">${Object.entries(options).map(([key, values]) => `<label>${({repository:'Repository',component:'Composant',version:'Version PROD'} as Record<string,string>)[key]}<select data-context-filter="${key}"><option value="">Tous</option>${[...new Set(values)].sort().map((value) => `<option value="${escape(value)}">${escape(value)}</option>`).join('')}</select></label>`).join('')}<button type="button" class="reset-button" data-clear-context>Effacer le périmètre</button></div><p class="muted">Les cartes KPI décrivent le snapshot complet. Les tableaux et les statistiques des explorateurs suivent le périmètre et la sélection.</p><p role="status" aria-live="polite" data-filter-feedback></p></section>`;
}

/** Restitue toutes les issues, même transverses, avec les liens explicites et les ruptures de traçabilité. */
export function traceabilityContent(snapshot: Snapshot): string {
  const data = snapshot.normalizedData;
  const rows = issueFacts(snapshot).map((fact) => {
    const anomalies = data.anomalies.filter((item) => fact.anomalyIds.includes(item.anomalyId));
    const auditLabels = fact.auditIds.map((id) => {const audit = data.audits.find((item) => item.auditId === id)!; return `<a href="audits.html?audit=${encodeURIComponent(id)}">${escape(id)}</a> · ${escape(audit.lifecycle ?? audit.status)}`;}).join('<br>');
    const missing = anomalies.flatMap((item) => item.origin === 'UNDETERMINED' ? [`Origine non résolue (${item.parentRefs.join(', ') || 'parent absent'})`] : []);
    const prs = [...new Set([...fact.prs, ...data.pullRequests.filter((pr) => pr.relatedIssueIds.includes(fact.id)).map((pr) => pr.pullRequestId)])];
    return `<tr data-trace-row ${contextAttribute(fact)}><td>${sourceLink(fact.url, fact.key)}<small>${escape(fact.title)}</small></td><td>${escape(fact.familyLabel)}<small>${escape(fact.status)} / GitHub ${escape(fact.githubState)}</small></td><td>${fact.anomalyIds.map((id) => `<a href="anomalies.html?anomaly=${encodeURIComponent(id)}">${escape(id)}</a>`).join('<br>') || 'Aucune spécialisation anomalie'}${missing.map((reason) => `<small>${escape(reason)}</small>`).join('')}</td><td>${auditLabels || 'Aucun audit explicitement relié'}</td><td>${escape(fact.versions.join(', ') || 'Version non déterminée')}</td><td>${escape(fact.components.join(', ') || 'Issue transverse / composant non déterminé')}</td><td>${escape(fact.repo)}</td><td>${prs.map((id) => {const pr = data.pullRequests.find((item) => item.pullRequestId === id); const rawRepo = snapshot.rawData.repositories.find((repo) => repo.pullRequests.some((item) => item.id === id)); const rawPr = rawRepo?.pullRequests.find((item) => item.id === id); return sourceLink(rawRepo && rawPr ? `https://github.com/${rawRepo.owner}/${rawRepo.name}/pull/${rawPr.number}` : undefined, `${id}${pr ? ` (${pr.state})` : ''}`);}).join('<br>') || 'Aucune PR explicitement reliée'}</td></tr>`;
  }).join('');
  return `<article class="panel table-panel" id="traceability"><h2>Chaîne de preuve exhaustive</h2><p>Issue → anomalie → audit → version → composant → repository → PR. Une absence ou une référence orpheline reste visible ; le partage d'un composant n'attribue aucune anomalie à un audit.</p><div class="table-wrap" tabindex="0" role="region" aria-label="Tableau défilant"><table><caption>Relations explicites de toutes les issues normalisées</caption><thead><tr>${['Issue source','Famille et état','Anomalie','Audit','Version','Composant','Repository','PR'].map((label) => `<th scope="col">${label}</th>`).join('')}</tr></thead><tbody>${rows || '<tr><td colspan="8">Aucune issue normalisée.</td></tr>'}</tbody></table></div></article>`;
}

/** Expose formule, population, sources, exclusions et alertes de chaque métrique conservée dans Analytics. */
export function metricExplanationContent(snapshot: Snapshot): string {
  const facts = issueFacts(snapshot);
  const metrics = {...snapshot.analytics.metrics, ...snapshot.analytics.flows};
  return `<section class="panel" id="metrics"><h2>Preuves des métriques Analytics</h2><p>Un effectif nul n'est pas une donnée inconnue. Sans date métier prouvée, aucune date de réalisation d'audit n'est inventée. Les délais estimés sont séparés des dates Done.</p>${Object.values(metrics).map((metric) => {
    const sources = metric.sourceEntityIds.map((id) => {
      const fact = facts.find((item) => item.id === id || item.auditIds.includes(id) || item.anomalyIds.includes(id));
      if (fact) return `<a href="graph.html?issue=${encodeURIComponent(fact.id)}#traceability">${escape(id)}</a>`;
      const relation=snapshot.normalizedData.componentVersions?.find((item) => item.componentVersionId===id);
      const component=snapshot.normalizedData.components.find((item) => item.componentId===(relation?.componentId ?? id));
      return component ? `<a href="audits.html?component=${encodeURIComponent(component.componentId)}${relation ? '&version='+encodeURIComponent(relation.versionId) : ''}#component-versions">${escape(id)}</a>` : escape(id);
    }).join(', ') || 'Population vide';
    const issues = metric.reliability.issueIds.map((id) => snapshot.dataQuality.issues.find((issue) => issue.id === id)).filter((issue) => issue !== undefined);
    return `<details id="metric-${escape(metric.id)}"><summary>${escape(metric.id)} · ${escape(metric.value)} ${escape(metric.unit)} · ${escape(metric.reliability.status)}</summary><p>${escape(metric.definition)}</p><p>Formule : ${escape(metricFormula(metric.id))}</p><p>Périmètre : ${escape(metric.scope)} · Numérateur : ${escape(metric.numerator ?? 'inconnu')} · Dénominateur : ${escape(metric.denominator ?? 'inconnu')}${metric.period ? ` · Période : ${escape(metric.period.from)} → ${escape(metric.period.to)}` : ''}</p><p>Sources retenues : ${sources}</p><p>Exclusions : ${metric.exclusions.map((item) => `${escape(item.entityId)} (${escape(item.ruleId)})`).join(', ') || 'Aucune'}</p><ul>${issues.map((issue) => `<li>${escape(issue.ruleId)} : ${escape(issue.message)} · ${issue.impacts.filter((impact) => impact.metricId === metric.id || impact.metricId.endsWith('*')).map((impact) => escape(impact.reason)).join('; ')}</li>`).join('')}</ul></details>`;
  }).join('')}</section>`;
}

/** Présente les changements observés sans leur attribuer artificiellement une date métier. */
export function transitionJournalContent(snapshot: Snapshot): string {
  const journal = snapshot.analytics.transitions;
  if (!journal) return '<article class="panel"><h2>Journal des transitions métier</h2><p>Aucune comparaison disponible ; transitions inconnues, pas zéro transition.</p></article>';
  const facts = issueFacts(snapshot);
  return `<article class="panel table-panel"><h2>Journal des transitions métier</h2><p>Observé à = capture du snapshot. Date métier = événement Project prouvé dans la période. Issues et anomalies ne s'additionnent pas.</p><div class="table-wrap"><table><thead><tr>${['Entité','Avant','Après','Date métier','Observé à','Snapshots'].map((label) => `<th scope="col">${label}</th>`).join('')}</tr></thead><tbody>${journal.map((entry) => {
    const fact = facts.find((item) => item.id === entry.issueId);
    return `<tr data-transition-row ${contextAttribute(fact ?? {id:entry.entityId})}><td><a href="graph.html?issue=${encodeURIComponent(entry.issueId ?? entry.entityId)}#traceability">${escape(entry.entityType)} · ${escape(entry.entityId)}</a></td><td>${escape(entry.from)}</td><td>${escape(entry.to)}</td><td>${escape(entry.businessAt ?? 'Non déterminée')}</td><td>${escape(entry.observedAt)}</td><td>${escape(entry.fromSnapshotId)} → ${escape(entry.toSnapshotId)}</td></tr>`;
  }).join('') || '<tr><td colspan="6">Aucune transition observée entre les deux snapshots comparables.</td></tr>'}</tbody></table></div></article>`;
}