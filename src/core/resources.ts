import { CrowdStrikeApiError } from './errors';
import type { HttpClient, RequestOptions } from './http-client';
import type { CrowdStrikeEnvelope, CrowdStrikeErrorDetail } from './types';

/** Outcome of a mutating call: what CrowdStrike returned, including per-id failures. */
export interface ActionResult {
  /** Raw `resources` entries from the response (shape varies by endpoint). */
  resources: unknown[];
  /** Per-id failures CrowdStrike reported alongside any successes. Empty when all succeeded. */
  errors: CrowdStrikeErrorDetail[];
}

/**
 * Returns the first entry of a single-entity response, or throws a
 * CrowdStrikeApiError carrying the response's `errors` when there is none.
 */
export function firstResource<T>(
  raw: CrowdStrikeEnvelope<T> | undefined,
  requestPath: string,
): T {
  const first = raw?.resources?.[0];
  if (first === undefined) {
    const errors = raw?.errors ?? [];
    const detail = errors.map((e) => e.message).join('; ');
    throw new CrowdStrikeApiError({
      status: 200,
      errors,
      requestPath,
      message: `CrowdStrike API response from ${requestPath} contained no resources${detail ? `: ${detail}` : ''}`,
    });
  }
  return first;
}

/** Sends a request expected to return exactly one entity and returns that entity. */
export async function requestFirst<T>(
  http: HttpClient,
  options: RequestOptions,
): Promise<T> {
  const raw = await http.request<CrowdStrikeEnvelope<T>>(options);
  return firstResource(raw, options.path);
}

/** Sends a mutating request and returns its resources and any per-id errors. */
export async function requestAction(
  http: HttpClient,
  options: RequestOptions,
): Promise<ActionResult> {
  const raw =
    await http.request<Partial<CrowdStrikeEnvelope<unknown>>>(options);
  return { resources: raw?.resources ?? [], errors: raw?.errors ?? [] };
}
