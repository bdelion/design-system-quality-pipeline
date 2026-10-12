import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { stringify } from 'yaml';

/** Valeur observée et numéros des issues qui la justifient, sans interprétation métier. */
export interface SystemObservation {
  value: string;
  issueNumbers: number[];
}

/** Inventaire par repository ; les champs RAW absents sont distingués des listes présentes et vides. */
export interface SystemInventory {
  repository: string;
  issueCount: number;
  issuesWithoutRawIssueType: number;
  issuesWithoutProjectStatuses: number;
  labels: SystemObservation[];
  rawIssueTypes: SystemObservation[];
  canonicalIssueTypes: SystemObservation[];
  projectStatuses: SystemObservation[];
  milestones: SystemObservation[];
}

/** Reconnaît un objet RAW sans tableau ni valeur nulle. */
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Valide une chaîne renseignée sans interpréter sa signification. */
function text(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Produit un brouillon de système depuis les seuls faits du RAW, sans règles métier implicites. */
export function buildSystemDraft(input: unknown) {
  if (
    !record(input) ||
    !text(input.collectedAt) ||
    !Number.isFinite(Date.parse(input.collectedAt)) ||
    !Array.isArray(input.repositories)
  )
    throw new Error('RAW invalide : date et repositories requis.');
  const owners = new Set<string>();
  const repositories = new Set<string>();
  const inventory: SystemInventory[] = [];
  const seen = new Set<string>();
  for (const repository of input.repositories) {
    if (
      !record(repository) ||
      !text(repository.owner) ||
      !text(repository.name) ||
      !Array.isArray(repository.issues)
    )
      throw new Error('RAW invalide : owner, nom ou issues du repository.');
    const fullName = `${repository.owner}/${repository.name}`;
    if (seen.has(fullName)) throw new Error('RAW invalide : repository dupliqué.');
    seen.add(fullName);
    owners.add(repository.owner);
    repositories.add(repository.name);
    const entry: SystemInventory = {
      repository: fullName,
      issueCount: repository.issues.length,
      issuesWithoutRawIssueType: 0,
      issuesWithoutProjectStatuses: 0,
      labels: [],
      rawIssueTypes: [],
      canonicalIssueTypes: [],
      projectStatuses: [],
      milestones: []
    };
    /** Ajoute une observation unique par valeur et numéro d’issue. */
    function add(list: SystemObservation[], value: string, number: number): void {
      let observation = list.find((item) => item.value === value);
      if (!observation) {
        observation = { value, issueNumbers: [] };
        list.push(observation);
      }
      if (!observation.issueNumbers.includes(number)) observation.issueNumbers.push(number);
    }
    for (const issue of repository.issues) {
      if (
        !record(issue) ||
        typeof issue.number !== 'number' ||
        !Number.isSafeInteger(issue.number) ||
        issue.number <= 0 ||
        !Array.isArray(issue.labels) ||
        !issue.labels.every(text)
      )
        throw new Error('RAW invalide : numéro ou labels d’une issue.');
      for (const label of issue.labels) add(entry.labels, label, issue.number);
      if (issue.rawIssueType === undefined) entry.issuesWithoutRawIssueType++;
      else if (text(issue.rawIssueType)) add(entry.rawIssueTypes, issue.rawIssueType, issue.number);
      else throw new Error('RAW invalide : type GitHub d’une issue.');
      if (issue.issueType !== undefined) {
        if (!text(issue.issueType)) throw new Error('RAW invalide : type canonique d’une issue.');
        add(entry.canonicalIssueTypes, issue.issueType, issue.number);
      }
      if (issue.projectStatuses === undefined) entry.issuesWithoutProjectStatuses++;
      else {
        if (!Array.isArray(issue.projectStatuses)) throw new Error('RAW invalide : statuts Project.');
        for (const status of issue.projectStatuses) {
          if (!record(status) || !text(status.status)) throw new Error('RAW invalide : statut Project.');
          add(entry.projectStatuses, status.status, issue.number);
        }
      }
      if (issue.milestone !== undefined) {
        if (!record(issue.milestone) || !text(issue.milestone.title))
          throw new Error('RAW invalide : milestone.');
        add(entry.milestones, issue.milestone.title, issue.number);
      }
    }
    for (const list of [
      entry.labels,
      entry.rawIssueTypes,
      entry.canonicalIssueTypes,
      entry.projectStatuses,
      entry.milestones
    ]) {
      list.sort((a, b) => (a.value < b.value ? -1 : a.value > b.value ? 1 : 0));
      for (const observation of list) observation.issueNumbers.sort((a, b) => a - b);
    }
    inventory.push(entry);
  }
  const ownerList = [...owners].sort();
  inventory.sort((a, b) => (a.repository < b.repository ? -1 : a.repository > b.repository ? 1 : 0));
  return {
    draft: true,
    collectedAt: input.collectedAt,
    modelVersion: null,
    ruleVersion: null,
    auditVersion: null,
    scope: null,
    githubOwner: ownerList.length === 1 ? ownerList[0]! : null,
    repositories: [...repositories].sort(),
    githubApiUrl: null,
    githubGraphqlUrl: null,
    githubUrl: null,
    github: {
      labels: {
        componentPrefix: null,
        accessibilityCriticalityPrefix: null,
        accessibilityCategoryPrefix: null,
        unknown: null,
        criticalityValues: null
      },
      issueTypes: { anomaly: null, keywords: null },
      projectStatuses: { keywords: null },
      closingKeywords: null,
      cancelledProjectStatuses: null,
      milestoneDetection: null,
      auditDetection: null,
      accessibilityRecognition: null
    },
    owners: ownerList,
    inventory
  };
}

/** Écrit un nouveau brouillon YAML hors réseau, en préservant les entrées et les fichiers existants. */
export async function generateSystemDraft(input: string, output: string) {
  const content = await readFile(input, 'utf8');
  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch {
    throw new Error('Fichier RAW : JSON invalide.');
  }
  const draft = buildSystemDraft(raw);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, stringify(draft), { encoding: 'utf8', flag: 'wx' });
  return draft;
}
