import type { FalconClientConfig } from '../config';
import type { Oauth2Client } from '../domains/oauth2/oauth2.client';
import { CrowdStrikeAuthConfigError } from './errors';
import type { TokenProvider } from './http-client';

/** Refetch this many ms before the real expiry to avoid races with in-flight requests. */
const EXPIRY_SKEW_MS = 60_000;

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

/**
 * Fetches, caches, and refreshes the OAuth2 bearer token used for all CrowdStrike requests.
 * Concurrent getToken() calls while a fetch is in flight share the same request.
 */
export class OAuth2TokenManager implements TokenProvider {
  private cachedToken?: CachedToken;
  private pendingFetch?: Promise<string>;

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
    if (
      this.cachedToken &&
      Date.now() < this.cachedToken.expiresAt - EXPIRY_SKEW_MS
    ) {
      return this.cachedToken.accessToken;
    }
    if (!this.pendingFetch) {
      this.pendingFetch = this.fetchToken();
    }
    try {
      return await this.pendingFetch;
    } finally {
      this.pendingFetch = undefined;
    }
  }

  /** Forces a fresh token fetch on the next getToken() call (e.g. after a 401). */
  invalidate(): void {
    this.cachedToken = undefined;
  }

  private async fetchToken(): Promise<string> {
    const result = await this.oauth2Client.createToken({
      clientId: this.config.clientId,
      clientSecret: this.config.clientSecret,
      memberCid: this.config.memberCid,
    });
    this.cachedToken = {
      accessToken: result.accessToken,
      expiresAt: Date.now() + result.expiresIn * 1000,
    };
    return result.accessToken;
  }
}
