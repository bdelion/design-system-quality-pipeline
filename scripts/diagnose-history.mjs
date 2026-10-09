#!/usr/bin/env node
/* global process, fetch, URL, console */
/** Local, read-only GitHub history diagnostic. Export contains no raw names or identifiers. */
import { existsSync } from 'node:fs';
if (existsSync('.env') && typeof process.loadEnvFile === 'function') process.loadEnvFile('.env');
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { randomBytes, createHmac } from 'node:crypto';

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
    else if (['--raw', '--fixture', '--output', '--sample'].includes(key)) {
      if (!argv[i + 1]) throw new Error(`Missing value for ${key}`);
      options[key.slice(2)] = argv[++i];
    } else if (key === '--help') options.help = true;
    else throw new Error(`Unknown option: ${key}`);
  }
  options.sample = Number(options.sample);
  if (!Number.isSafeInteger(options.sample) || options.sample < 1 || options.sample > 100)
    throw new Error('--sample must be 1..100');
  return options;
}

const historyOf = (issue) => (issue.projectStatuses ?? []).flatMap((p) => p.statusHistory ?? []);
const isDone = (status) => /^(?:done|termin[eé]e?|✅\s*done)$/i.test(String(status ?? '').trim());
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

async function fetchLiveHistory(repo, issue, token, graphqlUrl) {
  const owner = repo.owner;
  const name = repo.name;
  if (!owner || !name || !Number.isInteger(issue.number)) throw new Error('Missing local GitHub coordinates');
  let cursor = null;
  let events = 0;
  let done = 0;
  let pages = 0;
  let currentProjectCount = null;
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
    currentProjectCount,
    eventsForProjectsNotCurrent: [...historicalProjectIds].filter((id) => !currentProjectIds.has(id)).length
  };
}

export async function diagnose(options) {
  const raw = JSON.parse(await readFile(resolve(options.raw), 'utf8'));
  const { rows, totals } = summarize(raw);
  const salt = randomBytes(32);
  const pseudonym = (value) => createHmac('sha256', salt).update(String(value)).digest('hex').slice(0, 16);
  const fixture = options.fixture ? JSON.parse(await readFile(resolve(options.fixture), 'utf8')) : null;
  const fixtureStats = fixture ? summarize(fixture).totals : null;
  // Cross-file identifiers are deliberately NOT matched: anonymization changes IDs and dates.
  const cases = rows.map((r) => ({
    issue: pseudonym(`${r.repo.id}:${r.issue.id}`),
    repository: pseudonym(r.repo.id),
    category: r.case,
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
    // Deterministic sampling of missing histories and PR-without-DONE, plus a few controls.
    const targets = [
      ...rows.filter((r) => r.historyEvents === 0 || (r.hasPr && r.doneTransitions === 0)),
      ...rows.filter((r) => r.doneTransitions > 0)
    ].slice(0, options.sample);
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
      historicalProjectsNotCurrent: live.comparisons.reduce(
        (sum, r) => sum + (r.historicalProjectsNotCurrent ?? 0),
        0
      )
    }
  };
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
  if (options.live) await writeFile(join(output, 'history-live-sample.csv'), csv(live.comparisons));
  const report =
    `# Diagnostic local des historiques GitHub\n\nMode : ${summary.mode}. Les identifiants exportés sont des pseudonymes HMAC à sel aléatoire non exporté.\n\n` +
    `| Indicateur | Nombre |\n|---|---:|\n` +
    Object.entries(totals)
      .map(([key, value]) => `| ${key} | ${value} |`)
      .join('\n') +
    '\n\n' +
    (options.live
      ? `## Comparaison API (échantillon)\n\nIssues vérifiées : ${live.checked}. Réponses API contenant davantage d'événements que le RAW : ${summary.live.apiMoreEventsThanRaw}. Davantage de transitions Done : ${summary.live.apiMoreDoneThanRaw}. Projets historiques absents des projets courants (somme sur échantillon) : ${summary.live.historicalProjectsNotCurrent}.\n\nErreurs par code : ${JSON.stringify(live.outcomes)}.\n\n`
      : '') +
    `## Interprétation\n\nUne absence dans le RAW ne prouve pas une absence côté GitHub. Les différences API/RAW peuvent provenir de l'évolution des données entre les collectes. Le contrôle de pagination des projectItems est signalé explicitement. Une PR fusionnée ne prouve pas une transition métier Done. Le contrat I3 n'est pas modifié.\n\n## Confidentialité\n\nNe partager que ces fichiers de diagnostic après relecture. Ne pas partager le RAW, le token, les logs HTTP ni les fichiers de trace de l'anonymiseur. Les catégories et volumes peuvent rester sensibles.\n`;
  await writeFile(join(output, 'history-report.md'), report);
  return summary;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help)
      console.log(
        'npm run diagnose:history -- --raw <local-raw.json> [--fixture <anonymized.json>] [--live --sample 20] [--output data/diagnostics]'
      );
    else console.log(JSON.stringify(await diagnose(options), null, 2));
  } catch (error) {
    console.error(`Diagnosis failed: ${error.message}`);
    process.exitCode = 1;
  }
}
