import { assertSafeRequestPath, validateBaseUrl } from './base-url';
import { CrowdStrikeApiError, CrowdStrikeNetworkError } from './errors';
import type { CrowdStrikeErrorDetail } from './types';

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
  /** 'json' (default) or 'blob' for binary downloads (used by sensor installer downloads). */
  responseType?: 'json' | 'blob';
  signal?: AbortSignal;
  /**
   * By default a 2xx response whose body carries a non-empty `errors` array and
   * no `resources` is thrown as a CrowdStrikeApiError. Set true for endpoints
   * (e.g. GraphQL) where `errors` is part of a successful body the caller reads.
   */
  allowErrorsOn2xx?: boolean;
}

/** Raw wire shape of CrowdStrike's error envelope (snake_case meta fields). */
interface RawErrorEnvelope {
  errors?: CrowdStrikeErrorDetail[];
  meta?: { trace_id?: string };
}

const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Single choke point for all outbound CrowdStrike requests: builds the URL/query,
 * attaches the bearer token, applies a timeout, retries once on 401, and normalizes
 * errors into CrowdStrikeApiError / CrowdStrikeNetworkError.
 */
export class HttpClient {
  private readonly baseUrl: string;

  constructor(
    baseUrl: string,
    private readonly tokenProvider: TokenProvider | null,
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly timeoutMs: number = DEFAULT_TIMEOUT_MS,
    allowInsecureLoopback = false,
  ) {
    this.baseUrl = validateBaseUrl(baseUrl, allowInsecureLoopback);
  }

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

    // One controller aborts the request when either the client timeout or the
    // caller's signal fires (AbortSignal.any is unavailable on Node 18).
    const controller = new AbortController();
    let timedOut = false;
    const timeoutHandle = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, this.timeoutMs);
    const forwardCallerAbort = (): void => controller.abort();
    if (options.signal?.aborted) {
      controller.abort();
    } else {
      options.signal?.addEventListener('abort', forwardCallerAbort, {
        once: true,
      });
    }
    const cleanup = (): void => {
      clearTimeout(timeoutHandle);
      options.signal?.removeEventListener('abort', forwardCallerAbort);
    };
    const toNetworkError = (cause: unknown): CrowdStrikeNetworkError => {
      if (timedOut) {
        return new CrowdStrikeNetworkError({
          requestPath: options.path,
          message: `Request to ${options.path} timed out after ${this.timeoutMs}ms`,
          cause,
          code: 'timeout',
        });
      }
      if (options.signal?.aborted) {
        return new CrowdStrikeNetworkError({
          requestPath: options.path,
          message: `Request to ${options.path} was aborted by the caller`,
          cause,
          code: 'aborted',
        });
      }
      return new CrowdStrikeNetworkError({
        requestPath: options.path,
        message: `Network request to ${options.path} failed`,
        cause,
        code: 'network',
      });
    };

    try {
      let response: Response;
      try {
        response = await this.fetchImpl(url, {
          method: options.method,
          headers,
          body,
          signal: controller.signal,
        });
      } catch (cause) {
        throw toNetworkError(cause);
      }

      if (response.status === 401 && this.tokenProvider && !isRetry) {
        cleanup();
        this.tokenProvider.invalidate();
        return await this.request<TResponse>(options, true);
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

      // The timeout also covers reading the body, so a stalled stream cannot hang.
      try {
        if (options.responseType === 'blob') {
          return (await response.blob()) as TResponse;
        }
        const parsed = (await response.json()) as TResponse;
        if (!options.allowErrorsOn2xx) {
          this.assertNoHiddenFailure(parsed, response.status, options.path);
        }
        return parsed;
      } catch (cause) {
        if (controller.signal.aborted) {
          throw toNetworkError(cause);
        }
        throw cause;
      }
    } finally {
      cleanup();
    }
  }

  /**
   * CrowdStrike can answer 200/207 with only per-id failures in `errors` and
   * nothing in `resources`; surface that as an error instead of empty data.
   */
  private assertNoHiddenFailure(
    body: unknown,
    status: number,
    requestPath: string,
  ): void {
    if (typeof body !== 'object' || body === null) {
      return;
    }
    const envelope = body as RawErrorEnvelope & { resources?: unknown };
    const hasErrors =
      Array.isArray(envelope.errors) && envelope.errors.length > 0;
    const hasResources =
      Array.isArray(envelope.resources) && envelope.resources.length > 0;
    if (hasErrors && !hasResources) {
      throw new CrowdStrikeApiError({
        status,
        traceId: envelope.meta?.trace_id,
        errors: envelope.errors ?? [],
        requestPath,
      });
    }
  }

  private buildUrl(path: string, query?: Record<string, QueryValue>): string {
    assertSafeRequestPath(path);
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
  ): RequestInit['body'] | undefined {
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
