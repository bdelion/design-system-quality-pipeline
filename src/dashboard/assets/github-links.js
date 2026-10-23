/**
 * Prépare des accès GitHub depuis les seules URL sources, jamais depuis des identifiants anonymisés.
 * Les recherches par numéros peuvent aussi retrouver des mentions : elles ne sont pas des listes exactes.
 * @param {{url?: string, state?: string, labels?: string[]}[]} sources - Population complète de preuves du snapshot.
 * @param {{directSingle?: boolean, matchLabels?: boolean, state?: "open"|"closed"}} [options] - Présentation de la liste, sans modifier sa population.
 * @returns {{links: {url: string, count: number, repository: string, search: boolean}[], unavailable: number, stateMismatch?: boolean}} Accès répartis par dépôt et lots bornés.
 */
export function githubTargets(sources, options = {}) {
  const stateMismatch = Boolean(
    options.state && sources.some((source) => source.state?.toLowerCase() !== options.state)
  );
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
    groups.get(key).items.push({ number, url: source.url, labels: source.labels || [] });
  }
  const links = [];
  for (const { repository, type, items } of groups.values()) {
    let prefix = 'repo:' + repository + (type === 'pull' ? ' is:pr' : ' is:issue');
    if (options.state && !stateMismatch) prefix += ' is:' + options.state;
    if (options.matchLabels) {
      const shared = [...new Set(items[0].labels)].filter((label) =>
        items.every((item) => item.labels.includes(label))
      );
      const longest = items.reduce((maximum, item) => Math.max(maximum, item.number.length), 0);
      for (const label of shared) {
        const qualifier = ' label:' + JSON.stringify(label);
        if (prefix.length + qualifier.length + longest + 3 <= 256) prefix += qualifier;
      }
    }
    prefix += ' ';
    let batch = [];
    /** Ouvre la source unique sur demande, sinon une recherche bornée des références sélectionnées. */
    function flush() {
      if (!batch.length) return;
      const query = prefix + '(' + batch.map((item) => item.number).join(' OR ') + ')';
      const direct = Boolean(options.directSingle && seen.size === 1 && unavailable === 0);
      links.push({
        url: direct ? batch[0].url : 'https://github.com/search?type=issues&q=' + encodeURIComponent(query),
        count: batch.length,
        repository,
        search: !direct
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
  return { links, unavailable, ...(stateMismatch ? { stateMismatch: true } : {}) };
}
