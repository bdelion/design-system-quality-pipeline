/** Extrait l’hôte et le dépôt d’une URL source HTTPS, en écartant les hôtes réservés aux exemples. */
function githubSource(source) {
  const match =
    /^https:\/\/([^/@?#:\s]+(?::[0-9]+)?)\/([a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+)\/(issues|pull)\/([1-9][0-9]*)$/.exec(
      source.url || ''
    );
  if (!match) return undefined;
  let hostname;
  try {
    hostname = new globalThis.URL(source.url).hostname.toLowerCase();
  } catch {
    return undefined;
  }
  if (
    /\.(invalid|test|example)$/.test(hostname) ||
    ['example.com', 'example.org', 'example.net'].includes(hostname)
  )
    return undefined;
  return { origin: 'https://' + match[1], repository: match[2], type: match[3] };
}

/**
 * Construit un seul accès GitHub depuis les URL et labels sources, sans lots ni recherche par numéros.
 * Vérifie la sélection contre les issues connues du snapshot avant de proposer une recherche par filtres.
 * @param {{url?: string, state?: string, labels?: string[]}[]} sources - Population complète, avant pagination.
 * @param {{directSingle?: boolean, matchLabels?: boolean, allowBroader?: boolean, state?: "open"|"closed", universe?: {url?: string, state?: string, labels?: string[]}[]}} [options] - Sources connues et état explicitement demandé.
 * @returns {{links: {url: string, count: number, repository: string, search: boolean}[], unavailable: number, stateMismatch?: boolean, reason?: string, approximate?: boolean}} Destination unique ou motif explicite d’indisponibilité.
 */
export function githubTargets(sources, options = {}) {
  const items = [...new Map(sources.map((source) => [source.url, source])).values()];
  const unavailable = sources.filter((source) => !githubSource(source)).length;
  const stateMismatch = Boolean(
    options.state && items.some((source) => source.state?.toLowerCase() !== options.state)
  );
  const base = { links: [], unavailable, ...(stateMismatch ? { stateMismatch: true } : {}) };
  if (!sources.length) return base;
  if (unavailable)
    return {
      ...base,
      reason: 'Recherche GitHub indisponible : certaines URL sources sont absentes ou anonymisées.'
    };
  if (items.length === 1 && options.directSingle) {
    return {
      ...base,
      links: [{ url: items[0].url, count: 1, repository: githubSource(items[0]).repository, search: false }]
    };
  }
  const groups = new Map();
  for (const source of items) {
    const { origin, repository, type } = githubSource(source);
    const key = origin.toLowerCase() + '/' + repository.toLowerCase() + '/' + type;
    if (!groups.has(key)) groups.set(key, { origin, repository, type, sources: [] });
    groups.get(key).sources.push(source);
  }
  const origins = new Set([...groups.values()].map((group) => group.origin));
  if (origins.size > 1)
    return {
      ...base,
      reason: 'Les sources dépendent de plusieurs serveurs GitHub : aucune recherche unique ne les rassemble.'
    };
  const repositoryScope = groups.size === 1 ? [...groups.values()][0] : undefined;
  /** Ouvre l’onglet du dépôt lorsqu’il est unique, en gardant les filtres et leurs labels sources. */
  function searchUrl(query) {
    const url = new globalThis.URL(
      repositoryScope
        ? repositoryScope.origin +
            '/' +
            repositoryScope.repository +
            (repositoryScope.type === 'pull' ? '/pulls' : '/issues')
        : [...origins][0] + '/search'
    );
    if (!repositoryScope) url.searchParams.set('type', 'issues');
    url.searchParams.set('q', query);
    return url.href;
  }
  /** Conserve un accès unique plus large uniquement lorsque ce repli est explicitement autorisé. */
  function broader(reason) {
    if (!options.allowBroader) return { ...base, reason };
    const scopes = [...groups.values()].map((group) => {
      const common = options.matchLabels
        ? [...new Set(group.sources[0].labels || [])].filter((label) =>
            group.sources.every((source) =>
              source.labels?.some((value) => value.toLowerCase() === label.toLowerCase())
            )
          )
        : [];
      return (
        (repositoryScope ? '' : 'repo:' + group.repository + ' ') +
        (group.type === 'pull' ? 'is:pr' : 'is:issue') +
        (options.state && !stateMismatch ? ' is:' + options.state : '') +
        common.map((label) => ' label:' + JSON.stringify(label)).join('')
      );
    });
    let query = scopes.length === 1 ? scopes[0] : scopes.map((scope) => '(' + scope + ')').join(' OR ');
    if (query.length > 256 || scopes.length > 6) {
      const types = new Set([...groups.values()].map((group) => group.type));
      query =
        (repositoryScope
          ? ''
          : [...new Set([...groups.values()].map((group) => 'repo:' + group.repository))].join(' ') + ' ') +
        (types.size === 1 ? (types.has('pull') ? 'is:pr' : 'is:issue') : '') +
        (options.state && !stateMismatch ? ' is:' + options.state : '');
    }
    if (query.length > 256) return { ...base, reason };
    return {
      ...base,
      approximate: true,
      reason,
      links: [
        {
          url: searchUrl(query),
          count: items.length,
          repository: [...groups.values()].map((group) => group.repository).join(', '),
          search: true
        }
      ]
    };
  }
  const queries = [];
  for (const { origin, repository, type, sources: selected } of groups.values()) {
    const labels = options.matchLabels
      ? [...new Set(selected[0].labels || [])].filter((label) =>
          selected.every((source) =>
            source.labels?.some((value) => value.toLowerCase() === label.toLowerCase())
          )
        )
      : [];
    const requestedState = stateMismatch ? undefined : options.state;
    const known = (options.universe || sources).filter((source) => {
      const match = githubSource(source);
      return (
        match &&
        match.origin === origin &&
        match.repository.toLowerCase() === repository.toLowerCase() &&
        match.type === type
      );
    });
    const selectedUrls = new Set(selected.map((source) => source.url));
    /** Vérifie une conjonction de labels contre toutes les sources connues du même périmètre. */
    function matches(source, candidate) {
      return (
        candidate.every((label) =>
          source.labels?.some((value) => value.toLowerCase() === label.toLowerCase())
        ) &&
        (!requestedState || source.state?.toLowerCase() === requestedState)
      );
    }
    const candidates = [
      labels,
      ...selected.map((source) => (options.matchLabels ? [...new Set(source.labels || [])] : []))
    ];
    const covered = new Set();
    for (const candidate of candidates) {
      if (known.some((source) => !selectedUrls.has(source.url) && matches(source, candidate))) continue;
      const matching = selected.filter((source) => matches(source, candidate));
      if (!matching.some((source) => !covered.has(source.url))) continue;
      queries.push(
        (repositoryScope ? '' : 'repo:' + repository + ' ') +
          (type === 'pull' ? 'is:pr' : 'is:issue') +
          (requestedState ? ' is:' + requestedState : '') +
          candidate.map((label) => ' label:' + JSON.stringify(label)).join('')
      );
      matching.forEach((source) => covered.add(source.url));
    }
    if (covered.size !== selectedUrls.size)
      return broader('Cette sélection ne correspond pas exactement aux filtres disponibles dans GitHub.');
  }
  const query = queries.length === 1 ? queries[0] : queries.map((part) => '(' + part + ')').join(' OR ');
  if (query.length > 256 || queries.length > 6)
    return broader('La sélection exacte dépasse les limites d’une recherche GitHub unique.');
  return {
    ...base,
    links: [
      {
        url: searchUrl(query),
        count: items.length,
        repository: [...groups.values()].map((group) => group.repository).join(', '),
        search: true
      }
    ]
  };
}
