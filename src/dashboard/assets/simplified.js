import { downloadCsv } from './csv.js';
import { githubTargets } from './github-links.js';
/* Restitution de faits Analytics : filtres et tris précèdent toujours la pagination. */
const model = JSON.parse(document.getElementById('simplified-data').textContent);
const state = new Map();
const issueById = new Map(model.issues.map((issue) => [issue.id, issue]));
const content = document.getElementById('content');
const form = document.getElementById('context');
const spaces = {
  summary: ['priorities'],
  components: ['component-activity', 'components'],
  activity: ['activity'],
  team: ['repositories', 'delays'],
  versions: ['campaigns']
};
const labels = {
  summary: 'Que faut-il faire maintenant ?',
  components: 'Composants',
  activity: 'Activité des équipes',
  team: 'Repositories et équipe',
  versions: 'Audits par version'
};
let space = 'summary';
let detailRows = [];
let detailPage = 0;
let detailSize = 25;
/** Crée un élément et insère du texte sans interpréter de HTML source. */
function element(tag, text, parent) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (parent) parent.append(node);
  return node;
}
/** Formate les valeurs inconnues et numériques sans masquer les vrais zéros. */
function display(value) {
  return value === null
    ? 'Indisponible'
    : typeof value === 'number'
      ? new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(value)
      : String(value);
}
/** Accepte uniquement les liens web sources, sans protocoles exécutables. */
function sourceLink(url, label, parent) {
  if (!url || !/^https?:\/\//i.test(url)) return;
  const link = element('a', label, parent);
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
}
/** Ajoute des accès externes distincts du bouton de détail, sans ouvrir plusieurs onglets automatiquement. */
function githubLinks(cell, title, parent, explain = false) {
  if (cell.url && /^https:\/\/github\.com\/[^/]+\/[^/]+\/(issues|pulls)(?:\?|$)/.test(cell.url)) {
    const label = 'Ouvrir la recherche dans GitHub ↗';
    const link = element('a', label, parent);
    const url = new window.URL(cell.url);
    if (!url.searchParams.has('q'))
      url.searchParams.set('q', url.pathname.endsWith('/pulls') ? 'is:pr' : 'is:issue');
    link.href = url.href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'github-shortcut';
    link.title = title + ' — recherche GitHub du compteur, état actuel — nouvel onglet';
    link.setAttribute('aria-label', label + ' — ' + link.title);
    if (explain)
      element(
        'span',
        ' La recherche GitHub affiche l’état actuel du périmètre du compteur, distinct du snapshot.',
        parent
      );
    return;
  }
  const refs = [...new Set(cell.refs || [])];
  const sources = refs.map((id) => issueById.get(id) || { url: '' });
  const result = githubTargets(sources);
  for (const [index, target] of result.links.entries()) {
    const label =
      'Ouvrir la recherche dans GitHub' +
      (result.links.length > 1 ? ' — lot ' + (index + 1) + '/' + result.links.length : '') +
      ' ↗';
    const link = element('a', label, parent);
    link.href = target.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'github-shortcut';
    const description =
      title +
      ' — ' +
      target.repository +
      ' — ' +
      target.count +
      ' issue(s)' +
      (result.links.length > 1 ? ' — lot ' + (index + 1) + '/' + result.links.length : '') +
      (target.search
        ? ' — recherche par numéros, résultats à vérifier (des mentions peuvent apparaître)'
        : '') +
      (result.unavailable
        ? ' — sélection partielle : ' + result.unavailable + ' source(s) sans lien GitHub'
        : '') +
      ' — nouvel onglet';
    link.title = description;
    link.setAttribute('aria-label', label + ' — ' + description);
  }
  if (explain && (result.links.length || result.unavailable))
    element(
      'span',
      ' GitHub : état actuel, distinct du snapshot. Les recherches par numéros peuvent inclure des mentions.' +
        (result.links.length > 1 ? ' La sélection est répartie en ' + result.links.length + ' lots.' : '') +
        (result.unavailable ? ' ' + result.unavailable + ' source(s) sans lien GitHub exploitable.' : ''),
      parent
    );
}
/** Expose les éléments exacts d’une cellule, paginés sur place. */
function details(cell, title) {
  detailRows = (cell.refs || []).map((id) => issueById.get(id)).filter(Boolean);
  detailPage = 0;
  document.getElementById('detail-title').textContent = title;
  const note = document.getElementById('detail-note');
  note.replaceChildren();
  element(
    'span',
    cell.note ||
      (cell.value === null
        ? 'Population indisponible.'
        : 'Les liens ouvrent les sources GitHub ; leur état actuel peut différer du snapshot.'),
    note
  );
  if (cell.url && !/^https:\/\/github\.com\//.test(cell.url)) {
    element('span', ' ', note);
    sourceLink(cell.url, 'Ouvrir la source ↗', note);
  }
  githubLinks(cell, title, note, true);
  renderDetails();
  document.getElementById('detail').showModal();
}
/** Affiche la liste exacte de preuves sans fabriquer de lien à partir d’un identifiant anonymisé. */
function renderDetails() {
  const target = document.getElementById('detail-content');
  target.replaceChildren();
  const tools = element('div', undefined, target);
  tools.className = 'details-tools';
  const exportButton = element('button', 'Exporter les issues en CSV', tools);
  exportButton.type = 'button';
  exportButton.addEventListener('click', () =>
    downloadCsv('issues-associees.csv', [
      ['Repository', 'Issue', 'État GitHub', 'Correction', 'Création', 'URL GitHub', 'Signalements'],
      ...detailRows.map((issue) => [
        issue.repository,
        issue.title,
        issue.state,
        issue.correction,
        issue.createdAt,
        issue.url,
        issue.warnings.join(' ; ')
      ])
    ])
  );
  const table = element('table', undefined, target);
  const head = element('tr', undefined, element('thead', undefined, table));
  for (const label of ['Issue', 'GitHub', 'Correction', 'Signalements']) {
    const th = element('th', label, head);
    th.scope = 'col';
  }
  const body = element('tbody', undefined, table);
  for (const issue of detailRows.slice(detailPage * detailSize, (detailPage + 1) * detailSize)) {
    const tr = element('tr', undefined, body);
    const td = element('td', undefined, tr);
    if (issue.url) sourceLink(issue.url, issue.title + ' ↗', td);
    else element('span', issue.title + ' — lien indisponible', td);
    element('td', issue.state, tr);
    element('td', issue.correction, tr);
    element('td', issue.warnings.join(' ; ') || 'Aucun signalement métier', tr);
  }
  if (!detailRows.length)
    element(
      'p',
      'Aucun élément source individuel disponible dans ce snapshot. Utilisez la recherche GitHub lorsqu’elle est proposée ; un compteur de PR ne contient pas une liste d’issues.',
      target
    );
  pager(
    document.getElementById('detail-pagination'),
    detailRows.length,
    detailPage,
    detailSize,
    (page, size) => {
      detailPage = page;
      detailSize = size;
      renderDetails();
    }
  );
}
/** Construit un contrôle de pagination et annonce la population filtrée. */
function pager(target, count, page, size, change) {
  target.replaceChildren();
  const total = Math.max(1, Math.ceil(count / size));
  for (const [name, value] of [
    ['Première', 0],
    ['Précédente', page - 1],
    ['Suivante', page + 1],
    ['Dernière', total - 1]
  ]) {
    const button = element('button', name, target);
    button.type = 'button';
    button.disabled = value < 0 || value >= total || value === page;
    button.addEventListener('click', () => change(value, size));
  }
  const info = element(
    'span',
    count ? 'Page ' + (page + 1) + ' / ' + total + ' · ' + count + ' résultats' : '0 résultat',
    target
  );
  info.setAttribute('aria-live', 'polite');
  const label = element('label', 'Lignes par page ', target);
  const select = element('select', undefined, label);
  for (const n of [10, 25, 50, 100]) {
    const option = element('option', String(n), select);
    option.value = n;
    option.selected = size === n;
  }
  select.addEventListener('change', () => change(0, Number(select.value)));
}
/** Compare numériquement ou textuellement, en maintenant les inconnus à la fin. */
function compare(a, b, direction) {
  if (a === null || b === null) return a === b ? 0 : a === null ? 1 : -1;
  return (
    direction *
    (typeof a === 'number' && typeof b === 'number'
      ? a - b
      : String(a).localeCompare(String(b), 'fr', { numeric: true, sensitivity: 'base' }))
  );
}
/** Filtre toutes les lignes avant de les trier et découper en pages. */
function selected(table, local) {
  const repo = form.elements.repository.value;
  const version = form.elements.version.value.toLowerCase();
  return table.rows
    .filter(
      (row) =>
        (!repo || row.repository === repo) &&
        (!version ||
          ['repositories', 'delays', 'component-activity'].includes(table.id) ||
          row.version.toLowerCase().includes(version)) &&
        row.cells.some((cell) => display(cell.value).toLowerCase().includes(local.search.toLowerCase())) &&
        (!local.from || String(row.cells.at(-1)?.value) >= local.from) &&
        (!local.to || String(row.cells.at(-1)?.value) < local.to + 'T99')
    )
    .sort((a, b) =>
      compare(
        (a.cells[local.sort]?.sortValue !== undefined
          ? a.cells[local.sort].sortValue
          : a.cells[local.sort]?.value) ?? null,
        (b.cells[local.sort]?.sortValue !== undefined
          ? b.cells[local.sort].sortValue
          : b.cells[local.sort]?.value) ?? null,
        local.direction
      )
    );
}
/** Installe un tableau avec outils, sans recréer les champs lors de la saisie. */
function mount(table) {
  const local = state.get(table.id) || {
    page: 0,
    size: 25,
    search: '',
    sort: 0,
    direction: 1,
    from: '',
    to: ''
  };
  state.set(table.id, local);
  const panel = element('section', undefined, content);
  panel.className = 'panel';
  panel.dataset.tableId = table.id;
  element('h2', table.title, panel);
  element('p', table.description, panel).className = 'description';
  const tools = element('div', undefined, panel);
  tools.className = 'toolbar';
  const label = element('label', 'Filtrer ce tableau', tools);
  const search = element('input', undefined, label);
  search.type = 'search';
  search.value = local.search;
  search.placeholder = 'Toutes les lignes';
  const sortLabel = element('label', 'Trier par', tools);
  const sort = element('select', undefined, sortLabel);
  sort.setAttribute('aria-label', 'Trier par');
  table.headers.forEach((name, index) => {
    const option = element('option', name, sort);
    option.value = index;
    option.selected = index === local.sort;
  });
  const orderLabel = element('label', 'Ordre', tools);
  const order = element('select', undefined, orderLabel);
  order.setAttribute('aria-label', 'Ordre');
  for (const [name, value] of [
    ['Croissant', 1],
    ['Décroissant', -1]
  ]) {
    const option = element('option', name, order);
    option.value = value;
    option.selected = value === local.direction;
  }
  if (table.id === 'activity')
    for (const [name, key] of [
      ['Créées à partir du', 'from'],
      ['Créées jusqu’au', 'to']
    ]) {
      const dateLabel = element('label', name, tools);
      const date = element('input', undefined, dateLabel);
      date.type = 'date';
      date.value = local[key];
      date.addEventListener('input', () => {
        local[key] = date.value;
        local.page = 0;
        draw();
      });
    }
  const exportButton = element('button', 'Exporter en CSV', tools);
  exportButton.type = 'button';
  exportButton.className = 'export';
  exportButton.addEventListener('click', () => {
    const rows = selected(table, local);
    downloadCsv(table.id + '.csv', [
      [...table.headers, 'Issues associées', 'URL GitHub'],
      ...rows.map((row) => {
        const sources = [...new Set(row.cells.flatMap((cell) => cell.refs || []))]
          .map((id) => issueById.get(id))
          .filter(Boolean);
        return [
          ...row.cells.map((cell) => display(cell.value)),
          sources.map((issue) => issue.title).join(' | '),
          [
            ...new Set(
              [...sources.map((issue) => issue.url), ...row.cells.map((cell) => cell.url)].filter(Boolean)
            )
          ].join(' | ')
        ];
      })
    ]);
  });
  const githubTools = element('span');
  githubTools.className = 'github-selection';
  const reset = element('button', 'Réinitialiser', tools);
  reset.type = 'button';
  reset.addEventListener('click', () => {
    state.delete(table.id);
    render();
  });
  const scroll = element('div', undefined, panel);
  scroll.className = 'scroll';
  scroll.tabIndex = 0;
  scroll.setAttribute('role', 'region');
  scroll.setAttribute('aria-label', table.title);
  const grid = element('table', undefined, scroll);
  const headers = element('tr', undefined, element('thead', undefined, grid));
  const body = element('tbody', undefined, grid);
  const pagination = element('div', undefined, panel);
  pagination.className = 'pager';
  table.headers.forEach((name, index) => {
    const th = element('th', undefined, headers);
    th.scope = 'col';
    const button = element('button', name + ' ↕', th);
    button.type = 'button';
    button.addEventListener('click', () => {
      local.direction = local.sort === index ? -local.direction : 1;
      local.sort = index;
      sort.value = index;
      order.value = local.direction;
      local.page = 0;
      draw();
    });
  });
  /** Rafraîchit les lignes visibles en préservant le focus du champ actif. */
  function draw() {
    const rows = selected(table, local);
    local.page = Math.min(local.page, Math.max(0, Math.ceil(rows.length / local.size) - 1));
    body.replaceChildren();
    githubTools.replaceChildren();
    githubLinks(
      { refs: rows.flatMap((row) => row.cells.flatMap((cell) => cell.refs || [])) },
      table.title + ' — toutes les issues associées aux lignes filtrées, avant pagination',
      githubTools
    );
    if (githubTools.childElementCount) tools.insertBefore(githubTools, reset);
    else githubTools.remove();
    Array.from(headers.children).forEach((th, index) =>
      th.setAttribute(
        'aria-sort',
        index === local.sort ? (local.direction === 1 ? 'ascending' : 'descending') : 'none'
      )
    );
    for (const row of rows.slice(local.page * local.size, (local.page + 1) * local.size)) {
      const tr = element('tr', undefined, body);
      row.cells.forEach((cell, index) => {
        const td = element('td', undefined, tr);
        const labelRefs =
          typeof cell.value === 'string' && !cell.refs && !cell.url
            ? [...new Set(row.cells.flatMap((item) => item.refs || []))]
            : undefined;
        const presented = labelRefs?.length
          ? { ...cell, refs: labelRefs, note: cell.note || 'Issues associées à cette ligne.' }
          : cell;
        if (presented.refs || presented.url || presented.note) {
          const button = element('button', display(cell.value), td);
          button.type = 'button';
          button.addEventListener('click', () => details(presented, table.headers[index]));
          githubLinks(presented, table.headers[index], td);
        } else element('span', display(cell.value), td);
      });
    }
    if (!rows.length) {
      const td = element('td', 'Aucun résultat pour ces filtres.', element('tr', undefined, body));
      td.colSpan = table.headers.length;
    }
    pager(pagination, rows.length, local.page, local.size, (page, size) => {
      local.page = page;
      local.size = size;
      draw();
    });
  }
  search.addEventListener('input', () => {
    local.search = search.value;
    local.page = 0;
    draw();
  });
  sort.addEventListener('change', () => {
    local.sort = Number(sort.value);
    local.page = 0;
    draw();
  });
  order.addEventListener('change', () => {
    local.direction = Number(order.value);
    local.page = 0;
    draw();
  });
  draw();
}
/** Affiche uniquement les espaces demandés avec un contexte visible et partagé. */
function render() {
  form.elements.version.disabled = space === 'team';
  content.replaceChildren();
  document.getElementById('heading').textContent = labels[space];
  document.getElementById('scope').textContent =
    (form.elements.repository.value || 'Tous les repositories') +
    ' · ' +
    (space === 'team'
      ? 'Toutes dates et versions — stocks et délais'
      : form.elements.version.value || 'Toutes les versions');
  document.querySelectorAll('[data-space]').forEach((link) => {
    if (link.dataset.space === space) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  if (space === 'summary') {
    const table = model.tables.find((item) => item.id === 'components');
    const rows = selected(table, { search: '', sort: 0, direction: 1 });
    const cards = element('div', undefined, content);
    cards.className = 'cards summary-cards';
    for (const [title, value, link] of [
      [
        'Composants à examiner',
        selected(
          model.tables.find((item) => item.id === 'priorities'),
          { search: '', sort: 0, direction: 1 }
        ).length,
        'components'
      ],
      [
        'Corrections d’accessibilité confirmées',
        rows.some((row) => row.cells[3].value === null)
          ? null
          : rows.reduce((sum, row) => sum + Number(row.cells[3].value), 0),
        'components'
      ],
      [
        'Bugs sans audit',
        rows.some((row) => row.cells[4].value === null)
          ? null
          : rows.reduce((sum, row) => sum + Number(row.cells[4].value), 0),
        'activity'
      ]
    ]) {
      const card = element('section', undefined, cards);
      card.className = 'panel';
      card.title =
        title === 'Composants à examiner'
          ? 'Nombre de composants à examiner.'
          : 'Occurrences par composant ; une issue peut concerner plusieurs composants.';
      element('h2', title, card);
      const metric = element('button', display(value), card);
      metric.type = 'button';
      metric.className = 'card-metric';
      const index = title.startsWith('Corrections') ? 3 : 4;
      const references =
        title === 'Composants à examiner'
          ? selected(
              model.tables.find((item) => item.id === 'priorities'),
              { search: '', sort: 0, direction: 1 }
            ).flatMap((row) => row.cells[0].refs || [])
          : rows.flatMap((row) => row.cells[index].refs || []);
      const cardCell = {
        value,
        refs: [...new Set(references)],
        note:
          title === 'Composants à examiner'
            ? 'Ce compteur représente des composants ; voici leurs issues associées.'
            : 'Occurrences par composant ; la liste ci-dessous déduplique les issues multi-composants.'
      };
      metric.addEventListener('click', () => details(cardCell, title));
      githubLinks(cardCell, title, card);
      const anchor = element('a', 'Voir →', card);
      anchor.setAttribute('aria-label', 'Voir : ' + title);
      anchor.href = '#' + link;
    }
  }
  for (const id of spaces[space]) {
    const table = model.tables.find((item) => item.id === id);
    if (table) mount(table);
  }
}
/** Restaure l’espace demandé par un lien ou par l’historique du navigateur. */
function navigate() {
  space = Object.hasOwn(spaces, window.location.hash.slice(1)) ? window.location.hash.slice(1) : 'summary';
  render();
}
form.addEventListener('submit', (event) => event.preventDefault());
form.addEventListener('input', () => {
  state.forEach((value) => (value.page = 0));
  render();
});
form.addEventListener('reset', () => {
  window.setTimeout(() => {
    state.clear();
    render();
  }, 0);
});
document
  .getElementById('close-detail')
  .addEventListener('click', () => document.getElementById('detail').close());
window.addEventListener('hashchange', navigate);
navigate();

/** Maintient le contenu et le focus sous la hauteur réelle du bandeau, y compris au zoom. */
function updateStickyHeight() {
  const height = document.querySelector('.sticky-shell')?.getBoundingClientRect().height || 0;
  document.documentElement.style.setProperty('--sticky-height', height + 8 + 'px');
}
if (window.ResizeObserver) {
  const observer = new window.ResizeObserver(updateStickyHeight);
  observer.observe(document.querySelector('.sticky-shell'));
}
updateStickyHeight();
