import { setTimeout as sleep } from 'node:timers/promises';
import type { CollectionProgress } from '../lib/collection-progress.js';

/** Options communes aux commandes qui effectuent une collecte GitHub. */
export interface GithubQuotaOptions {
  waitForQuota?: boolean;
  restQuotaReserve?: number;
  graphqlQuotaReserve?: number;
  quotaMaxWait?: number;
  maxRetries?: number | undefined;
}
type Resource = 'rest' | 'graphql';
interface Quota {
  remaining: number;
  resetAt?: number;
  cost: number;
}
interface QuotaPayload {
  resources?: {
    core?: { remaining?: number; reset?: number };
    graphql?: { remaining?: number; reset?: number };
  };
  data?: { rateLimit?: { remaining?: number; resetAt?: string; cost?: number } };
  errors?: Array<{ type?: string; message?: string; extensions?: { type?: string; code?: string } }>;
  message?: string;
}

/** Lit un en-tête numérique sans transformer une valeur absente en zéro. */
function headerNumber(headers: Headers, name: string): number | undefined {
  const text = headers.get(name);
  if (text === null || !text.trim()) return undefined;
  const value = Number(text);
  return Number.isFinite(value) && value >= 0 ? value : undefined;
}

/** Valide les options avant toute requête ou création de données. */
export function validateGithubQuotaOptions(options: GithubQuotaOptions): void {
  for (const [name, value] of Object.entries({
    restQuotaReserve: options.restQuotaReserve,
    graphqlQuotaReserve: options.graphqlQuotaReserve,
    quotaMaxWait: options.quotaMaxWait,
    maxRetries: options.maxRetries
  })) {
    if (
      value !== undefined &&
      (!Number.isSafeInteger(value) || value < 0 || (name === 'quotaMaxWait' && value === 0))
    )
      throw new Error(
        `Option ${name} : entier ${name === 'quotaMaxWait' ? 'strictement positif' : 'positif ou nul'} requis.`
      );
  }
}

/** Coordonne toutes les requêtes d'une collecte, ses réserves et ses interruptions. */
export class GithubRequests {
  private queue: Promise<unknown> = Promise.resolve();
  private failure: Error | undefined;
  private readonly aborter = new AbortController();
  private readonly quotas: Partial<Record<Resource, Quota>> = {};
  private waited = 0;

  /** Initialise un contrôleur partagé ; les requêtes sont sérialisées pour éviter les courses au quota. */
  constructor(
    private readonly token: string,
    private readonly apiUrl: string,
    private readonly progress: CollectionProgress,
    private readonly options: GithubQuotaOptions = {}
  ) {
    validateGithubQuotaOptions(options);
  }

  /** Vérifie les deux quotas avant de lancer la collecte des repositories. */
  async initialize(): Promise<void> {
    try {
      await this.refresh();
      await this.ensureBudget('rest');
      await this.ensureBudget('graphql');
    } catch (error) {
      this.abort(error);
      throw error;
    }
  }

  /** Arrête les tâches en attente et annule une éventuelle requête en vol. */
  abort(error: unknown): void {
    this.failure ??= error instanceof Error ? error : new Error('Collecte GitHub interrompue.');
    this.aborter.abort(this.failure);
  }

  /** Place une lecture REST ou GraphQL dans la file commune sans mutation distante. */
  request(url: string, init: RequestInit, resource: Resource): Promise<Response> {
    const task = this.queue.then(async () => {
      if (this.failure) throw this.failure;
      try {
        await this.ensureBudget(resource);
        return await this.execute(url, init, resource);
      } catch (error) {
        this.abort(error);
        throw error;
      }
    });
    this.queue = task.catch(() => undefined);
    return task;
  }

  /** Relit les quotas officiels ; ce endpoint ne consomme pas le quota primaire REST. */
  private async refresh(): Promise<void> {
    if (this.failure) throw this.failure;
    const response = await this.execute(`${this.apiUrl.replace(/\/+$/, '')}/rate_limit`, {}, 'rest');
    if (!response.ok) throw new Error(`GitHub API request failed (${response.status})`);
    const data = (await response.json()) as QuotaPayload;
    const restRemaining = headerNumber(response.headers, 'x-ratelimit-remaining');
    const restReset = headerNumber(response.headers, 'x-ratelimit-reset');
    for (const [resource, quota] of [
      ['rest', data.resources?.core],
      ['graphql', data.resources?.graphql]
    ] as const) {
      if (typeof quota?.remaining !== 'number' || !Number.isFinite(quota.remaining) || quota.remaining < 0)
        continue;
      this.quotas[resource] = {
        remaining: resource === 'rest' ? (restRemaining ?? quota.remaining) : quota.remaining,
        cost: this.quotas[resource]?.cost ?? 1,
        ...(resource === 'rest' && restReset !== undefined && restReset > 0
          ? { resetAt: restReset * 1000 }
          : typeof quota.reset === 'number' && quota.reset > 0
            ? { resetAt: quota.reset * 1000 }
            : {})
      };
    }
    if (!this.quotas.rest || !this.quotas.graphql)
      throw new Error('Pré-check GitHub : quotas REST/GraphQL indisponibles ; collecte interrompue.');
  }

  /** Suspend avant la requête qui franchirait la réserve, sans supposer un nouveau quota au reset. */
  private async ensureBudget(resource: Resource): Promise<void> {
    let quota = this.quotas[resource];
    const reserve =
      resource === 'rest'
        ? (this.options.restQuotaReserve ?? 100)
        : (this.options.graphqlQuotaReserve ?? 100);
    while (quota && quota.remaining < reserve + quota.cost) {
      await this.pause(resource, quota.resetAt, 'réserve de sécurité atteinte');
      await this.refresh();
      quota = this.quotas[resource];
    }
  }

  /** Actualise les faits observés dans les en-têtes et dans le champ GraphQL rateLimit. */
  private observe(headers: Headers, resource: Resource, payload?: QuotaPayload): void {
    const remaining =
      resource === 'graphql'
        ? (payload?.data?.rateLimit?.remaining ?? headerNumber(headers, 'x-ratelimit-remaining'))
        : headerNumber(headers, 'x-ratelimit-remaining');
    const headerReset = headerNumber(headers, 'x-ratelimit-reset');
    const payloadReset = payload?.data?.rateLimit?.resetAt ? Date.parse(payload.data.rateLimit.resetAt) : NaN;
    const resetAt = Number.isFinite(payloadReset)
      ? payloadReset
      : headerReset !== undefined && headerReset > 0
        ? headerReset * 1000
        : this.quotas[resource]?.resetAt;
    if (typeof remaining === 'number' && Number.isFinite(remaining) && remaining >= 0) {
      const observedCost = payload?.data?.rateLimit?.cost;
      const cost =
        resource === 'graphql'
          ? typeof observedCost === 'number' && Number.isSafeInteger(observedCost) && observedCost > 0
            ? observedCost
            : (this.quotas[resource]?.cost ?? 1)
          : 1;
      this.quotas[resource] = { remaining, cost, ...(resetAt !== undefined ? { resetAt } : {}) };
      if (resource === 'graphql') this.progress.updateQuota(remaining, cost);
    }
  }

  /** Respecte le reset ou Retry-After ; conserve uniquement la progression en mémoire. */
  private async pause(resource: Resource, resumeAt: number | undefined, reason: string): Promise<void> {
    const name = resource === 'rest' ? 'REST' : 'GraphQL';
    const date =
      resumeAt === undefined
        ? 'inconnu'
        : `${new Date(resumeAt).toISOString()} (${new Date(resumeAt).toLocaleString('fr-FR', { timeZone: 'Europe/Paris', timeZoneName: 'short' })})`;
    if (!this.options.waitForQuota || resumeAt === undefined) {
      const error = new Error(
        `Quota ${name} : ${reason}. Reset/reprise : ${date}. Collecte interrompue, aucune nouvelle sortie produite.`
      );
      this.progress.warn(error.message);
      throw error;
    }
    const milliseconds = Math.max(1000, resumeAt - Date.now() + 1000);
    if (this.waited + milliseconds > (this.options.quotaMaxWait ?? 7200) * 1000)
      throw new Error(`Quota ${name} : durée maximale d’attente dépassée. Reset/reprise : ${date}.`);
    this.waited += milliseconds;
    this.progress.warn(`Quota ${name} : ${reason}. Reprise prévue : ${date}.`);
    const until = Date.now() + milliseconds;
    let tick = 0;
    while (Date.now() < until) {
      if (this.failure) throw this.failure;
      const seconds = Math.ceil((until - Date.now()) / 1000);
      if (this.progress.interactive || tick % 60 === 0)
        this.progress.warn(`Quota ${name} : ${seconds} s restantes avant reprise.`);
      await sleep(Math.min(1000, until - Date.now()), undefined, { signal: this.aborter.signal });
      tick++;
    }
    this.progress.warn(`Quota ${name} : vérification avant reprise.`);
  }

  /** Exécute les retries HTTP/réseau et détecte aussi les erreurs GraphQL retournées avec HTTP 200. */
  private async execute(url: string, init: RequestInit, resource: Resource): Promise<Response> {
    const maxRetries = this.options.maxRetries ?? 3;
    for (let attempt = 0; ; attempt++) {
      if (this.failure) throw this.failure;
      if (!url.endsWith('/rate_limit')) await this.ensureBudget(resource);
      let response: Response;
      try {
        if (!url.endsWith('/rate_limit') && this.quotas[resource])
          this.quotas[resource]!.remaining -= this.quotas[resource]!.cost;
        response = await fetch(url, {
          ...init,
          signal: this.aborter.signal,
          headers: {
            Authorization: `Bearer ${this.token}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'User-Agent': 'design-system-quality-pipeline',
            ...Object.fromEntries(new Headers(init.headers))
          }
        });
      } catch {
        if (this.failure) throw this.failure;
        if (attempt >= maxRetries)
          throw new Error('GitHub : erreur réseau persistante, collecte interrompue.');
        await this.backoff(attempt);
        continue;
      }
      let payload: QuotaPayload | undefined;
      if (resource === 'graphql' || response.status === 403 || response.status === 429) {
        try {
          payload = (await response.clone().json()) as QuotaPayload;
        } catch {
          /* Une réponse sans JSON ne prouve pas un quota disponible. */
        }
      }
      this.observe(response.headers, resource, payload);
      const graphqlLimit = payload?.errors?.some(
        (error) =>
          [error.type, error.extensions?.type, error.extensions?.code].includes('RATE_LIMITED') ||
          /rate.?limit/i.test(error.message ?? '')
      );
      const primary = headerNumber(response.headers, 'x-ratelimit-remaining') === 0;
      const secondary = /rate.?limit|abuse/i.test(payload?.message ?? '');
      const graphqlSecondary = payload?.errors?.some((error) => /secondary|abuse/i.test(error.message ?? ''));
      if (
        graphqlLimit ||
        response.status === 429 ||
        (response.status === 403 && (primary || secondary || response.headers.has('retry-after')))
      ) {
        const retryText = response.headers.get('retry-after');
        const retrySeconds = headerNumber(response.headers, 'retry-after');
        const retryDate = retryText ? Date.parse(retryText) : NaN;
        const retryAt =
          retrySeconds !== undefined
            ? Date.now() + retrySeconds * 1000
            : Number.isFinite(retryDate)
              ? retryDate
              : undefined;
        const headerReset = headerNumber(response.headers, 'x-ratelimit-reset');
        const resetAt =
          headerReset !== undefined && headerReset > 0 ? headerReset * 1000 : this.quotas[resource]?.resetAt;
        const resumeAt =
          retryAt ??
          (primary || (graphqlLimit && !graphqlSecondary)
            ? resetAt || undefined
            : Date.now() + 60000 * 2 ** Math.min(attempt, 4));
        await this.pause(
          resource,
          resumeAt,
          primary || (graphqlLimit && !graphqlSecondary) ? 'limite atteinte' : 'limite secondaire atteinte'
        );
        if (!url.endsWith('/rate_limit')) {
          await this.refresh();
          await this.ensureBudget(resource);
        }
        continue;
      }
      if (payload?.errors?.length)
        throw new Error(`GitHub GraphQL : réponse en erreur (${payload.errors.length} erreur(s)).`);
      if ([502, 503, 504].includes(response.status) && attempt < maxRetries) {
        await this.backoff(attempt);
        continue;
      }
      return response;
    }
  }

  /** Applique un backoff exponentiel borné avec jitter sans divulguer de données API. */
  private async backoff(attempt: number): Promise<void> {
    const milliseconds = Math.min(30000, 1000 * 2 ** attempt) + Math.floor(Math.random() * 1000);
    this.progress.warn(
      `GitHub : erreur transitoire, nouvelle tentative dans ${Math.ceil(milliseconds / 1000)} s.`
    );
    await sleep(milliseconds, undefined, { signal: this.aborter.signal });
  }
}
