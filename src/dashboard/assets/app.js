const snapshot = window.__SNAPSHOT__;
const capturedAt = document.querySelector('[data-captured-at]');
const ruleVersion = document.querySelector('[data-rule-version]');
if (capturedAt) capturedAt.textContent = new Date(snapshot.capturedAt).toLocaleString('fr-FR');
if (ruleVersion) ruleVersion.textContent = snapshot.ruleVersion;

const sortableTables = document.querySelectorAll('.table-panel table');
const collator = new Intl.Collator('fr', { numeric: true, sensitivity: 'base' });
function sortValue(value) {
  const text = value.trim();
  const dateParts = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text);
  if (dateParts) return { type: 'number', value: new Date(Number(dateParts[3]), Number(dateParts[2]) - 1, Number(dateParts[1])).getTime() };
  const normalizedNumber = text.replace(/\s/g, '').replace(',', '.');
  if (/^-?\d+(?:\.\d+)?$/.test(normalizedNumber)) return { type: 'number', value: Number(normalizedNumber) };
  return { type: 'text', value: text };
}
sortableTables.forEach((table) => {
  const headers = [...table.querySelectorAll('thead th')];
  headers.forEach((header, columnIndex) => {
    const label = header.textContent.trim();
    header.scope = 'col';
    header.setAttribute('aria-sort', 'none');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'sort-button';
    button.setAttribute('aria-label', `Trier par ${label}`);
    button.textContent = label;
    const indicator = document.createElement('span');
    indicator.className = 'sort-indicator';
    indicator.setAttribute('aria-hidden', 'true');
    indicator.textContent = '↕';
    button.append(indicator);
    header.replaceChildren(button);
    button.addEventListener('click', () => {
      const ascending = header.getAttribute('aria-sort') !== 'ascending';
      headers.forEach((item) => item.setAttribute('aria-sort', 'none'));
      header.setAttribute('aria-sort', ascending ? 'ascending' : 'descending');
      indicator.textContent = ascending ? '↑' : '↓';
      const body = table.tBodies[0];
      if (!body) return;
      const sortedRows = [...body.rows].sort((left, right) => {
        const leftValue = sortValue(left.cells[columnIndex]?.innerText ?? '');
        const rightValue = sortValue(right.cells[columnIndex]?.innerText ?? '');
        const compared = leftValue.type === 'number' && rightValue.type === 'number'
          ? leftValue.value - rightValue.value
          : collator.compare(String(leftValue.value), String(rightValue.value));
        return ascending ? compared : -compared;
      });
      sortedRows.forEach((row) => body.append(row));
    });
  });
});

const rows = [...document.querySelectorAll('[data-table] tr')];
const controls = {
  text: document.querySelector('[data-filter]'),
  repository: document.querySelector('[data-filter-repository]'),
  criticality: document.querySelector('[data-filter-criticality]'),
  category: document.querySelector('[data-filter-category]'),
  status: document.querySelector('[data-filter-status]')
};
function applyFilters() {
  const query = (controls.text?.value || '').toLowerCase();
  rows.forEach((row) => {
    const matches = (!query || row.textContent.toLowerCase().includes(query))
      && (!controls.repository?.value || row.dataset.repository === controls.repository.value)
      && (!controls.criticality?.value || row.dataset.criticality === controls.criticality.value)
      && (!controls.category?.value || row.dataset.categories.split('|').includes(controls.category.value))
      && (!controls.status?.value || row.dataset.status === controls.status.value);
    row.hidden = !matches;
  });
}
const params = new URLSearchParams(window.location.search);
if (controls.criticality && params.get('criticality')) controls.criticality.value = params.get('criticality');
if (controls.category && params.get('category')) controls.category.value = params.get('category');
if (controls.status && params.get('status')) controls.status.value = params.get('status');
Object.values(controls).filter(Boolean).forEach((control) => control.addEventListener('input', applyFilters));
document.querySelector('[data-reset-filters]')?.addEventListener('click', () => {
  Object.values(controls).forEach((control) => { if (control) control.value = ''; });
  applyFilters();
});
applyFilters();

document.querySelectorAll('[data-copy-yaml]').forEach((button) => {
  button.addEventListener('click', async () => {
    const yaml = decodeURIComponent(button.dataset.copyYaml);
    const feedback = button.nextElementSibling;
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(yaml);
      else {
        const textarea = document.createElement('textarea');
        textarea.value = yaml;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
      button.textContent = 'YAML copié';
      if (feedback) feedback.textContent = 'Prêt à coller dans config/catalogue.yaml';
    } catch {
      if (feedback) feedback.textContent = 'Copie impossible dans ce navigateur';
    }
  });
});


const componentRows = [...document.querySelectorAll('[data-component-table] tr[data-component-row]')];
const componentText = document.querySelector('[data-component-filter]');
const componentStatusFilter = document.querySelector('[data-component-status-filter]');
const applyComponentFilters = () => {
  const query = (componentText?.value || '').toLowerCase();
  const status = componentStatusFilter?.value || '';
  componentRows.forEach((row) => {
    const textMatch = !query || row.textContent.toLowerCase().includes(query);
    row.hidden = !(textMatch && (!status || row.dataset.componentStatus === status));
  });
};
[componentText, componentStatusFilter].filter(Boolean).forEach((control) => control.addEventListener('input', applyComponentFilters));
document.querySelector('[data-reset-component-filters]')?.addEventListener('click', () => { if (componentText) componentText.value = ''; if (componentStatusFilter) componentStatusFilter.value = ''; applyComponentFilters(); });
applyComponentFilters();

const activityRows = [...document.querySelectorAll('[data-activity-row]')];
const activityText = document.querySelector('[data-activity-filter]');
const activityRepository = document.querySelector('[data-activity-repository]');
const activityStatus = document.querySelector('[data-activity-status]');
function applyActivityFilters() {
  const query = (activityText?.value || '').toLowerCase();
  activityRows.forEach((row) => {
    const matches = (!query || row.textContent.toLowerCase().includes(query))
      && (!activityRepository?.value || row.dataset.repository === activityRepository.value)
      && (!activityStatus?.value || row.dataset.status.split('|').includes(activityStatus.value));
    row.hidden = !matches;
  });
}
[activityText, activityRepository, activityStatus].filter(Boolean).forEach((control) => control.addEventListener('input', applyActivityFilters));
document.querySelector('[data-reset-activity-filters]')?.addEventListener('click', () => {
  [activityText, activityRepository, activityStatus].forEach((control) => { if (control) control.value = ''; });
  applyActivityFilters();
});
applyActivityFilters();
