export interface OAuth2TokenParams {
  clientId: string;
  clientSecret: string;
  /** Optional MSSP child CID to act on behalf of. */
  memberCid?: string;
}

export interface OAuth2TokenResult {
  accessToken: string;
  /** Token lifetime in seconds, as reported by CrowdStrike (typically 1800). */
  expiresIn: number;
  tokenType?: string;
}
