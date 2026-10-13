/* global URL, Blob */
import { durationStatistics } from './statistics.js';
import { matchesFact, currentContext, setContext } from './context.js';

(() => {
  const root = document.querySelector('[data-component-analysis]');
  if (!root) return;
  const rows = JSON.parse(document.getElementById('component-analysis-data').textContent);
  /** Trouve un contrôle dans l'explorateur courant. */
  const $ = (selector) => root.querySelector(selector);
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
  const controls = ['repository', 'name', 'auditStatus', 'conformity', 'version', 'open'];
  for (const field of controls.filter((key) => key !== 'open')) {
    const values = [
      ...new Set(
        rows
          .flatMap((row) =>
            field === 'version' ? row.versionSummaries.map((summary) => summary.version) : [row[field]]
          )
          .filter(Boolean)
      )
    ].sort((a, b) => a.localeCompare(b, 'fr'));
    for (const value of values) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      $(`[data-component-filter="${field}"]`).append(option);
    }
  }
  const columns = [...root.querySelectorAll('[data-component-column]')];
  /** Projette la version demandée sans recalculer son verdict Analytics. */
  function projectRow(row) {
    const context = currentContext();
    const version = context.get('version') || $('[data-component-filter="version"]').value;
    const summary = version
      ? row.versionSummaries.find((item) => item.version === version || item.versionId === version)
      : row.versionSummaries.at(-1);
    const items = row.items.filter(
      (item) =>
        matchesFact(item, context) &&
        (!version || item.versions.includes(version) || item.versionIds.includes(version))
    );
    const latestAudit = version
      ? (row.auditSources.find((audit) => summary?.auditIds.includes(audit.id)) ??
        row.auditSources.find((audit) => audit.version === summary?.version))
      : row.auditSources.find((audit) => audit.id === row.latestAuditId);
    return {
      ...row,
      version: summary?.version ?? row.version,
      conformity: summary?.conformity ?? 'NON_COUVERT',
      auditIds: summary?.auditIds ?? [],
      latestAuditUrl: latestAudit?.url ?? '',
      latestAuditVersion: latestAudit?.version ?? '',
      auditStatus: latestAudit?.status ?? 'non audité',
      items,
      matches:
        matchesFact(
          {
            repository: row.repository,
            components: [row.name],
            componentIds: [row.componentId],
            versions: row.versionSummaries.map((item) => item.version),
            versionIds: row.versionSummaries.map((item) => item.versionId)
          },
          new URLSearchParams(
            [...context].filter(([key]) => ['repository', 'component', 'version'].includes(key))
          )
        ) &&
        (!['issue', 'audit', 'anomaly', 'family'].some((key) => context.get(key)) || items.length > 0)
    };
  }
  /** Rend uniquement les URL HTTPS résolues, avec ouverture externe explicite. */
  function externalLink(url, value, title) {
    return /^https:\/\/[^\s]+$/.test(url ?? '')
      ? `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer"${title ? ` title="${escape(title)}"` : ''}>${escape(value)} ↗</a>`
      : escape(value);
  }
  /** Associe les recherches GitHub et les audits justificatifs aux colonnes correspondantes. */
  function linkedValue(row, oldest, value, index) {
    const field = { 2: 'issues', 3: 'open', 4: 'treated', 5: 'cancelled', 6: 'prs', 7: 'audits' }[index];
    if (index === 6 && row.githubLinks?.prSearches.length > 1) {
      return (
        externalLink(row.githubLinks.prs, value, 'PR par références d’issues ; première recherche.') +
        '<small>' +
        row.githubLinks.prSearches
          .slice(1)
          .map((url, i) => externalLink(url, `Recherche PR ${i + 2}`))
          .join('<br>') +
        '</small>'
      );
    }
    if (field)
      return externalLink(
        row.githubLinks?.[field],
        value,
        'Recherche GitHub actuelle ; population approchée, voir les explications au-dessus du tableau.'
      );
    if (index === 8) return externalLink(row.latestAuditUrl, value);
    if (index === 9) {
      const audits = row.auditSources.filter(
        (audit) => row.auditIds.includes(audit.id) && /^https:\/\/[^\s]+$/.test(audit.url)
      );
      return audits.length
        ? audits.map((audit, i) => externalLink(audit.url, i === 0 ? value : audit.id)).join('<br>')
        : escape(value);
    }
    if (index === 10 && oldest) return externalLink(oldest.url, value);
    return escape(value);
  }
  /** Filtre et trie par repository puis composant par défaut, en agrégeant les faits Analytics distincts. */
  function render() {
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
          ? Math.max(
              0,
              (Date.parse(window.__SNAPSHOT__.capturedAt) - Date.parse(oldest.createdAt)) / 86400000
            )
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
            `${row.latestAuditVersion} ${row.auditStatus}`.trim(),
            row.conformity,
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
    $('[data-component-summary]').textContent =
      `${visible.length} composants · ${items.length} issues distinctes${selecting ? ' sélectionnées' : ''}`;
    $('[data-component-all]').checked =
      visible.length > 0 && visible.every(({ row }) => selected.has(row.id));
    $('[data-component-rows]').innerHTML = visible
      .map(
        ({ row, oldest, values }) =>
          `<tr><td><input type="checkbox" data-component-check="${escape(row.id)}" aria-label="Sélectionner ${escape(row.name)}" ${selected.has(row.id) ? 'checked' : ''}></td>${values.map((value, index) => `<td>${linkedValue(row, oldest, value, index)}</td>`).join('')}</tr>`
      )
      .join('');
    return visible;
  }
  root
    .querySelectorAll('select,input[data-component-search],input[data-component-column]')
    .forEach((control) =>
      control.addEventListener('input', () => {
        const field = control.dataset.componentFilter;
        if (['repository', 'name', 'version'].includes(field))
          setContext({ [field === 'name' ? 'component' : field]: control.value });
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
    setContext({ repository: '', component: '', version: '', issue: '', audit: '', anomaly: '', family: '' });
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
        'Conformité',
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
      link = document.createElement('a');
    link.href = url;
    link.download = 'analyse-composants.csv';
    link.click();
    URL.revokeObjectURL(url);
  });
  /** Synchronise les filtres métier après effacement, navigation ou changement du périmètre partagé. */
  function synchronize() {
    const context = currentContext();
    for (const [field, key] of Object.entries({
      repository: 'repository',
      name: 'component',
      version: 'version'
    }))
      $(`[data-component-filter="${field}"]`).value = context.get(key) || '';
    render();
  }
  window.addEventListener('dashboard-context-change', synchronize);
  window.addEventListener('popstate', synchronize);
  synchronize();
})();
