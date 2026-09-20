import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Analytics, AnomalyStatus, AuditStatus, DataQualityStatus, Severity, Snapshot } from '../domain/types.js';

export async function generateDashboard(snapshot: Snapshot, outputRoot: string, githubUrl?: string): Promise<void> {
  const dashboardPath = resolve(outputRoot, 'dashboard');
  await mkdir(resolve(dashboardPath, 'assets'), { recursive: true });
  const serializedSnapshot = JSON.stringify(snapshot).replace(/</g, '\\u003c');
  await Promise.all([
    writeFile(resolve(dashboardPath, 'index.html'), page('Vue d’ensemble', overviewContent(snapshot, githubUrl), serializedSnapshot), 'utf8'),
    writeFile(resolve(dashboardPath, 'anomalies.html'), page('Anomalies', anomaliesContent(snapshot, githubUrl), serializedSnapshot), 'utf8'),
    writeFile(resolve(dashboardPath, 'audits.html'), page('Audits et composants', auditsContent(snapshot, githubUrl), serializedSnapshot), 'utf8'),
    writeFile(resolve(dashboardPath, 'assets/style.css'), styles, 'utf8'),
    writeFile(resolve(dashboardPath, 'assets/app.js'), clientScript, 'utf8')
  ]);
}

function page(title: string, content: string, serializedSnapshot: string): string {
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} | Design System Quality</title>
  <link rel="stylesheet" href="assets/style.css">
</head>
<body>
  <header class="topbar"><a class="brand" href="index.html"><span class="brand-mark">DS</span><span>Pilotage qualité</span></a><nav><a href="index.html">Vue d’ensemble</a><a href="anomalies.html">Anomalies</a><a href="audits.html">Audits</a></nav><span class="status-pill status-${title === 'Vue d’ensemble' ? 'partial' : 'neutral'}">${title === 'Vue d’ensemble' ? 'À SURVEILLER' : 'V2.1'}</span></header>
  <main class="shell"><div class="page-heading"><div><p class="eyebrow">Qualité du Design System / V2.1</p><h1>${title}</h1><p class="muted">Lecture seule · données du snapshot courant</p></div><div class="snapshot-meta"><span>Date de capture</span><strong data-captured-at></strong><span>Version des règles</span><strong data-rule-version></strong></div></div>${content}</main>
  <script>window.__SNAPSHOT__ = ${serializedSnapshot};</script><script src="assets/app.js"></script>
</body></html>`;
}

function overviewContent(snapshot: Snapshot, githubUrl?: string): string {
  const { analytics, dataQuality } = snapshot;
  return `<section class="hero-band"><div><p class="eyebrow">Point de situation</p><h2>La qualité se pilote avec des faits.</h2><p>Chaque indicateur reste relié à ses objets sources et affiche son niveau de fiabilité.</p></div><div class="hero-ring"><strong>${analytics.openAnomalies.value}</strong><span>anomalie${analytics.openAnomalies.value === 1 ? '' : 's'} ouverte${analytics.openAnomalies.value === 1 ? '' : 's'}</span></div></section>
<section class="kpi-grid">${kpiCard('Anomalies déclarées', analytics.anomaliesDeclared, 'anomalies.html')} ${kpiCard('Anomalies corrigées', analytics.anomaliesCorrected, 'anomalies.html')} ${kpiCard('Couverture des audits', analytics.auditsCoverage, 'audits.html')} ${kpiCard('Conformité objective', analytics.conformityRate, 'audits.html')} ${delayCard('Délai moyen de correction', analytics.averageCorrectionDelayDays, 'anomalies.html')} ${delayCard('Délai médian de correction', analytics.medianCorrectionDelayDays, 'anomalies.html')}</section>
<section class="content-grid"><article class="panel"><div class="panel-heading"><div><p class="eyebrow">Répartition</p><h2>Criticité des anomalies</h2></div><span class="badge">${qualityLabel(analytics.anomaliesDeclared.reliability)}</span></div><div class="bars">${criticalityBars(analytics)}</div></article><article class="panel"><div class="panel-heading"><div><p class="eyebrow">Catégories</p><h2>Critères d’accessibilité</h2></div><span class="badge">${Object.keys(analytics.anomaliesByCategory).length} catégories</span></div><div class="bars">${categoryBars(analytics)}</div></article></section>
<section class="content-grid"><article class="panel alert-panel"><div class="panel-heading"><div><p class="eyebrow">Qualité des données</p><h2>Alertes à traiter</h2></div><span class="alert-count">${dataQuality.issues.length}</span></div><div class="severity-row"><span><i class="dot error"></i>Erreurs</span><strong>${dataQuality.summary.ERROR}</strong></div><div class="severity-row"><span><i class="dot warning"></i>Avertissements</span><strong>${dataQuality.summary.WARNING}</strong></div><div class="severity-row"><span><i class="dot info"></i>Informations</span><strong>${dataQuality.summary.INFO}</strong></div><a class="text-link" href="anomalies.html#quality">Voir les alertes de qualité →</a></article></section>
<article class="panel table-panel"><div class="panel-heading"><div><p class="eyebrow">Comparaison des sources</p><h2>Qualité par repository</h2></div><span class="badge">${snapshot.normalizedData.libraries.length} repositories</span></div><div class="table-wrap"><table><thead><tr><th>Repository</th><th>Composants</th><th>Anomalies</th><th>Ouvertes</th><th>PR fusionnées</th><th>Fiabilité</th></tr></thead><tbody>${repositoryRows(snapshot, githubUrl)}</tbody></table></div></article>
<article class="panel table-panel"><div class="panel-heading"><div><p class="eyebrow">Délais de traitement</p><h2>Temps de correction par repository</h2></div><span class="badge">Jours calendaires</span></div><div class="table-wrap"><table><thead><tr><th>Repository</th><th>Anomalies corrigées</th><th>Délai moyen</th><th>Délai médian</th><th>Plus long délai</th></tr></thead><tbody>${delayRows(snapshot)}</tbody></table></div></article>`;
}

function anomaliesContent(snapshot: Snapshot, githubUrl?: string): string {
  const libraryById = new Map(snapshot.normalizedData.libraries.map((library) => [library.libraryId, library.name]));
  const rows = snapshot.normalizedData.anomalies.map((anomaly) => { const component = snapshot.normalizedData.components.find((item) => item.componentId === anomaly.componentId); const linkedPullRequests = anomaly.pullRequestRefs.map((reference) => githubReference(snapshot, reference, githubUrl)).join(' ') || '—'; const categories = anomaly.categories.join(', ') || '—'; return `<tr data-criticality="${escapeHtml(anomaly.criticality ?? 'unknown')}" data-categories="${escapeHtml(anomaly.categories.join('|'))}"><td><strong>${escapeHtml(anomaly.anomalyId)}</strong><small>${githubReference(snapshot, anomaly.provenance.sourceId ?? 'source inconnue', githubUrl)}</small></td><td>${repositoryReference(snapshot, libraryById.get(component?.libraryId ?? '') ?? 'repository inconnu', githubUrl)}</td><td>${escapeHtml(component?.name ?? anomaly.componentId)}</td><td><span class="tag tag-${anomaly.criticality ?? 'unknown'}">${criticalityLabel(anomaly.criticality)}</span></td><td>${escapeHtml(categories)}</td><td><span class="state state-${anomaly.status}">${anomalyStatusLabel(anomaly.status)}</span></td><td>${linkedPullRequests}</td><td>${anomaly.everCorrected ? 'Oui' : 'Non'}</td></tr>`; }).join('');
  const issues = snapshot.dataQuality.issues.map((issue) => `<li><span class="tag tag-${issue.severity.toLowerCase()}">${severityLabel(issue.severity)}</span><div><strong>${escapeHtml(issue.ruleId)}</strong><p>${escapeHtml(qualityMessage(issue))}</p>${qualityIssueTarget(snapshot, issue, githubUrl)}</div></li>`).join('');
  return `<section class="page-intro"><p class="muted">${snapshot.normalizedData.anomalies.length} anomalies normalisées · ${snapshot.analytics.openAnomalies.value} ouvertes</p></section><article class="panel table-panel"><div class="panel-heading"><div><p class="eyebrow">Détail des objets</p><h2>Anomalies suivies</h2></div><input class="search" data-filter placeholder="Filtrer par repository, composant, criticité ou catégorie"></div><div class="table-wrap"><table><thead><tr><th>Identifiant</th><th>Repository</th><th>Composant</th><th>Criticité</th><th>Catégorie</th><th>État</th><th>PR liées</th><th>Corrigée</th></tr></thead><tbody data-table>${rows}</tbody></table></div></article><article class="panel" id="quality"><div class="panel-heading"><div><p class="eyebrow">Qualité des données</p><h2>Alertes et décisions de calcul</h2></div></div><ul class="issue-list">${issues}</ul></article>`;
}

function githubReference(snapshot: Snapshot, reference: string, githubUrl?: string): string {
  if (!githubUrl) return escapeHtml(reference);
  const baseUrl = githubUrl.replace(/\/+$/, '');
  for (const repository of snapshot.rawData.repositories) {
    const issue = repository.issues.find((candidate) => candidate.id === reference);
    if (issue) return `<a class="text-link" href="${baseUrl}/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/issues/${issue.number}" target="_blank" rel="noreferrer">${escapeHtml(reference)}</a>`;
    const pullRequest = repository.pullRequests.find((candidate) => candidate.id === reference);
    if (pullRequest) return `<a class="text-link" href="${baseUrl}/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/pull/${pullRequest.number}" target="_blank" rel="noreferrer">${escapeHtml(reference)}</a>`;
  }
  return escapeHtml(reference);
}

function repositoryReference(snapshot: Snapshot, repositoryName: string, githubUrl?: string): string {
  const repository = snapshot.rawData.repositories.find((candidate) => candidate.name === repositoryName);
  if (!repository || !githubUrl) return escapeHtml(repositoryName);
  return `<a class="text-link" href="${githubUrl.replace(/\/+$/, '')}/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}" target="_blank" rel="noreferrer">${escapeHtml(repositoryName)}</a>`;
}

function qualityIssueTarget(snapshot: Snapshot, issue: Snapshot['dataQuality']['issues'][number], githubUrl?: string): string {
  if (issue.entityType === 'anomaly') {
    const anomaly = snapshot.normalizedData.anomalies.find((candidate) => candidate.anomalyId === issue.entityId);
    const source = anomaly?.provenance.sourceId;
    return `<div class="quality-target"><span class="quality-target-label">Cible : anomalie ${escapeHtml(issue.entityId)}</span>${source ? `<span>Source : ${githubReference(snapshot, source, githubUrl)}</span>` : '<span>Aucune source GitHub disponible</span>'}</div>`;
  }
  if (issue.entityType === 'component') {
    const component = snapshot.normalizedData.components.find((candidate) => candidate.componentId === issue.entityId);
    const source = component?.provenance.sourceId;
    return `<div class="quality-target"><span class="quality-target-label">Cible : composant ${escapeHtml(component?.name ?? issue.entityId)}</span>${source ? `<span>Ouvrir la source : ${githubReference(snapshot, source, githubUrl)}</span>` : '<span>Aucune source GitHub disponible</span>'}</div>`;
  }
  if (issue.entityType === 'pull_request') {
    return `<div class="quality-target"><span class="quality-target-label">Cible : pull request</span><span>Ouvrir la source : ${githubReference(snapshot, issue.entityId, githubUrl)}</span></div>`;
  }
  return `<div class="quality-target"><span class="quality-target-label">Cible : ${escapeHtml(issue.entityType)}</span><span>Aucune source GitHub disponible (${escapeHtml(issue.entityId)})</span></div>`;
}

function qualityMessage(issue: Snapshot['dataQuality']['issues'][number]): string {
  return ({
    'DQ-001': 'L’anomalie n’a pas de criticité.',
    'DQ-002': 'L’anomalie possède plusieurs criticités incompatibles.',
    'DQ-003': 'L’anomalie possède plusieurs parents incompatibles.',
    'DQ-004': 'L’issue est terminée mais aucune pull request identifiable ne lui est associée.',
    'DQ-005': 'La pull request est fusionnée alors que l’issue associée est encore ouverte.',
    'DQ-006': 'Le composant détecté n’est pas présent dans le catalogue.',
    'DQ-007': 'L’issue contient un label inconnu.',
    'DQ-009': 'Nexus est indisponible : les preuves de release sont inconnues.'
  }[issue.ruleId] ?? issue.message);
}

function auditsContent(snapshot: Snapshot, githubUrl?: string): string {
  const libraryById = new Map(snapshot.normalizedData.libraries.map((library) => [library.libraryId, library.name]));
  const rows = snapshot.normalizedData.components.map((component) => { const audit = snapshot.normalizedData.audits.find((item) => item.componentId === component.componentId); return `<tr><td>${repositoryReference(snapshot, libraryById.get(component.libraryId) ?? 'repository inconnu', githubUrl)}</td><td><strong>${escapeHtml(component.name)}</strong><small>${escapeHtml(component.componentId)}</small></td><td><span class="tag tag-${component.discoverySource}">${discoveryLabel(component.discoverySource)}</span></td><td>${audit ? `<span class="state state-${audit.status}">${auditStatusLabel(audit.status)}</span>` : '<span class="state state-unknown">inconnu</span>'}</td><td>${audit?.version ?? '—'}</td><td>${qualityLabel(component.dataQualityStatus)}</td></tr>`; }).join('');
  return `<section class="page-intro"><p class="muted">Un composant non audité n’est jamais interprété comme non conforme.</p></section><article class="panel table-panel"><div class="panel-heading"><div><p class="eyebrow">Catalogue et audit</p><h2>Composants couverts</h2></div><span class="badge">${snapshot.normalizedData.components.length} composants</span></div><div class="table-wrap"><table><thead><tr><th>Repository</th><th>Composant</th><th>Découverte</th><th>Résultat objectif</th><th>Version</th><th>Fiabilité</th></tr></thead><tbody>${rows}</tbody></table></div></article>`;
}

function kpiCard(label: string, value: { value: number | 'unknown'; numerator: number | 'unknown'; denominator: number | 'unknown'; reliability: string; definition: string }, href: string): string { const display = value.value === 'unknown' ? '—' : value.value; const ratio = typeof value.numerator === 'number' && typeof value.denominator === 'number' && value.denominator > 0 && label !== 'Anomalies déclarées' ? `${Math.round((value.numerator / value.denominator) * 100)}%` : `${value.numerator}/${value.denominator}`; return `<a class="kpi-card" href="${href}"><span class="kpi-label">${label}</span><strong>${display}</strong><span class="kpi-ratio">${ratio} · ${qualityLabel(value.reliability as DataQualityStatus)}</span><span class="kpi-definition">${value.definition}</span></a>`; }
function delayCard(label: string, value: { value: number | 'unknown'; denominator: number | 'unknown'; reliability: string; definition: string }, href: string): string { const display = value.value === 'unknown' ? '—' : `${value.value} j`; const sample = typeof value.denominator === 'number' ? `${value.denominator} anomalie${value.denominator === 1 ? '' : 's'} corrigée${value.denominator === 1 ? '' : 's'}` : 'échantillon inconnu'; return `<a class="kpi-card" href="${href}"><span class="kpi-label">${label}</span><strong>${display}</strong><span class="kpi-ratio">${sample} · ${qualityLabel(value.reliability as DataQualityStatus)}</span><span class="kpi-definition">${value.definition}</span></a>`; }
function criticalityBars(analytics: Analytics): string { const values: Array<[string, string]> = [['blocking', 'bloquante'], ['major', 'majeure'], ['minor', 'mineure']]; return values.map(([key, label]) => linkedBar(label, analytics.anomaliesByCriticality[key] ?? 0, `anomalies.html?criticality=${encodeURIComponent(key)}`)).join(''); }
function categoryBars(analytics: Analytics): string { return Object.entries(analytics.anomaliesByCategory).sort(([, left], [, right]) => Number(right) - Number(left)).map(([category, value]) => linkedBar(category, value, `anomalies.html?category=${encodeURIComponent(category)}`)).join('') || '<p class="muted">Aucune catégorie détectée.</p>'; }
function repositoryRows(snapshot: Snapshot, githubUrl?: string): string {
  return snapshot.normalizedData.libraries.map((library) => {
    const components = snapshot.normalizedData.components.filter((component) => component.libraryId === library.libraryId);
    const componentIds = new Set(components.map((component) => component.componentId));
    const anomalies = snapshot.normalizedData.anomalies.filter((anomaly) => componentIds.has(anomaly.componentId));
    const pullRequests = snapshot.normalizedData.pullRequests.filter((pullRequest) => pullRequest.repository === library.name);
    const open = anomalies.filter((anomaly) => anomaly.status === 'open' || anomaly.status === 'reopened').length;
    const reliability = components.some((component) => component.dataQualityStatus !== 'reliable') ? 'partielle' : 'fiable';
    return `<tr><td>${repositoryReference(snapshot, library.name, githubUrl)}<small>${escapeHtml(library.repository)}</small></td><td>${components.length}</td><td>${anomalies.length}</td><td>${open}</td><td>${pullRequests.filter((pullRequest) => pullRequest.state === 'merged').length}</td><td><span class="tag tag-${reliability === 'fiable' ? 'reliable' : 'warning'}">${reliability}</span></td></tr>`;
  }).join('');
}
function delayRows(snapshot: Snapshot): string {
  const libraryById = new Map(snapshot.normalizedData.libraries.map((library) => [library.libraryId, library.name]));
  return snapshot.normalizedData.libraries.map((library) => {
    const componentIds = new Set(snapshot.normalizedData.components.filter((component) => component.libraryId === library.libraryId).map((component) => component.componentId));
    const delays = snapshot.normalizedData.anomalies.filter((anomaly) => componentIds.has(anomaly.componentId) && anomaly.firstDoneAt).map((anomaly) => (Date.parse(anomaly.firstDoneAt!) - Date.parse(anomaly.createdAt)) / 86_400_000).sort((left, right) => left - right);
    const average = delays.length === 0 ? 'inconnu' : `${(delays.reduce((total, delay) => total + delay, 0) / delays.length).toFixed(1)} j`;
    const median = delays.length === 0 ? 'inconnu' : `${(delays.length % 2 === 1 ? (delays[Math.floor(delays.length / 2)] ?? 0) : ((delays[delays.length / 2 - 1] ?? 0) + (delays[delays.length / 2] ?? 0)) / 2).toFixed(1)} j`;
    const longest = delays.length === 0 ? 'inconnu' : `${(delays[delays.length - 1] ?? 0).toFixed(1)} j`;
    return `<tr><td><strong>${escapeHtml(libraryById.get(library.libraryId) ?? library.name)}</strong></td><td>${delays.length}</td><td>${average}</td><td>${median}</td><td>${longest}</td></tr>`;
  }).join('');
}
function bar(label: string, value: number | 'unknown'): string { const width = typeof value === 'number' ? Math.min(value * 25, 100) : 0; return `<div class="bar-row"><span>${label}</span><div class="bar-track"><i style="width:${width}%"></i></div><strong>${value}</strong></div>`; }
function linkedBar(label: string, value: number | 'unknown', href: string): string { return `<a class="bar-link" href="${href}">${bar(label, value)}</a>`; }
function qualityLabel(value: DataQualityStatus): string { return ({ reliable: 'fiable', partial: 'partielle', unknown: 'inconnue', invalid: 'invalide' })[value]; }
function criticalityLabel(value: 'blocking' | 'major' | 'minor' | undefined): string { return value ? ({ blocking: 'bloquante', major: 'majeure', minor: 'mineure' })[value] : 'inconnue'; }
function anomalyStatusLabel(value: AnomalyStatus): string { return ({ open: 'ouverte', in_progress: 'en cours', done: 'terminée', reopened: 'réouverte', cancelled: 'annulée' })[value]; }
function auditStatusLabel(value: AuditStatus): string { return ({ not_evaluated: 'non évalué', in_progress: 'en cours', conform: 'conforme', conditional: 'conditionnel', non_conform: 'non conforme', critical: 'critique' })[value]; }
function severityLabel(value: Severity): string { return ({ INFO: 'information', WARNING: 'avertissement', ERROR: 'erreur' })[value]; }
function discoveryLabel(value: 'catalogue' | 'github' | 'suggested'): string { return ({ catalogue: 'catalogue', github: 'GitHub', suggested: 'suggestion' })[value]; }
function escapeHtml(value: string): string { return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character] ?? character); }

const styles = `@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Manrope:wght@400;600;700;800&display=swap');
:root{--ink:#17221f;--muted:#71807a;--line:#dce5df;--paper:#f4f7f3;--white:#fff;--mint:#b9e5d0;--green:#236b55;--coral:#de765f;--yellow:#e4b557;--blue:#7299c5}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:14px Manrope, sans-serif}a{color:inherit;text-decoration:none}.topbar{height:72px;background:var(--ink);color:#fff;display:flex;align-items:center;padding:0 clamp(20px,5vw,72px);gap:40px}.brand{display:flex;align-items:center;gap:10px;font-weight:800;letter-spacing:-.02em}.brand-mark{display:grid;place-items:center;width:30px;height:30px;background:var(--mint);color:var(--ink);font:12px 'DM Mono';border-radius:8px}.topbar nav{display:flex;gap:24px;color:#b4c3bc;font-weight:600}.topbar nav a:hover,.topbar nav a:first-child{color:#fff}.status-pill,.badge,.tag,.state{font:11px 'DM Mono',monospace;text-transform:uppercase;letter-spacing:.04em}.status-pill{margin-left:auto;padding:7px 10px;border-radius:99px}.status-partial{background:#63532b;color:#f6dc93}.status-neutral{background:#34413c;color:#cfe1d6}.shell{max-width:1240px;margin:0 auto;padding:56px clamp(20px,5vw,72px) 80px}.page-heading{display:flex;justify-content:space-between;gap:30px;align-items:flex-end;margin-bottom:34px}.eyebrow{margin:0 0 10px;color:var(--green);font:11px 'DM Mono';text-transform:uppercase;letter-spacing:.08em}.page-heading h1{margin:0;font-size:clamp(34px,5vw,58px);letter-spacing:-.06em;line-height:1}.muted{color:var(--muted)}.snapshot-meta{display:grid;grid-template-columns:auto auto;gap:6px 16px;color:var(--muted);font:11px 'DM Mono'}.snapshot-meta strong{color:var(--ink);font-weight:500}.hero-band{display:flex;justify-content:space-between;align-items:center;background:var(--green);color:#f5fff9;padding:34px 38px;border-radius:14px;margin-bottom:18px;overflow:hidden}.hero-band h2{font-size:clamp(24px,4vw,43px);letter-spacing:-.05em;margin:0 0 10px;max-width:590px}.hero-band p:last-child{color:#c4e0d2;max-width:540px}.hero-band .eyebrow{color:var(--mint)}.hero-ring{width:150px;height:150px;border:1px solid #9ed1b7;border-radius:50%;display:grid;place-content:center;text-align:center;flex:none}.hero-ring strong{font-size:48px;line-height:1}.hero-ring span{font-size:11px;color:#c4e0d2;max-width:90px;margin:auto}.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px}.kpi-card{background:var(--white);border:1px solid var(--line);padding:22px;min-height:182px;display:flex;flex-direction:column;transition:transform .18s,box-shadow .18s}.kpi-card:hover{transform:translateY(-3px);box-shadow:0 12px 25px #203d2b12}.kpi-label{font-size:12px;font-weight:700}.kpi-card strong{font-size:42px;letter-spacing:-.07em;margin:18px 0 3px}.kpi-ratio{font:11px 'DM Mono';color:var(--green)}.kpi-definition{font-size:11px;color:var(--muted);line-height:1.45;margin-top:auto}.content-grid{display:grid;grid-template-columns:1.3fr .7fr;gap:18px}.panel{background:var(--white);border:1px solid var(--line);padding:26px;margin-top:18px}.panel-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:24px}.panel h2{font-size:21px;letter-spacing:-.04em;margin:0}.badge{background:#e8f1eb;padding:7px 9px;color:var(--green)}.bars{display:grid;gap:18px}.bar-row{display:grid;grid-template-columns:70px 1fr 30px;align-items:center;gap:12px;font:12px 'DM Mono';text-transform:uppercase}.bar-track{height:10px;background:#edf2ee;border-radius:99px;overflow:hidden}.bar-track i{display:block;height:100%;background:var(--coral);border-radius:99px}.bar-row:nth-child(2) i{background:var(--yellow)}.bar-row:nth-child(3) i{background:var(--blue)}.severity-row{display:flex;justify-content:space-between;padding:13px 0;border-bottom:1px solid var(--line)}.severity-row span{display:flex;align-items:center;gap:9px}.dot{width:8px;height:8px;border-radius:50%;display:inline-block}.dot.error{background:var(--coral)}.dot.warning{background:var(--yellow)}.dot.info{background:var(--blue)}.alert-count{font-size:32px;color:var(--coral)}.text-link{display:block;color:var(--green);font-weight:700;margin-top:22px}.page-intro{margin-bottom:8px}.table-panel{overflow:hidden}.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse;min-width:650px}th{text-align:left;color:var(--muted);font:10px 'DM Mono';text-transform:uppercase;letter-spacing:.07em;padding:0 14px 13px}td{border-top:1px solid var(--line);padding:16px 14px;vertical-align:middle}td:first-child{padding-left:0}td strong,td small{display:block}td small{font:10px 'DM Mono';color:var(--muted);margin-top:5px}.tag,.state{display:inline-block;padding:6px 8px;border-radius:4px;background:#eef2ef}.tag-blocking,.tag-error{background:#fbe5df;color:#a84231}.tag-major,.tag-warning{background:#fff2d3;color:#8c681d}.tag-minor,.tag-reliable,.tag-catalogue{background:#e2f3e9;color:#236b55}.tag-unknown,.tag-suggested{background:#edf0f0;color:#62716b}.state-open,.state-reopened,.state-critical{color:#a84231;background:#fbe5df}.state-done,.state-conform{color:#236b55;background:#e2f3e9}.state-in_progress,.state-conditional{color:#8c681d;background:#fff2d3}.search{width:220px;border:1px solid var(--line);padding:10px 12px;font:12px Manrope}.issue-list{display:grid;gap:12px;padding:0;margin:0;list-style:none}.issue-list li{display:flex;gap:14px;padding:14px;background:var(--paper)}.issue-list p{margin:5px 0;color:var(--muted)}.issue-list small{font:10px 'DM Mono';color:var(--muted)}@media(max-width:800px){.topbar{gap:16px}.topbar nav{gap:10px;font-size:11px}.topbar nav a:nth-child(2){display:none}.page-heading{display:block}.snapshot-meta{margin-top:22px}.hero-band{align-items:flex-start;gap:20px;padding:25px}.hero-ring{width:100px;height:100px}.hero-ring strong{font-size:30px}.kpi-grid{grid-template-columns:repeat(2,1fr)}.content-grid{grid-template-columns:1fr}}@media(max-width:480px){.topbar{padding:0 16px}.brand span:last-child{display:none}.shell{padding:35px 16px 55px}.kpi-grid{grid-template-columns:1fr}.hero-band{display:block}.hero-ring{margin:24px 0 0}.panel{padding:20px}.panel-heading{display:block}.search{width:100%;margin-top:16px}}
`;

const clientScript = `const snapshot = window.__SNAPSHOT__; document.querySelector('[data-captured-at]').textContent = new Date(snapshot.capturedAt).toLocaleString('fr-FR'); document.querySelector('[data-rule-version]').textContent = snapshot.ruleVersion; const filter = document.querySelector('[data-filter]'); const params = new URLSearchParams(window.location.search); let selectedCriticality = params.get('criticality'); let selectedCategory = params.get('category'); const criticalityLabels = { blocking: 'bloquante', major: 'majeure', minor: 'mineure' }; if (filter && (selectedCriticality || selectedCategory)) filter.value = criticalityLabels[selectedCriticality] || selectedCategory || ''; const applyFilter = (query) => { const normalizedQuery = query.toLowerCase(); document.querySelectorAll('[data-table] tr').forEach((row) => { const matchesText = !normalizedQuery || row.textContent.toLowerCase().includes(normalizedQuery); const matchesCriticality = !selectedCriticality || row.dataset.criticality === selectedCriticality; const matchesCategory = !selectedCategory || row.dataset.categories.split('|').includes(selectedCategory); row.hidden = !(matchesText && matchesCriticality && matchesCategory); }); }; if (filter) { filter.addEventListener('input', (event) => { selectedCriticality = null; selectedCategory = null; applyFilter(event.target.value); }); applyFilter(filter.value); }`;
