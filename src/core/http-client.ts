import {CrowdStrikeApiError, CrowdStrikeNetworkError} from './errors';
import type {CrowdStrikeErrorDetail} from './types';

/** Minimal contract HttpClient needs from whatever manages bearer tokens. */
export interface TokenProvider {
  getToken(): Promise<string>;
  invalidate(): void;
}

export type QueryValue = string | number | boolean | string[] | undefined;

export interface RequestOptions<TBody = unknown> {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  path: string;
  query?: Record<string, QueryValue>;
  body?: TBody;
  /** 'json' (default) or 'form' for x-www-form-urlencoded (used by the OAuth2 token endpoint). */
  bodyEncoding?: 'json' | 'form';
  signal?: AbortSignal;
}

/** Raw wire shape of CrowdStrike's error envelope (snake_case meta fields). */
interface RawErrorEnvelope {
  errors?: CrowdStrikeErrorDetail[];
  meta?: {trace_id?: string};
}

const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Single choke point for all outbound CrowdStrike requests: builds the URL/query,
 * attaches the bearer token, applies a timeout, retries once on 401, and normalizes
 * errors into CrowdStrikeApiError / CrowdStrikeNetworkError.
 */
export class HttpClient {
  constructor(
    private readonly baseUrl: string,
    private readonly tokenProvider: TokenProvider | null,
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ) {}

  async request<TResponse>(
    options: RequestOptions,
    isRetry = false,
  ): Promise<TResponse> {
    const url = this.buildUrl(options.path, options.query);
    const headers = new Headers();
    if (this.tokenProvider) {
      headers.set(
        'Authorization',
        `Bearer ${await this.tokenProvider.getToken()}`,
      );
    }

    const body = this.buildBody(options, headers);
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Response;
    try {
      response = await this.fetchImpl(url, {
        method: options.method,
        headers,
        body,
        signal: options.signal ?? controller.signal,
      });
    } catch (cause) {
      throw new CrowdStrikeNetworkError({
        requestPath: options.path,
        message: `Network request to ${options.path} failed`,
        cause,
      });
    } finally {
      clearTimeout(timeoutHandle);
    }

    if (response.status === 401 && this.tokenProvider && !isRetry) {
      this.tokenProvider.invalidate();
      return this.request<TResponse>(options, true);
    }

    if (!response.ok) {
      const errorBody = await this.safeParseJson<RawErrorEnvelope>(response);
      throw new CrowdStrikeApiError({
        status: response.status,
        traceId: errorBody?.meta?.trace_id,
        errors: errorBody?.errors ?? [],
        requestPath: options.path,
      });
    }

    if (response.status === 204) {
      return undefined as TResponse;
    }

    return (await response.json()) as TResponse;
  }

  private buildUrl(path: string, query?: Record<string, QueryValue>): string {
    const url = new URL(path, this.baseUrl);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined) {
          continue;
        }
        if (Array.isArray(value)) {
          for (const item of value) {
            url.searchParams.append(key, String(item));
          }
        } else {
          url.searchParams.append(key, String(value));
        }
      }
    }
    return url.toString();
  }

  private buildBody(
    options: RequestOptions,
    headers: Headers,
  ): Bun.BodyInit | undefined {
    if (options.body === undefined) {
      return undefined;
    }
    if (options.bodyEncoding === 'form') {
      headers.set('Content-Type', 'application/x-www-form-urlencoded');
      return new URLSearchParams(
        options.body as Record<string, string>,
      ).toString();
    }
    headers.set('Content-Type', 'application/json');
    return JSON.stringify(options.body);
  }

  private async safeParseJson<T>(response: Response): Promise<T | undefined> {
    try {
      return (await response.json()) as T;
    } catch {
      return undefined;
    }
  }
}
