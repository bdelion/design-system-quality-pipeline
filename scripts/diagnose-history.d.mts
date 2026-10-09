/** Type declarations for the Node.js ESM history diagnostic. */
export interface HistoryTransition {
  projectId?: string | null;
  status?: string | null;
  at?: string | null;
}

export interface IssueHistoryEvent {
  status?: string | null;
  transitionedAt?: string | null;
}

export interface DiagnosticIssue {
  state?: string;
  linkedPullRequestIds?: string[];
  projectStatuses?: Array<{
    status?: string;
    statusHistory?: IssueHistoryEvent[];
  }>;
}

export interface DiagnosticOptions {
  raw: string;
  output: string;
  sample: number;
  live: boolean;
  fixture?: string;
  collectedAt?: string;
  help?: boolean;
}

export function transitionKey(projectId: string | null | undefined, status: string | null | undefined, at: string | null | undefined): string;
export function compareTransitions(raw: HistoryTransition[], api: HistoryTransition[], key: Uint8Array): {
  apiOnly: number;
  rawOnly: number;
  exactMatch: boolean;
};
export function classifyExtraTransitions(raw: HistoryTransition[], api: HistoryTransition[], key: Uint8Array, collectedAt: string): {
  beforeOrAtCollection: number;
  afterCollection: number;
  unknownTime: number;
  done: number;
  other: number;
};
export function parseArgs(argv: string[]): DiagnosticOptions;
export function classify(issue: DiagnosticIssue): {
  statusContexts: number;
  historyEvents: number;
  doneTransitions: number;
  hasPr: boolean;
  githubClosed: boolean;
  case: 'NO_PROJECT_STATUS' | 'NO_HISTORY' | 'MULTIPLE_DONE' | 'ONE_DONE' | 'HISTORY_WITHOUT_DONE';
};
export function diagnose(options: DiagnosticOptions): Promise<unknown>;
