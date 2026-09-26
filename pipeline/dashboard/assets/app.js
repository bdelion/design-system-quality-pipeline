(function () {
  const snapshot = window.__SNAPSHOT__;
  if (!snapshot) return;

  // 1. Affichage des métadonnées du snapshot en bas de sidebar
  const capturedAtEl = document.querySelector('[data-captured-at]');
  const ruleVersionEl = document.querySelector('[data-rule-version]');

  if (capturedAtEl && snapshot.capturedAt) {
    const date = new Date(snapshot.capturedAt);
    capturedAtEl.textContent = date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  if (ruleVersionEl && snapshot.ruleVersion) {
    ruleVersionEl.textContent = snapshot.ruleVersion;
  }

  // 2. Filtrage dynamique sur la page Anomalies
  const searchInput = document.querySelector('[data-filter]');
  const repoSelect = document.querySelector('[data-filter-repository]');
  const critSelect = document.querySelector('[data-filter-criticality]');
  const catSelect = document.querySelector('[data-filter-category]');
  const statusSelect = document.querySelector('[data-filter-status]');
  const resetButton = document.querySelector('[data-reset-filters]');
  const tableBody = document.querySelector('[data-table]');

  function applyFilters() {
    if (!tableBody) return;
    const query = (searchInput?.value || '').toLowerCase();
    const selectedRepo = repoSelect?.value || '';
    const selectedCrit = critSelect?.value || '';
    const selectedCat = catSelect?.value || '';
    const selectedStatus = statusSelect?.value || '';

    const rows = tableBody.querySelectorAll('tr');
    rows.forEach((row) => {
      const text = row.textContent.toLowerCase();
      const repo = row.getAttribute('data-repository') || '';
      const crit = row.getAttribute('data-criticality') || '';
      const cats = (row.getAttribute('data-categories') || '').split('|');
      const status = row.getAttribute('data-status') || '';

      const matchesSearch = !query || text.includes(query);
      const matchesRepo = !selectedRepo || repo === selectedRepo;
      const matchesCrit = !selectedCrit || crit === selectedCrit;
      const matchesCat = !selectedCat || cats.includes(selectedCat);
      const matchesStatus = !selectedStatus || status === selectedStatus;

      row.style.display = (matchesSearch && matchesRepo && matchesCrit && matchesCat && matchesStatus) ? '' : 'none';
    });
  }

  [searchInput, repoSelect, critSelect, catSelect, statusSelect].forEach((el) => {
    el?.addEventListener('input', applyFilters);
    el?.addEventListener('change', applyFilters);
  });

  resetButton?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    if (repoSelect) repoSelect.value = '';
    if (critSelect) critSelect.value = '';
    if (catSelect) catSelect.value = '';
    if (statusSelect) statusSelect.value = '';
    applyFilters();
  });

  // 3. Copie du YAML catalogue pour les alertes DQ-006
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (target && target.matches('[data-copy-yaml]')) {
      const yamlContent = decodeURIComponent(target.getAttribute('data-copy-yaml') || '');
      navigator.clipboard.writeText(yamlContent).then(() => {
        const feedback = target.nextElementSibling;
        if (feedback) {
          feedback.textContent = 'Copié !';
          setTimeout(() => { feedback.textContent = ''; }, 2000);
        }
      });
    }
  });
})();