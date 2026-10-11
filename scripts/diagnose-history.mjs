#!/usr/bin/env node
/* global process, fetch, console */
/** Local, read-only GitHub history diagnostic. Export contains no raw names or identifiers. */
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
if (existsSync('.env') && typeof process.loadEnvFile === 'function') process.loadEnvFile('.env');
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { randomBytes, createHmac } from 'node:crypto';

/** Returns a keyed, non-reversible digest; the per-run key is never exported. */
function digest(key, value) {
  return createHmac('sha256', key).update(String(value)).digest('hex').slice(0, 24);
}

/** Canonical identity of a status transition; missing fields remain explicit. */
export function transitionKey(projectId, status, at) {
  return JSON.stringify([String(projectId ?? ''), String(status ?? ''), String(at ?? '')]);
}

/** Counts keyed transitions as a multiset so repeated identical events remain visible. */
function countTransitions(items, key) {
  const counts = new Map();
  for (const item of items) {
    const hash = digest(key, transitionKey(item.projectId, item.status, item.at));
    counts.set(hash, (counts.get(hash) ?? 0) + 1);
  }
  return counts;
}

/** Computes differences without exporting raw event values or dates. */
export function compareTransitions(raw, api, key) {
  const a = countTransitions(raw, key);
  const b = countTransitions(api, key);
  let apiOnly = 0;
  let rawOnly = 0;
  for (const [hash, n] of b) apiOnly += Math.max(0, n - (a.get(hash) ?? 0));
  for (const [hash, n] of a) rawOnly += Math.max(0, n - (b.get(hash) ?? 0));
  return { apiOnly, rawOnly, exactMatch: apiOnly === 0 && rawOnly === 0 };
}

/** Classifies API-only transitions relative to an explicitly supplied RAW collection instant. */
export function classifyExtraTransitions(raw, api, key, collectedAt) {
  const counts = countTransitions(raw, key);
  const remaining = new Map(counts);
  const result = { beforeOrAtCollection: 0, afterCollection: 0, unknownTime: 0, done: 0, other: 0 };
  for (const event of api) {
    const hash = digest(key, transitionKey(event.projectId, event.status, event.at));
    const available = remaining.get(hash) ?? 0;
    if (available > 0) {
      remaining.set(hash, available - 1);
      continue;
    }
    if (isDone(event.status)) result.done++;
    else result.other++;
    const time = Date.parse(event.at ?? '');
    if (!Number.isFinite(time)) result.unknownTime++;
    else if (time <= Date.parse(collectedAt)) result.beforeOrAtCollection++;
    else result.afterCollection++;
  }
  return result;
}

/** Flattens locally collected project status histories without changing source data. */
function rawTransitions(issue) {
  return (issue.projectStatuses ?? []).flatMap((project) =>
    (project.statusHistory ?? []).map((event) => ({
      projectId: project.projectId,
      status: event.status,
      at: event.transitionedAt
    }))
  );
}

/** Groups creation years; unknown or malformed dates do not expose raw values. */
function creationPeriod(issue) {
  const year = String(issue.createdAt ?? '').slice(0, 4);
  return /^20\d{2}$/.test(year) ? year : 'UNKNOWN';
}

/** Parses and validates CLI options without accepting secrets as arguments. */
export function parseArgs(argv) {
  const options = {
    raw: 'data/raw/my-real-dataset.json',
    output: 'data/diagnostics',
    sample: 20,
    live: false
  };
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (key === '--live') options.live = true;
    else if (['--raw', '--fixture', '--output', '--sample', '--collected-at'].includes(key)) {
      if (!argv[i + 1]) throw new Error(`Missing value for ${key}`);
      options[key.slice(2)] = argv[++i];
    } else if (key === '--help') options.help = true;
    else throw new Error(`Unknown option: ${key}`);
  }
  options.sample = Number(options.sample);
  if (!Number.isSafeInteger(options.sample) || options.sample < 1 || options.sample > 1000)
    throw new Error('--sample must be 1..1000');
  if (options['collected-at']) {
    const value = options['collected-at'];
    if (
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) ||
      !Number.isFinite(Date.parse(value))
    )
      throw new Error('--collected-at requires an ISO timestamp with timezone');
    options.collectedAt = value;
  }
  return options;
}

/** Lists the transitions already attached to project contexts in the RAW. */
const historyOf = (issue) => (issue.projectStatuses ?? []).flatMap((p) => p.statusHistory ?? []);
/** Recognizes the supported Done labels without inferring Done from CLOSED. */
const isDone = (status) => /^(?:done|termin[eé]e?|✅\s*done)$/i.test(String(status ?? '').trim());
/** Classifies an issue from its collected statuses and dated Done transitions. */
export function classify(issue) {
  const history = historyOf(issue);
  const done = history.filter((t) => isDone(t.status) && t.transitionedAt);
  const statuses = (issue.projectStatuses ?? []).map((p) => p.status);
  const hasPr = (issue.linkedPullRequestIds ?? []).length > 0;
  return {
    statusContexts: statuses.length,
    historyEvents: history.length,
    doneTransitions: done.length,
    hasPr,
    githubClosed: issue.state === 'CLOSED',
    case: !statuses.length
      ? 'NO_PROJECT_STATUS'
      : !history.length
        ? 'NO_HISTORY'
        : done.length > 1
          ? 'MULTIPLE_DONE'
          : done.length === 1
            ? 'ONE_DONE'
            : 'HISTORY_WITHOUT_DONE'
  };
}

/** Produces non-identifying counts and local issue references for sampling. */
function summarize(dataset) {
  const rows = [];
  for (const repo of dataset.repositories ?? [])
    for (const issue of repo.issues ?? []) rows.push({ repo, issue, ...classify(issue) });
  const count = (predicate) => rows.filter(predicate).length;
  return {
    rows,
    totals: {
      repositories: (dataset.repositories ?? []).length,
      issues: rows.length,
      noProjectStatus: count((r) => !r.statusContexts),
      noHistory: count((r) => !r.historyEvents),
      prWithoutDatedDone: count((r) => r.hasPr && !r.doneTransitions),
      oneDone: count((r) => r.doneTransitions === 1),
      multipleDone: count((r) => r.doneTransitions > 1),
      closedWithoutDatedDone: count((r) => r.githubClosed && !r.doneTransitions)
    }
  };
}

/** Reads every available GitHub status-timeline page for one issue. */
async function fetchLiveHistory(repo, issue, token, graphqlUrl) {
  const owner = repo.owner;
  const name = repo.name;
  if (!owner || !name || !Number.isInteger(issue.number)) throw new Error('Missing local GitHub coordinates');
  let cursor = null;
  let events = 0;
  let done = 0;
  let pages = 0;
  let currentProjectCount = null;
  const transitions = [];
  const historicalProjectIds = new Set();
  const currentProjectIds = new Set();
  do {
    const query = `query($owner:String!,$name:String!,$number:Int!,$after:String) {
      repository(owner:$owner,name:$name) { issue(number:$number) {
        ${cursor === null ? 'projectItems(first:100) { nodes { project { id } } pageInfo { hasNextPage } }' : ''}
        timelineItems(first:100,after:$after,itemTypes:[PROJECT_V2_ITEM_STATUS_CHANGED_EVENT]) {
          nodes { ... on ProjectV2ItemStatusChangedEvent { status project { id } createdAt } }
          pageInfo { hasNextPage endCursor }
        }
      } }
    }`;
    const response = await fetch(graphqlUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query, variables: { owner, name, number: issue.number, after: cursor } })
    });
    if (!response.ok) throw new Error(`HTTP_${response.status}`);
    const payload = await response.json();
    if (payload.errors?.length) throw new Error('GRAPHQL_ERROR');
    const data = payload.data?.repository?.issue;
    if (!data) throw new Error('ISSUE_UNAVAILABLE');
    if (cursor === null) {
      currentProjectCount = data.projectItems?.nodes?.length ?? 0;
      for (const node of data.projectItems?.nodes ?? [])
        if (node?.project?.id) currentProjectIds.add(node.project.id);
      if (data.projectItems?.pageInfo?.hasNextPage) throw new Error('PROJECT_ITEMS_PAGINATION_REQUIRED');
    }
    const timeline = data.timelineItems;
    for (const event of timeline?.nodes ?? []) {
      if (!event?.createdAt || !event?.status) continue;
      events++;
      transitions.push({ projectId: event.project?.id, status: event.status, at: event.createdAt });
      if (isDone(event.status)) done++;
      if (event.project?.id) historicalProjectIds.add(event.project.id);
    }
    pages++;
    if (pages > 200) throw new Error('TIMELINE_PAGE_LIMIT');
    const next = timeline?.pageInfo?.hasNextPage ? timeline.pageInfo.endCursor : null;
    if (timeline?.pageInfo?.hasNextPage && (!next || next === cursor))
      throw new Error('INVALID_TIMELINE_CURSOR');
    cursor = next;
  } while (cursor);
  return {
    events,
    done,
    pages,
    transitions,
    currentProjectCount,
    eventsForProjectsNotCurrent: [...historicalProjectIds].filter((id) => !currentProjectIds.has(id)).length
  };
}

/** Runs offline and optional live diagnostics, writing pseudonymized reports only. */
export async function diagnose(options) {
  const raw = JSON.parse(await readFile(resolve(options.raw), 'utf8'));
  const { rows, totals } = summarize(raw);
  const salt = randomBytes(32);
  /** Creates a stable pseudonym within this run only. */
  const pseudonym = (value) => digest(salt, value).slice(0, 16);
  const fixture = options.fixture ? JSON.parse(await readFile(resolve(options.fixture), 'utf8')) : null;
  const fixtureStats = fixture ? summarize(fixture).totals : null;
  // Cross-file identifiers are deliberately NOT matched: anonymization changes IDs and dates.
  const cases = rows.map((r) => ({
    issue: pseudonym(`${r.repo.id}:${r.issue.id}`),
    repository: pseudonym(r.repo.id),
    category: r.case,
    createdYear: creationPeriod(r.issue),
    projectContexts: r.statusContexts,
    historyEvents: r.historyEvents,
    doneTransitions: r.doneTransitions,
    linkedPr: r.hasPr,
    githubClosed: r.githubClosed
  }));
  const live = { requested: options.live, checked: 0, outcomes: {}, comparisons: [] };
  if (options.live) {
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error('GITHUB_TOKEN is required for --live');
    const graphqlUrl = process.env.GITHUB_GRAPHQL_URL || 'https://api.github.com/graphql';
    // Stratified round-robin sampling: controls are included even for small samples.
    const groups = [
      rows.filter((r) => r.historyEvents === 0),
      rows.filter((r) => r.historyEvents > 0 && r.doneTransitions === 0),
      rows.filter((r) => r.doneTransitions > 0)
    ];
    const targets = [];
    for (let index = 0; targets.length < options.sample; index++) {
      let added = false;
      for (const group of groups) {
        if (group[index] && targets.length < options.sample) {
          targets.push(group[index]);
          added = true;
        }
      }
      if (!added) break;
    }
    for (const row of targets) {
      const entry = {
        issue: pseudonym(`${row.repo.id}:${row.issue.id}`),
        rawEvents: row.historyEvents,
        rawDone: row.doneTransitions
      };
      try {
        const observed = await fetchLiveHistory(row.repo, row.issue, token, graphqlUrl);
        entry.apiEvents = observed.events;
        entry.apiDone = observed.done;
        entry.apiPages = observed.pages;
        entry.historicalProjectsNotCurrent = observed.eventsForProjectsNotCurrent;
        entry.apiExceedsRaw = observed.events > row.historyEvents;
        entry.apiDoneExceedsRaw = observed.done > row.doneTransitions;
        const difference = compareTransitions(rawTransitions(row.issue), observed.transitions, salt);
        entry.apiOnlyTransitions = difference.apiOnly;
        entry.rawOnlyTransitions = difference.rawOnly;
        entry.exactTransitionMatch = difference.exactMatch;
        if (options.collectedAt) {
          const extra = classifyExtraTransitions(
            rawTransitions(row.issue),
            observed.transitions,
            salt,
            options.collectedAt
          );
          entry.apiOnlyBeforeOrAtCollection = extra.beforeOrAtCollection;
          entry.apiOnlyAfterCollection = extra.afterCollection;
          entry.apiOnlyUnknownTime = extra.unknownTime;
          entry.apiOnlyDone = extra.done;
          entry.apiOnlyOther = extra.other;
        }
        live.outcomes.OK = (live.outcomes.OK ?? 0) + 1;
      } catch (error) {
        const code = String(error.message).startsWith('HTTP_')
          ? error.message
          : [
                'GRAPHQL_ERROR',
                'ISSUE_UNAVAILABLE',
                'PROJECT_ITEMS_PAGINATION_REQUIRED',
                'TIMELINE_PAGE_LIMIT',
                'INVALID_TIMELINE_CURSOR',
                'Missing local GitHub coordinates'
              ].includes(error.message)
            ? error.message
            : 'OTHER_ERROR';
        entry.errorCode = code;
        live.outcomes[code] = (live.outcomes[code] ?? 0) + 1;
      }
      live.comparisons.push(entry);
      live.checked++;
    }
  }
  const output = resolve(options.output);
  await mkdir(output, { recursive: true });
  const summary = {
    schemaVersion: 1,
    mode: options.live ? 'live-sample' : 'offline',
    raw: totals,
    ...(fixtureStats
      ? {
          fixture: fixtureStats,
          note: 'Aggregate comparison only: fixture dates and IDs may be transformed.'
        }
      : {}),
    live: {
      requested: live.requested,
      checked: live.checked,
      outcomes: live.outcomes,
      apiMoreEventsThanRaw: live.comparisons.filter((r) => r.apiExceedsRaw).length,
      apiMoreDoneThanRaw: live.comparisons.filter((r) => r.apiDoneExceedsRaw).length,
      exactTransitionMismatches: live.comparisons.filter((r) => r.exactTransitionMatch === false).length,
      apiOnlyTransitions: live.comparisons.reduce((sum, r) => sum + (r.apiOnlyTransitions ?? 0), 0),
      rawOnlyTransitions: live.comparisons.reduce((sum, r) => sum + (r.rawOnlyTransitions ?? 0), 0),
      apiOnlyBeforeOrAtCollection: live.comparisons.reduce(
        (n, r) => n + (r.apiOnlyBeforeOrAtCollection ?? 0),
        0
      ),
      apiOnlyAfterCollection: live.comparisons.reduce((n, r) => n + (r.apiOnlyAfterCollection ?? 0), 0),
      historicalProjectsNotCurrent: live.comparisons.reduce(
        (sum, r) => sum + (r.historicalProjectsNotCurrent ?? 0),
        0
      )
    }
  };
  const periods = Object.entries(
    cases.reduce((acc, row) => {
      const period = row.createdYear;
      const bucket = (acc[period] ??= {
        createdYear: period,
        issues: 0,
        noHistory: 0,
        prWithoutDatedDone: 0
      });
      bucket.issues++;
      if (row.historyEvents === 0) bucket.noHistory++;
      if (row.linkedPr && row.doneTransitions === 0) bucket.prWithoutDatedDone++;
      return acc;
    }, {})
  )
    .map(([, value]) => value)
    .sort((a, b) => a.createdYear.localeCompare(b.createdYear));
  /** Serializes controlled, non-free-text diagnostic columns as CSV. */
  const csv = (data) =>
    data.length
      ? [
          Object.keys(data[0]).join(','),
          ...data.map((row) =>
            Object.values(row)
              .map((v) => String(v ?? ''))
              .join(',')
          )
        ].join('\n') + '\n'
      : '';
  await writeFile(join(output, 'history-summary.json'), JSON.stringify(summary, null, 2) + '\n');
  await writeFile(join(output, 'history-cases.csv'), csv(cases));
  await writeFile(join(output, 'history-periods.csv'), csv(periods));
  if (options.live) await writeFile(join(output, 'history-live-sample.csv'), csv(live.comparisons));
  const report =
    `# Diagnostic local des historiques GitHub\n\nMode : ${summary.mode}. Les identifiants exportés sont des pseudonymes HMAC à sel aléatoire non exporté.\n\n` +
    `| Indicateur | Nombre |\n|---|---:|\n` +
    Object.entries(totals)
      .map(([key, value]) => `| ${key} | ${value} |`)
      .join('\n') +
    '\n\n' +
    (options.live
      ? `## Comparaison API (échantillon)\n\nIssues vérifiées : ${live.checked}. Réponses API contenant davantage d'événements que le RAW : ${summary.live.apiMoreEventsThanRaw}. Davantage de transitions Done : ${summary.live.apiMoreDoneThanRaw}. Écarts de transitions exactes : ${summary.live.exactTransitionMismatches}. Projets historiques absents des projets courants (somme sur échantillon) : ${summary.live.historicalProjectsNotCurrent}.\n\nErreurs par code : ${JSON.stringify(live.outcomes)}.\n\n`
      : '') +
    `## Analyse temporelle\n\nVoir history-periods.csv (année de création, volumes sans historique et PR sans Done daté).\n\n## Interprétation\n\nUne absence dans le RAW ne prouve pas une absence côté GitHub. Les différences API/RAW peuvent provenir de l'évolution des données entre les collectes. Le contrôle de pagination des projectItems est signalé explicitement. Une PR fusionnée ne prouve pas une transition métier Done. Le contrat I3 n'est pas modifié.\n\n## Confidentialité\n\nNe partager que ces fichiers de diagnostic après relecture. Ne pas partager le RAW, le token, les logs HTTP ni les fichiers de trace de l'anonymiseur. Les catégories et volumes peuvent rester sensibles.\n`;
  await writeFile(join(output, 'history-report.md'), report);
  return summary;
}

if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help)
      console.log(
        'npm run diagnose:history -- --raw <local-raw.json> [--fixture <anonymized.json>] [--live --sample 20 --collected-at 2026-10-09T08:00:00+02:00] [--output data/diagnostics]'
      );
    else console.log(JSON.stringify(await diagnose(options), null, 2));
  } catch (error) {
    console.error(`Diagnosis failed: ${error.message}`);
    process.exitCode = 1;
  }
}
