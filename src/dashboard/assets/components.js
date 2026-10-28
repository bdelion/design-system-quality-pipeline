import { markReview } from './review-core.js';
import { readPageModel } from './page-model.js';
/* global URL, Blob */
import { durationStatistics } from './statistics.js';
import { matchesFact, currentContext, setContext, contextKeys } from './context.js';

(() => {
  const root = document.querySelector('[data-component-analysis]');
  if (!root) return;
  /** Trouve un contrôle dans l'explorateur courant. */
  const $ = (selector) => root.querySelector(selector);
  /** Annonce le périmètre URL et la population effective dans un seul résumé des résultats. */
  function updateSummary(message) {
    const context = currentContext();
    $('[data-component-summary]').textContent =
      `Repository : ${context.get('repository') || 'tous'} · Composant : ${context.get('component') || 'tous'} · Version : ${context.get('version') || 'toutes'} · ${message}`;
  }
  const pageModel = readPageModel();
  const rows = pageModel?.data.components;
  if (!Array.isArray(rows)) {
    updateSummary(
      'Données de l’explorateur indisponibles. Régénérez le dashboard depuis un snapshot compatible.'
    );
    root.querySelectorAll('input, select, button').forEach((control) => {
      control.disabled = true;
    });
    root.querySelectorAll('[data-component-count]').forEach((count) => {
      count.textContent = 'Indisponible';
    });
    return;
  }
  /** Échappe les valeurs des cellules et des liens générés. */
  const escape = (value) =>
    String(value ?? '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
    );
  /** Affiche une durée ou l'absence de population calculable. */
  const fmt = (value) => (Number.isFinite(value) ? `${value.toFixed(1)} j` : '—');
  const selected = new Set();
  let selecting = false;
  let sort = 0;
  let descending = false;
  // Les composants découverts par labels et leurs versions restent sélectionnables hors catalogue.
  const scopes = {
    repository: rows.map((row) => row.repository),
    component: rows.map((row) => row.name),
    version: rows.flatMap((row) => [
      ...row.auditSources.map((audit) => audit.version),
      ...(row.versionSummaries ?? []).map((item) => item.version),
      ...row.items.flatMap((item) => item.versions)
    ])
  };
  for (const [key, values] of Object.entries(scopes)) {
    const control = document.querySelector(`[data-context-filter="${key}"]`);
    for (const value of [...new Set(values)]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'fr', { numeric: true }))) {
      const known = [...control.options].find((option) => option.value === value);
      if (known) {
        known.textContent = value;
        continue;
      }
      const option = markReview('s3', document.createElement('option'));
      option.value = value;
      option.textContent = value;
      control.append(option);
    }
  }
  const controls = ['auditStatus', 'conformity', 'open'];
  for (const field of controls.filter((key) => key !== 'open')) {
    const values = [...new Set(rows.map((row) => row[field]).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, 'fr')
    );
    for (const value of values) {
      const option = markReview('s4', document.createElement('option'));
      option.value = value;
      option.textContent = value;
      $(`[data-component-filter="${field}"]`).append(option);
    }
  }
  const columns = [...root.querySelectorAll('[data-component-column]')];
  /** Projette le résultat de l’audit sur sa version cible, sans héritage vers une autre version. */
  function projectRow(row) {
    const context = currentContext();
    const version = context.get('version');
    const items = row.items.filter(
      (item) =>
        matchesFact(item, context) &&
        (!version || item.versions.includes(version) || item.versionIds.includes(version))
    );
    const latestAudit = version
      ? row.auditSources.find((audit) => audit.version === version || audit.versionId === version)
      : row.auditSources.find((audit) => audit.id === row.latestAuditId);
    return {
      ...row,
      version: version || latestAudit?.version || '',
      conformity: latestAudit?.result || 'Aucun résultat définitif',
      auditIds: latestAudit ? [latestAudit.id] : [],
      latestAuditUrl: latestAudit?.url ?? '',
      latestAuditVersion: latestAudit?.version ?? '',
      latestAuditResult: latestAudit?.result ?? '',
      latestAuditPublication: latestAudit?.publication ?? '',
      auditStatus: latestAudit?.status ?? 'non audité',
      items,
      matches:
        matchesFact(
          {
            repository: row.repository,
            components: [row.name],
            componentIds: row.componentIds ?? [row.componentId],
            versions: [...row.auditSources, ...(row.versionSummaries ?? [])].map((item) => item.version),
            versionIds: [...row.auditSources, ...(row.versionSummaries ?? [])].map((item) => item.versionId)
          },
          new URLSearchParams(
            [...context].filter(([key]) => ['repository', 'component', 'version'].includes(key))
          )
        ) &&
        (!['issue', 'audit', 'anomaly', 'family'].some((key) => context.get(key)) || items.length > 0)
    };
  }
  /** Rend uniquement les URL HTTPS résolues, avec ouverture externe explicite. */
  function externalLink(url, value, title, identity = 'source') {
    return /^https:\/\/[^\s]+$/.test(url ?? '')
      ? `<a data-review-slot="s5" data-review-key="${escape(identity)}" href="${escape(url)}" target="_blank" rel="noopener noreferrer"${title ? ` title="${escape(title)}"` : ''}>${escape(value)} ↗</a>`
      : escape(value);
  }
  /** Associe les recherches GitHub et les audits justificatifs aux colonnes correspondantes. */
  function linkedValue(row, oldest, value, index) {
    if (index === 1 && row.versionSummaries?.length) {
      const context = currentContext();
      const version = context.get('version');
      const history = row.versionSummaries.filter(
        (item) => !version || item.version === version || item.versionId === version
      );
      return (
        escape(value) +
        `<details data-review-slot="s6" data-component-history><summary data-review-slot="s7">Qualité par version (${history.length})</summary><dl data-review-slot="s8">${history.map((item) => `<div data-review-slot="s9" data-review-key="${escape(item.versionId || item.version)}"><dt data-review-slot="sa"><strong data-review-slot="sb">${escape(item.version)}</strong> · ${escape(item.channel === 'development' ? 'Développement' : item.publication)}</dt><dd data-review-slot="sc">Conformité : ${escape({ CONFORME: 'Conforme', NON_CONFORME: 'Non conforme', NON_COUVERT: 'Non couvert' }[item.conformity] ?? 'Indéterminée')}<br data-review-slot="sd">Audits justificatifs : ${(item.auditSources ?? []).map((audit) => externalLink(audit.url, audit.id, undefined, audit.id)).join('<br data-review-slot="se">') || 'Aucun'}<br data-review-slot="sf">Preuve de présence : ${escape(item.provenance)}</dd></div>`).join('')}</dl></details>`
      );
    }
    const field = { 2: 'issues', 3: 'open', 4: 'treated', 5: 'cancelled', 6: 'prs', 7: 'audits' }[index];
    if (index === 6 && row.githubLinks?.prSearches.length > 1) {
      return (
        externalLink(
          row.githubLinks.prs,
          `${value} · GitHub actuel ≈`,
          'Recherche approchée par références d’issues.'
        ) +
        '<small data-review-slot="sg">' +
        row.githubLinks.prSearches
          .slice(1)
          .map((url, i) => externalLink(url, `GitHub actuel ≈ · PR ${i + 2}`, undefined, 'pr-search:' + i))
          .join('<br data-review-slot="sh">') +
        '</small>'
      );
    }
    if (field)
      return externalLink(
        row.githubLinks?.[field],
        /^https:\/\/[^\s]+$/.test(row.githubLinks?.[field] ?? '') ? `${value} · GitHub actuel ≈` : value,
        'Recherche approchée ; le compteur reste celui du snapshot.'
      );
    if (index === 8) return externalLink(row.latestAuditUrl, value);
    if (index === 9) {
      const audits = row.auditSources.filter(
        (audit) => row.auditIds.includes(audit.id) && /^https:\/\/[^\s]+$/.test(audit.url)
      );
      return audits.length
        ? audits
            .map((audit, i) => externalLink(audit.url, i === 0 ? value : audit.id, undefined, audit.id))
            .join('<br data-review-slot="si">')
        : escape(value);
    }
    if (index === 10 && oldest) return externalLink(oldest.url, value);
    return escape(value);
  }
  /** Rend les résultats et annonce séparément composants visibles, sélection et issues Analytics distinctes. */
  function render() {
    root.dataset.reviewState = JSON.stringify({ sort, descending });
    const query = $('[data-component-search]').value.toLocaleLowerCase('fr');
    const visible = rows
      .map(projectRow)
      .filter(
        (row) =>
          row.matches &&
          controls.every((field) => {
            const value = $(`[data-component-filter="${field}"]`).value;
            return (
              !value ||
              (field === 'open'
                ? (value === 'yes') === row.items.some((item) => item.open)
                : row[field] === value)
            );
          }) &&
          (!query || `${row.repository} ${row.name}`.toLocaleLowerCase('fr').includes(query))
      )
      .map((row) => {
        const oldest = row.items
          .filter((item) => item.open)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
        const stats = durationStatistics(row.items).global;
        const prs = new Set(row.items.flatMap((item) => item.prs));
        const age = oldest
          ? Math.max(0, (Date.parse(pageModel.snapshot.capturedAt) - Date.parse(oldest.createdAt)) / 86400000)
          : null;
        return {
          row,
          oldest,
          values: [
            row.repository,
            row.name,
            row.items.length,
            row.items.filter((item) => item.open).length,
            row.items.filter((item) => item.treated).length,
            row.items.filter((item) => item.cancelled).length,
            prs.size,
            row.audits,
            `${row.latestAuditVersion} ${row.auditStatus} ${row.latestAuditResult}`.trim(),
            `${row.conformity}${row.latestAuditVersion ? ' · ' + row.latestAuditVersion : ''}${row.latestAuditPublication ? ' (' + row.latestAuditPublication + ')' : ''}`,
            oldest ? `#${oldest.number}` : '—',
            fmt(age),
            fmt(stats.average)
          ]
        };
      })
      .filter(({ values }) =>
        columns.every(
          (input, index) =>
            !input.value ||
            String(values[index]).toLocaleLowerCase('fr').includes(input.value.toLocaleLowerCase('fr'))
        )
      );
    visible.sort((a, b) => {
      const x = a.values[sort],
        y = b.values[sort];
      const nx = parseFloat(x),
        ny = parseFloat(y);
      const primary =
        Number.isFinite(nx) && Number.isFinite(ny)
          ? nx - ny
          : String(x).localeCompare(String(y), 'fr', { numeric: true });
      const cmp =
        primary ||
        (sort === 0 ? String(a.values[1]).localeCompare(String(b.values[1]), 'fr', { numeric: true }) : 0);
      return descending ? -cmp : cmp;
    });
    const chosen = visible.filter(({ row }) => !selecting || selected.has(row.id));
    const items = [
      ...new Map(chosen.flatMap(({ row }) => row.items.map((item) => [item.id, item]))).values()
    ];
    for (const [kind, statistics] of Object.entries(durationStatistics(items))) {
      for (const stat of ['average', 'median', 'p90'])
        $(`[data-component-kpi="${kind}-${stat}"]`).textContent = fmt(statistics[stat]);
      $(`[data-component-count="${kind}"]`).textContent = `${statistics.count} issue(s) distincte(s)`;
    }
    const summary =
      `${visible.length} composant${visible.length === 1 ? '' : 's'} visible${visible.length === 1 ? '' : 's'} · ` +
      (selecting
        ? `${chosen.length} composant${chosen.length === 1 ? '' : 's'} sélectionné${chosen.length === 1 ? '' : 's'} · `
        : '') +
      `${items.length} issues distinctes${selecting ? ' dans la sélection' : ''}`;
    updateSummary(summary);
    $('[data-component-all]').checked =
      visible.length > 0 && visible.every(({ row }) => selected.has(row.id));
    $('[data-component-rows]').innerHTML = visible
      .map(
        ({ row, oldest, values }) =>
          `<tr data-review-slot="sj" data-review-key="${escape(row.id)}"><td data-review-slot="sk"><input data-review-slot="sl" type="checkbox" data-component-check="${escape(row.id)}" aria-label="Sélectionner ${escape(row.name)}" ${selected.has(row.id) ? 'checked' : ''}></td>${values.map((value, index) => `<td data-review-slot="sm" data-review-key="field:${index}">${linkedValue(row, oldest, value, index)}</td>`).join('')}</tr>`
      )
      .join('');
    return visible;
  }
  root
    .querySelectorAll('select,input[data-component-search],input[data-component-column]')
    .forEach((control) =>
      control.addEventListener('input', () => {
        render();
      })
    );
  root.querySelectorAll('[data-component-sort]').forEach((button) =>
    button.addEventListener('click', () => {
      const next = Number(button.dataset.componentSort);
      descending = next === sort ? !descending : false;
      sort = next;
      root
        .querySelectorAll('[data-component-sort]')
        .forEach((header) =>
          header.parentElement.setAttribute(
            'aria-sort',
            Number(header.dataset.componentSort) === sort ? (descending ? 'descending' : 'ascending') : 'none'
          )
        );
      render();
    })
  );
  $('[data-component-rows]').addEventListener('change', (event) => {
    const id = event.target.dataset.componentCheck;
    if (!id) return;
    if (event.target.checked) selected.add(id);
    else selected.delete(id);
    selecting = true;
    render();
  });
  $('[data-component-all]').addEventListener('change', (event) => {
    const checked = event.target.checked;
    for (const { row } of render())
      if (checked) selected.add(row.id);
      else selected.delete(row.id);
    selecting = true;
    render();
  });
  $('[data-component-clear]').addEventListener('click', () => {
    selected.clear();
    selecting = false;
    render();
  });
  $('[data-component-reset]').addEventListener('click', () => {
    root
      .querySelectorAll('select,input[data-component-search],input[data-component-column]')
      .forEach((control) => {
        control.value = '';
      });
    sort = 0;
    descending = false;
    selected.clear();
    selecting = false;
    root
      .querySelectorAll('[data-component-sort]')
      .forEach((header) =>
        header.parentElement.setAttribute(
          'aria-sort',
          header.dataset.componentSort === '0' ? 'ascending' : 'none'
        )
      );
    setContext(Object.fromEntries([...contextKeys, 'progress', 'result', 'scope'].map((key) => [key, ''])));
    render();
  });
  $('[data-component-export]').addEventListener('click', () => {
    const records = render(),
      header = [
        'Repository',
        'Composant',
        'Issues',
        'Ouvertes',
        'Traitées',
        'Annulées',
        'PR',
        'Audits',
        'Dernier audit',
        'Résultat de l’audit · version cible',
        'Plus ancienne ouverte',
        'Ancienneté maximale',
        'Délai moyen'
      ];
    const csv =
      '\ufeff' +
      [header, ...records.map((record) => record.values)]
        .map((record) => record.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(';'))
        .join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })),
      link = markReview('sn', document.createElement('a'));
    link.href = url;
    link.download = 'analyse-composants.csv';
    link.click();
    URL.revokeObjectURL(url);
  });
  /** Relit uniquement le périmètre URL après navigation ou changement des sélecteurs partagés. */
  function synchronize() {
    render();
  }
  window.addEventListener('dashboard-context-change', synchronize);
  window.addEventListener('popstate', synchronize);
  synchronize();
})();
