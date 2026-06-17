import type { RequestOptions } from '../../core/http-client';
import type { OAuth2TokenParams } from './oauth2.types';

export function buildCreateTokenRequest(
  params: OAuth2TokenParams,
): RequestOptions<Record<string, string>> {
  const body: Record<string, string> = {
    client_id: params.clientId,
    client_secret: params.clientSecret,
  };
  if (params.memberCid) {
    body.member_cid = params.memberCid;
  }
  return {
    method: 'POST',
    path: '/oauth2/token',
    body,
    bodyEncoding: 'form',
  };
}
