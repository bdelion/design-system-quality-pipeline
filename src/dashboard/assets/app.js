const snapshot = window.__SNAPSHOT__;
const capturedAt = document.querySelector('[data-captured-at]');
const ruleVersion = document.querySelector('[data-rule-version]');
if (capturedAt) capturedAt.textContent = new Date(snapshot.capturedAt).toLocaleString('fr-FR');
if (ruleVersion) ruleVersion.textContent = snapshot.ruleVersion;

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
