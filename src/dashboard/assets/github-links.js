/**
 * Prépare des accès GitHub depuis les seules URL sources, jamais depuis des identifiants anonymisés.
 * Les recherches par numéros peuvent aussi retrouver des mentions : elles ne sont pas des listes exactes.
 * @param {{url?: string}[]} sources - Population complète de preuves du snapshot.
 * @returns {{links: {url: string, count: number, repository: string, search: boolean}[], unavailable: number}} Accès répartis par dépôt et lots bornés.
 */
export function githubTargets(sources) {
  const groups = new Map();
  const seen = new Set();
  let unavailable = 0;
  for (const source of sources) {
    const match =
      /^https:\/\/github\.com\/([a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+)\/(issues|pull)\/([1-9][0-9]*)$/.exec(
        source.url || ''
      );
    if (!match) {
      unavailable++;
      continue;
    }
    const [, repository, type, number] = match;
    const key = repository.toLowerCase() + '/' + type;
    const identity = key + '/' + number;
    if (seen.has(identity)) continue;
    seen.add(identity);
    if (!groups.has(key)) groups.set(key, { repository, type, items: [] });
    groups.get(key).items.push({ number, url: source.url });
  }
  const links = [];
  for (const { repository, type, items } of groups.values()) {
    const prefix = 'repo:' + repository + (type === 'pull' ? ' is:pr ' : ' is:issue ');
    let batch = [];
    /** Construit toujours une recherche explicite, y compris pour une seule source. */
    function flush() {
      if (!batch.length) return;
      const query = prefix + '(' + batch.map((item) => item.number).join(' OR ') + ')';
      links.push({
        url: 'https://github.com/search?type=issues&q=' + encodeURIComponent(query),
        count: batch.length,
        repository,
        search: true
      });
      batch = [];
    }
    for (const item of items) {
      const query = prefix + '(' + [...batch, item].map((entry) => entry.number).join(' OR ') + ')';
      if (batch.length && (batch.length === 6 || query.length > 256)) flush();
      batch.push(item);
    }
    flush();
  }
  return { links, unavailable };
}
