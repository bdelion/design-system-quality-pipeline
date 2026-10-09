/* global URL, Blob */
(() => {
  const root = document.querySelector('[data-issues-explorer]');
  if (!root) return;
  const items = JSON.parse(document.getElementById('issue-explorer-data').textContent);
  const $ = (selector) => root.querySelector(selector);
  const unique = (values) => [...new Set(values)].sort((a, b) => String(a).localeCompare(String(b), 'fr'));
  const filters = Object.fromEntries(['repo', 'label', 'type', 'status', 'githubState'].map((key) => [key, $(`[data-issue-filter="${key}"]`)]));
  const selection = new Set();
  let selectionActive = false;
  let dedupe = false;
  let columnSort = -1;
  let descending = false;
  const number = (value) => Number.isFinite(value) ? value.toFixed(1) + ' j' : '—';
  const percentile = (values, p) => {
    if (!values.length) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const index = (sorted.length - 1) * p;
    const lower = Math.floor(index);
    return sorted[lower] + (sorted[Math.ceil(index)] - sorted[lower]) * (index - lower);
  };
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const fill = (control, values) => { values.forEach((value) => { const option = document.createElement('option'); option.value = value; option.textContent = value; control.append(option); }); };
  fill(filters.repo, unique(items.map((item) => item.repo)));
  fill(filters.label, unique(items.flatMap((item) => item.labels)));
  fill(filters.type, unique(items.map((item) => item.type)));
  const columns = [...root.querySelectorAll('[data-issue-column]')];
  const key = (item) => item.key;
  const dayAge = (item) => Math.max(0, (Date.now() - Date.parse(item.createdAt)) / 86400000);
  function rowsFor(item, matchingLabels) {
    const labels = dedupe ? [matchingLabels.join(', ') || 'Sans label'] : matchingLabels.length ? matchingLabels : ['Sans label'];
    return labels.map((label) => ({ ...item, label }));
  }
  function render() {
    const q = $('[data-issue-search]').value.trim().toLocaleLowerCase('fr');
    const componentOnly = $('[data-issue-components]').checked;
    const filtered = items.filter((item) => {
      const labels = item.labels.length ? item.labels : ['Sans label'];
      const eligible = labels.filter((label) => !filters.label.value || label === filters.label.value);
      const hasComponent = item.labels.some((label) => /^component:/i.test(label));
      return eligible.length && (!componentOnly || hasComponent) && (!filters.repo.value || item.repo === filters.repo.value) && (!filters.type.value || item.type === filters.type.value) && (!filters.status.value || item.status === filters.status.value) && (!filters.githubState.value || item.githubState === filters.githubState.value) && (!q || [item.repo, item.number, item.title, item.type, item.status, ...labels].join(' ').toLocaleLowerCase('fr').includes(q));
    });
    const groups = new Map();
    for (const item of filtered) {
      const eligible = (item.labels.length ? item.labels : ['Sans label']).filter((label) => !filters.label.value || label === filters.label.value);
      for (const row of rowsFor(item, eligible)) {
        const groupKey = [item.repo, row.label, item.type].join('\u0000');
        if (!groups.has(groupKey)) groups.set(groupKey, []);
        groups.get(groupKey).push(row);
      }
    }
    const entries = [...groups.values()].flatMap((group) => {
      const distinct = [...new Map(group.map((item) => [key(item), item])).values()];
      const open = distinct.filter((item) => item.status === 'open');
      const closed = distinct.filter((item) => item.status === 'closed');
      const cancelled = distinct.filter((item) => item.status === 'cancelled');
      const oldest = [...open].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))[0];
      const rate = (count) => (100 * count / distinct.length).toFixed(1) + '%';
      const prs = unique(distinct.flatMap((item) => item.prs)).length;
      return group.map((item) => ({ item, values: [item.repo, item.number, item.label, item.type, item.status, item.githubState, prs, distinct.length, open.length, closed.length, cancelled.length, rate(open.length), rate(closed.length), rate(cancelled.length), oldest ? `#${oldest.number}` : '—', oldest ? dayAge(oldest).toFixed(1) + ' j' : '—', item.delay === null ? '—' : number(item.delay)], oldest }));
    });
    const visible = entries.filter(({ values }) => columns.every((control, index) => !control.value || String(values[index]).toLocaleLowerCase('fr').includes(control.value.toLocaleLowerCase('fr'))));
    const sortIndex = columnSort >= 0 ? columnSort : ({ repo: 0, number: 1, age: 15, total: 7, delay: 16 })[$('[data-issue-sort]').value];
    visible.sort((a, b) => {
      const av = a.values[sortIndex], bv = b.values[sortIndex];
      const na = parseFloat(av), nb = parseFloat(bv);
      const comparison = Number.isFinite(na) && Number.isFinite(nb) ? na - nb : String(av).localeCompare(String(bv), 'fr', { numeric: true });
      return (descending ? -1 : 1) * comparison;
    });
    const displayed = unique(visible.map(({ item }) => key(item)));
    const relevant = selectionActive ? items.filter((item) => selection.has(key(item)) && displayed.includes(key(item))) : items.filter((item) => displayed.includes(key(item)));
    for (const [name, candidates] of Object.entries({ global: relevant.filter((item) => item.delay !== null), done: relevant.filter((item) => item.delay !== null && item.source === 'done'), estimated: relevant.filter((item) => item.delay !== null && item.source === 'estimated') })) {
      const delays = candidates.map((item) => item.delay);
      $('[data-issue-kpi="' + name + '-average"]').textContent = number(delays.length ? delays.reduce((sum, delay) => sum + delay, 0) / delays.length : null);
      $('[data-issue-kpi="' + name + '-median"]').textContent = number(percentile(delays, .5));
      $('[data-issue-kpi="' + name + '-p90"]').textContent = number(percentile(delays, .9));
      $('[data-issue-count="' + name + '"]').textContent = candidates.length + ' correction(s) · ' + (name === 'global' ? 'Done + estimées' : name === 'done' ? 'Done' : 'closedAt');
    }
    $('[data-issue-summary]').textContent = `${visible.length} lignes · ${displayed.length} issues distinctes · ${selectionActive ? relevant.length + ' issues sélectionnées' : 'KPI sur les issues filtrées'}`;
    $('[data-issue-select-all]').checked = displayed.length > 0 && displayed.every((id) => selection.has(id));
    $('[data-issue-rows]').innerHTML = visible.map(({ item, values, oldest }) => `<tr><td><input type="checkbox" data-issue-check="${escape(key(item))}" aria-label="Sélectionner ${escape(key(item))}" ${selection.has(key(item)) ? 'checked' : ''}></td>${values.map((value, index) => `<td>${index === 1 && item.url ? `<a href="${escape(item.url)}" target="_blank" rel="noopener noreferrer">#${escape(value)} ↗</a>` : index === 14 && oldest?.url ? `<a href="${escape(oldest.url)}" target="_blank" rel="noopener noreferrer">${escape(value)} ↗</a>` : escape(value)}</td>`).join('')}</tr>`).join('');
    return visible;
  }
  const redraw = () => { render(); };
  root.querySelectorAll('select, input[data-issue-search], input[data-issue-components], input[data-issue-column]').forEach((control) => control.addEventListener('input', redraw));
  $('[data-issue-dedupe]').addEventListener('click', (event) => { dedupe = !dedupe; event.currentTarget.setAttribute('aria-pressed', String(dedupe)); event.currentTarget.textContent = dedupe ? 'Vue par labels' : 'Dédoublonner par repo / issue'; redraw(); });
  $('[data-issue-reset]').addEventListener('click', () => { root.querySelectorAll('select, input[data-issue-search], input[data-issue-column]').forEach((control) => { control.value = ''; }); $('[data-issue-sort]').value = 'repo'; $('[data-issue-components]').checked = false; columnSort = -1; descending = false; redraw(); });
  $('[data-issue-clear-selection]').addEventListener('click', () => { selection.clear(); selectionActive = false; redraw(); });
  $('[data-issue-select-all]').addEventListener('change', (event) => { for (const { item } of render()) { if (event.target.checked) selection.add(key(item)); else selection.delete(key(item)); } selectionActive = true; redraw(); });
  $('[data-issue-rows]').addEventListener('change', (event) => { const id = event.target.dataset.issueCheck; if (!id) return; if (event.target.checked) selection.add(id); else selection.delete(id); selectionActive = true; redraw(); });
  root.querySelectorAll('[data-issue-column-sort]').forEach((button) => button.addEventListener('click', () => { const next = Number(button.dataset.issueColumnSort); descending = columnSort === next ? !descending : false; columnSort = next; redraw(); }));
  $('[data-issue-export]').addEventListener('click', () => { const visible = render(); const rows = [['Repository','Issue','Label','Type','Statut','État GitHub','PR','Total','Ouvertes','Closed','Cancelled','Taux ouvert','Taux closed','Taux cancelled','Plus vieille ouverte','Âge','Délai'], ...visible.map(({ values }) => values)]; const csv = '\ufeff' + rows.map((row) => row.map((cell) => '"' + String(cell).replace(/"/g, '""') + '"').join(';')).join('\r\n'); const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = 'analyse-issues.csv'; link.click(); URL.revokeObjectURL(url); });
  redraw();
})();
