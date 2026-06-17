import type { HttpClient } from '../../core/http-client';
import { buildCreateTokenRequest } from './oauth2.requests';
import type { OAuth2TokenParams, OAuth2TokenResult } from './oauth2.types';

/** Raw wire shape of CrowdStrike's /oauth2/token response (DomainAccessTokenResponseV1). */
interface RawTokenResponse {
  access_token: string;
  expires_in?: number;
  token_type?: string;
}

const DEFAULT_EXPIRES_IN_SECONDS = 1800;

export class Oauth2Client {
  constructor(private readonly http: HttpClient) {}

  async createToken(params: OAuth2TokenParams): Promise<OAuth2TokenResult> {
    const raw = await this.http.request<RawTokenResponse>(
      buildCreateTokenRequest(params),
    );
    return {
      accessToken: raw.access_token,
      expiresIn: raw.expires_in ?? DEFAULT_EXPIRES_IN_SECONDS,
      tokenType: raw.token_type,
    };
  }
}
