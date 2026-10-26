import { markReview } from './review-core.js';
import { paginate, updatePagination } from './pagination.js';
import { downloadCsv } from './csv.js';
import { readPageModel } from './page-model.js';
import { durationStatistics } from './statistics.js';
import { matchesFact, currentContext, setContext } from './context.js';
(() => {
  const root = document.querySelector('[data-issues-explorer]');
  if (!root) return;
  const pageModel = readPageModel();
  const payload = pageModel?.data.issues;
  if (!payload) return;
  const items = Array.isArray(payload) ? payload : payload.items;
  const componentPrefix = Array.isArray(payload) ? 'Component:' : payload.componentPrefix;
  /** Trouve un contrôle dans l’explorateur courant. */
  const $ = (selector) => root.querySelector(selector);
  /** Déduplique les valeurs et les trie pour les filtres et les populations. */
  const unique = (values) => [...new Set(values)].sort((a, b) => String(a).localeCompare(String(b), 'fr'));
  const filters = Object.fromEntries(
    ['repo', 'label', 'type', 'status', 'githubState', 'family', 'project', 'kind', 'review'].map((key) => [
      key,
      $(`[data-issue-filter="${key}"]`)
    ])
  );
  const selection = new Set();
  let selectionActive = false;
  let page = 1;
  let dedupe = false;
  let columnSort = -1;
  let descending = false;
  /** Formate une durée mesurable sans transformer une absence en zéro. */
  const number = (value) => (Number.isFinite(value) ? value.toFixed(1) + ' j' : '—');
  /** Échappe les valeurs injectées dans les cellules et les liens. */
  const escape = (value) =>
    String(value ?? '').replace(
      /[&<>"']/g,
      (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]
    );
  /** Remplit un filtre avec les valeurs effectivement présentes dans les faits. */
  const fill = (control, values) => {
    values.forEach((value) => {
      const option = markReview('su', document.createElement('option'));
      option.value = value;
      option.textContent = value;
      control.append(option);
    });
  };
  fill(filters.repo, unique(items.map((item) => item.repo)));
  fill(filters.label, unique(items.flatMap((item) => item.labels)));
  fill(filters.type, unique(items.map((item) => item.type)));
  // Restaure le contexte de navigation partagé sans inventer de filtre de version
  // lorsque les issues ne portent pas de relation de version fiable.
  const context = new URLSearchParams(window.location.search);
  const repository = context.get('repository');
  if (repository && [...filters.repo.options].some((option) => option.value === repository))
    filters.repo.value = repository;
  if (root.hasAttribute('data-components-explorer')) $('[data-issue-components]').checked = true;
  const columns = [...root.querySelectorAll('[data-issue-column]')];
  /** Retourne l’identité distincte d’une issue dans son repository. */
  const key = (item) => item.key;
  /** Rend les références GitHub vérifiées en conservant les valeurs textuelles échappées. */
  const cell = (item, value, index) => {
    if (index === 1 && item.url && /^https:\/\/[^\s]+$/.test(item.url))
      return `<a data-review-slot="sv" href="${escape(item.url)}" target="_blank" rel="noopener noreferrer">#${escape(value)} ↗</a>`;
    if (index === 6 && item.pullRequestLinks?.length)
      return item.pullRequestLinks
        .filter((pr) => /^https:\/\/[^\s]+$/.test(pr.url))
        .map(
          (pr) =>
            `<a data-review-slot="sw" data-review-key="${escape(pr.id || pr.number)}" href="${escape(pr.url)}" target="_blank" rel="noopener noreferrer">#${escape(pr.number)} · ${escape(pr.state)}</a>`
        )
        .join(' ; ');
    return escape(value);
  };
  /** Présente une valeur par Project et conserve les absences et les valeurs source nulles explicites. */
  const projectValues = (item, field) => {
    const contexts = item.projectContexts ?? [];
    return contexts.length
      ? contexts
          .map((context) => {
            const value =
              field === 'status'
                ? (context.rawStatus ?? context.status)
                : field === 'iteration'
                  ? context.iteration?.title
                  : context.rawVelocity;
            return (
              (contexts.length > 1 ? `${context.projectName || context.projectId} : ` : '') +
              (value === undefined || value === null || (typeof value === 'string' && !value.trim())
                ? field === 'velocity'
                  ? 'Non renseignée'
                  : 'Non renseigné'
                : value)
            );
          })
          .join(' ; ')
      : field === 'velocity'
        ? 'Non renseignée'
        : 'Sans Project enregistré';
  };
  /** Calcule l’ancienneté à la capture du snapshot, indépendamment de la date de consultation. */
  const dayAge = (item) =>
    Math.max(0, (Date.parse(pageModel.snapshot.capturedAt) - Date.parse(item.createdAt)) / 86400000);
  /** Ventile une issue par labels tout en conservant son identité pour les KPI distincts. */
  function rowsFor(item, matchingLabels) {
    const labels = dedupe
      ? [matchingLabels.join(', ') || 'Sans label']
      : matchingLabels.length
        ? matchingLabels
        : ['Sans label'];
    return labels.map((label) => ({ ...item, label }));
  }
  /** Combine les filtres, trie les lignes et agrège les faits Analytics de la sélection. */
  function render() {
    const q = $('[data-issue-search]').value.trim().toLocaleLowerCase('fr');
    const componentOnly = $('[data-issue-components]').checked;
    const filtered = items.filter((item) => {
      const labels = item.labels.length ? item.labels : ['Sans label'];
      const eligible = labels.filter(
        (label) =>
          (!filters.label.value || label === filters.label.value) &&
          (!root.hasAttribute('data-components-explorer') ||
            label.toLocaleLowerCase('fr').startsWith(componentPrefix.toLocaleLowerCase('fr')))
      );
      const hasComponent = item.labels.some((label) =>
        label.toLocaleLowerCase('fr').startsWith(componentPrefix.toLocaleLowerCase('fr'))
      );
      return (
        matchesFact(item, currentContext()) &&
        (!filters.family.value || item.family === filters.family.value) &&
        (!filters.project.value || item.review?.project === filters.project.value) &&
        (!filters.kind.value ||
          (filters.kind.value === 'unknown'
            ? item.anomalyIds.length && item.review?.kinds.length === 0
            : item.review?.kinds.includes(filters.kind.value))) &&
        (!filters.review.value ||
          {
            'no-audit': item.anomalyIds.length > 0 && item.auditIds.length === 0,
            'no-component': item.anomalyIds.length > 0 && item.componentIds.length === 0,
            'audit-no-component':
              (item.review?.auditCandidate || item.type.toLowerCase() === 'audit') &&
              item.componentIds.length === 0,
            advice: item.review?.advice,
            corrected: item.anomalyIds.length > 0 && item.review?.correctionConfirmed,
            improvements: item.family === 'improvement',
            warnings: item.review?.warnings.length > 0
          }[filters.review.value]) &&
        eligible.length &&
        (!componentOnly || hasComponent) &&
        (!filters.repo.value || item.repo === filters.repo.value) &&
        (!filters.type.value || item.type === filters.type.value) &&
        (!filters.status.value || item.status === filters.status.value) &&
        (!filters.githubState.value || item.githubState === filters.githubState.value) &&
        (!q ||
          [
            item.repo,
            item.number,
            item.title,
            item.type,
            item.status,
            ...(item.components ?? []),
            projectValues(item, 'status'),
            projectValues(item, 'iteration'),
            projectValues(item, 'velocity'),
            ...labels
          ]
            .join(' ')
            .toLocaleLowerCase('fr')
            .includes(q))
      );
    });
    const groups = new Map();
    for (const item of filtered) {
      const eligible = (item.labels.length ? item.labels : ['Sans label']).filter(
        (label) =>
          (!filters.label.value || label === filters.label.value) &&
          (!root.hasAttribute('data-components-explorer') ||
            label.toLocaleLowerCase('fr').startsWith(componentPrefix.toLocaleLowerCase('fr')))
      );
      for (const row of rowsFor(item, eligible)) {
        const groupKey = [item.repo, row.label, item.type].join('\u0000');
        if (!groups.has(groupKey)) groups.set(groupKey, []);
        groups.get(groupKey).push(row);
      }
    }
    const entries = [...groups.values()].flatMap((group) =>
      group.map((item) => ({
        item,
        values: [
          item.repo,
          item.number,
          item.label,
          item.type +
            ' · ' +
            item.familyLabel +
            (item.review?.typeSource === 'labels' ? ' · Déduit des labels' : ''),
          item.status,
          item.githubState,
          item.prs.length,
          item.delay === null ? '—' : number(item.delay),
          item.githubState === 'OPEN' ? number(dayAge(item)) : '—',
          item.components?.join(', ') || 'Non renseigné',
          projectValues(item, 'status'),
          projectValues(item, 'iteration'),
          projectValues(item, 'velocity'),
          item.anomalyIds.length
            ? item.review?.kinds
                .map((kind) => ({ accessibility: 'Accessibilité', functional: 'Fonctionnel' })[kind])
                .join(', ') || 'Nature non renseignée'
            : '—',
          item.anomalyIds.length ? item.review?.correctionLabel || 'Indisponible' : '—',
          item.anomalyIds.length
            ? item.review?.correctionVersion
              ? (item.review.correctionConfirmed ? 'Confirmée pour ' : 'Prévue : ') +
                item.review.correctionVersion
              : 'Version de correction non renseignée'
            : '—',
          item.review?.warnings.join(' ; ') || ''
        ]
      }))
    );
    const visible = entries.filter(({ values }) =>
      columns.every(
        (control, index) =>
          !control.value ||
          String(values[index]).toLocaleLowerCase('fr').includes(control.value.toLocaleLowerCase('fr'))
      )
    );
    const sortIndex =
      columnSort >= 0 ? columnSort : { repo: 0, number: 1, age: 8, delay: 7 }[$('[data-issue-sort]').value];
    visible.sort((a, b) => {
      const av = a.values[sortIndex],
        bv = b.values[sortIndex];
      const na = parseFloat(av),
        nb = parseFloat(bv);
      const comparison =
        Number.isFinite(na) && Number.isFinite(nb)
          ? na - nb
          : String(av).localeCompare(String(bv), 'fr', { numeric: true });
      return (descending ? -1 : 1) * comparison;
    });
    const displayed = unique(visible.map(({ item }) => key(item)));
    const relevant = selectionActive
      ? items.filter((item) => selection.has(key(item)) && displayed.includes(key(item)))
      : items.filter((item) => displayed.includes(key(item)));
    for (const [name, statistics] of Object.entries(durationStatistics(relevant))) {
      for (const stat of ['average', 'median', 'p90'])
        $('[data-issue-kpi="' + name + '-' + stat + '"]').textContent = number(statistics[stat]);
      $('[data-issue-count="' + name + '"]').textContent =
        statistics.count +
        ' issue(s) distincte(s) · ' +
        (name === 'global' ? 'Done + estimées' : name === 'done' ? 'Done' : 'closedAt');
    }
    $('[data-issue-summary]').textContent =
      `${visible.length} lignes · ${displayed.length} issues distinctes · ${selectionActive ? relevant.length + ' issues sélectionnées' : 'KPI sur les issues filtrées'}`;
    $('[data-issue-select-all]').checked = displayed.length > 0 && displayed.every((id) => selection.has(id));
    const state = paginate(visible, page);
    page = state.page;
    root.dataset.reviewState = JSON.stringify({ sort: sortIndex, descending, page, dedupe });
    const focused = document.activeElement?.dataset.issueCheck;
    const focusedIndex = [...root.querySelectorAll('[data-issue-check]')].indexOf(document.activeElement);
    updatePagination(root.querySelector('[data-pagination]'), state);
    $('[data-issue-select-all]').indeterminate =
      displayed.some((id) => selection.has(id)) && !displayed.every((id) => selection.has(id));
    $('[data-issue-rows]').innerHTML = state.rows
      .map(
        ({ item, values }) =>
          `<tr data-review-slot="sx" data-review-key="${escape(JSON.stringify([key(item), item.label]))}"><td data-review-slot="sy"><input data-review-slot="sz" type="checkbox" data-issue-check="${escape(key(item))}" aria-label="Sélectionner ${escape(key(item))}" ${selection.has(key(item)) ? 'checked' : ''}></td>${values.map((value, index) => `<td data-review-slot="s10" data-review-key="field:${index}">${cell(item, value, index)}</td>`).join('')}</tr>`
      )
      .join('');
    const focusTarget = root.querySelectorAll('[data-issue-check]')[focusedIndex];
    if (focused && focusTarget?.dataset.issueCheck === focused) focusTarget.focus();
    return visible;
  }
  /** Restaure les dimensions partagées et rafraîchit l'intersection de filtres. */
  const redraw = (reset = true) => {
    if (reset) page = 1;
    const params = currentContext();
    filters.repo.value = params.get('repository') || '';
    filters.family.value = params.get('family') || '';
    for (const dimension of ['project', 'kind', 'review']) {
      const value = params.get(dimension) || '';
      if (value && ![...filters[dimension].options].some((option) => option.value === value)) {
        const option = markReview('s11', document.createElement('option'));
        option.value = value;
        option.textContent = 'Valeur inconnue : ' + value;
        filters[dimension].append(option);
      }
      filters[dimension].value = value;
    }
    render();
  };
  root
    .querySelectorAll(
      'select, input[data-issue-search], input[data-issue-components], input[data-issue-column]'
    )
    .forEach((control) =>
      control.addEventListener('input', () => {
        if (control === filters.repo) setContext({ repository: control.value });
        if (control === filters.family) setContext({ family: control.value });
        for (const dimension of ['project', 'kind', 'review'])
          if (control === filters[dimension]) setContext({ [dimension]: control.value });
        redraw();
      })
    );
  window.addEventListener('dashboard-context-change', () => redraw());
  window.addEventListener('popstate', () => redraw());
  $('[data-page-previous]').addEventListener('click', () => {
    page--;
    render();
  });
  $('[data-page-next]').addEventListener('click', () => {
    page++;
    render();
  });
  $('[data-issue-dedupe]').addEventListener('click', (event) => {
    dedupe = !dedupe;
    event.currentTarget.setAttribute('aria-pressed', String(dedupe));
    event.currentTarget.textContent = dedupe ? 'Vue par labels' : 'Dédoublonner par repo / issue';
    redraw();
  });
  $('[data-issue-reset]').addEventListener('click', () => {
    root.querySelectorAll('select, input[data-issue-search], input[data-issue-column]').forEach((control) => {
      control.value = '';
    });
    $('[data-issue-sort]').value = 'repo';
    $('[data-issue-components]').checked = false;
    columnSort = -1;
    descending = false;
    setContext({
      repository: '',
      component: '',
      version: '',
      issue: '',
      audit: '',
      anomaly: '',
      family: '',
      project: '',
      kind: '',
      review: ''
    });
    redraw();
  });
  $('[data-issue-clear-selection]').addEventListener('click', () => {
    selection.clear();
    selectionActive = false;
    redraw(false);
  });
  $('[data-issue-select-all]').addEventListener('change', (event) => {
    const checked = event.target.checked;
    for (const { item } of render()) {
      if (checked) selection.add(key(item));
      else selection.delete(key(item));
    }
    selectionActive = true;
    redraw(false);
  });
  $('[data-issue-rows]').addEventListener('change', (event) => {
    const id = event.target.dataset.issueCheck;
    if (!id) return;
    if (event.target.checked) selection.add(id);
    else selection.delete(id);
    selectionActive = true;
    redraw(false);
  });
  root.querySelectorAll('[data-issue-column-sort]').forEach((button) =>
    button.addEventListener('click', () => {
      const next = Number(button.dataset.issueColumnSort);
      descending = columnSort === next ? !descending : false;
      columnSort = next;
      root
        .querySelectorAll('[data-issue-column-sort]')
        .forEach((header) =>
          header.parentElement.setAttribute(
            'aria-sort',
            Number(header.dataset.issueColumnSort) === columnSort
              ? descending
                ? 'descending'
                : 'ascending'
              : 'none'
          )
        );
      redraw();
    })
  );
  $('[data-issue-export]').addEventListener('click', () => {
    const visible = render();
    const rows = [
      [
        'Repository',
        'Issue',
        'Label',
        'Type',
        'Statut',
        'État GitHub',
        'PR',
        'Délai issue',
        'Ancienneté ouverte',
        'Composants',
        'Statut Project',
        'Itération',
        'Velocity source',
        'Nature du bug',
        'Correction / résolution',
        'Version de correction',
        'Signalements',
        'Preuves PR'
      ],
      ...visible.map(({ item, values }) => [
        ...values,
        item.pullRequestLinks?.map((pr) => `#${pr.number} ${pr.state} ${pr.url}`).join(' ; ') ?? ''
      ])
    ];
    downloadCsv(
      root.hasAttribute('data-components-explorer') ? 'analyse-composants.csv' : 'analyse-issues.csv',
      rows
    );
  });
  redraw();
})();
