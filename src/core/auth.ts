import type { FalconClientConfig } from '../config';
import type { Oauth2Client } from '../domains/oauth2/oauth2.client';
import { CrowdStrikeAuthConfigError } from './errors';
import type { TokenProvider } from './http-client';

/** Refetch this many ms before the real expiry to avoid races with in-flight requests. */
const EXPIRY_SKEW_MS = 60_000;

interface CachedToken {
  accessToken: string;
  /** Timestamp (ms) after which the token should be refetched; already skew-adjusted. */
  refreshAt: number;
}

/**
 * Fetches, caches, and refreshes the OAuth2 bearer token used for all CrowdStrike requests.
 * Concurrent getToken() calls while a fetch is in flight share the same request.
 */
export class OAuth2TokenManager implements TokenProvider {
  private cachedToken?: CachedToken;
  private pendingFetch?: Promise<string>;
  /** Bumped by invalidate() so a fetch started before it never repopulates the cache. */
  private generation = 0;

  constructor(
    private readonly config: FalconClientConfig,
    private readonly oauth2Client: Oauth2Client,
  ) {
    if (!config.clientId || !config.clientSecret) {
      throw new CrowdStrikeAuthConfigError(
        'FalconClientConfig requires both clientId and clientSecret.',
      );
    }
  }

  async getToken(): Promise<string> {
    if (this.cachedToken && Date.now() < this.cachedToken.refreshAt) {
      return this.cachedToken.accessToken;
    }
    if (!this.pendingFetch) {
      this.pendingFetch = this.fetchToken();
    }
    const pending = this.pendingFetch;
    try {
      return await pending;
    } finally {
      // invalidate() may already have replaced the in-flight fetch with a newer one.
      if (this.pendingFetch === pending) {
        this.pendingFetch = undefined;
      }
    }
  }

  /** Forces a fresh token fetch on the next getToken() call (e.g. after a 401). */
  invalidate(): void {
    this.cachedToken = undefined;
    this.pendingFetch = undefined;
    this.generation += 1;
  }

  private async fetchToken(): Promise<string> {
    const startedGeneration = this.generation;
    const result = await this.oauth2Client.createToken({
      clientId: this.config.clientId,
      clientSecret: this.config.clientSecret,
      memberCid: this.config.memberCid,
    });
    if (startedGeneration === this.generation) {
      // Never let the skew exceed half the lifetime, otherwise a short-lived
      // token would be treated as already expired the moment it is cached.
      const lifetimeMs = result.expiresIn * 1000;
      const skewMs = Math.min(EXPIRY_SKEW_MS, lifetimeMs / 2);
      this.cachedToken = {
        accessToken: result.accessToken,
        refreshAt: Date.now() + lifetimeMs - skewMs,
      };
    }
    return result.accessToken;
  }
}
