import type { CrowdStrikeErrorDetail } from './types';

/** Thrown when CrowdStrike responds with a non-2xx status. */
export class CrowdStrikeApiError extends Error {
  readonly status: number;
  readonly traceId?: string;
  readonly errors: CrowdStrikeErrorDetail[];
  readonly requestPath: string;

  constructor(params: {
    status: number;
    traceId?: string;
    errors: CrowdStrikeErrorDetail[];
    requestPath: string;
  }) {
    super(CrowdStrikeApiError.buildMessage(params));
    this.name = 'CrowdStrikeApiError';
    this.status = params.status;
    this.traceId = params.traceId;
    this.errors = params.errors;
    this.requestPath = params.requestPath;
  }

  /** True for 401/403 responses — caller may want to re-check credentials. */
  get isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }

  /** True for 429 responses — caller may want to back off and retry. */
  get isRateLimited(): boolean {
    return this.status === 429;
  }

  private static buildMessage(params: {
    status: number;
    requestPath: string;
    errors: CrowdStrikeErrorDetail[];
  }): string {
    const detail = params.errors.map((e) => e.message).join('; ');
    return `CrowdStrike API request to ${params.requestPath} failed with status ${params.status}${detail ? `: ${detail}` : ''}`;
  }
}

/** Thrown for network-level failures (DNS, connection reset, timeout/abort). */
export class CrowdStrikeNetworkError extends Error {
  readonly requestPath: string;
  readonly cause?: unknown;

  constructor(params: {
    requestPath: string;
    message: string;
    cause?: unknown;
  }) {
    super(params.message);
    this.name = 'CrowdStrikeNetworkError';
    this.requestPath = params.requestPath;
    this.cause = params.cause;
  }
}

/** Thrown synchronously when required client configuration (e.g. credentials) is missing. */
export class CrowdStrikeAuthConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CrowdStrikeAuthConfigError';
  }
}
