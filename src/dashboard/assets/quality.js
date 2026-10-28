import { markReview } from './review-core.js';
import { readPageModel } from './page-model.js';
import { currentContext, setContext } from './context.js';
import { paginate, updatePagination } from './pagination.js';
import { qualityMatches, qualityValues, qualityRowHtml } from './quality-presentation.js';
import { downloadCsv } from './csv.js';
import {
  groupQualityRows,
  qualityCauseHtml,
  qualityCauseKey,
  qualityGroupSummary
} from './quality-causes.js';

const rows = readPageModel()?.data.quality;
const root = document.querySelector('#quality');
const controls = [...document.querySelectorAll('[data-quality-filter]')];
let page = 1;
let sort = -1;
let descending = false;
let filtered = [];
let causePage = 1;
let lastFilters = '';
const detailNav = root?.querySelector('[data-pagination="quality"]');
const causeNav = root?.querySelector('[data-pagination="quality-causes"]');
const allGroups = groupQualityRows(rows ?? []).map((group, index) => ({
  ...group,
  id: `${readPageModel().snapshot.id}:${index}`
}));
const groupIds = new Map(allGroups.map((group) => [group.key, group.id]));

/** Filtre et trie tous les diagnostics avant de monter uniquement la page demandée. */
function render(reset = true) {
  if (!root || !rows) return;
  if (reset) page = 1;
  const params = currentContext();
  for (const control of controls) {
    const value = params.get(control.dataset.qualityFilter) || '';
    if (
      control.tagName === 'SELECT' &&
      value &&
      ![...control.options].some((option) => option.value === value)
    ) {
      const option = markReview('s1v', document.createElement('option'));
      option.value = value;
      option.textContent = 'Référence inconnue : ' + value;
      control.append(option);
    }
    control.value = value;
  }
  const scope = JSON.stringify(
    controls.map((control) => [
      control.dataset.qualityFilter,
      params.get(control.dataset.qualityFilter) || ''
    ])
  );
  if (scope !== lastFilters) causePage = 1;
  lastFilters = scope;
  const baseRows = rows.filter((row) => qualityMatches(row, params));
  const groups = groupQualityRows(baseRows);
  const requested = params.get('dqCause');
  const selected = allGroups.find((group) => group.id === requested);
  filtered = requested
    ? selected
      ? baseRows.filter((row) => qualityCauseKey(row) === selected.key)
      : []
    : baseRows;
  const groupState = paginate(groups, causePage);
  causePage = groupState.page;
  const expanded = new Set(
    [...root.querySelectorAll('[data-quality-cause-detail][open]')].map(
      (detail) => detail.dataset.qualityCauseDetail
    )
  );
  root.querySelector('[data-quality-causes]').innerHTML = groupState.rows
    .map((group) => qualityCauseHtml(group, groupIds.get(group.key), groupIds.get(group.key) === requested))
    .join('');
  root.querySelectorAll('[data-quality-cause-detail]').forEach((detail) => {
    detail.open = expanded.has(detail.dataset.qualityCauseDetail);
  });
  root.querySelector('[data-quality-group-summary]').textContent = qualityGroupSummary(
    groups.length,
    baseRows.length
  );
  root.querySelector('[data-quality-cause-selection]').textContent = requested
    ? selected
      ? `Cause sélectionnée : ${filtered.length} occurrences dans le détail et le CSV, toutes pages.`
      : 'Cause introuvable : détail indisponible, aucun résultat global substitué.'
    : `Toutes les causes : ${baseRows.length} occurrences dans le détail et le CSV, toutes pages.`;
  updatePagination(causeNav, groupState);
  if (sort >= 0)
    filtered.sort((left, right) => {
      const comparison = String(qualityValues(left)[sort]).localeCompare(
        String(qualityValues(right)[sort]),
        'fr',
        { numeric: true }
      );
      return (descending ? -1 : 1) * comparison || left.id.localeCompare(right.id, 'fr', { numeric: true });
    });
  const state = paginate(filtered, page);
  page = state.page;
  root.querySelector('[data-quality-rows]').innerHTML = state.rows.map(qualityRowHtml).join('');
  root.querySelector('[data-quality-count]').textContent =
    requested && !selected ? 'Indisponible' : filtered.length;
  root.querySelector('[data-quality-export]').disabled = Boolean(requested && !selected);
  updatePagination(detailNav, state);
}

if (root && rows) {
  for (const control of controls)
    for (const event of ['input', 'change'])
      control.addEventListener(event, () => setContext({ [control.dataset.qualityFilter]: control.value }));
  root
    .querySelector('[data-quality-reset]')
    .addEventListener('click', () =>
      setContext(
        Object.fromEntries([
          ...controls.map((control) => [control.dataset.qualityFilter, '']),
          ['dqCause', '']
        ])
      )
    );
  detailNav.querySelector('[data-page-previous]').addEventListener('click', () => {
    page--;
    render(false);
  });
  detailNav.querySelector('[data-page-next]').addEventListener('click', () => {
    page++;
    render(false);
  });
  causeNav.querySelector('[data-page-previous]').addEventListener('click', () => {
    causePage--;
    render(false);
  });
  causeNav.querySelector('[data-page-next]').addEventListener('click', () => {
    causePage++;
    render(false);
  });
  root.querySelector('[data-quality-causes]').addEventListener('click', (event) => {
    const button = event.target.closest('[data-quality-cause]');
    if (!button) return;
    setContext({ dqCause: button.dataset.qualityCause });
    root.querySelector('[data-quality-occurrences-heading]').focus();
  });
  root.querySelector('[data-quality-all-causes]').addEventListener('click', () => {
    setContext({ dqCause: '' });
    root.querySelector('[data-quality-group-summary]').focus();
  });
  root.querySelectorAll('[data-quality-sort]').forEach((button) =>
    button.addEventListener('click', () => {
      const next = Number(button.dataset.qualitySort);
      descending = sort === next ? !descending : false;
      sort = next;
      root
        .querySelectorAll('[data-quality-sort]')
        .forEach((header) =>
          header.parentElement.setAttribute(
            'aria-sort',
            header === button ? (descending ? 'descending' : 'ascending') : 'none'
          )
        );
      render();
    })
  );
  root
    .querySelector('[data-quality-export]')
    .addEventListener('click', () =>
      downloadCsv('diagnostics-qualite.csv', [
        [
          'Règle',
          'Sévérité',
          'Repository',
          'Type d’entité',
          'Entité',
          'Diagnostic',
          'Action',
          'Métriques et impacts',
          'Identifiant diagnostic',
          'URL source',
          'Issue liée'
        ],
        ...filtered.map((row) => [...qualityValues(row), row.id, row.sourceUrl, row.issueId])
      ])
    );
  window.addEventListener('dashboard-context-change', () => render());
  window.addEventListener('popstate', () => render());
  render();
}
